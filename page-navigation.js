/* Page URLs share the existing forms/controller so navigation preserves edits. */
(() => {
    const pages = ['overview', 'packages', 'crm', 'manifest', 'finance', 'settings', 'superadmin'];
    let current = document.body.dataset.page || 'overview';
    const switchTab = App.switchTab;

    function show(page, updateHistory) {
        if (!pages.includes(page)) return;
        if (page === 'superadmin' && !State.isSuperAdmin) page = 'overview';
        switchTab.call(App, page);
        current = page;
        document.body.dataset.page = page;
        document.querySelectorAll('.nav-btn').forEach(button => {
            if (button.dataset.tab === page) button.setAttribute('aria-current', 'page');
            else button.removeAttribute('aria-current');
        });
        if (updateHistory) {
            const url = new URL(location.href);
            url.pathname = url.pathname.replace(/[^/]*$/, page + '.html');
            if (url.pathname !== location.pathname) history[updateHistory + 'State']({page}, '', url);
        }
    }

    App.switchTab = page => show(page, 'push');
    const authenticate = App.handleAuthenticatedUser;
    App.handleAuthenticatedUser = async function (...args) {
        await authenticate.apply(this, args);
        if (State.currentUser && !State.passwordChangeMode) show(current, 'replace');
    };
    window.addEventListener('popstate', () => {
        const filename = location.pathname.split('/').pop();
        const page = !filename || filename === 'index.html' ? 'overview' : filename.replace(/\.html$/, '');
        if (State.currentUser) show(page, page === 'superadmin' && !State.isSuperAdmin ? 'replace' : null);
    });
})();
