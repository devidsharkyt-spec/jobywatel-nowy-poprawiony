var options = { year: 'numeric', month: 'numeric', day: '2-digit' };
var optionsTime = { second: 'numeric', minute: 'numeric', hour: '2-digit' };
var params = new URLSearchParams(window.location.search);
var data = {};

for (var pair of params.entries()) {
  data[pair[0]] = pair[1];
}

function upper(value, fallback) {
  var text = value == null || value === '' ? fallback : value;
  return String(text || '').toLocaleUpperCase('pl-PL');
}

function setData(id, value) {
  var element = document.getElementById(id);
  if (element) element.innerHTML = value == null ? '' : value;
}

function setText(id, value) {
  var element = document.getElementById(id);
  if (element) element.textContent = value == null ? '' : value;
}

function parseDateDots(value) {
  if (!value) return null;
  var split = String(value).split('.');
  if (split.length !== 3) return null;
  var day = parseInt(split[0], 10);
  var month = parseInt(split[1], 10);
  var year = parseInt(split[2], 10);
  if (!day || !month || !year) return null;
  return { day: day, month: month, year: year };
}

function displayDate(value, fallback) {
  var parsed = parseDateDots(value || fallback);
  if (!parsed) return value || fallback || '';
  var date = new Date(parsed.year, parsed.month - 1, parsed.day);
  return date.toLocaleDateString('pl-PL', options);
}

function generatePeselFromBirthday(birthdayValue, sexValue) {
  var parsed = parseDateDots(birthdayValue);
  if (!parsed) return '00000000000';

  var month = parsed.month;
  if (parsed.year >= 2000) month += 20;

  var yearPart = String(parsed.year).slice(-2);
  var monthPart = String(month).padStart(2, '0');
  var dayPart = String(parsed.day).padStart(2, '0');
  var later = String(sexValue || '').toLowerCase() === 'k' ? '0382' : '0295';
  return (yearPart + monthPart + dayPart + later + '7').substring(0, 11);
}

function activateBottomNav() {
  try {
    var tab = (new URLSearchParams(window.location.search).get('tab') || 'home').toLowerCase();
    var valid = ['home', 'services', 'qr', 'search', 'more'];
    if (!valid.includes(tab)) tab = 'home';
    var imgs = document.querySelectorAll('.bottom_element_image');
    var texts = document.querySelectorAll('.bottom_element_text');
    var openClasses = ['home_open', 'services_open', 'qr_open', 'search_open', 'more_open'];
    imgs.forEach(function (img) { openClasses.forEach(function (c) { img.classList.remove(c); }); });
    texts.forEach(function (text) { text.classList.remove('open'); });
    document.querySelectorAll('.bottom_element_grid').forEach(function (element) {
      var send = element.getAttribute('send');
      var img = element.querySelector('.bottom_element_image');
      var text = element.querySelector('.bottom_element_text');
      if (send === tab) {
        if (img) img.classList.add(tab + '_open');
        if (text) text.classList.add('open');
      }
    });
  } catch (error) {}
}

if (localStorage.getItem('update') == null) {
  localStorage.setItem('update', '21.05.2025');
}

var updateText = document.querySelector('.bottom_update_value');
if (updateText) updateText.innerHTML = localStorage.getItem('update');

var update = document.querySelector('.update');
if (update && updateText) {
  update.addEventListener('click', function () {
    var newDate = new Date().toLocaleDateString('pl-PL', options);
    localStorage.setItem('update', newDate);
    updateText.innerHTML = newDate;
    scroll(0, 0);
  });
}

function setClock() {
  var time = document.getElementById('time');
  if (!time) return;
  var date = new Date();
  time.innerHTML = 'Czas: ' + date.toLocaleTimeString('pl-PL', optionsTime) + ' ' + date.toLocaleDateString('pl-PL', options);
  setTimeout(setClock, 1000);
}

var unfold = document.querySelector('.info_holder');
if (unfold) {
  unfold.addEventListener('click', function () {
    unfold.classList.toggle('unfolded');
  });
}

var imageElement = document.querySelector('.id_own_image');
if (imageElement) {
  imageElement.style.backgroundImage = 'url("' + String(data.image || 'https://i.imgur.com/7vHo48p.jpg').replace(/"/g, '%22') + '")';
}

var birthday = displayDate(data.birthday, '01.01.2000');
var sex = String(data.sex || 'm').toLowerCase() === 'k' ? 'KOBIETA' : 'MĘŻCZYZNA';
var addressParts = [];
if (data.adress1) addressParts.push('UL. ' + upper(data.adress1));
var secondLine = [upper(data.adress2), upper(data.city)].filter(Boolean).join(' ');
if (secondLine) addressParts.push(secondLine);

setData('name', upper(data.name, 'JAN'));
setData('surname', upper(data.surname, 'KOWALSKI'));
setData('nationality', upper(data.nationality, 'POLSKIE'));
setData('birthday', birthday);
setData('familyName', upper(data.familyName || data.surname, 'KOWALSKI'));
setData('sex', sex);
setData('fathersFamilyName', upper(data.fathersFamilyName || data.surname, 'KOWALSKI'));
setData('mothersFamilyName', upper(data.mothersFamilyName, 'NOWAK'));
setData('birthPlace', upper(data.birthPlace, 'WARSZAWA'));
setData('countryOfBirth', upper(data.countryOfBirth, 'POLSKA'));
setData('adress', addressParts.join('<br>'));
setData('pesel', data.pesel || generatePeselFromBirthday(data.birthday, data.sex));

setText('mdowSeriesValue', upper(data.mdow_series, 'MWYC 24561'));
setText('mdowExpiryValue', data.expiry_date || '14.07.2028');
setText('mdowIssueValue', data.issue_date || '14.07.2023');
setText('fatherNameValue', upper(data.father_name, 'MACIEJ'));
setText('motherNameValue', upper(data.mother_name, 'EWA'));

var homeDateValue = data.home_date || localStorage.getItem('homeDate');
if (!homeDateValue) {
  homeDateValue = '01.01.2000';
  localStorage.setItem('homeDate', homeDateValue);
}
var homeDate = document.querySelector('.home_date');
if (homeDate) homeDate.innerHTML = homeDateValue;

setClock();
activateBottomNav();
