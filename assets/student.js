(function () {
  var params = new URLSearchParams(window.location.search);
  var options = { year: 'numeric', month: 'numeric', day: '2-digit' };
  var optionsTime = { second: 'numeric', minute: 'numeric', hour: '2-digit' };

  function upper(value, fallback) {
    var text = value == null || value === '' ? fallback : value;
    return String(text || '').toLocaleUpperCase('pl-PL');
  }

  function value(name, fallback) {
    return params.get(name) || fallback || '';
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function setClock() {
    var time = document.getElementById('time');
    if (!time) return;
    var date = new Date();
    time.textContent = 'Czas: ' + date.toLocaleTimeString('pl-PL', optionsTime) + ' ' + date.toLocaleDateString('pl-PL', options);
    setTimeout(setClock, 1000);
  }

  if (!localStorage.getItem('update')) {
    localStorage.setItem('update', '21.05.2025');
  }

  setText('studentName', upper(value('name', 'KATARZYNA')));
  setText('studentSurname', upper(value('surname', 'KOWALSKA')));
  setText('studentBirthday', value('birthday', '16.08.2013'));
  setText('studentPesel', value('student_pesel', value('pesel', '13281614262')));
  setText('studentCardNumber', upper(value('student_card_number', '4321/44')));
  setText('studentIssueDate', value('student_issue_date', value('issue_date', '25.09.2025')));
  setText('studentExpiryDate', value('student_expiry_date', value('expiry_date', '30.09.2026')));
  setText('schoolName', upper(value('school_name', 'SZKOŁA PODSTAWOWA NR 515 IM. JANA III SOBIESKIEGO')));
  setText('schoolAddress', upper(value('school_address', 'UL. SZKOLNA 236, 00-006 WARSZAWA')));
  setText('schoolPhone', upper(value('school_phone', '22 664 73 13')));
  setText('schoolPrincipal', upper(value('school_principal', 'BARBARA DĄBROWSKA')));

  var photo = document.getElementById('studentPhoto');
  var image = value('image', 'https://i.imgur.com/7vHo48p.jpg');
  if (photo) photo.style.backgroundImage = 'url("' + image.replace(/"/g, '%22') + '")';

  var updateText = document.querySelector('.bottom_update_value');
  if (updateText) updateText.textContent = localStorage.getItem('update');

  var updateButton = document.querySelector('.update');
  if (updateButton && updateText) {
    updateButton.addEventListener('click', function () {
      var now = new Date().toLocaleDateString('pl-PL', options);
      localStorage.setItem('update', now);
      updateText.textContent = now;
      scroll(0, 0);
    });
  }

  var removeButton = document.getElementById('removeStudentCard');
  if (removeButton) {
    removeButton.addEventListener('click', function () {
      localStorage.removeItem('mobDemoStudentCardAdded');
      sendTo('home');
    });
  }

  var infoCard = document.querySelector('.student_info_card');
  var infoHeader = document.querySelector('.student_info_card .section_header');
  if (infoCard && infoHeader) {
    infoHeader.setAttribute('role', 'button');
    infoHeader.setAttribute('tabindex', '0');
    infoHeader.addEventListener('click', function () {
      infoCard.classList.toggle('collapsed');
    });
    infoHeader.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        infoCard.classList.toggle('collapsed');
      }
    });
  }

  setClock();
})();
