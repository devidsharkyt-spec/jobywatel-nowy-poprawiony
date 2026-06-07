using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Text;
using System.Threading;

namespace MobywatelDemoLauncher
{
    internal static class Program
    {
        private static volatile bool running = true;
        private static string webRoot = "";
        private static DateTime lastRequestUtc = DateTime.UtcNow;

        [STAThread]
        private static void Main()
        {
            webRoot = PrepareWebRoot();

            if (!Directory.Exists(webRoot))
            {
                return;
            }

            int port = FindPort(18280);
            TcpListener listener = new TcpListener(IPAddress.Loopback, port);
            listener.Start();

            Thread serverThread = new Thread(delegate() { Serve(listener); });
            serverThread.IsBackground = true;
            serverThread.Start();

            string edgePath = FindEdge();
            string url = "http://127.0.0.1:" + port + "/id.html";
            string userData = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "MobywatelDemoEdgeProfile");

            Process browser = null;
            try
            {
                ProcessStartInfo startInfo = new ProcessStartInfo();
                startInfo.FileName = edgePath.Length > 0 ? edgePath : url;
                if (edgePath.Length > 0)
                {
                    startInfo.Arguments =
                        "--app=\"" + url + "\" " +
                        "--window-size=390,844 " +
                        "--user-data-dir=\"" + userData + "\" " +
                        "--disable-features=Translate";
                }
                startInfo.UseShellExecute = edgePath.Length == 0;
                browser = Process.Start(startInfo);
                KeepServerAlive(browser, userData);
            }
            catch
            {
                try
                {
                    Process.Start(url);
                }
                catch
                {
                }
            }
            finally
            {
                running = false;
                try { listener.Stop(); } catch { }
            }
        }

        private static void KeepServerAlive(Process browser, string userData)
        {
            DateTime startUtc = DateTime.UtcNow;

            while (true)
            {
                Thread.Sleep(1000);

                if (DateTime.UtcNow - startUtc > TimeSpan.FromHours(8))
                {
                    return;
                }

                if (browser != null)
                {
                    try
                    {
                        if (!browser.HasExited)
                        {
                            continue;
                        }
                    }
                    catch
                    {
                    }
                }

                if (DateTime.UtcNow - lastRequestUtc < TimeSpan.FromHours(2))
                {
                    continue;
                }

                return;
            }
        }

        private static string PrepareWebRoot()
        {
            string exeDir = AppDomain.CurrentDomain.BaseDirectory;
            string siblingRoot = Path.Combine(exeDir, "www");
            if (Directory.Exists(siblingRoot))
            {
                return siblingRoot;
            }

            string cacheRoot = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "MobywatelDemoApp");
            string extractedRoot = Path.Combine(cacheRoot, "www");

            try
            {
                if (Directory.Exists(extractedRoot))
                {
                    Directory.Delete(extractedRoot, true);
                }
                Directory.CreateDirectory(cacheRoot);

                Assembly assembly = Assembly.GetExecutingAssembly();
                string resourceName = "";
                string[] names = assembly.GetManifestResourceNames();
                for (int i = 0; i < names.Length; i++)
                {
                    if (names[i].EndsWith("app.zip", StringComparison.OrdinalIgnoreCase))
                    {
                        resourceName = names[i];
                        break;
                    }
                }

                if (resourceName.Length == 0)
                {
                    return siblingRoot;
                }

                using (Stream stream = assembly.GetManifestResourceStream(resourceName))
                using (ZipArchive archive = new ZipArchive(stream))
                {
                    string cacheFull = Path.GetFullPath(cacheRoot);
                    foreach (ZipArchiveEntry entry in archive.Entries)
                    {
                        string target = Path.GetFullPath(Path.Combine(cacheRoot, entry.FullName));
                        if (!target.StartsWith(cacheFull, StringComparison.OrdinalIgnoreCase))
                        {
                            continue;
                        }

                        if (entry.FullName.EndsWith("/", StringComparison.Ordinal))
                        {
                            Directory.CreateDirectory(target);
                            continue;
                        }

                        string parent = Path.GetDirectoryName(target);
                        if (!Directory.Exists(parent))
                        {
                            Directory.CreateDirectory(parent);
                        }

                        entry.ExtractToFile(target, true);
                    }
                }
            }
            catch
            {
                return siblingRoot;
            }

            return extractedRoot;
        }

        private static void Serve(TcpListener listener)
        {
            while (running)
            {
                try
                {
                    TcpClient client = listener.AcceptTcpClient();
                    ThreadPool.QueueUserWorkItem(delegate(object state) { HandleClient((TcpClient)state); }, client);
                }
                catch
                {
                    if (!running) return;
                }
            }
        }

        private static void HandleClient(TcpClient client)
        {
            using (client)
            {
                NetworkStream stream = client.GetStream();
                byte[] buffer = new byte[8192];
                int count = stream.Read(buffer, 0, buffer.Length);
                if (count <= 0) return;

                string request = Encoding.ASCII.GetString(buffer, 0, count);
                lastRequestUtc = DateTime.UtcNow;
                string[] parts = request.Split(' ');
                if (parts.Length < 2)
                {
                    WriteResponse(stream, 400, "text/plain", Encoding.UTF8.GetBytes("Bad Request"));
                    return;
                }

                string path = parts[1];
                int queryIndex = path.IndexOf('?');
                if (queryIndex >= 0) path = path.Substring(0, queryIndex);
                path = Uri.UnescapeDataString(path.Replace('/', Path.DirectorySeparatorChar));

                if (path == "\\" || path == "/")
                {
                    path = Path.DirectorySeparatorChar + "id.html";
                }

                string fullPath = Path.GetFullPath(Path.Combine(webRoot, path.TrimStart('\\', '/')));
                string rootPath = Path.GetFullPath(webRoot);
                if (!fullPath.StartsWith(rootPath, StringComparison.OrdinalIgnoreCase))
                {
                    WriteResponse(stream, 403, "text/plain", Encoding.UTF8.GetBytes("Forbidden"));
                    return;
                }

                if (!File.Exists(fullPath))
                {
                    WriteResponse(stream, 404, "text/plain", Encoding.UTF8.GetBytes("Not Found"));
                    return;
                }

                byte[] bytes = File.ReadAllBytes(fullPath);
                WriteResponse(stream, 200, GetMimeType(fullPath), bytes);
            }
        }

        private static void WriteResponse(NetworkStream stream, int status, string contentType, byte[] bytes)
        {
            string text = "HTTP/1.1 " + status + " OK\r\n" +
                "Content-Type: " + contentType + "\r\n" +
                "Content-Length: " + bytes.Length + "\r\n" +
                "Cache-Control: no-store\r\n" +
                "Connection: close\r\n\r\n";
            byte[] header = Encoding.ASCII.GetBytes(text);
            stream.Write(header, 0, header.Length);
            stream.Write(bytes, 0, bytes.Length);
        }

        private static int FindPort(int start)
        {
            for (int port = start; port < start + 60; port++)
            {
                TcpListener probe = null;
                try
                {
                    probe = new TcpListener(IPAddress.Loopback, port);
                    probe.Start();
                    return port;
                }
                catch
                {
                }
                finally
                {
                    if (probe != null)
                    {
                        try { probe.Stop(); } catch { }
                    }
                }
            }
            return start;
        }

        private static string FindEdge()
        {
            string[] paths = new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Microsoft\\Edge\\Application\\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Microsoft\\Edge\\Application\\msedge.exe")
            };

            for (int i = 0; i < paths.Length; i++)
            {
                if (File.Exists(paths[i])) return paths[i];
            }

            return "";
        }

        private static string GetMimeType(string path)
        {
            string ext = Path.GetExtension(path).ToLowerInvariant();
            if (ext == ".html") return "text/html; charset=utf-8";
            if (ext == ".css") return "text/css; charset=utf-8";
            if (ext == ".js" || ext == ".pobrane") return "application/javascript; charset=utf-8";
            if (ext == ".png") return "image/png";
            if (ext == ".jpg" || ext == ".jpeg") return "image/jpeg";
            if (ext == ".svg") return "image/svg+xml";
            if (ext == ".webp") return "image/webp";
            if (ext == ".ttf") return "font/ttf";
            return "application/octet-stream";
        }
    }
}
