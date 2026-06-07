(function () {
    var input = document.getElementById('searchInput');
    var results = document.getElementById('searchResults');

    var items = [
        { title: 'mDowód', description: 'Dokumenty', route: 'card', icon: 'mD', keywords: 'dowod mdowod dokument dokumenty dane pesel' },
        { title: 'Legitymacja szkolna', description: 'Dokumenty', route: 'student', icon: 'LS', keywords: 'legitymacja szkolna szkola uczen dokument' },
        { title: 'Dodaj dokument', description: 'Dokumenty', route: 'home', icon: '+', keywords: 'dodaj dokument legitymacja' },
        { title: 'Kod QR', description: 'Kod QR', route: 'qr', icon: 'QR', keywords: 'kod qr potwierdz dane' },
        { title: 'Zeskanuj kod QR', description: 'Kod QR', route: 'scanqr', icon: 'QR', keywords: 'skaner zeskanuj kod qr kamera' },
        { title: 'Pokaż kod QR', description: 'Kod QR', route: 'showqr', icon: 'QR', keywords: 'pokaz pokaż kod qr' },
        { title: 'Usługi', description: 'Lista usług', route: 'services', icon: 'U', keywords: 'uslugi usługi sprawy podpis dokument pesel' },
        { title: 'Zastrzeż PESEL', description: 'Usługi', route: 'pesel', icon: 'P', keywords: 'pesel zastrzez zastrzeż numer' },
        { title: 'Więcej', description: 'Ustawienia i dane', route: 'more', icon: 'W', keywords: 'wiecej więcej ustawienia dane wyloguj' }
    ];

    function normalize(value) {
        return String(value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function resultButton(item) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'search_result';
        button.innerHTML =
            '<span class="search_result_icon">' + item.icon + '</span>' +
            '<span class="search_result_text">' +
                '<strong>' + item.title + '</strong>' +
                '<span>' + item.description + '</span>' +
            '</span>';
        button.addEventListener('click', function () {
            if (item.title === 'Dodaj dokument') {
                localStorage.setItem('mobDemoStudentCardAdded', '1');
            }
            sendTo(item.route);
        });
        return button;
    }

    function render() {
        var query = normalize(input.value);
        var filtered = items.filter(function (item) {
            var haystack = normalize(item.title + ' ' + item.description + ' ' + item.keywords);
            return !query || haystack.indexOf(query) !== -1;
        });

        results.innerHTML = '';

        if (!filtered.length) {
            var empty = document.createElement('p');
            empty.className = 'search_empty';
            empty.textContent = 'Brak wyników';
            results.appendChild(empty);
            return;
        }

        filtered.forEach(function (item) {
            results.appendChild(resultButton(item));
        });
    }

    if (input && results) {
        input.addEventListener('input', render);
        render();
        setTimeout(function () {
            input.focus();
        }, 150);
    }
})();
