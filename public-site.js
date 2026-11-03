/* Public presentation and adapters around the original workspace handlers. */
(function () {
    'use strict';
    const $ = id => document.getElementById(id);
    const config = window.SafarPublicConfig;
    const validate = window.SafarValidation;
    const phoneBaselines = new Map();

    const WorkspaceForms = {
        remember(id, existing) {
            phoneBaselines.set(id, existing ? $(id).value : null);
            this.showError(id, '');
        },
        showError(id, error) {
            $(id).setAttribute('aria-invalid', String(Boolean(error)));
            $(id + '-error').textContent = error;
        },
        valid(id, focus = false) {
            const field = $(id);
            const previous = phoneBaselines.get(id);
            const error = previous !== null && previous !== undefined && field.value === previous
                ? '' : validate.phone(field.value, field.required).error;
            this.showError(id, error);
            if (error && focus) field.focus();
            return !error;
        },
        phoneValue(id) {
            const previous = phoneBaselines.get(id);
            return previous !== null && previous !== undefined && $(id).value === previous
                ? previous : Utils.normalizePhone($(id).value);
        },
        init() {
            for (const [id, formId] of [['wiz-phone', 'wizard-form'], ['prof-phone', 'agency-profile-form'], ['jm-phone', 'form-jamaah']]) {
                const field = $(id);
                field.type = 'tel';
                field.inputMode = 'tel';
                field.autocomplete = 'tel';
                field.placeholder = '081234567890';
                field.parentElement.querySelector('label')?.setAttribute('for', id);
                const error = document.createElement('p');
                error.id = id + '-error';
                error.className = 'phone-error';
                const help = document.createElement('p');
                help.id = id + '-help';
                help.className = 'phone-help';
                help.textContent = 'Nomor digunakan untuk konsultasi; kepemilikan nomor belum diverifikasi.';
                field.after(error, help);
                field.setAttribute('aria-describedby', error.id + ' ' + help.id);
                field.addEventListener('blur', () => this.valid(id));
                field.addEventListener('input', () => {
                    if (field.getAttribute('aria-invalid') === 'true') this.valid(id);
                });
                $(formId).addEventListener('submit', event => {
                    if (!this.valid(id, true)) { event.preventDefault(); event.stopImmediatePropagation(); }
                }, true);
            }
            for (const input of document.querySelectorAll('#app-view input[id], #app-view select[id], #app-view textarea[id], #onboarding-wizard input[id]')) {
                input.parentElement.querySelector('label:not([for])')?.setAttribute('for', input.id);
            }
        }
    };
    window.WorkspaceForms = WorkspaceForms;

    const PublicSite = {
        requested: false,
        initializing: null,
        trigger: null,
        workspaceActive: false,
        init() {
            this.dialog = $('console-dialog');
            this.publicView = $('public-view');
            document.querySelectorAll('[data-public-brand]').forEach(el => { el.textContent = config.brandName || 'SafarOps'; });
            $('public-year').textContent = new Date().getFullYear();
            if (validate.phone(config.whatsappNumber).valid) {
                $('public-contact-number').textContent = config.whatsappNumber;
                $('public-contact-note').textContent = 'Siapkan pesan melalui formulir di samping.';
            }
            const menu = $('travel-menu-toggle');
            const header = $('travel-header');
            const closeMenu = () => { header.classList.remove('menu-open'); menu.setAttribute('aria-expanded', 'false'); };
            menu.addEventListener('click', () => {
                const open = menu.getAttribute('aria-expanded') !== 'true';
                menu.setAttribute('aria-expanded', String(open));
                header.classList.toggle('menu-open', open);
            });
            header.addEventListener('keydown', event => {
                if (event.key === 'Escape' && header.classList.contains('menu-open')) { closeMenu(); menu.focus(); }
            });
            document.querySelectorAll('.travel-navigation a').forEach(link => link.addEventListener('click', closeMenu));
            document.querySelectorAll('[data-open-console]').forEach(button => button.addEventListener('click', () => {
                closeMenu();
                this.openConsole(button);
            }));
            document.querySelectorAll('[data-consult]').forEach(link => link.addEventListener('click', () => {
                requestAnimationFrame(() => $('inquiry-name').focus({ preventScroll: true }));
            }));
            const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 24);
            window.addEventListener('scroll', onScroll, { passive: true });
            window.matchMedia('(min-width: 901px)').addEventListener('change', closeMenu);
            onScroll();
            $('close-console').addEventListener('click', () => this.dialog.close());
            this.dialog.addEventListener('cancel', () => { this.requested = false; });
            this.dialog.addEventListener('close', () => {
                this.requested = false;
                document.body.style.overflow = '';
                this.publicView.inert = false;
                $('auth-password').type = 'password';
                $('toggle-auth-password').setAttribute('aria-pressed', 'false');
                $('toggle-auth-password').setAttribute('aria-label', 'Tampilkan kata sandi');
                if (!this.workspaceActive) {
                    const returnTarget = this.trigger?.getClientRects().length ? this.trigger : $('travel-menu-toggle');
                    returnTarget?.focus({ preventScroll: true });
                }
            });
            this.dialog.addEventListener('keydown', event => {
                if (event.key !== 'Tab') return;
                const elements = [...this.dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), a[href]')]
                    .filter(el => el.getClientRects().length && !el.closest('[inert]'));
                const first = elements[0];
                const last = elements.at(-1);
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
            });
            $('toggle-auth-password').addEventListener('click', () => {
                const show = $('auth-password').type === 'password';
                $('auth-password').type = show ? 'text' : 'password';
                $('toggle-auth-password').setAttribute('aria-pressed', String(show));
                $('toggle-auth-password').setAttribute('aria-label', show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
            });
            $('login-form').addEventListener('submit', event => {
                if ($('btn-login').disabled || this.initializing || !$('login-form').reportValidity()) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    return;
                }
                const password = $('auth-password');
                if (password.minLength > 0 && password.value.length < password.minLength) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    if (this.workspaceAvailable()) App.showAuthAlert('Kata sandi minimal ' + password.minLength + ' karakter.', 'error');
                    password.focus();
                    return;
                }
                if (!this.workspaceAvailable()) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    $('console-status').textContent = 'Komponen ruang kerja belum tersedia. Periksa koneksi lalu muat ulang halaman.';
                }
            }, true);
            new MutationObserver(() => { $('btn-switch-register').disabled = $('btn-login').disabled; })
                .observe($('btn-login'), { attributes: true, attributeFilter: ['disabled'] });
            this.initInquiry();
            this.initHero();
            if (this.workspaceAvailable()) {
                WorkspaceForms.init();
                this.adaptWorkspace();
            }
            window.lucide?.createIcons();
        },
        workspaceAvailable() {
            try { return typeof App !== 'undefined'; } catch { return false; }
        },
        initHero() {
            const hero = $('beranda');
            const frames = [...hero.querySelectorAll('[data-hero-frame]')];
            const dots = [...hero.querySelectorAll('[data-hero-dot]')];
            const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
            const narrow = window.matchMedia('(max-width: 640px)');
            const connection = navigator.connection;
            const constrained = () => motion.matches || narrow.matches || connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '');
            const names = ['Makkah Al-Mukarramah', 'Madinah Al-Munawwarah'];
            let index = 0;
            let timer;
            let pending = false;
            let playing = !constrained();
            let userPaused = false;
            let hovered = false;
            let focused = false;
            const load = async next => {
                const frame = frames[next];
                const image = frame.querySelector('img');
                frame.querySelectorAll('[data-srcset]').forEach(source => {
                    source.srcset = source.dataset.srcset;
                    source.removeAttribute('data-srcset');
                });
                if (image.dataset.src) { image.src = image.dataset.src; image.removeAttribute('data-src'); }
                if (image.decode) await image.decode();
                else if (!image.complete) await new Promise((resolve, reject) => {
                    image.addEventListener('load', resolve, { once: true });
                    image.addEventListener('error', reject, { once: true });
                });
                if (!image.naturalWidth) throw new Error('Hero unavailable');
            };
            const sync = () => {
                $('hero-play').setAttribute('aria-pressed', String(playing));
                $('hero-play').setAttribute('aria-label', playing ? 'Jeda pergantian gambar' : 'Putar pergantian gambar');
                $('hero-play').firstElementChild.textContent = playing ? 'Ⅱ' : '▶';
                clearTimeout(timer);
                if (playing && !pending && !hovered && !focused && !document.hidden && !this.dialog.open && !this.publicView.hidden) {
                    timer = window.setTimeout(() => select((index + 1) % frames.length, false), 9000);
                }
            };
            const select = async (next, manual = true) => {
                if (pending || next === index) return;
                if (manual) { playing = false; userPaused = true; }
                pending = true;
                clearTimeout(timer);
                $('hero-next').disabled = true;
                $('hero-previous').disabled = true;
                try {
                    // Keep the current image visible until the new local asset is decoded.
                    await load(next);
                    frames.forEach((frame, i) => {
                        frame.classList.toggle('is-active', i === next);
                        frame.setAttribute('aria-hidden', String(i !== next));
                    });
                    dots.forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === next)));
                    index = next;
                    $('hero-slide-count').textContent = String(index + 1).padStart(2, '0') + ' / 02';
                    $('hero-location-name').textContent = names[index].toUpperCase();
                    if (manual) $('hero-announcement').textContent = 'Ilustrasi ' + names[index] + ', gambar ' + (index + 1) + ' dari 2.';
                } catch {
                    playing = false;
                    $('hero-announcement').textContent = 'Gambar berikutnya belum dapat dimuat. Gambar saat ini tetap ditampilkan.';
                } finally {
                    pending = false;
                    $('hero-next').disabled = false;
                    $('hero-previous').disabled = false;
                    sync();
                }
            };
            $('hero-next').addEventListener('click', () => select((index + 1) % frames.length));
            $('hero-previous').addEventListener('click', () => select((index + frames.length - 1) % frames.length));
            dots.forEach((dot, i) => dot.addEventListener('click', () => select(i)));
            $('hero-play').addEventListener('click', () => { playing = !playing; userPaused = !playing; sync(); });
            hero.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovered = true; sync(); } });
            hero.addEventListener('pointerleave', () => { hovered = false; sync(); });
            hero.addEventListener('focusin', () => { focused = true; sync(); });
            hero.addEventListener('focusout', event => { if (!hero.contains(event.relatedTarget)) { focused = false; sync(); } });
            const adapt = () => { playing = !constrained() && !userPaused; sync(); };
            motion.addEventListener('change', adapt);
            narrow.addEventListener('change', adapt);
            connection?.addEventListener('change', adapt);
            document.addEventListener('visibilitychange', sync);
            this.dialog.addEventListener('close', sync);
            new MutationObserver(sync).observe(this.dialog, { attributes: true, attributeFilter: ['open'] });
            $('hero-controls').hidden = false;
            // No video, no eager second frame. Mobile, reduced motion and data-saving stay static.
            sync();
        },
        async openConsole(trigger) {
            this.trigger = trigger;
            this.requested = true;
            this.workspaceActive = false;
            $('auth-view').classList.remove('hidden');
            $('auth-alert').classList.add('hidden');
            $('console-status').textContent = '';
            if (!this.dialog.open) this.dialog.showModal();
            document.body.style.overflow = 'hidden';
            this.publicView.inert = true;
            if (!this.workspaceAvailable()) {
                $('console-status').textContent = 'Komponen ruang kerja belum dimuat. Periksa koneksi internet, lalu muat ulang halaman.';
                return;
            }
            if ($('btn-login').disabled) return;
            $('login-form').inert = true;
            try {
                if (!this.initializing) {
                    // Original init checks the existing session; never run it on public page load.
                    this.initializing = App.init();
                }
                await this.initializing;
            } catch {
                if (this.dialog.open) $('console-status').textContent = 'Sesi belum dapat diperiksa. Periksa koneksi atau coba masuk menggunakan akun Anda.';
            } finally {
                this.initializing = null;
                $('login-form').inert = false;
                if (this.dialog.open) $('auth-email').focus();
            }
        },
        enterWorkspace() {
            this.workspaceActive = true;
            this.publicView.hidden = true;
            this.publicView.inert = false;
            $('page-robots').content = 'noindex, nofollow';
            if (this.dialog.open) this.dialog.close();
            document.body.style.overflow = '';
            window.scrollTo({ top: 0, behavior: 'instant' });
        },
        showPublic() {
            this.workspaceActive = false;
            $('app-view').classList.add('hidden');
            $('onboarding-wizard').classList.add('hidden');
            this.publicView.hidden = false;
            this.publicView.inert = false;
            $('page-robots').content = 'index, follow';
            if (this.dialog.open) this.dialog.close();
            document.body.style.overflow = '';
            window.scrollTo({ top: 0, behavior: 'instant' });
            $('travel-header').querySelector('a').focus({ preventScroll: true });
            if (State.currentUser) document.querySelectorAll('[data-open-console]').forEach(button => {
                // Keep the icon and an explicit staff label.
                button.setAttribute('aria-label', 'Buka Console — ruang kerja tim');
            });
        },
        adaptWorkspace() {
            const bindAuth = App.bindAuthEvents;
            let bound = false;
            App.bindAuthEvents = function () { if (!bound) { bound = true; return bindAuth.call(this); } };
            const handleUser = App.handleAuthenticatedUser;
            App.handleAuthenticatedUser = async function (...args) {
                // The original provider has decided; closing a modal never reopens a stale view.
                if (!PublicSite.requested || !PublicSite.dialog.open) {
                    return;
                }
                PublicSite.enterWorkspace();
                const result = await handleUser.apply(this, args);
                if (!PublicSite.workspaceActive) {
                    $('app-view').classList.add('hidden');
                    $('onboarding-wizard').classList.add('hidden');
                }
                return result;
            };
            const showAlert = App.showAuthAlert;
            App.showAuthAlert = function (...args) {
                if (PublicSite.dialog.open && PublicSite.requested) return showAlert.apply(this, args);
            };
            const logout = App.logout;
            App.logout = async function () {
                await logout.call(this);
                PublicSite.showPublic();
            };
            const openJamaah = App.openJamaahModal;
            App.openJamaahModal = function (id = null) {
                const result = openJamaah.call(this, id);
                WorkspaceForms.remember('jm-phone', Boolean(id));
                return result;
            };
            const openWizard = App.openOnboardingWizard;
            App.openOnboardingWizard = function (...args) {
                const result = openWizard.apply(this, args);
                WorkspaceForms.remember('wiz-phone', Boolean(State.agencyProfile.is_setup));
                return result;
            };
            const moveWizard = App.moveWizardStep;
            App.moveWizardStep = function (delta) {
                if (State.wizardStep === 1 && delta > 0 && !WorkspaceForms.valid('wiz-phone', true)) return;
                return moveWizard.call(this, delta);
            };
            // These two methods are referenced by the original app but missing at baseline.
            App.populateProfileForm = function () {
                const p = State.agencyProfile;
                for (const [id, key] of [['prof-name', 'agency_name'], ['prof-ppiu', 'ppiu_number'], ['prof-address', 'agency_address'], ['prof-phone', 'agency_phone'], ['prof-director', 'director_name'], ['prof-bank', 'bank_info']]) $(id).value = p[key] || '';
                this.renderImagePreview('prof-logo-preview', p.logo_base64, 'image');
                this.renderImagePreview('prof-banner-preview', p.banner_base64, 'panorama');
                WorkspaceForms.remember('prof-phone', Boolean(p.is_setup));
            };
            App.saveAgencyProfile = async function (event) {
                event.preventDefault();
                if (!WorkspaceForms.valid('prof-phone', true)) return;
                const button = $('agency-profile-form').querySelector('button[type="submit"]');
                if (button.disabled) return;
                button.disabled = true;
                try {
                    State.agencyProfile = {
                        ...State.agencyProfile,
                        agency_name: $('prof-name').value.trim(),
                        ppiu_number: $('prof-ppiu').value.trim(),
                        agency_address: $('prof-address').value.trim(),
                        agency_phone: WorkspaceForms.phoneValue('prof-phone'),
                        director_name: $('prof-director').value.trim(),
                        bank_info: $('prof-bank').value.trim()
                    };
                    await this.syncAgencyProfileToCloud();
                    this.persistLocal();
                    this.populateProfileForm();
                    this.renderAll();
                    Utils.toast('Pengaturan profil telah diproses.');
                } catch { Utils.toast('Profil belum dapat disimpan. Periksa koneksi lalu coba lagi.', 'error'); }
                finally { button.disabled = false; }
            };
            const sidebar = $('app-view').querySelector('aside');
            const navToggle = document.createElement('button');
            navToggle.className = 'workspace-nav-toggle';
            navToggle.type = 'button';
            navToggle.setAttribute('aria-expanded', 'false');
            navToggle.setAttribute('aria-controls', 'workspace-navigation');
            navToggle.innerHTML = '<i data-lucide="menu" aria-hidden="true"></i> Menu';
            sidebar.querySelector('nav').id = 'workspace-navigation';
            sidebar.querySelector('div.relative > div').appendChild(navToggle);
            navToggle.addEventListener('click', () => {
                const open = sidebar.classList.toggle('workspace-menu-open');
                navToggle.setAttribute('aria-expanded', String(open));
            });
            sidebar.querySelectorAll('.nav-btn').forEach(button => button.addEventListener('click', () => {
                sidebar.classList.remove('workspace-menu-open'); navToggle.setAttribute('aria-expanded', 'false');
            }));
            const homeButton = document.createElement('button');
            homeButton.type = 'button';
            homeButton.className = 'workspace-return';
            homeButton.textContent = 'Kembali ke Beranda';
            homeButton.addEventListener('click', () => this.showPublic());
            $('app-view').querySelector('main > header > div:last-child').appendChild(homeButton);
        },
        initInquiry() {
            const form = $('consultation-form');
            const status = $('inquiry-status');
            const fallback = $('whatsapp-fallback');
            const fields = ['name', 'phone', 'email', 'message', 'consent'];
            const values = () => Object.fromEntries(fields.map(key => [key, key === 'consent' ? $('inquiry-' + key).checked : $('inquiry-' + key).value]));
            const showError = (key, error) => {
                $('inquiry-' + key).setAttribute('aria-invalid', String(Boolean(error)));
                $('inquiry-' + key + '-error').textContent = error;
            };
            for (const key of fields) {
                const field = $('inquiry-' + key);
                field.addEventListener('blur', () => showError(key, validate.inquiry(values())[key]));
                field.addEventListener(key === 'consent' ? 'change' : 'input', () => {
                    if (field.getAttribute('aria-invalid') === 'true') showError(key, validate.inquiry(values())[key]);
                    fallback.hidden = true;
                    fallback.removeAttribute('href');
                    status.textContent = '';
                });
            }
            let busy = false;
            form.addEventListener('submit', event => {
                event.preventDefault();
                if (busy) return;
                const details = values();
                const errors = validate.inquiry(details);
                fields.forEach(key => showError(key, errors[key]));
                const invalid = fields.filter(key => errors[key]);
                fallback.hidden = true;
                fallback.removeAttribute('href');
                if (invalid.length) {
                    status.textContent = invalid.length > 1 ? 'Periksa ' + invalid.length + ' kolom yang ditandai sebelum melanjutkan.' : errors[invalid[0]];
                    $('inquiry-' + invalid[0]).focus();
                    return;
                }
                const url = validate.draftURL(config.whatsappNumber, details);
                if (!url) {
                    status.textContent = 'Kontak konsultasi belum tersedia. Pesan belum dikirim. Silakan kembali setelah informasi kontak diperbarui.';
                    return;
                }
                busy = true;
                const submit = form.querySelector('button[type="submit"]');
                submit.disabled = true;
                try {
                    // A draft is opened by this user action. No message is sent or lead stored.
                    window.open(url, '_blank', 'noopener,noreferrer');
                    fallback.href = url;
                    fallback.hidden = false;
                    status.textContent = 'Pesan belum terkirim. Silakan kirim melalui WhatsApp. Jika jendela tidak terbuka, gunakan tautan draf di bawah.';
                } catch {
                    fallback.href = url;
                    fallback.hidden = false;
                    status.textContent = 'Draf belum terbuka. Pesan belum terkirim. Gunakan tautan di bawah untuk melanjutkan.';
                } finally {
                    // Briefly guard double-clicks. This timer never reports submission success.
                    window.setTimeout(() => { busy = false; submit.disabled = false; }, 800);
                }
            });
        }
    };
    window.PublicSite = PublicSite;
    window.addEventListener('DOMContentLoaded', () => PublicSite.init(), { once: true });
})();
