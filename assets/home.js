(function () {
  var params = new URLSearchParams(window.location.search);
  var documentType = (params.get('document_type') || '').toUpperCase();
  var stack = document.querySelector('.stack');
  var studentCard = document.querySelector('[data-student-card]');
  var addPanel = document.querySelector('[data-add-panel]');
  var addButton = document.querySelector('.add_document_button');
  var pngAddButton = document.querySelector('.doc_add_hotspot');
  var closeAddButton = document.querySelector('[data-close-add-panel]');
  var addStudentButton = document.querySelector('[data-add-student]');

  if (documentType.indexOf('LEGITYMACJA') !== -1) {
    localStorage.setItem('mobDemoStudentCardAdded', '1');
  }

  function renderStudentCard() {
    var visible = localStorage.getItem('mobDemoStudentCardAdded') === '1';
    if (stack) stack.classList.toggle('has_student', visible);
    if (studentCard) studentCard.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

  function toggleAddPanel(open) {
    if (!addPanel) return;
    addPanel.classList.toggle('open', Boolean(open));
  }

  if (addButton) {
    addButton.addEventListener('click', function () {
      toggleAddPanel(!addPanel || !addPanel.classList.contains('open'));
    });
  }

  if (pngAddButton) {
    pngAddButton.addEventListener('click', function () {
      toggleAddPanel(!addPanel || !addPanel.classList.contains('open'));
    });
  }

  if (closeAddButton) {
    closeAddButton.addEventListener('click', function () {
      toggleAddPanel(false);
    });
  }

  if (addStudentButton) {
    addStudentButton.addEventListener('click', function () {
      localStorage.setItem('mobDemoStudentCardAdded', '1');
      renderStudentCard();
      toggleAddPanel(false);
    });
  }

  renderStudentCard();
})();

(function () {
  var cardContainer = document.querySelector('.card-container');
  if (!cardContainer) return;

  var startX = 0;
  var scrollLeft = 0;

  function start(pageX) {
    startX = pageX - cardContainer.offsetLeft;
    scrollLeft = cardContainer.scrollLeft;
    cardContainer.style.cursor = 'grabbing';
  }

  function move(pageX, event) {
    if (!startX) return;
    if (event) event.preventDefault();
    var x = pageX - cardContainer.offsetLeft;
    var walk = (x - startX) * 2;
    cardContainer.scrollLeft = scrollLeft - walk;
  }

  function end() {
    startX = 0;
    cardContainer.style.cursor = 'grab';
  }

  cardContainer.addEventListener('mousedown', function (event) { start(event.pageX); });
  cardContainer.addEventListener('mouseleave', end);
  cardContainer.addEventListener('mouseup', end);
  cardContainer.addEventListener('mousemove', function (event) { move(event.pageX, event); });
  cardContainer.addEventListener('touchstart', function (event) { start(event.touches[0].pageX); });
  cardContainer.addEventListener('touchmove', function (event) { move(event.touches[0].pageX, event); });
  cardContainer.addEventListener('touchend', end);
})();
