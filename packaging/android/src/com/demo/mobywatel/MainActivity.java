package com.demo.mobywatel;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.hardware.biometrics.BiometricPrompt;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.webkit.PermissionRequest;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.util.concurrent.Executor;

public class MainActivity extends Activity {
    private static final int REQUEST_CAMERA = 7301;
    private WebView webView;
    private CancellationSignal biometricCancellation;

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        }

        webView.addJavascriptInterface(new BiometricBridge(), "MobDemoBiometrics");
        webView.setWebViewClient(new DemoWebViewClient());
        webView.setWebChromeClient(new DemoWebChromeClient());

        requestCameraPermissionIfNeeded();
        webView.loadUrl("file:///android_asset/www/id.html");
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (biometricCancellation != null) {
            biometricCancellation.cancel();
        }
        super.onDestroy();
    }

    private void requestCameraPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
                checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.CAMERA}, REQUEST_CAMERA);
        }
    }

    private void runJs(final String script) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (webView != null) {
                    webView.evaluateJavascript(script, null);
                }
            }
        });
    }

    public class BiometricBridge {
        @android.webkit.JavascriptInterface
        public void authenticate() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    showBiometricPrompt();
                }
            });
        }
    }

    private void showBiometricPrompt() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
            runJs("window.mobDemoNativeBiometricsError && window.mobDemoNativeBiometricsError('Biometria wymaga Androida 9 lub nowszego.');");
            return;
        }

        biometricCancellation = new CancellationSignal();
        Executor executor = new Executor() {
            @Override
            public void execute(Runnable command) {
                runOnUiThread(command);
            }
        };

        BiometricPrompt prompt = new BiometricPrompt.Builder(this)
                .setTitle("mObywatel")
                .setSubtitle("Zaloguj sie biometria")
                .setDescription("DEMO MOBYWATEL 2.0")
                .setNegativeButton("Anuluj", executor, (dialogInterface, which) ->
                        runJs("window.mobDemoNativeBiometricsError && window.mobDemoNativeBiometricsError('Logowanie biometryczne anulowane.');"))
                .build();

        prompt.authenticate(biometricCancellation, executor, new BiometricPrompt.AuthenticationCallback() {
            @Override
            public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                runJs("window.mobDemoNativeBiometricsSuccess && window.mobDemoNativeBiometricsSuccess();");
            }

            @Override
            public void onAuthenticationError(int errorCode, CharSequence errString) {
                String safe = String.valueOf(errString).replace("'", "\\'");
                runJs("window.mobDemoNativeBiometricsError && window.mobDemoNativeBiometricsError('" + safe + "');");
            }

            @Override
            public void onAuthenticationFailed() {
                Toast.makeText(MainActivity.this, "Nie rozpoznano biometrii", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private class DemoWebChromeClient extends WebChromeClient {
        @Override
        public void onPermissionRequest(final PermissionRequest request) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    request.grant(request.getResources());
                }
            });
        }
    }

    private static class DemoWebViewClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return false;
        }

        @Override
        public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
            handler.proceed();
        }
    }
}
