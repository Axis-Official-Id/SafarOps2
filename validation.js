/* Presentation-only validation. Existing workspace payloads retain their contract. */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.SafarValidation = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const phoneMessage = 'Masukkan nomor WhatsApp Indonesia yang valid, misalnya 081234567890.';

    function phone(raw, required = true) {
        const value = String(raw ?? '').trim();
        if (!value) return { valid: !required, normalized: '', error: required ? phoneMessage : '' };
        if (!/^\+?[0-9 ()-]+$/.test(value)) return { valid: false, error: phoneMessage };
        let depth = 0;
        let groupDigits = 0;
        for (const char of value) {
            if (char === '(') {
                if (depth) return { valid: false, error: phoneMessage };
                depth = 1;
                groupDigits = 0;
            } else if (char === ')') {
                if (!depth || !groupDigits) return { valid: false, error: phoneMessage };
                depth = 0;
            } else if (depth && /\d/.test(char)) groupDigits++;
        }
        if (depth) return { valid: false, error: phoneMessage };
        const compact = value.replace(/[ ()-]/g, '');
        const normalized = compact.startsWith('08') ? '+62' + compact.slice(1)
            : compact.startsWith('628') ? '+' + compact : compact;
        const valid = /^\+628\d{8,11}$/.test(normalized) && !/^(\d)\1+$/.test(normalized.slice(4));
        return { valid, normalized: valid ? normalized : '', error: valid ? '' : phoneMessage };
    }

    function name(raw) {
        const value = String(raw ?? '').trim();
        return value.length >= 2 && value.length <= 100 && /\p{L}/u.test(value)
            && /^[\p{L}\p{M}\p{N} .,'’()\-]+$/u.test(value)
            ? '' : 'Masukkan nama Anda, 2–100 karakter, tanpa simbol atau markup.';
    }

    function email(raw) {
        const value = String(raw ?? '').trim();
        if (!value) return '';
        const match = value.match(/^([^\s@<>]+)@([^\s@<>]+)$/u);
        const valid = match && match[1].length <= 64 && !match[1].startsWith('.')
            && !match[1].endsWith('.') && !match[1].includes('..')
            && match[2].length <= 253 && match[2].split('.').length > 1
            && match[2].split('.').every(part => /^[\p{L}\p{N}](?:[\p{L}\p{N}-]*[\p{L}\p{N}])?$/u.test(part))
            && /^[\p{L}]{2,}$/u.test(match[2].split('.').at(-1));
        return valid ? '' : 'Masukkan alamat email yang valid.';
    }

    function message(raw) {
        const value = String(raw ?? '').trim();
        return !value || (value.length >= 10 && value.length <= 1000 && /[\p{L}\p{N}]/u.test(value)
            && !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2060-\u206F<>]/u.test(value))
            ? '' : 'Isi pesan 10–1000 karakter tanpa markup, atau kosongkan kolom ini.';
    }

    function inquiry(values) {
        return {
            name: name(values.name),
            phone: phone(values.phone).error,
            email: email(values.email),
            message: message(values.message),
            consent: values.consent === true ? '' : 'Setujui agar tim kami dapat menghubungi Anda.'
        };
    }

    function draftURL(destination, values) {
        const target = phone(destination);
        if (!target.valid) return null;
        const contact = phone(values.phone);
        const text = [
            'Assalamualaikum, saya ingin berkonsultasi tentang perjalanan Umroh.',
            'Nama: ' + String(values.name).trim(),
            'WhatsApp: ' + contact.normalized,
            values.email?.trim() ? 'Email: ' + values.email.trim() : '',
            values.message?.trim() ? 'Pesan: ' + values.message.trim() : ''
        ].filter(Boolean).join('\n');
        return 'https://wa.me/' + target.normalized.slice(1) + '?text=' + encodeURIComponent(text);
    }

    return Object.freeze({ phone, name, email, message, inquiry, draftURL });
});
