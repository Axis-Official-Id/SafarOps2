(() => {
    const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
    const save = (key, value) => { try { localStorage.setItem(key, String(value)); } catch {} };

    document.addEventListener('DOMContentLoaded', () => {
        const app = document.getElementById('app-view');
        const sidebar = app.querySelector('aside');
        const nav = sidebar.querySelector('nav');
        const body = nav.parentElement;
        const brand = body.firstElementChild;
        const footer = sidebar.querySelector(':scope > div.relative:last-of-type');
        const mobile = matchMedia('(max-width:1023px)');
        sidebar.id = 'workspace-sidebar';
        body.classList.add('sidebar-body');
        brand.classList.add('sidebar-brand');
        footer.classList.add('sidebar-footer');
        sidebar.append(document.getElementById('superadmin-menu'));

        function button(label, icon, action) {
            const element = document.createElement('button');
            element.type = 'button';
            element.className = 'shell-icon';
            element.title = label;
            element.setAttribute('aria-label', label);
            element.innerHTML = `<i data-lucide="${icon}" aria-hidden="true"></i>`;
            element.onclick = action;
            return element;
        }

        let collapsed = read('safarops-sidebar-closed') === 'true';
        let minimum = 300;
        let width = Number(read('safarops-sidebar-width')) || 0;
        const logo = document.getElementById('sidebar-logo-box');
        const open = button('Buka sidebar', 'panel-left-open', () => {
            if (collapsed) { collapse(false); close.focus(); }
        });
        open.classList.add('sidebar-logo-toggle');
        open.setAttribute('aria-controls', sidebar.id);
        logo.before(open);
        open.prepend(logo);
        const close = button('Tutup sidebar', 'panel-left-close', () => {
            collapse(true);
            open.focus();
        });
        close.classList.add('sidebar-collapse');
        close.setAttribute('aria-controls', sidebar.id);
        brand.append(close);

        const search = document.getElementById('global-search');
        const searchBox = search.parentElement;
        searchBox.classList.add('sidebar-search');
        search.setAttribute('aria-label', 'Cari jamaah, NIK, atau kode');
        brand.after(searchBox);
        const find = button('Cari', 'search', () => { collapse(false); search.focus(); });
        find.classList.add('rail-search');
        brand.after(find);
        sidebar.querySelectorAll('.nav-btn').forEach(item => {
            item.title = item.textContent.trim();
            item.setAttribute('aria-label', item.title);
        });

        const handle = document.createElement('div');
        handle.className = 'sidebar-resizer';
        handle.setAttribute('role', 'separator');
        handle.setAttribute('aria-label', 'Lebar sidebar');
        handle.setAttribute('aria-controls', sidebar.id);
        handle.setAttribute('aria-orientation', 'vertical');
        sidebar.append(handle);

        function draw() {
            const rail = collapsed && !mobile.matches;
            app.classList.toggle('sidebar-collapsed', rail);
            app.style.setProperty('--sidebar-width', (rail ? 64 : width) + 'px');
            handle.setAttribute('aria-valuemin', minimum);
            handle.setAttribute('aria-valuemax', 440);
            handle.setAttribute('aria-valuenow', width);
            handle.tabIndex = rail || mobile.matches ? -1 : 0;
            open.tabIndex = rail ? 0 : -1;
            open.setAttribute('aria-expanded', String(!rail));
            close.setAttribute('aria-expanded', String(!rail));
        }
        function collapse(value) {
            collapsed = value;
            save('safarops-sidebar-closed', value);
            draw();
        }
        function measure() {
            const row = nav.querySelector('[data-tab="manifest"]');
            const label = row.querySelector('span');
            const textStyle = getComputedStyle(label);
            const rowStyle = getComputedStyle(row);
            const navStyle = getComputedStyle(nav);
            const pixels = value => parseFloat(value) || 0;
            const context = document.createElement('canvas').getContext('2d');
            context.font = `${textStyle.fontWeight} ${textStyle.fontSize} ${textStyle.fontFamily}`;
            // Measure expanded geometry even when the compact rail is currently visible.
            const rowPadding = collapsed && !mobile.matches ? 32 : pixels(rowStyle.paddingLeft) + pixels(rowStyle.paddingRight);
            const navPadding = collapsed && !mobile.matches ? 32 : pixels(navStyle.paddingLeft) + pixels(navStyle.paddingRight);
            minimum = Math.ceil(context.measureText(label.textContent.trim()).width + 20 + pixels(rowStyle.columnGap) + rowPadding + navPadding + 2) + 4;
            width = Math.max(minimum, Math.min(440, width || minimum));
            draw();
        }

        let frame = 0;
        function scheduleDraw() {
            if (!frame) frame = requestAnimationFrame(() => { frame = 0; draw(); });
        }
        handle.onpointerdown = event => {
            if (event.button === 0) { handle.setPointerCapture(event.pointerId); event.preventDefault(); }
        };
        handle.onpointermove = event => {
            if (!handle.hasPointerCapture(event.pointerId)) return;
            const requested = event.clientX - sidebar.getBoundingClientRect().left;
            if (requested < minimum) {
                handle.releasePointerCapture(event.pointerId);
                collapse(true);
                open.focus();
            } else {
                width = Math.min(440, requested);
                save('safarops-sidebar-width', width);
                scheduleDraw();
            }
        };
        handle.onpointerup = handle.onpointercancel = event => {
            if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
        };
        handle.onkeydown = event => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'Enter'].includes(event.key)) return;
            event.preventDefault();
            if (event.key === 'Enter' || event.key === 'ArrowLeft' && width - 8 < minimum) {
                collapse(true);
                open.focus();
                return;
            }
            width = event.key === 'Home' ? minimum : Math.max(minimum, Math.min(440, width + (event.key === 'ArrowRight' ? 8 : -8)));
            save('safarops-sidebar-width', width);
            draw();
        };
        mobile.addEventListener('change', draw);
        window.addEventListener('resize', measure);
        document.fonts.ready.then(measure);
        measure();

        const quotes = [
            ['فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', 'Bersama kesulitan ada kemudahan.', 'Ash-Sharh 94:5', 'https://quran.com/94/5'],
            ['أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', 'Mengingat Allah membawa ketenteraman hati.', 'Ar-Ra’d 13:28', 'https://quran.com/13/28'],
            ['إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ', 'Nilai amal bergantung pada niatnya.', 'Al-Bukhari 1', 'https://sunnah.com/bukhari:1'],
            ['وَاللَّهُ فِي عَوْنِ الْعَبْدِ مَا كَانَ الْعَبْدُ فِي عَوْنِ أَخِيهِ', 'Allah menolong hamba yang menolong saudaranya.', 'Muslim 2699a', 'https://sunnah.com/muslim:2699a']
        ];
        const previous = read('safarops-last-quote');
        const choices = quotes.map((_, index) => index).filter(index => previous === null || index !== Number(previous));
        const index = choices[Math.floor(Math.random() * choices.length)];
        save('safarops-last-quote', index);
        const card = sidebar.querySelector('p.font-serif').parentElement;
        card.className = 'workspace-quote';
        card.replaceChildren();
        const link = document.createElement('a');
        link.href = quotes[index][3];
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', `Baca ${quotes[index][2]} — ${quotes[index][1]}`);
        const arabic = document.createElement('p');
        arabic.lang = 'ar';
        arabic.dir = 'rtl';
        arabic.className = 'quote-arabic';
        arabic.textContent = quotes[index][0];
        const meaning = document.createElement('p');
        meaning.textContent = quotes[index][1];
        link.append(arabic, meaning);
        card.append(link);
        window.lucide?.createIcons();
    });
})();
