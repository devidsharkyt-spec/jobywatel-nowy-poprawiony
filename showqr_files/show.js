var left = 0;
var leftMax = 180;
var loading;
var timer;
var numbers;
var qrImage;
var qrCode;
var qr;

function delay(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}

function initShowQR() {
    loading = document.querySelector('.loading_bar');
    timer = document.querySelector('.expire_highlight');
    numbers = document.querySelector('.numbers');
    qrImage = document.querySelector('.qr_image');

    if (loading && timer && numbers && qrImage) {
        setLeft();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShowQR);
} else {
    initShowQR();
}

function setLeft() {
    if (left <= 0) {
        generateQR();
        left = leftMax;
    }

    var min = parseInt(left / 60, 10);
    var sec = parseInt(left - min * 60, 10);
    timer.innerHTML = min === 0 ? sec + ' sek.' : min + ' min ' + sec + ' sek.';
    loading.style.width = (left / leftMax) * 100 + '%';

    left--;
    delay(1000).then(setLeft);
}

function generateQR() {
    var issuedAt = Math.floor(Date.now() / 1000);
    var nonce = randomId();

    qrCode = [
        'DEMO_MOBYWATEL_2_0',
        'INVALID_QR',
        'ERROR_ONLY',
        issuedAt,
        nonce
    ].join(';');

    qrImage.innerHTML = '';
    qr = new QRCode(qrImage, {
        text: qrCode,
        width: 300,
        height: 300,
        correctLevel: QRCode.CorrectLevel.M
    });

    numbers.innerHTML = randomSixDigit();
}

function randomSixDigit() {
    return Math.floor(100000 + Math.random() * 900000);
}

function randomId() {
    if (window.crypto && window.crypto.getRandomValues) {
        var bytes = new Uint8Array(12);
        window.crypto.getRandomValues(bytes);
        return Array.prototype.map.call(bytes, function (byte) {
            return byte.toString(16).padStart(2, '0');
        }).join('');
    }

    return String(Date.now()) + String(Math.random()).slice(2);
}
