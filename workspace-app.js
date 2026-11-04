
        /**
         * KONFIGURASI KONEKSI CLOUD WORKSPACE
         */
        const CONFIG = window.SAFAROPS_CONFIG || {CLOUD_ENDPOINT:'', CLOUD_PUBLIC_KEY:''};

        const isCloudConfigured = Boolean(CONFIG.CLOUD_ENDPOINT && CONFIG.CLOUD_PUBLIC_KEY);
        const cloudClient = isCloudConfigured
            ? window.supabase.createClient(CONFIG.CLOUD_ENDPOINT, CONFIG.CLOUD_PUBLIC_KEY, {
                auth: { persistSession: true, autoRefreshToken: true }
            })
            : null;

        /**
         * KOLEKSI ASET VISUAL HARAMAIN (UNTUK KARTU PAKET & BANNER)
         */
        const HARAMAIN_THEMES = {
            makkah: 'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?auto=format&fit=crop&w=900&q=80',
            madinah: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=900&q=80',
            kabah: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=900&q=80',
            turkey: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=900&q=80'
        };

        /**
         * STATE GLOBAL APLIKASI
         */
        const State = {
            currentUser: null,
            isRegisterMode: false,
            wizardStep: 1,
            searchQuery: '',
            agencyProfile: {
                is_setup: false,
                agency_name: 'PT. Wisata Haromain Tour & Travel',
                ppiu_number: 'SK PPIU Resmi Kemenag RI',
                agency_address: 'Jl. Majalengka Utama No. 76, Jawa Barat',
                agency_phone: '6281717888989',
                director_name: 'H. Direktur Utama, Lc.',
                bank_info: 'Bank Syariah Indonesia (BSI) — a.n PT. Wisata Haromain Tour & Travel',
                logo_base64: '',
                banner_base64: ''
            },
            packages: [],
            jamaah: [],
            payments: [],
            licenses: [],
            charts: { finance: null, pipeline: null }
        };

        const CRM_STAGES = ['Leads Baru', 'Follow Up', 'DP Masuk', 'Cicilan', 'Lunas', 'Siap Berangkat'];

        /**
         * MODUL UTILITAS, KOMPRESI GAMBAR & VALIDASI FORM
         */
        const Utils = {
            escapeHTML(value) {return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));},
            formatIDR(num) {
                return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
            },
            formatDate(dateStr) {
                if (!dateStr) return '-';
                const d = new Date(dateStr);
                if (isNaN(d.getTime())) return dateStr;
                const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
            },
            normalizePhone(raw) {
                let cleaned = String(raw || '').replace(/[^0-9]/g, '');
                if (cleaned.startsWith('0')) cleaned = '62' + cleaned.slice(1);
                else if (cleaned.startsWith('8')) cleaned = '62' + cleaned;
                return cleaned;
            },
            validateEmail(email) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            },
            calcDocPercent(j) {
                const docs = [j.doc_ktp, j.doc_kk, j.doc_passport, j.doc_photo, j.doc_vaccine];
                const done = docs.filter(Boolean).length;
                return Math.round((done / 5) * 100);
            },
            calcPaidByJamaah(jamaahId) {
                return State.payments
                    .filter(p => p.jamaah_id === jamaahId && p.status === 'Confirmed')
                    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
            },
            compressImage(file, maxWidth = 600, maxHeight = 300, quality = 0.82) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        const img = new Image();
                        img.onload = () => {
                            let w = img.width;
                            let h = img.height;
                            if (w > maxWidth || h > maxHeight) {
                                const ratio = Math.min(maxWidth / w, maxHeight / h);
                                w = Math.round(w * ratio);
                                h = Math.round(h * ratio);
                            }
                            const canvas = document.createElement('canvas');
                            canvas.width = w;
                            canvas.height = h;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, w, h);
                            resolve(canvas.toDataURL('image/png', quality));
                        };
                        img.onerror = reject;
                        img.src = ev.target.result;
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            },
            toast(message, type = 'success') {
                const container = document.getElementById('toast-container');
                const el = document.createElement('div');
                const bg = type === 'error' ? 'bg-red-700' : 'bg-emerald-900';
                el.className = `${bg} text-white px-4 py-3 rounded-2xl shadow-xl border border-white/10 flex items-center gap-3 text-xs font-bold pointer-events-auto transition-all duration-300`;
                el.innerHTML = `<i data-lucide="${type === 'error' ? 'alert-triangle' : 'check-circle'}" class="w-4 h-4 text-amber-400 shrink-0"></i><span>${Utils.escapeHTML(message)}</span>`;
                container.appendChild(el);
                lucide.createIcons();
                setTimeout(() => el.remove(), 4000);
            }
        };

        /**
         * MODUL INTI APLIKASI (SPA CONTROLLER)
         */
        const App = {
            async init() {
                window.lucide?.createIcons();
                this.clearCachedWorkspaceData();
                this.bindAuthEvents();
                const invitation = new URLSearchParams(location.hash.slice(1));
                if(invitation.has('setup')) {
                    State.adminSetupToken=invitation.get('setup');
                    document.getElementById('auth-email').value=invitation.get('email')||'';
                    history.replaceState(null,'',location.pathname+location.search);
                }
                if(invitation.has('invite')) {
                    State.activationToken=invitation.get('invite');
                    document.getElementById('auth-email').value=invitation.get('email')||'';
                    history.replaceState(null,'',location.pathname+location.search);
                    this.setAuthMode(true);
                }
                cloudClient?.auth.onAuthStateChange((event) => {
                    if(event==='SIGNED_OUT') setTimeout(()=>{const hadWorkspace=Boolean(State.currentUser);this.clearSessionUI();if(hadWorkspace)location.reload();},0);
                });
                if (!isCloudConfigured) return this.showAuthAlert('Layanan masuk belum tersedia. Hubungi pemilik sistem.', 'error');
                try {
                    const { data, error } = await cloudClient.auth.getUser();
                    if (error || !data?.user) return;
                    const license = await SafarAuth.authorize(cloudClient, data.user);
                    await this.handleAuthenticatedUser(data.user, license);
                } catch(error) { this.showAuthAlert(error.message, 'error'); }
            },
            setAuthMode(register) {
                State.isRegisterMode = register;
                document.getElementById('auth-password').minLength = 6;
                document.getElementById('auth-password').maxLength = 128;
                document.getElementById('auth-password').autocomplete = register ? 'new-password' : 'current-password';
                document.getElementById('console-title').textContent = register ? 'Aktifkan akun Anda.' : 'Masuk ke ruang kerja.';
                document.getElementById('console-description').textContent = register ? 'Gunakan email yang sudah ditambahkan administrator. Buat kata sandi minimal 6 karakter sekali untuk mengaktifkan akun Anda.' : 'Gunakan email terdaftar dan kata sandi Anda.';
                document.getElementById('btn-login').textContent = register ? 'Aktivasi Kata Sandi ↗' : 'Masuk ke Ruang Kerja ↗';
                document.getElementById('btn-switch-register').textContent = register ? 'Sudah memiliki kata sandi? Masuk di sini' : 'Pertama kali masuk? Aktivasi kata sandi';
                document.getElementById('auth-alert').classList.add('hidden');
            },
            bindAuthEvents() {
                const form = document.getElementById('login-form');
                const button = document.getElementById('btn-login');
                const toggle = document.getElementById('btn-switch-register');
                toggle.addEventListener('click', () => this.setAuthMode(!State.isRegisterMode));
                document.getElementById('dismiss-auth-alert').addEventListener('click', () => {
                    document.getElementById('auth-alert').classList.add('hidden');
                    document.getElementById('auth-password').focus();
                });
                form.addEventListener('submit', async event => {
                    event.preventDefault();
                    if(button.disabled) return;
                    if(!form.reportValidity()) return;
                    const email = document.getElementById('auth-email').value.trim().toLowerCase();
                    const password = document.getElementById('auth-password').value;
                    button.disabled = toggle.disabled = true;
                    button.textContent = 'Memproses…';
                    try {
                        if(State.passwordChangeMode) {
                            await SafarAuth.accountRequest(cloudClient,{action:'change-password',password,token:State.adminSetupToken});
                            const {error}=await cloudClient.auth.signInWithPassword({email,password});
                            if(error) throw error;
                            State.passwordChangeMode=false;
                            document.getElementById('auth-email').disabled=false;
                            this.setAuthMode(false);
                            const {data}=await cloudClient.auth.getUser();
                            const license=await SafarAuth.authorize(cloudClient,data.user);
                            await this.handleAuthenticatedUser(data.user,license);
                            document.getElementById('auth-password').value='';
                            return;
                        }
                        const result = await SafarAuth.submit(cloudClient, {email, password, register:State.isRegisterMode, token:State.activationToken});
                        if(result.pendingConfirmation) {
                            this.setAuthMode(false);
                            this.showAuthAlert('Periksa email untuk konfirmasi akun, lalu masuk dengan kata sandi yang Anda buat.', 'info');
                        } else {
                            await this.handleAuthenticatedUser(result.user, result.license, State.isRegisterMode);
                            document.getElementById('auth-password').value = '';
                        }
                    } catch(error) { this.showAuthAlert(error.message || 'Koneksi gagal. Silakan coba lagi.', 'error'); }
                    finally { button.disabled = false; toggle.disabled = Boolean(State.passwordChangeMode); button.textContent = State.passwordChangeMode ? 'Simpan Kata Sandi Baru ↗' : State.isRegisterMode ? 'Aktivasi Kata Sandi ↗' : 'Masuk ke Ruang Kerja ↗'; }
                });
            },

            showAuthAlert(msg, type) {
                const el = document.getElementById('auth-alert');
                el.className = `auth-alert p-4 rounded-xl text-xs font-bold leading-relaxed ${
                    type === 'error'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`;
                document.getElementById('auth-alert-message').textContent = msg;
                el.classList.remove('hidden');
            },

            async handleAuthenticatedUser(user, licenseRecord = null, forceWizardOnNewActivation = false) {
                if(user.app_metadata?.password_change_required) {
                    State.passwordChangeMode=true;
                    this.setAuthMode(true);
                    document.getElementById('auth-email').value=user.email;
                    document.getElementById('auth-email').disabled=true;
                    document.getElementById('auth-password').value='';
                    document.getElementById('btn-switch-register').disabled=true;
                    document.getElementById('console-title').textContent='Amankan akun admin.';
                    document.getElementById('console-description').textContent='Ganti kata sandi sementara dengan kata sandi unik minimal 6 karakter sebelum membuka data.';
                    document.getElementById('auth-password').focus();
                    return;
                }
                State.currentUser = user;
                document.getElementById('auth-view').classList.add('hidden');
                document.getElementById('app-view').classList.remove('hidden');
                document.getElementById('user-email-display').textContent = user.email;

                const isSuperAdmin = SafarAuth.isAdmin(user, licenseRecord);
                State.isSuperAdmin = isSuperAdmin;
                document.getElementById('superadmin-menu').classList.toggle('hidden', !isSuperAdmin);

                if(isSuperAdmin) await this.loadAccountDirectory();
                document.getElementById('account-scope-field').hidden=!isSuperAdmin;
                await this.fetchWorkspaceData(licenseRecord, forceWizardOnNewActivation, isSuperAdmin);
            },

            clearCachedWorkspaceData() {
                for(const key of Object.keys(localStorage)) if(/^safarops_(pk_|jm_|pay_|prof_|global_licenses$|active_user$)/.test(key)) localStorage.removeItem(key);
            },
            clearSessionUI() {
                this.clearCachedWorkspaceData();
                State.currentUser=null; State.isSuperAdmin=false; State.passwordChangeMode=false;
                State.workspaceUserId=null; State.workspaceEmail=null; State.accountDirectory=[]; State.activationToken=null; State.adminSetupToken=null;
                State.packages=[]; State.jamaah=[]; State.payments=[]; State.licenses=[];
                document.getElementById('auth-email').disabled=false;
                document.getElementById('btn-switch-register').disabled=false;
                document.getElementById('app-view').classList.add('hidden');
                document.getElementById('auth-view').classList.remove('hidden');
                document.getElementById('onboarding-wizard').classList.add('hidden');
                document.getElementById('invitation-result').hidden=true;
                document.getElementById('invitation-link').value='';
                this.setAuthMode(false);
            },
            async logout() {
                if (isCloudConfigured) {
                    try { await cloudClient.auth.signOut(); } catch (e) {}
                }
                this.clearSessionUI();
                localStorage.removeItem('safarops_active_user');
                State.currentUser = null;
                State.isSuperAdmin = false;
                document.getElementById('onboarding-wizard').classList.add('hidden');
                document.getElementById('app-view').classList.add('hidden');
                document.getElementById('auth-view').classList.remove('hidden');
                this.setAuthMode(false);
                document.getElementById('auth-password').value = '';
                document.getElementById('auth-email').focus();
                location.reload();
            },

            /**
             * SINKRONISASI DATA MULTI-PERANGKAT & PENGECEKAN STATUS SETUP WIZARD
             */
            async fetchWorkspaceData(licenseRecord = null, forceWizardOnNewActivation = false, isSuperAdmin = false) {
                const loader = document.getElementById('skeleton-loader');
                loader.classList.remove('hidden');

                const uid = State.workspaceUserId || State.currentUser.id;
                const email = State.workspaceEmail || State.currentUser.email.toLowerCase();

                const savedLocalProfile = localStorage.getItem(`safarops_prof_${email}`) || localStorage.getItem(`safarops_prof_${uid}`);
                if (savedLocalProfile) {
                    try {
                        State.agencyProfile = { ...State.agencyProfile, ...JSON.parse(savedLocalProfile) };
                    } catch (e) {}
                } else {
                    State.agencyProfile = {
                        is_setup: false,
                        agency_name: '',
                        ppiu_number: '',
                        agency_address: '',
                        agency_phone: '',
                        director_name: '',
                        bank_info: '',
                        logo_base64: '',
                        banner_base64: ''
                    };
                }

                if (isCloudConfigured) {
                    try {
                        const [pkRes, jmRes, payRes, licRes] = await Promise.all([
                            cloudClient.from('safarops_packages').select('*').order('departure_date', { ascending: true }),
                            cloudClient.from('safarops_jamaah').select('*').order('created_at', { ascending: false }),
                            cloudClient.from('safarops_payments').select('*').order('payment_date', { ascending: false }),
                            cloudClient.from('safarops_licenses').select('*').order('created_at', { ascending: false })
                        ]);
                        for(const response of [pkRes,jmRes,payRes,licRes]) if(response.error) throw response.error;
                        State.packages = (pkRes.data || []).filter(row=>!State.workspaceUserId || row.user_id===State.workspaceUserId);
                        State.jamaah = (jmRes.data || []).filter(row=>!State.workspaceUserId || row.user_id===State.workspaceUserId);
                        State.payments = (payRes.data || []).filter(row=>!State.workspaceUserId || row.user_id===State.workspaceUserId);
                        State.licenses = licRes.data || [];

                        const myLic = licenseRecord || State.licenses.find(l => (l.email || '').toLowerCase() === email);
                        if (myLic) {
                            const hasValidAgencyName = myLic.agency_name &&
                                myLic.agency_name !== 'Belum Setup' &&
                                myLic.agency_name !== 'Travel Umroh Berkah';

                            if (myLic.is_setup || hasValidAgencyName) {
                                State.agencyProfile = {
                                    is_setup: true,
                                    agency_name: myLic.agency_name || State.agencyProfile.agency_name,
                                    ppiu_number: myLic.ppiu_number || State.agencyProfile.ppiu_number || 'SK PPIU Resmi Kemenag RI',
                                    agency_address: myLic.agency_address || State.agencyProfile.agency_address,
                                    agency_phone: myLic.agency_phone || State.agencyProfile.agency_phone,
                                    director_name: myLic.director_name || State.agencyProfile.director_name,
                                    bank_info: myLic.bank_info || State.agencyProfile.bank_info || '',
                                    logo_base64: myLic.logo_base64 || State.agencyProfile.logo_base64 || '',
                                    banner_base64: myLic.banner_base64 || State.agencyProfile.banner_base64 || ''
                                };
                            }
                        }
                    } catch (err) {
                        State.packages=[]; State.jamaah=[]; State.payments=[];
                        Utils.toast('Data cloud gagal dimuat. Coba masuk kembali.', 'error');
                    }
                } else {
                    State.packages = JSON.parse(localStorage.getItem(`safarops_pk_${uid}`) || '[]');
                    State.jamaah = JSON.parse(localStorage.getItem(`safarops_jm_${uid}`) || '[]');
                    State.payments = JSON.parse(localStorage.getItem(`safarops_pay_${uid}`) || '[]');
                    this.loadLocalLicenses();
                }

                loader.classList.add('hidden');
                this.populateProfileForm();
                this.renderAll();

                const needsOnboarding = (!State.agencyProfile.is_setup || forceWizardOnNewActivation) && !isSuperAdmin;
                if (needsOnboarding) {
                    this.openOnboardingWizard(false);
                }
            },

            persistLocal() {
                if(isCloudConfigured) return;
                if (!State.currentUser) return;
                const uid = State.workspaceUserId || State.currentUser.id;
                const email = State.workspaceEmail || State.currentUser.email.toLowerCase();
                localStorage.setItem(`safarops_pk_${uid}`, JSON.stringify(State.packages));
                localStorage.setItem(`safarops_jm_${uid}`, JSON.stringify(State.jamaah));
                localStorage.setItem(`safarops_pay_${uid}`, JSON.stringify(State.payments));
                localStorage.setItem(`safarops_prof_${uid}`, JSON.stringify(State.agencyProfile));
                localStorage.setItem(`safarops_prof_${email}`, JSON.stringify(State.agencyProfile));
            },

            loadLocalLicenses() {
                const raw = localStorage.getItem('safarops_global_licenses');
                if (raw) {
                    State.licenses = JSON.parse(raw);
                } else {
                    State.licenses = [
                    ];
                    if(!isCloudConfigured) localStorage.setItem('safarops_global_licenses', JSON.stringify(State.licenses));
                }
            },

            /**
             * MODUL ONBOARDING SETUP WIZARD (3 LANGKAH + UPLOAD LOGO, BANNER & PRESET HARAMAIN)
             */
            openOnboardingWizard(isManualReopen = false) {
                State.wizardStep = 1;
                const p = State.agencyProfile;
                document.getElementById('wiz-agency-name').value = (p.agency_name && p.agency_name !== 'Belum Setup') ? p.agency_name : '';
                document.getElementById('wiz-ppiu').value = p.ppiu_number || '';
                document.getElementById('wiz-director').value = (p.director_name && p.director_name !== 'Direktur Utama') ? p.director_name : '';
                document.getElementById('wiz-phone').value = (p.agency_phone && p.agency_phone !== '6281234567890') ? p.agency_phone : '';
                document.getElementById('wiz-address').value = (p.agency_address && p.agency_address !== 'Jl. Raya Utama No. 1, Indonesia') ? p.agency_address : '';
                document.getElementById('wiz-bank').value = p.bank_info || '';

                this.renderImagePreview('wiz-logo-preview', p.logo_base64, 'image');
                this.renderImagePreview('wiz-banner-preview', p.banner_base64, 'panorama');

                this.updateWizardStepUI();
                document.getElementById('onboarding-wizard').classList.remove('hidden');
                lucide.createIcons();
            },

            moveWizardStep(delta) {
                if (State.wizardStep === 1 && delta > 0) {
                    const name = document.getElementById('wiz-agency-name').value.trim();
                    const dir = document.getElementById('wiz-director').value.trim();
                    const phone = document.getElementById('wiz-phone').value.trim();
                    const addr = document.getElementById('wiz-address').value.trim();
                    if (!name || !dir || !phone || !addr) {
                        return Utils.toast('Mohon lengkapi Nama Travel, Direktur, Nomor WA, dan Alamat Kantor terlebih dahulu.', 'error');
                    }
                }
                State.wizardStep = Math.min(3, Math.max(1, State.wizardStep + delta));
                this.updateWizardStepUI();
            },

            updateWizardStepUI() {
                const s = State.wizardStep;
                document.getElementById('wiz-step-1').classList.toggle('hidden', s !== 1);
                document.getElementById('wiz-step-2').classList.toggle('hidden', s !== 2);
                document.getElementById('wiz-step-3').classList.toggle('hidden', s !== 3);

                document.getElementById('wiz-btn-prev').classList.toggle('hidden', s === 1);
                document.getElementById('wiz-btn-next').classList.toggle('hidden', s === 3);
                document.getElementById('wiz-btn-finish').classList.toggle('hidden', s !== 3);

                document.getElementById('wizard-step-badge').textContent = `Langkah ${s} dari 3`;
                document.getElementById('wizard-progress-bar').style.width = `${Math.round((s / 3) * 100)}%`;
                lucide.createIcons();
            },

            async handleImageUpload(event, type, previewElementId) {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                    const isLogo = type === 'logo';
                    const compressedDataUrl = await Utils.compressImage(
                        file,
                        isLogo ? 320 : 1000,
                        isLogo ? 320 : 360,
                        0.85
                    );
                    if (isLogo) {
                        State.agencyProfile.logo_base64 = compressedDataUrl;
                        this.renderImagePreview('wiz-logo-preview', compressedDataUrl, 'image');
                        this.renderImagePreview('prof-logo-preview', compressedDataUrl, 'image');
                    } else {
                        State.agencyProfile.banner_base64 = compressedDataUrl;
                        this.renderImagePreview('wiz-banner-preview', compressedDataUrl, 'panorama');
                        this.renderImagePreview('prof-banner-preview', compressedDataUrl, 'panorama');
                    }
                    Utils.toast(`${isLogo ? 'Logo' : 'Banner'} perusahaan berhasil dimuat!`);
                } catch (err) {
                    Utils.toast('Gagal memproses gambar. Coba gunakan file JPG atau PNG lain.', 'error');
                }
            },

            selectPresetBanner(imageUrl) {
                State.agencyProfile.banner_base64 = imageUrl;
                this.renderImagePreview('wiz-banner-preview', imageUrl, 'panorama');
                this.renderImagePreview('prof-banner-preview', imageUrl, 'panorama');
                this.persistLocal();
                this.renderBrandingHeader();
                Utils.toast('Tema Banner Haramain berhasil diterapkan!');
            },

            renderImagePreview(elementId, base64, fallbackIcon) {
                const box = document.getElementById(elementId);
                if (!box) return;
                if (base64) {
                    box.innerHTML = `<img src="${base64}" alt="Preview" class="w-full h-full object-cover">`;
                } else {
                    box.innerHTML = `<i data-lucide="${fallbackIcon}" class="w-7 h-7 text-slate-300"></i>`;
                    lucide.createIcons();
                }
            },

            clearBrandingAsset(type) {
                if (type === 'logo') {
                    State.agencyProfile.logo_base64 = '';
                    this.renderImagePreview('prof-logo-preview', '', 'image');
                } else {
                    State.agencyProfile.banner_base64 = '';
                    this.renderImagePreview('prof-banner-preview', '', 'panorama');
                }
                this.persistLocal();
                this.renderAll();
                Utils.toast(`Aset ${type} telah dihapus.`);
            },

            async completeOnboardingWizard(e) {
                e.preventDefault();
                State.agencyProfile = {
                    ...State.agencyProfile,
                    is_setup: true,
                    agency_name: document.getElementById('wiz-agency-name').value.trim(),
                    ppiu_number: document.getElementById('wiz-ppiu').value.trim() || 'Penyelenggara Perjalanan Ibadah Umroh Resmi',
                    director_name: document.getElementById('wiz-director').value.trim(),
                    agency_phone: WorkspaceForms.phoneValue('wiz-phone'),
                    agency_address: document.getElementById('wiz-address').value.trim(),
                    bank_info: document.getElementById('wiz-bank').value.trim()
                };

                await this.syncAgencyProfileToCloud();
                this.persistLocal();
                this.populateProfileForm();
                document.getElementById('onboarding-wizard').classList.add('hidden');
                this.renderAll();
                Utils.toast(`Selamat datang! Workspace ${State.agencyProfile.agency_name} telah aktif.`);
            },

            async syncAgencyProfileToCloud() {
                if (!State.currentUser) return;
                const email = State.workspaceEmail || State.currentUser.email.toLowerCase();
                const p = State.agencyProfile;

                const licIdx = State.licenses.findIndex(l => (l.email || '').toLowerCase() === email);
                if (licIdx > -1) {
                    State.licenses[licIdx] = {
                        ...State.licenses[licIdx],
                        agency_name: p.agency_name,
                        agency_address: p.agency_address,
                        agency_phone: p.agency_phone,
                        director_name: p.director_name,
                        is_setup: true
                    };
                    if(!isCloudConfigured) localStorage.setItem('safarops_global_licenses', JSON.stringify(State.licenses));
                }

                if (isCloudConfigured) {
                    const fullUpdate = {
                        agency_name: p.agency_name,
                        agency_address: p.agency_address,
                        agency_phone: p.agency_phone,
                        director_name: p.director_name,
                        is_setup: true,
                        ppiu_number: p.ppiu_number,
                        bank_info: p.bank_info,
                        logo_base64: p.logo_base64,
                        banner_base64: p.banner_base64
                    };
                    const {error} = State.isSuperAdmin && State.workspaceEmail
                        ? await cloudClient.from('safarops_licenses').update(fullUpdate).eq('email',email)
                        : await cloudClient.rpc('safarops_save_profile',{profile:fullUpdate});
                    if(error) throw new Error('Profil belum tersimpan. Silakan coba kembali.');
                }
            },

            /**
             * NAVIGASI TAB MULUS TANPA RELOAD
             */
            switchTab(tabId) {
                document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
                document.getElementById(`tab-${tabId}`).classList.remove('hidden');

                document.querySelectorAll('.nav-btn').forEach(btn => {
                    const active = btn.getAttribute('data-tab') === tabId;
                    btn.className = active
                        ? 'nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition bg-emerald-800 text-amber-400 shadow'
                        : 'nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-emerald-100 hover:bg-emerald-800/60 transition';
                });

                const titles = {
                    overview: ['Ikhtisar Operasional Travel', 'Pantau performa konversi leads, kelengkapan dokumen, dan kas keberangkatan secara real-time.'],
                    packages: ['Manajemen Paket & Kuota Keberangkatan', 'Kelola batch keberangkatan, maskapai, kuota kursi, dan pantau sisa seat secara otomatis.'],
                    crm: ['Pipeline CRM & Konversi Jamaah', 'Geser dan lepas kartu jamaah untuk memindahkan tahapan proses dari Leads hingga Siap Berangkat.'],
                    manifest: ['Manifest Jamaah, Dokumen, Kamar & Mahram', 'Kelola kelengkapan berkas, rooming list, serta cetak surat pengantar imigrasi dan izin cuti.'],
                    finance: ['Manajemen Keuangan, Mutasi & Kwitansi', 'Rekapitulasi pembayaran jamaah, kalkulasi sisa tagihan, dan cetak bukti pembayaran ber-QR Code.'],
                    settings: ['Identitas Biro, Logo & Kop Surat Resmi', 'Sesuaikan nama travel, logo, banner, dan direktur penandatangan untuk seluruh cetakan dokumen PDF.'],
                    superadmin: ['Super Admin Control Room', 'Ruang kontrol pemilik untuk whitelist lisensi email buyer, pemantauan akses, dan pemblokiran darurat.']
                };
                if (titles[tabId]) {
                    document.getElementById('page-title').textContent = titles[tabId][0];
                    document.getElementById('page-subtitle').textContent = titles[tabId][1];
                }
                this.renderAll();
            },

            handleGlobalSearch(val) {
                State.searchQuery = val.trim().toLowerCase();
                this.renderAll();
            },

            getFilteredJamaah() {
                const pkgFilter = document.getElementById('crm-filter-package')?.value || 'ALL';
                return State.jamaah.filter(j => {
                    const matchSearch = !State.searchQuery ||
                        j.full_name?.toLowerCase().includes(State.searchQuery) ||
                        j.jamaah_code?.toLowerCase().includes(State.searchQuery) ||
                        j.nik?.toLowerCase().includes(State.searchQuery) ||
                        j.mahram_group?.toLowerCase().includes(State.searchQuery) ||
                        j.room_group?.toLowerCase().includes(State.searchQuery);
                    const matchPkg = pkgFilter === 'ALL' || j.package_id === pkgFilter;
                    return matchSearch && matchPkg;
                });
            },

            /**
             * RENDER SELURUH KOMPONEN UI
             */
            renderAll() {
                this.renderBrandingHeader();
                this.renderPackageSelectOptions();
                this.renderKPIsAndCharts();
                this.renderPackagesTable();
                this.renderKanbanBoard();
                this.renderManifestTable();
                this.renderRoomingAndMahramCards();
                this.renderFinanceTables();
                this.renderSuperAdminTable();
                lucide.createIcons();
            },

            renderBrandingHeader() {
                const p = State.agencyProfile;
                const displayName = p.agency_name || 'Smart Umrah Workspace';
                document.getElementById('sidebar-agency-name').textContent = displayName;
                document.getElementById('hero-agency-name').textContent = displayName;
                document.getElementById('hero-agency-address').textContent = p.agency_address || 'Lengkapi alamat biro travel Anda di menu Pengaturan';
                document.getElementById('hero-ppiu-badge').textContent = p.ppiu_number || 'Biro Umroh Resmi';

                const sidebarLogoBox = document.getElementById('sidebar-logo-box');
                const heroLogoBox = document.getElementById('hero-logo-box');
                sidebarLogoBox.innerHTML = `<img src="assets/brand-compass.svg" alt="SafarOps" width="44" height="44" class="w-full h-full object-contain">`;
                if (p.logo_base64) {
                    heroLogoBox.innerHTML = `<img src="${p.logo_base64}" alt="Logo" class="w-full h-full object-contain bg-white p-1">`;
                } else {
                    heroLogoBox.innerHTML = `<img src="assets/brand-compass.svg" alt="SafarOps" class="hero-brand-mark">`;
                }

                // Default ke Panorama Masjidil Haram jika agen belum upload banner sendiri
                const heroBg = document.getElementById('agency-hero-bg');
                const bannerUrl = p.banner_base64 || 'assets/jejakimani-home-video-poster.webp';
                heroBg.style.backgroundImage = `url('${bannerUrl}')`;
            },

            renderPackageSelectOptions() {
                const filterSel = document.getElementById('crm-filter-package');
                const currentVal = filterSel.value;
                filterSel.innerHTML = `<option value="ALL">Semua Batch Keberangkatan</option>` +
                    State.packages.map(p => `<option value="${p.id}">(${Utils.escapeHTML(p.code)}) ${Utils.escapeHTML(p.name)}</option>`).join('');
                filterSel.value = currentVal || 'ALL';

                const modalPkgSel = document.getElementById('jm-package-id');
                modalPkgSel.innerHTML = `<option value="">-- Pilih Paket Keberangkatan --</option>` +
                    State.packages.map(p => `<option value="${p.id}" data-price="${Utils.escapeHTML(p.price)}">(${Utils.escapeHTML(p.code)}) ${Utils.escapeHTML(p.name)} - ${Utils.formatIDR(p.price)}</option>`).join('');

                const payJmSel = document.getElementById('pay-jamaah-id');
                payJmSel.innerHTML = State.jamaah.map(j => {
                    const net = Number(j.package_price || 0) - Number(j.discount || 0);
                    const paid = Utils.calcPaidByJamaah(j.id);
                    const rem = Math.max(0, net - paid);
                    return `<option value="${j.id}">(${Utils.escapeHTML(j.jamaah_code)}) ${Utils.escapeHTML(j.full_name)} — Sisa Tagihan: ${Utils.formatIDR(rem)}</option>`;
                }).join('');
            },

            /**
             * LOGIKA & PERHITUNGAN KPI + ANALITIK GRAFIK
             */
            renderKPIsAndCharts() {
                const totalJamaah = State.jamaah.length;
                let totalOmzet = 0;
                let totalPaid = 0;
                let totalDocPct = 0;
                let lunasCount = 0;

                State.jamaah.forEach(j => {
                    const netPrice = Number(j.package_price || 0) - Number(j.discount || 0);
                    const paid = Utils.calcPaidByJamaah(j.id);
                    totalOmzet += netPrice;
                    totalPaid += paid;
                    totalDocPct += Utils.calcDocPercent(j);
                    if (j.crm_stage === 'Lunas' || j.crm_stage === 'Siap Berangkat' || (netPrice > 0 && paid >= netPrice)) {
                        lunasCount++;
                    }
                });

                const totalUnpaid = Math.max(0, totalOmzet - totalPaid);
                const conversionRate = totalJamaah > 0 ? Math.round((lunasCount / totalJamaah) * 100) : 0;
                const avgDoc = totalJamaah > 0 ? Math.round(totalDocPct / totalJamaah) : 0;

                document.getElementById('kpi-total-omzet').textContent = Utils.formatIDR(totalOmzet);
                document.getElementById('kpi-total-jamaah').textContent = `${totalJamaah} Total Jamaah & Leads`;
                document.getElementById('kpi-total-paid').textContent = Utils.formatIDR(totalPaid);
                document.getElementById('kpi-total-unpaid').textContent = Utils.formatIDR(totalUnpaid);
                document.getElementById('kpi-conversion-rate').textContent = `${conversionRate}% (${lunasCount}/${totalJamaah})`;
                document.getElementById('kpi-doc-avg').textContent = `Rata-rata Kelengkapan Dokumen: ${avgDoc}%`;

                const monthlyMap = {};
                State.payments.filter(p => p.status === 'Confirmed').forEach(p => {
                    const ym = (p.payment_date || '').slice(0, 7);
                    if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(ym)) return;
                    monthlyMap[ym] = (monthlyMap[ym] || 0) + Number(p.amount || 0);
                });
                const range=document.getElementById('finance-range').value;
                const now=new Date();
                let months;
                if(range==='all' && Object.keys(monthlyMap).length) months=Object.keys(monthlyMap).sort();
                else {
                    const count=range==='year'?now.getMonth()+1:range==='12'?12:6;
                    months=Array.from({length:count},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-count+1+i,1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;});
                }
                const labels=months.map(m=>new Date(Number(m.slice(0,4)),Number(m.slice(5))-1,1).toLocaleDateString('id-ID',{month:'short',year:'numeric'}));
                const values=months.map(k=>monthlyMap[k]||0);

                const ctxFin = document.getElementById('financeChart');
                if (State.charts.finance) State.charts.finance.destroy();
                State.charts.finance = new Chart(ctxFin, {
                    type: 'bar',
                    data: {
                        labels,
                        datasets: [{
                            label: 'Dana Pembayaran Masuk (Rp)',
                            data: values,
                            maxBarThickness: 48,
                            backgroundColor: '#065f46',
                            borderRadius: 8
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins:{legend:{display:false},tooltip:{callbacks:{label:context=>Utils.formatIDR(context.parsed.y)}}},scales:{x:{grid:{display:false},ticks:{maxRotation:0,maxTicksLimit:8}},y:{beginAtZero:true,grid:{color:'#e8eee9'},ticks:{callback:value=>new Intl.NumberFormat('id-ID',{notation:'compact'}).format(value)}}} }
                });

                const stageCounts = CRM_STAGES.map(st => State.jamaah.filter(j => j.crm_stage === st).length);
                const ctxPipe = document.getElementById('pipelineChart');
                if (State.charts.pipeline) State.charts.pipeline.destroy();
                State.charts.pipeline = new Chart(ctxPipe, {
                    type: 'doughnut',
                    data: {
                        labels: CRM_STAGES,
                        datasets: [{
                            data: stageCounts,
                            backgroundColor: ['#94a3b8', '#38bdf8', '#fbbf24', '#f59e0b', '#10b981', '#065f46']
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
                });
            },

            /**
             * RENDER KATALOG KARTU VISUAL PAKET & TABEL KUOTA KEBERANGKATAN
             */
            renderPackagesTable() {
                const grid = document.getElementById('packages-visual-grid');
                const tbody = document.getElementById('packages-table-body');

                if (!State.packages.length) {
                    const emptyIllustration = `
                        <div class="col-span-full bg-white rounded-3xl border border-slate-200/80 p-10 text-center shadow-sm">
                            <div class="w-24 h-24 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
                                <svg viewBox="0 0 64 64" class="w-14 h-14">
                                    <rect x="14" y="20" width="36" height="34" rx="3" fill="#064e3b"/>
                                    <rect x="14" y="27" width="36" height="5" fill="#fbbf24"/>
                                    <rect x="28" y="38" width="8" height="16" rx="2" fill="#fbbf24"/>
                                    <circle cx="32" cy="12" r="4" fill="#d97706"/>
                                </svg>
                            </div>
                            <h4 class="text-base font-extrabold text-navy-900">Belum Ada Jadwal Kloter Keberangkatan Umroh</h4>
                            <p class="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                                Mari buat paket keberangkatan suci pertama Anda atau gunakan tombol Injeksi Data Demo untuk melihat simulasi lengkap.
                            </p>
                            <div class="flex items-center justify-center gap-3">
                                <button onclick="App.openPackageModal()" class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-navy-900 text-xs font-extrabold shadow">
                                    + Tambah Batch Keberangkatan
                                </button>
                                <button onclick="App.injectDummyData()" class="px-4 py-2.5 rounded-xl border border-emerald-700 text-emerald-800 hover:bg-emerald-50 text-xs font-bold">
                                    Injeksi Data Demo
                                </button>
                            </div>
                        </div>
                    `;
                    if (grid) grid.innerHTML = emptyIllustration;
                    tbody.innerHTML = `<tr><td colspan="11" class="py-8 text-center text-slate-400">Belum ada paket keberangkatan terdaftar.</td></tr>`;
                    return;
                }

                // Render Katalog Kartu Visual Bergambar Makkah/Madinah
                if (grid) {
                    grid.innerHTML = State.packages.map((p, idx) => {
                        const filled = State.jamaah.filter(j => j.package_id === p.id).length;
                        const quota = Number(p.quota || 40);
                        const rem = Math.max(0, quota - filled);
                        const pct = Math.min(100, Math.round((filled / quota) * 100));
                        const themeKey = p.theme || (idx % 2 === 0 ? 'makkah' : 'madinah');
                        const imgUrl = HARAMAIN_THEMES[themeKey] || HARAMAIN_THEMES.makkah;
                        const displayStatus = rem <= 0 ? 'Full Book' : p.status;
                        const statusBg = rem <= 0 || p.status === 'Full Book' ? 'bg-red-600 text-white' : 'bg-amber-400 text-navy-900';

                        return `
                            <div class="premium-card bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div class="relative h-40 overflow-hidden bg-emerald-950">
                                        <img src="${imgUrl}" alt="${Utils.escapeHTML(p.name)}" class="w-full h-full object-cover">
                                        <div class="absolute inset-0 bg-gradient-to-t from-navy-900/90 via-navy-900/30 to-transparent"></div>
                                        <div class="absolute top-3 left-3 right-3 flex items-center justify-between">
                                            <span class="px-2.5 py-1 rounded-lg bg-emerald-950/80 backdrop-blur text-amber-300 text-[11px] font-extrabold border border-white/15">${Utils.escapeHTML(p.code)}</span>
                                            <span class="px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase shadow ${statusBg}">${displayStatus}</span>
                                        </div>
                                        <div class="absolute bottom-3 left-4 right-4 text-white">
                                            <p class="text-[11px] text-amber-300 font-bold flex items-center gap-1">
                                                <i data-lucide="plane" class="w-3.5 h-3.5"></i>
                                                <span>${Utils.escapeHTML(p.airline)} • ${Utils.escapeHTML(p.duration_days)} Hari</span>
                                            </p>
                                            <h4 class="font-extrabold text-base leading-snug truncate mt-0.5">${Utils.escapeHTML(p.name)}</h4>
                                        </div>
                                    </div>

                                    <div class="p-5 space-y-3">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <p class="text-[10px] font-bold uppercase text-slate-400">Jadwal Keberangkatan</p>
                                                <p class="text-xs font-bold text-navy-900 mt-0.5">${Utils.formatDate(p.departure_date)}</p>
                                            </div>
                                            <div class="text-right">
                                                <p class="text-[10px] font-bold uppercase text-slate-400">Harga Paket</p>
                                                <p class="text-sm font-extrabold text-emerald-800 mt-0.5">${Utils.formatIDR(p.price)}</p>
                                            </div>
                                        </div>

                                        <div class="pt-2 border-t border-slate-100 space-y-1.5">
                                            <div class="flex justify-between text-xs">
                                                <span class="text-slate-500 font-medium">Terisi: <b class="text-emerald-700">${filled} Pax</b> dari ${quota} Seat</span>
                                                <span class="font-extrabold ${rem <= 5 ? 'text-red-600' : 'text-navy-900'}">Sisa ${rem} Seat</span>
                                            </div>
                                            <div class="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                                <div class="h-full bg-gradient-to-r from-emerald-700 to-amber-500 transition-all duration-300" style="width: ${pct}%"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                    <button onclick="App.openJamaahModal()" class="text-xs font-extrabold text-emerald-800 hover:underline flex items-center gap-1">
                                        <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
                                        <span>Daftarkan Jamaah</span>
                                    </button>
                                    <div class="flex items-center gap-1">
                                        <button onclick="App.openPackageModal('${p.id}')" class="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70" title="Edit Paket">
                                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                                        </button>
                                        <button onclick="App.deletePackage('${p.id}')" class="p-1.5 rounded-lg text-red-500 hover:bg-red-50" title="Hapus Paket">
                                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('');
                }

                tbody.innerHTML = State.packages.map(p => {
                    const filled = State.jamaah.filter(j => j.package_id === p.id).length;
                    const rem = Number(p.quota || 0) - filled;
                    const badgeClass = rem <= 0 || p.status === 'Full Book'
                        ? 'bg-red-600 text-white'
                        : 'bg-emerald-600 text-white';
                    const displayStatus = rem <= 0 ? 'Full Book' : p.status;

                    return `
                        <tr class="hover:bg-slate-50/80">
                            <td class="py-3.5 px-4 font-bold text-navy-900">${Utils.escapeHTML(p.code)}</td>
                            <td class="py-3.5 px-4 font-semibold">${Utils.escapeHTML(p.name)}</td>
                            <td class="py-3.5 px-4 text-xs">${Utils.formatDate(p.departure_date)}</td>
                            <td class="py-3.5 px-4 text-xs">${Utils.escapeHTML(p.airline)}</td>
                            <td class="py-3.5 px-4 text-xs">${Utils.escapeHTML(p.duration_days)} Hari</td>
                            <td class="py-3.5 px-4 font-bold text-emerald-800">${Utils.formatIDR(p.price)}</td>
                            <td class="py-3.5 px-4 text-center font-semibold">${Utils.escapeHTML(p.quota)} Pax</td>
                            <td class="py-3.5 px-4 text-center font-bold text-emerald-700">${filled} Pax</td>
                            <td class="py-3.5 px-4 text-center font-bold ${rem <= 0 ? 'text-red-600' : 'text-slate-700'}">${rem} Pax</td>
                            <td class="py-3.5 px-4 text-center">
                                <span class="px-2.5 py-1 rounded-lg text-[11px] font-bold ${badgeClass}">${displayStatus}</span>
                            </td>
                            <td class="py-3.5 px-4 text-right space-x-1">
                                <button onclick="App.openPackageModal('${p.id}')" class="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100" title="Edit Paket">
                                    <i data-lucide="edit" class="w-4 h-4"></i>
                                </button>
                                <button onclick="App.deletePackage('${p.id}')" class="p-1.5 rounded-lg text-red-500 hover:bg-red-50" title="Hapus Paket">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');
            },

            /**
             * RENDER KANBAN CRM (DRAG & DROP)
             */
            renderKanbanBoard() {
                const board = document.getElementById('kanban-board');
                const list = this.getFilteredJamaah();

                board.innerHTML = CRM_STAGES.map(stage => {
                    const items = list.filter(j => j.crm_stage === stage);
                    return `
                        <div class="bg-slate-100/90 rounded-2xl p-3.5 flex flex-col kanban-col border border-slate-200/70"
                             ondragover="event.preventDefault()"
                             ondrop="App.handleDrop(event, '${stage}')">
                            <div class="flex items-center justify-between mb-3 px-1">
                                <span class="text-xs font-extrabold uppercase tracking-wider text-navy-900">${stage}</span>
                                <span class="px-2 py-0.5 rounded-full bg-emerald-800 text-amber-400 text-[11px] font-bold">${items.length}</span>
                            </div>
                            <div class="space-y-3 flex-1">
                                ${items.map(j => {
                                    const net = Number(j.package_price || 0) - Number(j.discount || 0);
                                    const paid = Utils.calcPaidByJamaah(j.id);
                                    const rem = Math.max(0, net - paid);
                                    const docPct = Utils.calcDocPercent(j);
                                    const pkg = State.packages.find(p => p.id === j.package_id);

                                    return `
                                        <div draggable="true"
                                             ondragstart="App.handleDragStart(event, '${j.id}')"
                                             class="premium-card bg-white p-3.5 rounded-xl shadow-sm border border-slate-200/80 cursor-grab active:cursor-grabbing hover:border-emerald-600 transition space-y-2.5">
                                            <div class="flex items-start justify-between gap-2">
                                                <div>
                                                    <span class="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">${Utils.escapeHTML(j.jamaah_code)}</span>
                                                    <h4 class="font-bold text-sm text-navy-900 mt-1 leading-snug">${Utils.escapeHTML(j.full_name)}</h4>
                                                </div>
                                                <button onclick="App.openJamaahModal('${j.id}')" class="text-slate-400 hover:text-navy-900">
                                                    <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                                                </button>
                                            </div>

                                            <p class="text-[11px] text-slate-500 font-medium truncate">${Utils.escapeHTML(pkg ? pkg.name : 'Belum Pilih Batch')}</p>

                                            <div class="text-[11px] space-y-1 pt-1 border-t border-slate-100">
                                                <div class="flex justify-between">
                                                    <span class="text-slate-400">Sisa Tagihan:</span>
                                                    <span class="font-bold ${rem === 0 ? 'text-emerald-700' : 'text-red-600'}">${rem === 0 ? 'LUNAS' : Utils.formatIDR(rem)}</span>
                                                </div>
                                                <div class="flex justify-between items-center">
                                                    <span class="text-slate-400">Berkas:</span>
                                                    <span class="font-bold text-navy-900">${docPct}%</span>
                                                </div>
                                                <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                    <div class="bg-emerald-600 h-full" style="width:${docPct}%"></div>
                                                </div>
                                            </div>

                                            <div class="flex items-center justify-between pt-2">
                                                <a href="https://wa.me/${Utils.normalizePhone(j.phone)}?text=${encodeURIComponent(`Assalamualaikum Bapak/Ibu ${Utils.escapeHTML(j.full_name)}, kami dari ${State.agencyProfile.agency_name} menginformasikan status pendaftaran Umroh Anda (${Utils.escapeHTML(j.jamaah_code)}).`)}"
                                                   target="_blank"
                                                   class="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
                                                    <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
                                                    <span>Follow Up WA</span>
                                                </a>
                                                <span class="text-[10px] font-semibold text-slate-400">${Utils.escapeHTML(j.room_type)}</span>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `;
                }).join('');
            },

            handleDragStart(e, jamaahId) {
                e.dataTransfer.setData('text/plain', jamaahId);
            },

            async handleDrop(e, newStage) {
                e.preventDefault();
                const jamaahId = e.dataTransfer.getData('text/plain');
                const item = State.jamaah.find(j => j.id === jamaahId);
                if (!item || item.crm_stage === newStage) return;

                item.crm_stage = newStage;
                if (isCloudConfigured) {
                    await cloudClient.from('safarops_jamaah').update({ crm_stage: newStage }).eq('id', jamaahId);
                }
                this.persistLocal();
                this.renderAll();
                Utils.toast(`Status ${item.full_name} dipindahkan ke "${newStage}".`);
            },

            /**
             * RENDER MANIFEST, CHECKLIST BERKAS, KAMAR & CETAK SURAT RESMI
             */
            renderManifestTable() {
                const tbody = document.getElementById('manifest-table-body');
                const list = this.getFilteredJamaah();

                if (!list.length) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="7" class="py-12 text-center">
                                <div class="max-w-sm mx-auto space-y-2">
                                    <div class="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto">
                                        <i data-lucide="users" class="w-8 h-8"></i>
                                    </div>
                                    <p class="font-extrabold text-navy-900 text-sm">Manifest Jamaah Masih Kosong</p>
                                    <p class="text-xs text-slate-500">Tambahkan data jamaah baru untuk mengelola kelengkapan berkas paspor, kamar, dan surat pengantar resmi.</p>
                                </div>
                            </td>
                        </tr>`;
                    return;
                }

                tbody.innerHTML = list.map(j => {
                    const pkg = State.packages.find(p => p.id === j.package_id);
                    const pct = Utils.calcDocPercent(j);
                    const docs = [
                        ['doc_ktp', 'KTP'],
                        ['doc_kk', 'KK'],
                        ['doc_passport', 'Paspor'],
                        ['doc_photo', 'Foto'],
                        ['doc_vaccine', 'Vaksin']
                    ];

                    return `
                        <tr class="hover:bg-slate-50/80">
                            <td class="py-3.5 px-3">
                                <span class="font-extrabold text-xs text-emerald-800 block">${Utils.escapeHTML(j.jamaah_code)}</span>
                                <span class="text-[11px] text-slate-400">${Utils.escapeHTML(j.nik || '-')}</span>
                            </td>
                            <td class="py-3.5 px-3">
                                <p class="font-bold text-navy-900">${Utils.escapeHTML(j.full_name)}</p>
                                <p class="text-xs text-slate-500">+${Utils.normalizePhone(j.phone)} • ${Utils.escapeHTML(j.gender)}</p>
                            </td>
                            <td class="py-3.5 px-3 text-xs">
                                <p class="font-semibold text-navy-900">${Utils.escapeHTML(pkg ? pkg.name : '-')}</p>
                                <p class="text-slate-500">Paspor: <b>${Utils.escapeHTML(j.passport_number || 'Belum Ada')}</b></p>
                            </td>
                            <td class="py-3.5 px-3 text-xs">
                                <span class="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">${Utils.escapeHTML(j.room_type)}</span>
                                <span class="font-semibold text-slate-700 ml-1">${Utils.escapeHTML(j.room_group || '-')}</span>
                                <p class="text-[11px] text-slate-500 mt-0.5">Mahram: <b>${Utils.escapeHTML(j.mahram_group || '-')}</b> (${Utils.escapeHTML(j.mahram_relation || '-')})</p>
                            </td>
                            <td class="py-3.5 px-3">
                                <div class="flex flex-wrap gap-1.5">
                                    ${docs.map(([key, label]) => `
                                        <button onclick="App.toggleDoc('${j.id}', '${key}')"
                                            class="px-2 py-1 rounded-lg text-[11px] font-bold border transition ${j[key] ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-slate-50 text-slate-400 border-slate-200'}">
                                            ${j[key] ? '✓ ' : ''}${label}
                                        </button>
                                    `).join('')}
                                </div>
                            </td>
                            <td class="py-3.5 px-3">
                                <div class="flex items-center gap-2">
                                    <div class="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div class="bg-emerald-600 h-full" style="width:${pct}%"></div>
                                    </div>
                                    <span class="text-xs font-extrabold">${pct}%</span>
                                </div>
                            </td>
                            <td class="py-3.5 px-3 text-right">
                                <div class="flex items-center justify-end gap-1">
                                    <button onclick="App.printSuratImigrasi('${j.id}')" title="Cetak Surat Rekomendasi Paspor Imigrasi"
                                        class="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-[11px] font-bold">
                                        Surat Paspor
                                    </button>
                                    <button onclick="App.printSuratCuti('${j.id}')" title="Cetak Surat Permohonan Izin Cuti"
                                        class="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold">
                                        Surat Cuti
                                    </button>
                                    <button onclick="App.printIdCard('${j.id}')" title="Cetak Kartu ID Jamaah QR"
                                        class="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-navy-900 text-[11px] font-bold">
                                        ID Card
                                    </button>
                                    <button onclick="App.openJamaahModal('${j.id}')" class="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
                                        <i data-lucide="edit" class="w-4 h-4"></i>
                                    </button>
                                    <button onclick="App.deleteJamaah('${j.id}')" class="p-1.5 rounded-lg text-red-500 hover:bg-red-50">
                                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('');
            },

            renderRoomingAndMahramCards() {
                const roomBox = document.getElementById('rooming-list-cards');
                const mahramBox = document.getElementById('mahram-list-cards');
                if (!roomBox || !mahramBox) return;

                const rooms = {};
                const mahrams = {};

                State.jamaah.forEach(j => {
                    const rKey = j.room_group ? `${j.room_group} (${j.room_type})` : `Belum Diatur (${j.room_type})`;
                    if (!rooms[rKey]) rooms[rKey] = [];
                    rooms[rKey].push(j);

                    const mKey = j.mahram_group || 'Tanpa Kelompok Mahram';
                    if (!mahrams[mKey]) mahrams[mKey] = [];
                    mahrams[mKey].push(j);
                });

                roomBox.innerHTML = Object.entries(rooms).map(([roomName, members]) => `
                    <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-extrabold text-emerald-900">${Utils.escapeHTML(roomName)}</span>
                            <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">${members.length} Jamaah</span>
                        </div>
                        <ul class="space-y-1 text-xs text-slate-600">
                            ${members.map(m => `<li class="truncate">• <b>${Utils.escapeHTML(m.full_name)}</b> (${Utils.escapeHTML(m.gender)})</li>`).join('')}
                        </ul>
                    </div>
                `).join('') || `<p class="text-xs text-slate-400 col-span-2">Belum ada data kamar.</p>`;

                mahramBox.innerHTML = Object.entries(mahrams).map(([groupName, members]) => `
                    <div class="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/70">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-extrabold text-navy-900">${Utils.escapeHTML(groupName)}</span>
                            <span class="px-2 py-0.5 rounded-full bg-amber-200 text-navy-900 text-[10px] font-bold">${members.length} Anggota</span>
                        </div>
                        <ul class="space-y-1 text-xs text-slate-600">
                            ${members.map(m => `<li class="truncate">• <b>${Utils.escapeHTML(m.full_name)}</b> (${Utils.escapeHTML(m.mahram_relation || '-')})</li>`).join('')}
                        </ul>
                    </div>
                `).join('') || `<p class="text-xs text-slate-400 col-span-2">Belum ada kelompok keluarga/mahram.</p>`;
            },

            async toggleDoc(jamaahId, docKey) {
                const j = State.jamaah.find(x => x.id === jamaahId);
                if (!j) return;
                j[docKey] = !j[docKey];
                if (isCloudConfigured) {
                    await cloudClient.from('safarops_jamaah').update({ [docKey]: j[docKey] }).eq('id', jamaahId);
                }
                this.persistLocal();
                this.renderAll();
            },

            /**
             * RENDER TABEL KEUANGAN & RIWAYAT PEMBAYARAN
             */
            renderFinanceTables() {
                const jmBody = document.getElementById('finance-jamaah-body');
                const list = this.getFilteredJamaah();

                jmBody.innerHTML = list.map(j => {
                    const pkg = State.packages.find(p => p.id === j.package_id);
                    const price = Number(j.package_price || 0);
                    const disc = Number(j.discount || 0);
                    const net = price - disc;
                    const paid = Utils.calcPaidByJamaah(j.id);
                    const rem = Math.max(0, net - paid);

                    return `
                        <tr class="hover:bg-slate-50/80">
                            <td class="py-3.5 px-4 font-bold text-xs text-emerald-800">${Utils.escapeHTML(j.jamaah_code)}</td>
                            <td class="py-3.5 px-4 font-bold text-navy-900">${Utils.escapeHTML(j.full_name)}</td>
                            <td class="py-3.5 px-4 text-xs">${Utils.escapeHTML(pkg ? pkg.name : '-')}</td>
                            <td class="py-3.5 px-4 text-xs">${Utils.formatIDR(price)}</td>
                            <td class="py-3.5 px-4 text-xs">${Utils.formatIDR(disc)}</td>
                            <td class="py-3.5 px-4 font-bold">${Utils.formatIDR(net)}</td>
                            <td class="py-3.5 px-4 font-bold text-emerald-700">${Utils.formatIDR(paid)}</td>
                            <td class="py-3.5 px-4 font-extrabold ${rem === 0 ? 'text-emerald-700' : 'text-red-600'}">
                                ${rem === 0 ? 'LUNAS' : Utils.formatIDR(rem)}
                            </td>
                            <td class="py-3.5 px-4 text-right space-x-1">
                                <button onclick="App.printMutasi('${j.id}')" class="px-3 py-1.5 rounded-lg bg-navy-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1">
                                    <i data-lucide="printer" class="w-3.5 h-3.5"></i>
                                    <span>Print Mutasi</span>
                                </button>
                                <button onclick="App.openPaymentModal('${j.id}')" class="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-navy-900 text-xs font-extrabold">
                                    + Bayar
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');

                const payBody = document.getElementById('payments-history-body');
                if (!State.payments.length) {
                    payBody.innerHTML = `<tr><td colspan="8" class="py-8 text-center text-slate-400">Belum ada transaksi pembayaran tercatat.</td></tr>`;
                    return;
                }

                payBody.innerHTML = State.payments.map(p => {
                    const j = State.jamaah.find(x => x.id === p.jamaah_id);
                    const badge = p.status === 'Confirmed'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-red-600 text-white';

                    return `
                        <tr class="hover:bg-slate-50/80">
                            <td class="py-3.5 px-4 text-xs">${Utils.formatDate(p.payment_date)}</td>
                            <td class="py-3.5 px-4 font-mono text-xs font-bold">${Utils.escapeHTML(p.trx_code)}</td>
                            <td class="py-3.5 px-4 font-bold text-navy-900">${j ? j.full_name : '-'}</td>
                            <td class="py-3.5 px-4 font-extrabold text-emerald-800">${Utils.formatIDR(p.amount)}</td>
                            <td class="py-3.5 px-4 text-xs font-semibold">${Utils.escapeHTML(p.method)}</td>
                            <td class="py-3.5 px-4">
                                <button onclick="App.togglePaymentStatus('${p.id}')" title="Klik untuk ubah status Confirmed / Check"
                                    class="px-2.5 py-1 rounded text-[11px] font-bold ${badge}">${Utils.escapeHTML(p.status)}</button>
                            </td>
                            <td class="py-3.5 px-4 text-xs text-slate-500">${Utils.escapeHTML(p.reference_note || '-')}</td>
                            <td class="py-3.5 px-4 text-right space-x-1">
                                <button onclick="App.printKwitansi('${p.id}')" class="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-amber-400 text-xs font-bold inline-flex items-center gap-1">
                                    <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                                    <span>Cetak Kwitansi</span>
                                </button>
                                <button onclick="App.deletePayment('${p.id}')" class="p-1.5 rounded-lg text-red-500 hover:bg-red-50">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');
            },

            async togglePaymentStatus(paymentId) {
                const p = State.payments.find(x => x.id === paymentId);
                if (!p) return;
                p.status = p.status === 'Confirmed' ? 'Check' : 'Confirmed';
                if (isCloudConfigured) {
                    await cloudClient.from('safarops_payments').update({ status: p.status }).eq('id', paymentId);
                }
                this.persistLocal();
                this.renderAll();
                Utils.toast(`Status transaksi diubah menjadi ${p.status}.`);
            },

            /**
             * FASE 2: CETAK DOKUMEN RESMI (WATERMARK, KOP PRESISI, PDF KORPORAT)
             */
            getLetterheadHTML() {
                const p = State.agencyProfile;
                const logoHtml = p.logo_base64
                    ? `<img src="${p.logo_base64}" alt="Logo" class="w-20 h-20 object-contain object-left">`
                    : `<div class="w-20 h-20 bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-slate-400 rounded">LOGO</div>`;

                const watermarkHtml = p.logo_base64
                    ? `<img src="${p.logo_base64}" class="watermark-print">`
                    : `<div class="watermark-print text-[140px] text-slate-800 font-extrabold opacity-5 text-center tracking-widest leading-none" style="transform: translate(-50%, -50%) rotate(-30deg);">SAFAROPS</div>`;

                return `
                    ${watermarkHtml}
                    <div class="flex items-start justify-between border-b-[3px] border-amber-500 pb-4 mb-6">
                        <div class="flex items-center gap-5">
                            ${logoHtml}
                            <div class="text-left">
                                <h1 class="text-2xl font-black uppercase tracking-wide text-navy-900 leading-tight">${Utils.escapeHTML(p.agency_name || 'Biro Perjalanan Umroh')}</h1>
                                <p class="text-sm italic text-slate-600 font-serif mb-1">${Utils.escapeHTML(p.ppiu_number || 'Penyelenggara Perjalanan Ibadah Umroh & Haji Khusus')}</p>
                                <p class="text-xs text-slate-800 font-medium">${Utils.escapeHTML(p.agency_address || '-')}</p>
                                <p class="text-xs text-slate-800 font-medium">Telp/WA: +${Utils.normalizePhone(p.agency_phone)} | Email: dev.${p.agency_name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0,6)}@gmail.com</p>
                            </div>
                        </div>
                        <div class="text-right flex flex-col items-end gap-2">
                            <div class="flex gap-2">
                                <div class="px-2 py-1 bg-amber-50 text-amber-800 font-extrabold text-[10px] rounded border border-amber-300 shadow-sm">ASITA</div>
                                <div class="px-2 py-1 bg-emerald-50 text-emerald-800 font-extrabold text-[10px] rounded border border-emerald-300 shadow-sm">KAN</div>
                            </div>
                        </div>
                    </div>
                `;
            },

            getFooterHTML() {
                const year = new Date().getFullYear();
                return `
                    <div class="mt-16 pt-4 border-t border-slate-300 text-center w-full absolute bottom-0 left-0 right-0">
                        <p class="text-[10px] text-slate-500 italic font-medium">Travel Management System &copy; ${year} || ${State.agencyProfile.agency_name || 'Travel Biro'} &copy; Hajj & Umroh Service</p>
                    </div>
                `;
            },

            renderQRBox(textData) {
                setTimeout(() => {
                    const container = document.getElementById('print-qr-code');
                    if (container) {
                        container.innerHTML = '';
                        new QRCode(container, { text: textData, width: 75, height: 75, colorDark: "#0f172a" });
                    }
                }, 80);
            },

            // 1. CETAK KWITANSI BUKTI PEMBAYARAN (Presisi PDF)
            printKwitansi(paymentId) {
                const p = State.payments.find(x => x.id === paymentId);
                if (!p) return;
                const j = State.jamaah.find(x => x.id === p.jamaah_id);
                if (!j) return;
                const pkg = State.packages.find(x => x.id === j.package_id);
                const prof = State.agencyProfile;

                const price = Number(j.package_price || 0);
                const disc = Number(j.discount || 0);
                const net = price - disc;
                const paid = Utils.calcPaidByJamaah(j.id);
                const rem = Math.max(0, net - paid);

                const html = `
                    <div class="min-h-[1000px] relative pb-20">
                        ${this.getLetterheadHTML()}

                        <h2 class="text-center text-lg font-black underline uppercase tracking-wider mb-8 text-navy-900">BUKTI PEMBAYARAN</h2>

                        <div class="grid grid-cols-2 gap-8 text-sm mb-6">
                            <div>
                                <table class="text-sm">
                                    <tr><td class="w-32 py-1">Tanggal Transaksi</td><td>: <b>${Utils.formatDate(p.payment_date)}</b></td></tr>
                                    <tr><td class="py-1">Kode Transaksi</td><td>: <b>${Utils.escapeHTML(p.trx_code)}</b></td></tr>
                                </table>

                                <div class="mt-6 pt-3 border-t border-slate-300">
                                    <p class="font-bold text-slate-500 uppercase mb-2 tracking-wider text-xs">DATA TRAVEL :</p>
                                    <p class="font-black text-navy-900 uppercase">${Utils.escapeHTML(prof.agency_name)}</p>
                                    <p class="text-slate-800">${Utils.escapeHTML(prof.agency_address)}</p>
                                    <p class="text-slate-800">Telp: +${Utils.normalizePhone(prof.agency_phone)}</p>
                                </div>
                            </div>
                            <div>
                                <div class="mt-[74px] pt-3 border-t border-slate-300">
                                    <p class="font-bold text-slate-500 uppercase mb-2 tracking-wider text-xs">DATA JAMAAH :</p>
                                    <p class="font-black text-navy-900 uppercase">${Utils.escapeHTML(j.full_name)}</p>
                                    <p class="text-slate-800">${Utils.escapeHTML(j.address || '-')}</p>
                                    <p class="text-slate-800">Telp: +${Utils.normalizePhone(j.phone)}</p>
                                    <p class="text-slate-800">Email: ${j.jamaah_code.toLowerCase()}@jamaah.com</p>
                                </div>
                            </div>
                        </div>

                        <table class="print-table text-sm">
                            <thead>
                                <tr>
                                    <th>Kode Transaksi</th>
                                    <th>Tanggal Pembayaran</th>
                                    <th>Nama Jamaah</th>
                                    <th>Nama Keberangkatan</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td class="font-mono">${Utils.escapeHTML(p.trx_code)}</td>
                                    <td>${Utils.formatDate(p.payment_date)}</td>
                                    <td class="font-bold uppercase">${Utils.escapeHTML(j.full_name)}</td>
                                    <td>${Utils.escapeHTML(pkg ? pkg.name : '-')}</td>
                                </tr>
                            </tbody>
                        </table>

                        <table class="print-table text-sm">
                            <thead>
                                <tr>
                                    <th>Harga Paket</th>
                                    <th>Diskon Harga</th>
                                    <th>Total Harga</th>
                                    <th>Sudah Pembayaran</th>
                                    <th>Sisa Pembayaran</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>${Utils.formatIDR(price)}</td>
                                    <td>${Utils.formatIDR(disc)}</td>
                                    <td class="font-bold bg-slate-50">${Utils.formatIDR(net)}</td>
                                    <td class="font-bold text-emerald-800 bg-emerald-50/50">${Utils.formatIDR(paid)}</td>
                                    <td class="font-bold text-red-700 bg-red-50/50">${Utils.formatIDR(rem)}</td>
                                </tr>
                            </tbody>
                        </table>

                        <table class="print-table text-sm">
                            <thead>
                                <tr>
                                    <th>Jumlah Pembayaran Ini</th>
                                    <th>Metode Pembayaran</th>
                                    <th>Status Pembayaran</th>
                                    <th>Kode Referensi</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td class="font-black text-base text-navy-900 bg-slate-50 py-3">${Utils.formatIDR(p.amount)}</td>
                                    <td class="font-semibold py-3">${Utils.escapeHTML(p.method)}</td>
                                    <td class="font-semibold py-3">${Utils.escapeHTML(p.status)}</td>
                                    <td class="py-3">${Utils.escapeHTML(p.reference_note || '-')}</td>
                                </tr>
                            </tbody>
                        </table>

                        ${prof.bank_info ? `<p class="text-xs text-slate-700 mt-4 px-2 border-l-4 border-amber-500"><b>Rekening Resmi Transfer:</b> ${Utils.escapeHTML(prof.bank_info)}</p>` : ''}

                        <div class="mt-12 flex justify-end">
                            <div class="text-center text-sm space-y-2 w-64">
                                <p class="mb-4">Majalengka, ${Utils.formatDate(new Date().toISOString())}</p>
                                <p class="font-bold text-navy-900">${Utils.escapeHTML(prof.agency_name)}</p>
                                <div id="print-qr-code" class="flex justify-center py-2"></div>
                                <p class="font-extrabold underline text-navy-900">${Utils.escapeHTML(prof.director_name)}</p>
                                <p class="text-xs text-slate-600">Direktur</p>
                            </div>
                        </div>

                        ${this.getFooterHTML()}
                    </div>
                `;

                document.getElementById('print-area').innerHTML = html;
                document.getElementById('modal-print').classList.remove('hidden');
                this.renderQRBox(`VALID-KWITANSI|${p.trx_code}|${j.full_name}|${p.amount}`);
                lucide.createIcons();
            },

            // 2. CETAK RIWAYAT MUTASI PEMBAYARAN JAMAAH (Presisi PDF)
            printMutasi(jamaahId) {
                const j = State.jamaah.find(x => x.id === jamaahId);
                if (!j) return;
                const pkg = State.packages.find(x => x.id === j.package_id);
                const prof = State.agencyProfile;
                const trxList = State.payments.filter(p => p.jamaah_id === j.id);

                const price = Number(j.package_price || 0);
                const disc = Number(j.discount || 0);
                const net = price - disc;
                const paid = Utils.calcPaidByJamaah(j.id);
                const rem = Math.max(0, net - paid);

                const html = `
                    <div class="min-h-[1000px] relative pb-20">
                        ${this.getLetterheadHTML()}

                        <h2 class="text-center text-lg font-black underline uppercase tracking-wider mb-8 text-navy-900">RIWAYAT MUTASI PEMBAYARAN</h2>

                        <div class="grid grid-cols-2 gap-8 text-sm mb-6">
                            <div>
                                <table class="text-sm">
                                    <tr><td class="w-32 py-1">Tanggal Cetak</td><td>: <b>${Utils.formatDate(new Date().toISOString())}</b></td></tr>
                                    <tr><td class="py-1">Kode Mutasi</td><td>: <b>${Utils.escapeHTML(j.jamaah_code)}/${Utils.escapeHTML(pkg ? pkg.code : 'UMR')}/${Utils.escapeHTML(j.nik || '001')}</b></td></tr>
                                </table>

                                <div class="mt-6 pt-3 border-t border-slate-300">
                                    <p class="font-bold text-slate-500 uppercase mb-2 tracking-wider text-xs">DATA TRAVEL :</p>
                                    <p class="font-black text-navy-900 uppercase">${Utils.escapeHTML(prof.agency_name)}</p>
                                    <p class="text-slate-800">${Utils.escapeHTML(prof.agency_address)}</p>
                                    <p class="text-slate-800">Telp: +${Utils.normalizePhone(prof.agency_phone)}</p>
                                </div>
                            </div>
                            <div>
                                <div class="mt-[74px] pt-3 border-t border-slate-300">
                                    <p class="font-bold text-slate-500 uppercase mb-2 tracking-wider text-xs">DATA JAMAAH :</p>
                                    <p class="font-black text-navy-900 uppercase">${Utils.escapeHTML(j.full_name)}</p>
                                    <p class="text-slate-800">${Utils.escapeHTML(j.address || '-')}</p>
                                    <p class="text-slate-800">Telp: +${Utils.normalizePhone(j.phone)} | Kamar: <b>${Utils.escapeHTML(j.room_type)}</b></p>
                                </div>
                            </div>
                        </div>

                        <table class="print-table text-sm mb-2 mt-6">
                            <thead>
                                <tr>
                                    <th>Tanggal Registrasi</th>
                                    <th>Nama Jamaah</th>
                                    <th>Nama Keberangkatan</th>
                                    <th>Tanggal Keberangkatan</th>
                                    <th>Tipe Kamar</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>${Utils.formatDate(j.created_at)}</td>
                                    <td class="font-bold uppercase">${Utils.escapeHTML(j.full_name)}</td>
                                    <td>${Utils.escapeHTML(pkg ? pkg.name : '-')}</td>
                                    <td>${pkg ? Utils.formatDate(pkg.departure_date) : '-'}</td>
                                    <td>${Utils.escapeHTML(j.room_type)}</td>
                                </tr>
                            </tbody>
                        </table>

                        <table class="print-table text-sm mb-6">
                            <thead>
                                <tr>
                                    <th>Harga Paket</th>
                                    <th>Diskon Harga</th>
                                    <th>Total Harga</th>
                                    <th>Sudah Pembayaran</th>
                                    <th>Sisa Pembayaran</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>${Utils.formatIDR(price)}</td>
                                    <td>${Utils.formatIDR(disc)}</td>
                                    <td class="font-bold bg-slate-50">${Utils.formatIDR(net)}</td>
                                    <td class="font-bold text-emerald-800 bg-emerald-50/50">${Utils.formatIDR(paid)}</td>
                                    <td class="font-bold text-red-700 bg-red-50/50">${Utils.formatIDR(rem)}</td>
                                </tr>
                            </tbody>
                        </table>

                        <table class="print-table text-sm">
                            <thead>
                                <tr>
                                    <th class="w-10">No</th>
                                    <th>Tanggal Pembayaran</th>
                                    <th>Kode Transaksi</th>
                                    <th>Jumlah Pembayaran</th>
                                    <th>Metode Pembayaran</th>
                                    <th>Status Pembayaran</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${trxList.map((t, idx) => `
                                    <tr>
                                        <td class="text-center">${idx + 1}</td>
                                        <td>${Utils.formatDate(t.payment_date)}</td>
                                        <td class="font-mono text-xs">${t.trx_code}</td>
                                        <td class="font-bold text-navy-900">${Utils.formatIDR(t.amount)}</td>
                                        <td>${t.method}</td>
                                        <td class="font-semibold">${t.status}</td>
                                    </tr>
                                `).join('') || `<tr><td colspan="6" class="py-6 text-center text-slate-500 italic">Belum ada riwayat pembayaran yang tercatat.</td></tr>`}
                            </tbody>
                        </table>

                        <div class="mt-12 flex justify-end">
                            <div class="text-center text-sm space-y-2 w-64">
                                <p class="mb-4">Majalengka, ${Utils.formatDate(new Date().toISOString())}</p>
                                <p class="font-bold text-navy-900">${Utils.escapeHTML(prof.agency_name)}</p>
                                <div id="print-qr-code" class="flex justify-center py-2"></div>
                                <p class="font-extrabold underline text-navy-900">${Utils.escapeHTML(prof.director_name)}</p>
                                <p class="text-xs text-slate-600">Direktur</p>
                            </div>
                        </div>

                        ${this.getFooterHTML()}
                    </div>
                `;

                document.getElementById('print-area').innerHTML = html;
                document.getElementById('modal-print').classList.remove('hidden');
                this.renderQRBox(`MUTASI|${j.jamaah_code}|${j.full_name}|PAID:${paid}`);
                lucide.createIcons();
            },

            // 3. CETAK SURAT REKOMENDASI PEMBUATAN PASPOR IMIGRASI
            printSuratImigrasi(jamaahId) {
                const j = State.jamaah.find(x => x.id === jamaahId);
                if (!j) return;
                const pkg = State.packages.find(x => x.id === j.package_id);
                const prof = State.agencyProfile;

                const html = `
                    <div class="min-h-[1000px] relative pb-20">
                        ${this.getLetterheadHTML()}

                        <div class="flex justify-between text-sm mb-8">
                            <table class="text-sm">
                                <tr><td class="py-1 w-24">Nomor</td><td>: RK-${Utils.escapeHTML(j.jamaah_code)}/PT-UMR/${new Date().getFullYear()}</td></tr>
                                <tr><td class="py-1">Perihal</td><td>: <b>Permohonan Pembuatan Paspor</b></td></tr>
                            </table>
                            <p>${Utils.formatDate(new Date().toISOString())}</p>
                        </div>

                        <div class="text-sm mb-8">
                            <p>Kepada Yth,</p>
                            <p class="font-bold text-navy-900">Kepala ${Utils.escapeHTML(j.imigrasi_city || 'Kantor Imigrasi Kelas I')}</p>
                            <p>Di Tempat</p>
                        </div>

                        <div class="space-y-5 text-sm leading-loose text-justify text-slate-900">
                            <p class="italic font-semibold text-base">Assalamualaikum wr. wb.,</p>
                            <p class="indent-8">Segala puji dan syukur kita panjatkan kehadirat Allah subhanahu wata'ala, atas rahmat dan karunia-Nya untuk kita yang begitu banyak. Bersama dengan surat ini, kami bermaksud menyampaikan surat pengantar pembuatan paspor untuk jamaah umroh perusahaan travel kami atas nama:</p>

                            <div class="px-8 my-4">
                                <table class="w-full text-sm leading-loose">
                                    <tr><td class="py-1 w-48 font-semibold">NIK</td><td>: ${Utils.escapeHTML(j.nik || '-')}</td></tr>
                                    <tr><td class="py-1 font-semibold">Nama Lengkap</td><td>: <b class="uppercase">${Utils.escapeHTML(j.full_name)}</b></td></tr>
                                    <tr><td class="py-1 font-semibold">Tempat, Tgl Lahir</td><td>: ${Utils.escapeHTML(j.birth_place || '-')}, ${Utils.formatDate(j.birth_date)}</td></tr>
                                    <tr><td class="py-1 font-semibold align-top">Alamat Domisili</td><td class="align-top">: ${Utils.escapeHTML(j.address || '-')}</td></tr>
                                    <tr><td class="py-1 font-semibold">Rencana Keberangkatan</td><td>: ${pkg ? `${Utils.formatDate(pkg.departure_date)} s/d ${Utils.formatDate(pkg.return_date)}` : 'Segera'}</td></tr>
                                </table>
                            </div>

                            <p class="indent-8">Dengan ini kami menyatakan bahwa nama tersebut di atas adalah benar calon jamaah umroh travel kami, dari perusahaan travel kami, yang terdaftar secara resmi yaitu:</p>

                            <div class="px-8 my-4">
                                <table class="w-full text-sm leading-loose">
                                    <tr><td class="py-1 w-48 font-semibold">Nama Perusahaan</td><td>: <b class="uppercase">${Utils.escapeHTML(prof.agency_name)}</b></td></tr>
                                    <tr><td class="py-1 font-semibold">Kontak / Telepon</td><td>: +${Utils.normalizePhone(prof.agency_phone)}</td></tr>
                                    <tr><td class="py-1 font-semibold align-top">Alamat Kantor</td><td class="align-top">: ${Utils.escapeHTML(prof.agency_address)}</td></tr>
                                </table>
                            </div>

                            <p class="indent-8">Untuk itu kami mohon agar nama tersebut diatas bisa dibantu dalam proses kelancaran pembuatan paspor. Demikian surat rekomendasi ini kami buat dengan sebenar-benarnya dan dapat dipergunakan sebagaimana mestinya.</p>
                        </div>

                        <div class="mt-16 flex justify-end">
                            <div class="text-center text-sm space-y-2 w-72">
                                <p class="mb-5">Majalengka, ${Utils.formatDate(new Date().toISOString())}</p>
                                <p class="font-bold text-navy-900">${Utils.escapeHTML(prof.agency_name)}</p>
                                <div id="print-qr-code" class="flex justify-center py-2"></div>
                                <p class="font-extrabold underline text-navy-900">${Utils.escapeHTML(prof.director_name)}</p>
                                <p class="text-xs text-slate-600">Direktur Utama</p>
                            </div>
                        </div>

                        ${this.getFooterHTML()}
                    </div>
                `;

                document.getElementById('print-area').innerHTML = html;
                document.getElementById('modal-print').classList.remove('hidden');
                this.renderQRBox(`SURAT-PASPOR|${j.jamaah_code}|${j.full_name}`);
                lucide.createIcons();
            },

            // 4. CETAK SURAT PERMOHONAN IZIN CUTI INSTANSI
            printSuratCuti(jamaahId) {
                const j = State.jamaah.find(x => x.id === jamaahId);
                if (!j) return;
                const pkg = State.packages.find(x => x.id === j.package_id);
                const prof = State.agencyProfile;

                const html = `
                    <div class="min-h-[1000px] relative pb-20">
                        ${this.getLetterheadHTML()}

                        <div class="flex justify-between text-sm mb-8">
                            <table class="text-sm">
                                <tr><td class="py-1 w-24">Nomor</td><td>: SC-${Utils.escapeHTML(j.jamaah_code)}/PT-UMR/${new Date().getFullYear()}</td></tr>
                                <tr><td class="py-1">Perihal</td><td>: <b>Permohonan Izin Cuti Umroh</b></td></tr>
                            </table>
                            <p>${Utils.formatDate(new Date().toISOString())}</p>
                        </div>

                        <div class="text-sm mb-8">
                            <p>Kepada Yth,</p>
                            <p class="font-bold text-navy-900">Pimpinan / HRD ${Utils.escapeHTML(j.job_company || 'Instansi Tempat Bekerja')}</p>
                            <p>Di Tempat</p>
                        </div>

                        <div class="space-y-5 text-sm leading-loose text-justify text-slate-900">
                            <p class="italic font-semibold text-base">Assalamualaikum wr. wb.,</p>
                            <p class="indent-8">Segala puji dan syukur kita panjatkan kehadirat Allah subhanahu wata'ala, atas rahmat dan karunia-Nya untuk kita yang begitu banyak. Bersama dengan surat ini, kami bermaksud menyampaikan surat pengantar permohonan izin cuti melaksanakan ibadah umroh untuk jamaah dari biro perjalanan kami atas nama:</p>

                            <div class="px-8 my-4">
                                <table class="w-full text-sm leading-loose">
                                    <tr><td class="py-1 w-48 font-semibold">NIK</td><td>: ${Utils.escapeHTML(j.nik || '-')}</td></tr>
                                    <tr><td class="py-1 font-semibold">Nama Lengkap</td><td>: <b class="uppercase">${Utils.escapeHTML(j.full_name)}</b></td></tr>
                                    <tr><td class="py-1 font-semibold">Tempat, Tgl Lahir</td><td>: ${Utils.escapeHTML(j.birth_place || '-')}, ${Utils.formatDate(j.birth_date)}</td></tr>
                                    <tr><td class="py-1 font-semibold align-top">Alamat Domisili</td><td class="align-top">: ${Utils.escapeHTML(j.address || '-')}</td></tr>
                                    <tr><td class="py-1 font-semibold">Tgl Keberangkatan</td><td>: <b>${pkg ? `${Utils.formatDate(pkg.departure_date)} s/d ${Utils.formatDate(pkg.return_date)}` : '-'}</b></td></tr>
                                </table>
                            </div>

                            <p class="indent-8">Dengan ini kami menyatakan bahwa nama tersebut di atas adalah benar calon jamaah umroh yang telah terdaftar secara resmi pada biro perjalanan kami (<b class="uppercase">${Utils.escapeHTML(prof.agency_name)}</b>).</p>

                            <p class="indent-8">Untuk itu kami memohon kebijaksanaan Bapak/Ibu Pimpinan agar kiranya dapat memberikan izin cuti kepada yang bersangkutan selama pelaksanaan ibadah umroh berlangsung. Demikian surat permohonan izin cuti ini kami sampaikan, atas perhatian dan izin yang diberikan kami ucapkan terima kasih.</p>
                        </div>

                        <div class="mt-16 flex justify-end">
                            <div class="text-center text-sm space-y-2 w-72">
                                <p class="mb-5">Majalengka, ${Utils.formatDate(new Date().toISOString())}</p>
                                <p class="font-bold text-navy-900">${Utils.escapeHTML(prof.agency_name)}</p>
                                <div id="print-qr-code" class="flex justify-center py-2"></div>
                                <p class="font-extrabold underline text-navy-900">${Utils.escapeHTML(prof.director_name)}</p>
                                <p class="text-xs text-slate-600">Direktur Utama</p>
                            </div>
                        </div>

                        ${this.getFooterHTML()}
                    </div>
                `;

                document.getElementById('print-area').innerHTML = html;
                document.getElementById('modal-print').classList.remove('hidden');
                this.renderQRBox(`SURAT-CUTI|${j.jamaah_code}|${j.full_name}`);
                lucide.createIcons();
            },

            // 5. CETAK KARTU ID JAMAAH BER-QR CODE
            printIdCard(jamaahId) {
                const j = State.jamaah.find(x => x.id === jamaahId);
                if (!j) return;
                const pkg = State.packages.find(x => x.id === j.package_id);
                const prof = State.agencyProfile;
                const cardLogo = prof.logo_base64
                    ? `<img src="${prof.logo_base64}" alt="Logo" class="w-12 h-12 rounded-xl object-contain bg-white p-1 mx-auto mb-2">`
                    : '';

                const html = `
                    <div class="max-w-sm mx-auto border-[3px] border-emerald-900 rounded-3xl overflow-hidden shadow-lg mt-8">
                        <div class="bg-emerald-900 text-white p-5 text-center relative overflow-hidden">
                            <div class="absolute inset-0 arabesque-overlay opacity-30"></div>
                            <div class="relative z-10">
                                ${cardLogo}
                                <p class="text-[10px] font-bold uppercase tracking-widest text-amber-400">KARTU IDENTITAS JAMAAH UMROH</p>
                                <h3 class="font-black text-lg mt-1 tracking-tight">${Utils.escapeHTML(prof.agency_name)}</h3>
                            </div>
                        </div>
                        <div class="p-6 text-center space-y-3 bg-white relative">
                            <div class="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none z-0">
                                <img src="${prof.logo_base64 || ''}" class="w-48 h-48 object-contain">
                            </div>

                            <div class="relative z-10">
                                <div class="w-20 h-20 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-3xl flex items-center justify-center mx-auto border-[3px] border-amber-400 shadow-md">
                                    ${j.full_name.charAt(0)}
                                </div>
                                <div class="mt-4">
                                    <span class="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs shadow-sm">${Utils.escapeHTML(j.jamaah_code)}</span>
                                    <h2 class="text-xl font-black text-navy-900 uppercase mt-2 leading-tight">${Utils.escapeHTML(j.full_name)}</h2>
                                    <p class="text-sm text-slate-500 font-semibold mt-1">Paspor: <b>${Utils.escapeHTML(j.passport_number || '-')}</b></p>
                                </div>
                                <div class="text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-1.5 mt-4 shadow-sm">
                                    <p><b>Kloter/Batch:</b> ${Utils.escapeHTML(pkg ? pkg.name : '-')}</p>
                                    <p><b>Maskapai:</b> ${Utils.escapeHTML(pkg ? pkg.airline : '-')}</p>
                                    <p><b>Kamar:</b> ${Utils.escapeHTML(j.room_type)} (${Utils.escapeHTML(j.room_group || '-')})</p>
                                    <p><b>Mahram:</b> ${Utils.escapeHTML(j.mahram_group || '-')}</p>
                                    <p class="pt-2 mt-2 border-t border-slate-200"><b>Darurat Travel:</b> +${Utils.normalizePhone(prof.agency_phone)}</p>
                                </div>
                                <div id="print-qr-code" class="flex justify-center pt-4 mt-2"></div>
                                <p class="text-[10px] text-slate-400 font-medium mt-1">Scan QR Code untuk verifikasi manifest jamaah</p>
                            </div>
                        </div>
                    </div>
                `;
                document.getElementById('print-area').innerHTML = html;
                document.getElementById('modal-print').classList.remove('hidden');
                this.renderQRBox(`ID-JAMAAH|${j.jamaah_code}|${j.full_name}|PASSPORT:${j.passport_number || '-'}`);
                lucide.createIcons();
            },

            /**
             * OPERASI CRUD JAMAAH, PAKET, PEMBAYARAN & SUPER ADMIN
             */
            openJamaahModal(jamaahId = null) {
                this.renderPackageSelectOptions();
                const form = document.getElementById('form-jamaah');
                form.reset();

                if (jamaahId) {
                    const j = State.jamaah.find(x => x.id === jamaahId);
                    if (!j) return;
                    document.getElementById('modal-jamaah-title').textContent = `Edit Data Jamaah (${j.jamaah_code})`;
                    document.getElementById('jm-id').value = j.id;
                    document.getElementById('jm-code').value = j.jamaah_code;
                    document.getElementById('jm-nik').value = j.nik || '';
                    document.getElementById('jm-stage').value = j.crm_stage;
                    document.getElementById('jm-name').value = j.full_name;
                    document.getElementById('jm-passport-name').value = j.passport_name || '';
                    document.getElementById('jm-phone').value = j.phone;
                    document.getElementById('jm-birth-place').value = j.birth_place || '';
                    document.getElementById('jm-birth-date').value = j.birth_date || '';
                    document.getElementById('jm-gender').value = j.gender || 'Laki-Laki';
                    document.getElementById('jm-address').value = j.address || '';
                    document.getElementById('jm-package-id').value = j.package_id || '';
                    document.getElementById('jm-price').value = j.package_price || 32000000;
                    document.getElementById('jm-discount').value = j.discount || 0;
                    document.getElementById('jm-passport-no').value = j.passport_number || '';
                    document.getElementById('jm-passport-exp').value = j.passport_expiry || '';
                    document.getElementById('jm-room-type').value = j.room_type || 'Quad';
                    document.getElementById('jm-room-group').value = j.room_group || '';
                    document.getElementById('jm-mahram-group').value = j.mahram_group || '';
                    document.getElementById('jm-mahram-rel').value = j.mahram_relation || '';
                    document.getElementById('jm-imigrasi').value = j.imigrasi_city || 'Kantor Imigrasi Kelas I Cirebon';
                    document.getElementById('jm-company').value = j.job_company || '';
                } else {
                    document.getElementById('modal-jamaah-title').textContent = 'Tambah Pendaftaran Jamaah / Leads Baru';
                    document.getElementById('jm-id').value = '';
                    const nextNum = String(State.jamaah.length + 1).padStart(5, '0');
                    document.getElementById('jm-code').value = `J-${nextNum}`;
                    if (State.packages[0]) {
                        document.getElementById('jm-package-id').value = State.packages[0].id;
                        document.getElementById('jm-price').value = State.packages[0].price;
                    }
                }
                document.getElementById('modal-jamaah').classList.remove('hidden');
            },

            syncPackagePrice() {
                const sel = document.getElementById('jm-package-id');
                const opt = sel.options[sel.selectedIndex];
                const price = opt?.getAttribute('data-price');
                if (price) document.getElementById('jm-price').value = price;
            },

            async saveJamaah(e) {
                e.preventDefault();
                const id = document.getElementById('jm-id').value;
                const payload = {
                    user_id: State.workspaceUserId || State.currentUser.id,
                    jamaah_code: document.getElementById('jm-code').value.trim(),
                    nik: document.getElementById('jm-nik').value.trim(),
                    crm_stage: document.getElementById('jm-stage').value,
                    full_name: document.getElementById('jm-name').value.trim(),
                    passport_name: document.getElementById('jm-passport-name').value.trim(),
                    phone: WorkspaceForms.phoneValue('jm-phone'),
                    birth_place: document.getElementById('jm-birth-place').value.trim(),
                    birth_date: document.getElementById('jm-birth-date').value || null,
                    gender: document.getElementById('jm-gender').value,
                    address: document.getElementById('jm-address').value.trim(),
                    package_id: document.getElementById('jm-package-id').value || null,
                    package_price: Number(document.getElementById('jm-price').value || 0),
                    discount: Number(document.getElementById('jm-discount').value || 0),
                    passport_number: document.getElementById('jm-passport-no').value.trim(),
                    passport_expiry: document.getElementById('jm-passport-exp').value || null,
                    room_type: document.getElementById('jm-room-type').value,
                    room_group: document.getElementById('jm-room-group').value.trim(),
                    mahram_group: document.getElementById('jm-mahram-group').value.trim(),
                    mahram_relation: document.getElementById('jm-mahram-rel').value.trim(),
                    imigrasi_city: document.getElementById('jm-imigrasi').value.trim(),
                    job_company: document.getElementById('jm-company').value.trim()
                };

                if (id) {
                    const idx = State.jamaah.findIndex(x => x.id === id);
                    if (idx > -1) State.jamaah[idx] = { ...State.jamaah[idx], ...payload };
                    if (isCloudConfigured) await cloudClient.from('safarops_jamaah').update(payload).eq('id', id);
                } else {
                    const newRecord = {
                        id: crypto.randomUUID(),
                        ...payload,
                        doc_ktp: true, doc_kk: false, doc_passport: false, doc_photo: false, doc_vaccine: false,
                        created_at: new Date().toISOString()
                    };
                    State.jamaah.unshift(newRecord);
                    if (isCloudConfigured) await cloudClient.from('safarops_jamaah').insert([newRecord]);
                }

                this.persistLocal();
                this.closeModal('modal-jamaah');
                this.renderAll();
                Utils.toast('Data jamaah berhasil disimpan dan disinkronkan.');
            },

            async deleteJamaah(id) {
                if (!confirm('Hapus data jamaah ini beserta riwayat pembayarannya?')) return;
                State.jamaah = State.jamaah.filter(x => x.id !== id);
                State.payments = State.payments.filter(p => p.jamaah_id !== id);
                if (isCloudConfigured) await cloudClient.from('safarops_jamaah').delete().eq('id', id);
                this.persistLocal();
                this.renderAll();
                Utils.toast('Data jamaah telah dihapus.');
            },

            openPackageModal(packageId = null) {
                const form = document.getElementById('form-package');
                form.reset();
                if (packageId) {
                    const p = State.packages.find(x => x.id === packageId);
                    if (!p) return;
                    document.getElementById('modal-package-title').textContent = `Edit Batch Keberangkatan (${p.code})`;
                    document.getElementById('pk-id').value = p.id;
                    document.getElementById('pk-code').value = p.code;
                    document.getElementById('pk-status').value = p.status;
                    document.getElementById('pk-name').value = p.name;
                    document.getElementById('pk-dep-date').value = p.departure_date || '';
                    document.getElementById('pk-ret-date').value = p.return_date || '';
                    document.getElementById('pk-airline').value = p.airline || 'Qatar Airways';
                    document.getElementById('pk-days').value = p.duration_days || 12;
                    document.getElementById('pk-quota').value = p.quota || 40;
                    document.getElementById('pk-price').value = p.price || 32000000;
                    document.getElementById('pk-theme').value = p.theme || 'makkah';
                } else {
                    document.getElementById('modal-package-title').textContent = 'Tambah Batch Paket Keberangkatan';
                    document.getElementById('pk-id').value = '';
                    const nextCode = `KU-${String(State.packages.length + 1).padStart(5, '0')}`;
                    document.getElementById('pk-code').value = nextCode;
                    document.getElementById('pk-theme').value = 'makkah';
                }
                document.getElementById('modal-package').classList.remove('hidden');
            },

            async savePackage(e) {
                e.preventDefault();
                const id = document.getElementById('pk-id').value;
                const selectedTheme = document.getElementById('pk-theme').value || 'makkah';
                const dbPayload = {
                    user_id: State.workspaceUserId || State.currentUser.id,
                    code: document.getElementById('pk-code').value.trim(),
                    name: document.getElementById('pk-name').value.trim(),
                    departure_date: document.getElementById('pk-dep-date').value,
                    return_date: document.getElementById('pk-ret-date').value,
                    airline: document.getElementById('pk-airline').value.trim(),
                    duration_days: Number(document.getElementById('pk-days').value || 9),
                    quota: Number(document.getElementById('pk-quota').value || 40),
                    price: Number(document.getElementById('pk-price').value || 32000000),
                    status: document.getElementById('pk-status').value
                };

                if (id) {
                    const idx = State.packages.findIndex(p => p.id === id);
                    if (idx > -1) State.packages[idx] = { ...State.packages[idx], ...dbPayload, theme: selectedTheme };
                    if (isCloudConfigured) await cloudClient.from('safarops_packages').update(dbPayload).eq('id', id);
                } else {
                    const newId = crypto.randomUUID();
                    const newPkg = { id: newId, ...dbPayload, theme: selectedTheme };
                    State.packages.push(newPkg);
                    if (isCloudConfigured) await cloudClient.from('safarops_packages').insert([{ id: newId, ...dbPayload }]);
                }

                this.persistLocal();
                this.closeModal('modal-package');
                this.renderAll();
                Utils.toast('Data paket keberangkatan berhasil disimpan.');
            },

            async deletePackage(id) {
                if (!confirm('Hapus batch paket keberangkatan ini?')) return;
                State.packages = State.packages.filter(p => p.id !== id);
                if (isCloudConfigured) await cloudClient.from('safarops_packages').delete().eq('id', id);
                this.persistLocal();
                this.renderAll();
                Utils.toast('Batch keberangkatan dihapus.');
            },

            openPaymentModal(jamaahId = null) {
                if (!State.jamaah.length) return Utils.toast('Tambahkan data jamaah terlebih dahulu.', 'error');
                this.renderPackageSelectOptions();
                if (jamaahId) document.getElementById('pay-jamaah-id').value = jamaahId;
                const j = State.jamaah.find(x => x.id === document.getElementById('pay-jamaah-id').value) || State.jamaah[0];
                const dateStamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
                document.getElementById('pay-code').value = `INV/CR/${j.jamaah_code}/KU-00001/${dateStamp}${State.payments.length + 1}`;
                document.getElementById('pay-date').value = new Date().toISOString().slice(0, 10);
                document.getElementById('modal-payment').classList.remove('hidden');
            },

            async savePayment(e) {
                e.preventDefault();
                const jamaahId = document.getElementById('pay-jamaah-id').value;
                const newPay = {
                    id: crypto.randomUUID(),
                    user_id: State.workspaceUserId || State.currentUser.id,
                    jamaah_id: jamaahId,
                    trx_code: document.getElementById('pay-code').value.trim(),
                    payment_date: document.getElementById('pay-date').value,
                    amount: Number(document.getElementById('pay-amount').value || 0),
                    method: document.getElementById('pay-method').value,
                    status: document.getElementById('pay-status').value,
                    reference_note: document.getElementById('pay-note').value.trim()
                };

                State.payments.unshift(newPay);
                const j = State.jamaah.find(x => x.id === jamaahId);
                if (j) {
                    const net = Number(j.package_price || 0) - Number(j.discount || 0);
                    const totalPaid = Utils.calcPaidByJamaah(j.id);
                    if (totalPaid >= net && net > 0) j.crm_stage = 'Lunas';
                    else if (totalPaid > 0 && (j.crm_stage === 'Leads Baru' || j.crm_stage === 'Follow Up')) j.crm_stage = 'DP Masuk';
                }

                if (isCloudConfigured) await cloudClient.from('safarops_payments').insert([newPay]);
                this.persistLocal();
                this.closeModal('modal-payment');
                this.renderAll();
                Utils.toast('Pembayaran berhasil dicatat. Klik "Cetak Kwitansi" untuk mengunduh PDF.');
            },

            async deletePayment(id) {
                if (!confirm('Hapus catatan transaksi pembayaran ini?')) return;
                State.payments = State.payments.filter(p => p.id !== id);
                if (isCloudConfigured) await cloudClient.from('safarops_payments').delete().eq('id', id);
                this.persistLocal();
                this.renderAll();
                Utils.toast('Transaksi pembayaran dihapus.');
            },

            /**
             * SUPER ADMIN CONTROL ROOM
             */
            async loadAccountDirectory() {
                const result=await SafarAuth.accountRequest(cloudClient,{action:'accounts'});
                State.accountDirectory=result.accounts;
                const select=document.getElementById('account-scope');
                select.replaceChildren(new Option('Semua akun',''));
                for(const account of result.accounts) if(account.user_id) select.add(new Option(account.email,account.user_id));
                select.value=State.workspaceUserId||'';
            },
            async selectAccount(id) {
                if(!State.isSuperAdmin) return;
                const account=State.accountDirectory.find(a=>a.user_id===id);
                if(id && !account) return;
                document.getElementById('account-scope').disabled=true;
                try {
                    State.workspaceUserId=account?.user_id||null;
                    State.workspaceEmail=account?.email||null;
                    State.agencyProfile={is_setup:false,agency_name:'Belum Setup'};
                    document.getElementById('account-scope-status').textContent=account ? 'Mengelola data: '+account.email : 'Semua akun — data baru disimpan pada akun admin.';
                    await this.fetchWorkspaceData(null,false,true);
                } finally {document.getElementById('account-scope').disabled=false;}
            },
            async inviteAccount(email,role='agent') {
                const result=await SafarAuth.accountRequest(cloudClient,{action:'invite',email,role});
                const link=new URL(location.pathname,location.origin);
                link.hash=new URLSearchParams({invite:result.token,email:result.email}).toString();
                document.getElementById('invitation-link').value=link.href;
                document.getElementById('invitation-result').hidden=false;
                await this.fetchWorkspaceData(null,false,true);
                await this.loadAccountDirectory();
            },
            async renewInvitation(id) {
                if(!State.isSuperAdmin) return;
                const license=State.licenses.find(l=>l.id===id);
                if(!license) return;
                try {await this.inviteAccount(license.email,license.role);}
                catch(error){Utils.toast(error.message,'error');}
            },
            async updateLicenseRole(id, role) {
                if(!State.isSuperAdmin) return Utils.toast('Akses administrator diperlukan.','error');
                const license=State.licenses.find(item=>item.id===id);
                if(!license || license.role===role) return;
                try {
                    const result=await SafarAuth.accountRequest(cloudClient,{action:'set-role',email:license.email,role});
                    license.role=result.role;
                    this.renderAll();
                    Utils.toast(`Peran ${license.email} diubah menjadi ${result.role==='superadmin'?'SUPER ADMIN':'USER'}.`);
                } catch(error) {
                    this.renderAll();
                    Utils.toast(error.message,'error');
                }
            },
            async resetUserPassword(id) {
                if(!State.isSuperAdmin) return Utils.toast('Akses administrator diperlukan.','error');
                const license=State.licenses.find(item=>item.id===id);
                if(!license || !confirm(`Reset kata sandi untuk ${license.email}? Semua akses data akun akan dikunci sampai pengguna menyelesaikan setup kata sandi baru.`)) return;
                try {
                    const result=await SafarAuth.accountRequest(cloudClient,{action:'reset-password',email:license.email});
                    const link=new URL(location.pathname,location.origin);
                    link.hash=new URLSearchParams({setup:result.token,email:result.email}).toString();
                    document.getElementById('temporary-password').value=result.temporary_password;
                    document.getElementById('password-reset-link').value=link.href;
                    document.getElementById('password-reset-result').hidden=false;
                    Utils.toast('Kata sandi sementara dibuat. Bagikan hanya kepada pemilik email.');
                } catch(error){Utils.toast(error.message,'error');}
            },
            async copyResetCredentials() {
                const password=document.getElementById('temporary-password').value;
                const link=document.getElementById('password-reset-link').value;
                const message=`Tautan reset SafarOps: ${link}\nKata sandi sementara: ${password}\nMasuk melalui tautan tersebut lalu segera buat kata sandi pribadi minimal 6 karakter.`;
                try {await navigator.clipboard.writeText(message); Utils.toast('Instruksi reset disalin.');}
                catch {Utils.toast('Pilih dan salin data reset secara manual.','error');}
            },
            renderSuperAdminTable() {
                const tbody = document.getElementById('superadmin-users-body');
                if (!tbody) return;
                if (!State.licenses.length) {
                    tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-slate-400">Belum ada email buyer di daftar whitelist lisensi.</td></tr>`;
                    return;
                }

                tbody.innerHTML = State.licenses.map(lic => {
                    const badge = lic.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : lic.status === 'frozen'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800';

                    const isPendingSetup = !lic.agency_name || lic.agency_name === 'Belum Setup' || lic.agency_name === 'Travel Umroh Berkah';
                    const agencyInfo = isPendingSetup
                        ? `<span class="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">⏳ Menunggu Setup Wizard Buyer</span>`
                        : `<span class="font-bold text-navy-900">${Utils.escapeHTML(lic.agency_name)}</span>`;

                    return `
                        <tr class="hover:bg-slate-50">
                            <td class="py-3.5 px-4 font-bold text-navy-900">${Utils.escapeHTML(lic.email)}</td>
                            <td class="py-3.5 px-4">${agencyInfo}</td>
                            <td class="py-3.5 px-4">
                                <select aria-label="Peran ${Utils.escapeHTML(lic.email)}" onchange="App.updateLicenseRole('${lic.id}',this.value)" class="px-2 py-1.5 rounded-lg border text-xs font-bold">
                                    <option value="agent" ${lic.role==='agent'?'selected':''}>USER</option>
                                    <option value="superadmin" ${lic.role==='superadmin'?'selected':''}>SUPER ADMIN</option>
                                </select>
                            </td>
                            <td class="py-3.5 px-4">
                                <span class="px-2.5 py-1 rounded-full text-xs font-bold uppercase ${badge}">${Utils.escapeHTML(lic.status)}</span>
                            </td>
                            <td class="py-3.5 px-4 text-xs text-slate-500">${Utils.formatDate(lic.created_at)}</td>
                            <td class="py-3.5 px-4 text-right space-x-1">

                                <button onclick="App.resetUserPassword('${lic.id}')" class="px-2.5 py-1 rounded-lg border border-indigo-200 text-indigo-700 text-xs font-bold">Reset Password</button>
                                <button onclick="App.updateLicenseStatus('${lic.id}', 'active')" class="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold">Aktifkan</button>
                                <button onclick="App.updateLicenseStatus('${lic.id}', 'frozen')" class="px-2.5 py-1 rounded-lg bg-amber-500 text-navy-900 text-xs font-bold">Bekukan</button>
                                <button onclick="App.updateLicenseStatus('${lic.id}', 'blocked')" class="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-bold">Blokir</button>
                                <button onclick="App.deleteLicense('${lic.id}')" class="p-1.5 rounded-lg text-slate-400 hover:text-red-600"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                            </td>
                        </tr>
                    `;
                }).join('');
            },

            async addLicenseUser(e) {
                if (!State.isSuperAdmin) return Utils.toast('Akses administrator diperlukan.', 'error');
                e.preventDefault();
                const email = document.getElementById('sa-new-email').value.trim().toLowerCase();
                const role = document.getElementById('sa-new-role').value;

                if (!Utils.validateEmail(email)) {
                    return Utils.toast('Format email buyer tidak valid.', 'error');
                }

                if (State.licenses.some(l => (l.email || '').toLowerCase() === email)) {
                    return Utils.toast('Email buyer ini sudah terdaftar di dalam whitelist.', 'error');
                }

                const button=e.target.querySelector('button[type="submit"]');
                if(button.disabled)return;
                button.disabled=true;
                try {
                    await SafarAuth.accountRequest(cloudClient,{action:'add-account',email,role});
                    await this.fetchWorkspaceData(null,false,true);
                    await this.loadAccountDirectory();
                    e.target.reset();
                    Utils.toast('Akun tersimpan. Pengguna dapat mengaktifkan kata sandi dengan email terdaftar.');
                } catch(error){Utils.toast(error.message,'error');}
                finally{button.disabled=false;}
            },

            async updateLicenseStatus(id, status) {
                if (!State.isSuperAdmin) return Utils.toast('Akses administrator diperlukan.', 'error');
                const item = State.licenses.find(l => l.id === id);
                if (!item) return;
                item.status = status;
                if (isCloudConfigured) await cloudClient.from('safarops_licenses').update({ status }).eq('id', id);
                if(!isCloudConfigured) localStorage.setItem('safarops_global_licenses', JSON.stringify(State.licenses));
                this.renderAll();
                Utils.toast(`Status akun ${item.email} diubah menjadi ${status.toUpperCase()}.`);
            },

            async deleteLicense(id) {
                if (!State.isSuperAdmin) return Utils.toast('Akses administrator diperlukan.', 'error');
                if (!confirm('Hapus lisensi email buyer ini dari whitelist?')) return;
                State.licenses = State.licenses.filter(l => l.id !== id);
                if (isCloudConfigured) await cloudClient.from('safarops_licenses').delete().eq('id', id);
                if(!isCloudConfigured) localStorage.setItem('safarops_global_licenses', JSON.stringify(State.licenses));
                this.renderAll();
                Utils.toast('Lisensi pengguna telah dihapus.');
            },

            /**
             * DUMMY DATA GENERATOR
             */
            async injectDummyData() {
                const uid = State.workspaceUserId || State.currentUser.id;
                const pkg1Id = crypto.randomUUID();
                const pkg2Id = crypto.randomUUID();

                const demoPackages = [
                    {
                        id: pkg1Id, user_id: uid, code: 'KU-00001',
                        name: 'UMROH 25 DESEMBER 2026 (Batch-1)',
                        departure_date: '2026-12-25', return_date: '2027-01-05',
                        airline: 'Qatar Airways', duration_days: 12, quota: 40,
                        price: 32000000, status: 'Open', theme: 'makkah'
                    },
                    {
                        id: pkg2Id, user_id: uid, code: 'KU-00003',
                        name: 'UMROH AWAL RAMADHAN 2027 (Batch-2)',
                        departure_date: '2027-02-15', return_date: '2027-02-27',
                        airline: 'Saudia Airlines', duration_days: 12, quota: 40,
                        price: 34500000, status: 'Open', theme: 'madinah'
                    }
                ];

                const jm1Id = crypto.randomUUID();
                const jm2Id = crypto.randomUUID();
                const jm3Id = crypto.randomUUID();
                const jm4Id = crypto.randomUUID();

                const demoJamaah = [
                    {
                        id: jm1Id, user_id: uid, package_id: pkg1Id,
                        jamaah_code: 'J-00007', nik: '7311055103760002',
                        full_name: 'YUSUF RAIHAN RAMDANI', passport_name: 'YUSUF RAIHAN RAMDANI',
                        gender: 'Laki-Laki', birth_place: 'Majalengka', birth_date: '2005-10-16',
                        phone: '628111111111', address: 'Jl. Raya Majalengka No. 76, Munjul, Sindangkasih, Jawa Barat',
                        imigrasi_city: 'Kantor Imigrasi Kelas I Cirebon', job_company: 'PT. Sumber Rejeki Indonesia',
                        passport_number: 'X111112', passport_expiry: '2030-10-16',
                        room_type: 'Quad', room_group: 'Kamar 401',
                        mahram_group: 'Keluarga Raihan', mahram_relation: 'Kepala Keluarga',
                        crm_stage: 'Cicilan', package_price: 32000000, discount: 500000,
                        doc_ktp: true, doc_kk: true, doc_passport: true, doc_photo: true, doc_vaccine: false
                    },
                    {
                        id: jm2Id, user_id: uid, package_id: pkg1Id,
                        jamaah_code: 'J-00008', nik: '7311111111110001',
                        full_name: 'ZAINAL ABIDIN', passport_name: 'ZAINAL ABIDIN AHMAD',
                        gender: 'Laki-Laki', birth_place: 'Majalengka', birth_date: '1958-10-15',
                        phone: '6281299887766', address: 'Jl. Raya Majalengka No. 76, Sindangkasih, Jawa Barat',
                        imigrasi_city: 'Kantor Imigrasi Kelas I Cirebon', job_company: 'Wiraswasta',
                        passport_number: 'X111113', passport_expiry: '2031-05-20',
                        room_type: 'Triple', room_group: 'Kamar 302',
                        mahram_group: 'Keluarga Zainal', mahram_relation: 'Suami',
                        crm_stage: 'Lunas', package_price: 32000000, discount: 500000,
                        doc_ktp: true, doc_kk: true, doc_passport: true, doc_photo: true, doc_vaccine: true
                    },
                    {
                        id: jm3Id, user_id: uid, package_id: pkg1Id,
                        jamaah_code: 'J-00011', nik: '7311111111110004',
                        full_name: 'ABDUL RASYID', passport_name: 'ABDUL RASYID KARIM',
                        gender: 'Laki-Laki', birth_place: 'Jakarta', birth_date: '1988-10-18',
                        phone: '6281322334455', address: 'Jl. Raya Majalengka No. 76, Munjul, Jawa Barat',
                        imigrasi_city: 'Kantor Imigrasi Kelas I Cirebon', job_company: 'PT. Sumber Rejeki Indonesia',
                        passport_number: 'X111116', passport_expiry: '2035-07-16',
                        room_type: 'Quad', room_group: 'Kamar 401',
                        mahram_group: 'Keluarga Rasyid', mahram_relation: 'Sendiri',
                        crm_stage: 'DP Masuk', package_price: 32500000, discount: 500000,
                        doc_ktp: true, doc_kk: true, doc_passport: false, doc_photo: true, doc_vaccine: false
                    },
                    {
                        id: jm4Id, user_id: uid, package_id: pkg2Id,
                        jamaah_code: 'J-00012', nik: '3210099887760005',
                        full_name: 'HJ. SITI AMINAH ZAHRA', passport_name: 'SITI AMINAH ZAHRA',
                        gender: 'Perempuan', birth_place: 'Bandung', birth_date: '1979-04-12',
                        phone: '6281566778899', address: 'Jl. Dago Asri No. 19, Bandung, Jawa Barat',
                        imigrasi_city: 'Kantor Imigrasi Kelas I Bandung', job_company: 'RS Harapan Bunda',
                        passport_number: 'C998877', passport_expiry: '2032-09-10',
                        room_type: 'Double', room_group: 'Kamar 201',
                        mahram_group: 'Keluarga Zainal', mahram_relation: 'Istri',
                        crm_stage: 'Siap Berangkat', package_price: 34500000, discount: 0,
                        doc_ktp: true, doc_kk: true, doc_passport: true, doc_photo: true, doc_vaccine: true
                    }
                ];

                const demoPayments = [
                    { id: crypto.randomUUID(), user_id: uid, jamaah_id: jm1Id, trx_code: 'INV/CR/J-00007/KU-00001/260704', payment_date: '2026-07-04', amount: 1000000, method: 'Cash', status: 'Confirmed', reference_note: 'Booking Seat Awal' },
                    { id: crypto.randomUUID(), user_id: uid, jamaah_id: jm1Id, trx_code: 'INV/CR/J-00007/KU-00001/260705', payment_date: '2026-07-05', amount: 5000000, method: 'Cash', status: 'Confirmed', reference_note: 'DP Umroh' },
                    { id: crypto.randomUUID(), user_id: uid, jamaah_id: jm1Id, trx_code: 'INV/CR/J-00007/KU-00001/260706', payment_date: '2026-07-06', amount: 500000, method: 'Transfer', status: 'Confirmed', reference_note: 'Cicilan Ke-1' },
                    { id: crypto.randomUUID(), user_id: uid, jamaah_id: jm1Id, trx_code: 'INV/CR/J-00007/KU-00001/260707', payment_date: '2026-07-07', amount: 500000, method: 'Debit', status: 'Confirmed', reference_note: 'Cicilan Ke-2' },
                    { id: crypto.randomUUID(), user_id: uid, jamaah_id: jm2Id, trx_code: 'INV/CR/J-00008/KU-00001/260812', payment_date: '2026-08-12', amount: 31500000, method: 'Transfer', status: 'Confirmed', reference_note: 'Pelunasan Langsung' },
                    { id: crypto.randomUUID(), user_id: uid, jamaah_id: jm3Id, trx_code: 'INV/CR/J-00011/KU-00001/260905', payment_date: '2026-09-05', amount: 5000000, method: 'Transfer', status: 'Confirmed', reference_note: 'DP Pendaftaran' },
                    { id: crypto.randomUUID(), user_id: uid, jamaah_id: jm4Id, trx_code: 'INV/CR/J-00012/KU-00003/261002', payment_date: '2026-10-02', amount: 34500000, method: 'Transfer', status: 'Confirmed', reference_note: 'Lunas Paket VIP' }
                ];

                State.packages = demoPackages;
                State.jamaah = demoJamaah;
                State.payments = demoPayments;

                if (isCloudConfigured) {
                    try {
                        const cleanPkgs = demoPackages.map(({ theme, ...rest }) => rest);
                        await cloudClient.from('safarops_packages').insert(cleanPkgs);
                        await cloudClient.from('safarops_jamaah').insert(demoJamaah);
                        await cloudClient.from('safarops_payments').insert(demoPayments);
                    } catch (e) {}
                }

                this.persistLocal();
                this.renderAll();
                Utils.toast('Data Demo Presentasi & Kartu Visual Paket berhasil diinjeksikan!');
            },

            /**
             * EXPORT LAPORAN EXCEL SEKALI KLIK
             */
            exportExcel() {
                if (!State.jamaah.length) return Utils.toast('Belum ada data untuk diekspor.', 'error');

                const manifestSheet = State.jamaah.map((j, idx) => {
                    const pkg = State.packages.find(p => p.id === j.package_id);
                    const net = Number(j.package_price || 0) - Number(j.discount || 0);
                    const paid = Utils.calcPaidByJamaah(j.id);
                    return {
                        'No': idx + 1,
                        'Kode Jamaah': j.jamaah_code,
                        'NIK': j.nik || '-',
                        'Nama Lengkap': j.full_name,
                        'Jenis Kelamin': j.gender,
                        'WhatsApp': Utils.normalizePhone(j.phone),
                        'Paket Keberangkatan': pkg ? pkg.name : '-',
                        'Tahap CRM': j.crm_stage,
                        'Tipe Kamar': j.room_type,
                        'Kelompok Kamar': j.room_group || '-',
                        'Kelompok Mahram': j.mahram_group || '-',
                        'Nomor Paspor': j.passport_number || '-',
                        'Kelengkapan Dokumen (%)': Utils.calcDocPercent(j) + '%',
                        'Harga Paket Bersih': net,
                        'Sudah Dibayar': paid,
                        'Sisa Tagihan': Math.max(0, net - paid)
                    };
                });

                const wb = XLSX.utils.book_new();
                const ws1 = XLSX.utils.json_to_sheet(manifestSheet);
                XLSX.utils.book_append_sheet(wb, ws1, 'Manifest & Keuangan Jamaah');
                XLSX.writeFile(wb, `SafarOps_Laporan_Manifest_${new Date().toISOString().slice(0, 10)}.xlsx`);
                Utils.toast('Laporan Excel berhasil diunduh.');
            },

            closeModal(id) {
                document.getElementById(id).classList.add('hidden');
            }
        };

        // Staff initialization is requested explicitly by public-site.js.
