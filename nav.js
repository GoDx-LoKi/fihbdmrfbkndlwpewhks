/* nav.js
   Central nav/hamburger wiring for both mobile and desktop.
   Drop this in, remove other hamburger/nav wiring from main.js and mobile.js.
*/

(function () {
  const MOBILE_MEDIA = '(max-width: 899px)'; // adjust breakpoint to match your CSS
  const ATTR_WIRED = 'data-nav-wired';
  const ROOT_SEL = 'body'; // could be document.documentElement if desired

  // Utility: mark as wired to avoid duplicate bindings
  function isWired(el) {
    return el && el.hasAttribute(ATTR_WIRED);
  }
  function markWired(el) {
    if (!el) return;
    el.setAttribute(ATTR_WIRED, '1');
  }

  // Focus trap: simple implementation for nav modal/panel
  function trapFocus(container) {
    const focusable = container.querySelectorAll('a, button, input, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return () => {};
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function handleKey(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }

  // Find elements with reasonable fallbacks
  function getNavElements() {
    const root = document;
    const hamburger = root.querySelector('.hamburger, .nav-toggle, [data-nav-toggle]');
    const navPanel = root.querySelector('.mobile-nav, .site-nav, nav[role="navigation"], #mobileNav');
    const backdrop = root.querySelector('.nav-backdrop') || createBackdrop(root);
    const closeBtn = navPanel && navPanel.querySelector('.nav-close, [data-nav-close]');

    return { root, hamburger, navPanel, backdrop, closeBtn };
  }

  function createBackdrop(root) {
    const b = document.createElement('div');
    b.className = 'nav-backdrop';
    b.setAttribute('aria-hidden', 'true');
    b.style.cssText = 'position:fixed;inset:0;z-index:999;display:none;';
    (root.body || document.body).appendChild(b);
    return b;
  }

  // Show / hide helpers
  function openNav(navPanel, backdrop, hamburger) {
    if (!navPanel) return;
    navPanel.classList.add('open');
    navPanel.setAttribute('aria-hidden', 'false');
    if (backdrop) backdrop.style.display = 'block';
    if (hamburger) hamburger.setAttribute('aria-expanded', 'true');
    // prevent page scroll while nav open
    document.documentElement.style.overflow = 'hidden';
    // trap focus
    const releaseTrap = trapFocus(navPanel);
    // ESC to close
    function escHandler(e) {
      if (e.key === 'Escape') closeNav(navPanel, backdrop, hamburger);
    }
    document.addEventListener('keydown', escHandler);
    // return cleanup
    return function cleanup() {
      document.removeEventListener('keydown', escHandler);
      releaseTrap && releaseTrap();
    };
  }

  function closeNav(navPanel, backdrop, hamburger) {
    if (!navPanel) return;
    navPanel.classList.remove('open');
    navPanel.setAttribute('aria-hidden', 'true');
    if (backdrop) backdrop.style.display = 'none';
    if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = '';
  }

  // Prevent duplicate listeners by wrapping handler creation
  function wireNavOnce() {
    const { hamburger, navPanel, backdrop } = getNavElements();
    if (!hamburger || !navPanel) {
      // Nothing to wire; bail
      return;
    }

    // If either element is already marked wired, exit
    if (isWired(hamburger) || isWired(navPanel)) return;
    markWired(hamburger);
    markWired(navPanel);

    // Accessibility defaults
    hamburger.setAttribute('role', hamburger.getAttribute('role') || 'button');
    hamburger.setAttribute('aria-controls', navPanel.id || 'siteNavPanel');
    if (!navPanel.id) navPanel.id = 'siteNavPanel';
    navPanel.setAttribute('aria-hidden', 'true');

    // Add a close button if not present
    let closeBtn = navPanel.querySelector('.nav-close, [data-nav-close]');
    if (!closeBtn) {
      closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'nav-close';
      closeBtn.innerHTML = 'Close';
      closeBtn.setAttribute('aria-label', 'Close navigation');
      // prepend close
      navPanel.insertBefore(closeBtn, navPanel.firstChild);
    }

    // click handlers and outside-click handling
    let cleanupFocusTrap = null;
    function toggleHandler(e) {
      const isOpen = navPanel.classList.contains('open');
      if (isOpen) {
        cleanupFocusTrap && cleanupFocusTrap();
        closeNav(navPanel, backdrop, hamburger);
      } else {
        cleanupFocusTrap = openNav(navPanel, backdrop, hamburger);
        // focus the first interactive element inside nav
        const firstInteractive = navPanel.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
        if (firstInteractive) firstInteractive.focus();
      }
    }

    hamburger.addEventListener('click', toggleHandler);
    closeBtn.addEventListener('click', () => {
      cleanupFocusTrap && cleanupFocusTrap();
      closeNav(navPanel, backdrop, hamburger);
      hamburger.focus();
    });

    // Close when clicking backdrop or clicking outside navPanel
    backdrop.addEventListener('click', () => {
      cleanupFocusTrap && cleanupFocusTrap();
      closeNav(navPanel, backdrop, hamburger);
      hamburger && hamburger.focus();
    });

    // Close on any in-nav link click (common mobile behavior)
    navPanel.addEventListener('click', (ev) => {
      const a = ev.target.closest('a');
      if (!a) return;
      // if link is internal hash or site nav link, close nav
      if (a.getAttribute('href') && (a.getAttribute('href').startsWith('#') || a.hostname === location.hostname)) {
        cleanupFocusTrap && cleanupFocusTrap();
        closeNav(navPanel, backdrop, hamburger);
      }
    });

    // Handle resize / breakpoint changes: close nav if switching layout
    const mql = window.matchMedia(MOBILE_MEDIA);
    function mqHandler() {
      // On layout change we forcibly close to avoid stuck open on desktop
      cleanupFocusTrap && cleanupFocusTrap();
      closeNav(navPanel, backdrop, hamburger);
    }
    mql.addEventListener ? mql.addEventListener('change', mqHandler) : mql.addListener(mqHandler);

    // Expose API
    window.SiteNav = window.SiteNav || {};
    window.SiteNav.open = () => {
      cleanupFocusTrap = openNav(navPanel, backdrop, hamburger);
    };
    window.SiteNav.close = () => {
      cleanupFocusTrap && cleanupFocusTrap();
      closeNav(navPanel, backdrop, hamburger);
    };
    window.SiteNav.isOpen = () => navPanel.classList.contains('open');
  }

  // Initialize on DOMContentLoaded (defer-safe)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireNavOnce);
  } else {
    wireNavOnce();
  }

})();
