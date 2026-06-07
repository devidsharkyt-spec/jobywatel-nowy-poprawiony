var params = new URLSearchParams(window.location.search);
var credentialKey = 'mobDemoBiometricCredentialId';
var userKey = 'mobDemoBiometricUserId';

var loginButton = document.querySelector('.login');
var biometricPanel = document.querySelector('.biometric_panel');
var biometricToggle = document.querySelector('.biometric_login');
var biometricStatus = document.querySelector('.biometric_status');
var pngBiometricHotspot = document.querySelector('.png_biometric_hotspot');
var pngPasswordHotspot = document.querySelector('.png_password_hotspot');
var input = document.querySelector('.password_input');
var eye = document.querySelector('.eye');

var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
document.body.classList.add(isIOS ? 'ios_device' : 'fingerprint_device');

window.mobDemoNativeBiometricsSuccess = function () {
    setBiometricStatus('Biometria potwierdzona.');
    toHome();
};

window.mobDemoNativeBiometricsError = function (message) {
    setBiometricStatus(message || 'Logowanie biometryczne anulowane.');
};

loginButton.addEventListener('click', function () {
    toHome();
});

if (biometricPanel) {
    biometricPanel.addEventListener('click', function () {
        loginWithBiometrics();
    });
}

if (pngBiometricHotspot) {
    pngBiometricHotspot.addEventListener('click', function () {
        loginWithBiometrics();
    });
}

if (biometricToggle) {
    biometricToggle.addEventListener('click', function () {
        togglePasswordMode();
    });
}

if (pngPasswordHotspot) {
    pngPasswordHotspot.addEventListener('click', function () {
        togglePasswordMode();
    });
}

var welcome = 'Dzie&#324; dobry!';
var date = new Date();
if (date.getHours() >= 18) {
    welcome = 'Dobry wiecz&#243;r!';
}
document.querySelector('.welcome').innerHTML = welcome;

function toHome() {
    sessionStorage.setItem('mobDemoAuthenticated', '1');
    localStorage.setItem('mobDemoAuthenticated', '1');
    location.href = 'home.html?' + params.toString();
}

function togglePasswordMode() {
    var passwordMode = document.body.classList.toggle('password_mode');
    if (biometricToggle) {
        biometricToggle.innerHTML = passwordMode ? 'Logowanie biometri&#261;' : 'Wpisz has&#322;o';
    }
    if (biometricStatus) {
        biometricStatus.textContent = '';
    }
}

async function loginWithBiometrics() {
    setBiometricStatus('Otwieranie biometrii...');

    if (window.MobDemoBiometrics && typeof window.MobDemoBiometrics.authenticate === 'function') {
        window.MobDemoBiometrics.authenticate();
        return;
    }

    if (!window.PublicKeyCredential || !window.navigator || !window.navigator.credentials || !window.crypto) {
        setBiometricStatus('Biometria nie jest dostepna w tej przegladarce.');
        return;
    }

    try {
        if (window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
            var available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            if (!available) {
                setBiometricStatus('Biometria nie jest wlaczona na tym urzadzeniu.');
                return;
            }
        }

        var credentialId = localStorage.getItem(credentialKey);

        if (!credentialId) {
            setBiometricStatus('Konfiguracja biometrii...');
            await createBiometricCredential();
            setBiometricStatus('Biometria potwierdzona.');
            toHome();
            return;
        }

        await getBiometricCredential(credentialId);
        setBiometricStatus('Biometria potwierdzona.');
        toHome();
    } catch (error) {
        if (error && error.name === 'NotAllowedError') {
            setBiometricStatus('Logowanie biometryczne anulowane.');
            return;
        }

        localStorage.removeItem(credentialKey);
        setBiometricStatus('Nie udalo sie potwierdzic biometrii. Sprobuj ponownie.');
    }
}

async function createBiometricCredential() {
    var userId = localStorage.getItem(userKey);
    if (!userId) {
        userId = bufferToBase64Url(randomBytes(16));
        localStorage.setItem(userKey, userId);
    }

    var credential = await window.navigator.credentials.create({
        publicKey: {
            challenge: randomBytes(32),
            rp: {
                name: 'DEMO MOBYWATEL 2.0'
            },
            user: {
                id: base64UrlToBuffer(userId),
                name: 'demo@local',
                displayName: 'DEMO MOBYWATEL 2.0'
            },
            pubKeyCredParams: [
                { type: 'public-key', alg: -7 },
                { type: 'public-key', alg: -257 }
            ],
            authenticatorSelection: {
                authenticatorAttachment: 'platform',
                residentKey: 'preferred',
                requireResidentKey: false,
                userVerification: 'required'
            },
            timeout: 60000,
            attestation: 'none'
        }
    });

    if (!credential || !credential.rawId) {
        throw new Error('credential_create_failed');
    }

    localStorage.setItem(credentialKey, bufferToBase64Url(credential.rawId));
}

async function getBiometricCredential(credentialId) {
    var assertion = await window.navigator.credentials.get({
        publicKey: {
            challenge: randomBytes(32),
            allowCredentials: [
                {
                    type: 'public-key',
                    id: base64UrlToBuffer(credentialId),
                    transports: ['internal']
                }
            ],
            timeout: 60000,
            userVerification: 'required'
        }
    });

    if (!assertion) {
        throw new Error('credential_get_failed');
    }
}

function setBiometricStatus(message) {
    if (biometricStatus) {
        biometricStatus.textContent = message;
    }
}

function randomBytes(length) {
    var bytes = new Uint8Array(length);
    window.crypto.getRandomValues(bytes);
    return bytes;
}

function bufferToBase64Url(buffer) {
    var bytes = new Uint8Array(buffer);
    var binary = '';
    for (var i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBuffer(value) {
    var base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }

    var binary = atob(base64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

input.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        document.activeElement.blur();
    }
});

var dot = '\u2022';
var original = '';

input.addEventListener('input', function () {
    var value = input.value.toString();
    var char = value.substring(value.length - 1);

    if (value.length < original.length) {
        original = original.substring(0, original.length - 1);
    } else {
        original = original + char;
    }

    if (!eye.classList.contains('eye_close')) {
        var dots = '';
        for (var i = 0; i < value.length - 1; i++) {
            dots += dot;
        }
        input.value = dots + char;

        delay(3000).then(function () {
            if (input.value.length !== 0) {
                input.value = input.value.substring(0, input.value.length - 1) + dot;
            }
        });
    }
});

function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time);
    });
}

eye.addEventListener('click', function () {
    var classlist = eye.classList;
    if (classlist.contains('eye_close')) {
        classlist.remove('eye_close');
        var dots = '';
        for (var i = 0; i < input.value.length; i++) {
            dots += dot;
        }
        input.value = dots;
    } else {
        classlist.add('eye_close');
        input.value = original;
    }
});
