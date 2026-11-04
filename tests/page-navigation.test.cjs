const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {compose, pages} = require('../scripts/compose.cjs');

test('all page outputs retain shared form IDs without duplicate IDs or unresolved templates', () => {
    for (const page of pages) {
        const html = compose(page);
        const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
        assert.equal(new Set(ids).size, ids.length, page + ': duplicate element IDs');
        assert(html.includes(`data-page="${page}"`));
        assert(html.includes(`id="tab-${page}"`));
        assert(html.includes('id="form-jamaah"'));
        assert(html.includes('id="agency-profile-form"'));
        assert(!html.includes('<!-- page:'));
    }
    assert.throws(() => compose('../.env'), /Unknown page/);
});

function fixture(page = 'overview', admin = false) {
    const shown = [], writes = [], handlers = {};
    const location = new URL(`https://example.test/${page}.html`);
    const context = {
        URL, location,
        document: {body: {dataset: {page}}, querySelectorAll: () => []},
        State: {currentUser: {}, isSuperAdmin: admin, passwordChangeMode: false},
        App: {switchTab: page => shown.push(page), handleAuthenticatedUser: async () => {}},
        window: {addEventListener: (name, handler) => { handlers[name] = handler; }},
        history: Object.fromEntries(['push', 'replace'].map(type => [type + 'State', (state, _, url) => {
            writes.push({type, page: state.page}); location.href = String(url);
        }]))
    };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../page-navigation.js'), 'utf8'), context);
    return {context, shown, writes, handlers, location};
}

test('a direct page URL survives authentication and navigation uses reloadable URLs', async () => {
    const {context, shown, writes, location} = fixture('manifest');
    await context.App.handleAuthenticatedUser();
    assert.deepEqual(shown, ['manifest']);
    assert.equal(writes.length, 0);
    context.App.switchTab('finance');
    assert.equal(location.pathname, '/finance.html');
    assert.equal(writes[0].type, 'push');
});

test('Back to the root shows overview without creating another history entry', () => {
    const {context, handlers, location, shown, writes} = fixture('manifest');
    location.pathname = '/';
    handlers.popstate();
    assert.equal(shown.at(-1), 'overview');
    assert.equal(context.document.body.dataset.page, 'overview');
    assert.equal(writes.length, 0);
});

test('normal users cannot open the admin page through a direct URL or history', async () => {
    const {context, handlers, location, shown, writes} = fixture('superadmin');
    await context.App.handleAuthenticatedUser();
    assert.deepEqual(shown, ['overview']);
    assert.equal(writes[0].type, 'replace');
    location.pathname = '/superadmin.html';
    handlers.popstate();
    assert(!shown.includes('superadmin'));
    assert.equal(location.pathname, '/overview.html');
    context.App.switchTab('unknown');
    assert.equal(shown.length, 2);
});

test('admin direct URLs work and forced password change does not open the workspace', async () => {
    const {context, shown} = fixture('superadmin', true);
    context.State.passwordChangeMode = true;
    await context.App.handleAuthenticatedUser();
    assert.equal(shown.length, 0);
    context.State.passwordChangeMode = false;
    await context.App.handleAuthenticatedUser();
    assert.deepEqual(shown, ['superadmin']);
});
