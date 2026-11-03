/* Login entry point and existing workspace form adapters. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const validate=window.SafarValidation;
const phoneBaselines=new Map();
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


window.addEventListener('DOMContentLoaded', async () => {
$('toggle-auth-password').addEventListener('click',()=>{ const show=$('auth-password').type==='password'; $('auth-password').type=show?'text':'password'; $('toggle-auth-password').setAttribute('aria-pressed',String(show)); $('toggle-auth-password').setAttribute('aria-label',show?'Sembunyikan kata sandi':'Tampilkan kata sandi'); });
if(typeof App==='undefined'){ $('console-status').textContent='Komponen ruang kerja belum tersedia. Periksa koneksi dan muat ulang.';return; }
WorkspaceForms.init();
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

const originalSwitch=App.switchTab;
App.switchTab=function(tab){if(tab==='superadmin'&&!State.isSuperAdmin)return Utils.toast('Menu ini hanya untuk administrator.','error');return originalSwitch.call(this,tab);};
$('btn-login').disabled=true;
try{await App.init();}catch(error){App.showAuthAlert('Layanan masuk belum tersedia. Periksa koneksi lalu coba lagi.','error');}finally{$('btn-login').disabled=false;}
},{once:true});
})();
