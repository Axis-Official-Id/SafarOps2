const test = require('node:test');
const assert = require('node:assert/strict');
const validate = require('../validation.js');

test('accepts Indonesian mobile formats and normalizes them consistently', () => {
  for (const raw of ['081234567890', '+62 812-3456-7890', '6281234567890', '(0812) 3456-7890']) {
    assert.deepEqual(validate.phone(raw), { valid: true, normalized: '+6281234567890', error: '' });
  }
});

test('rejects unsupported, malformed, and implausible phone values', () => {
  for (const raw of ['', '08123', '08123456789012', 'abc081234567890', '+62+81234567890', '08/1234567890', '(0812 34567890', '+12025550123', '02112345678', '+628000000000']) {
    assert.equal(validate.phone(raw).valid, false, raw);
  }
});

test('permits documented phone length boundaries', () => {
  assert.equal(validate.phone('0812345678').valid, true);
  assert.equal(validate.phone('0812345678901').valid, true);
});

test('inquiry requires meaningful name, mobile phone, and consent', () => {
  const valid = { name: 'Aisyah', phone: '081234567890', email: '', message: '', consent: true };
  assert.deepEqual(validate.inquiry(valid), { name: '', phone: '', email: '', message: '', consent: '' });
  assert.ok(validate.inquiry({ ...valid, name: ' ', phone: '123', consent: false }).name);
  assert.ok(validate.inquiry({ ...valid, name: ' ', phone: '123', consent: false }).phone);
  assert.ok(validate.inquiry({ ...valid, name: ' ', phone: '123', consent: false }).consent);
  assert.ok(validate.inquiry({ ...valid, email: 'invalid@' }).email);
  assert.ok(validate.inquiry({ ...valid, message: 'hi' }).message);
});

test('WhatsApp link uses configured destination and creates a draft, not a sent message', () => {
  const values = { name: 'Aisyah', phone: '081234567890', email: '', message: 'Saya ingin melihat paket.' };
  assert.equal(validate.draftURL('', values), null);
  const url = validate.draftURL('+6281234567890', values);
  assert.ok(url.startsWith('https://wa.me/6281234567890?text='));
  assert.match(decodeURIComponent(url), /Nama: Aisyah/);
  assert.match(decodeURIComponent(url), /WhatsApp: \+6281234567890/);
});
