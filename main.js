// main.js
// Desktop & shared behaviors: header scroll, smooth scroll, gallery (auto + buttons + keyboard),
// forms (hero + contact), ripple, scroll animations, hamburger wiring for non-mobile.
// This file is intentionally verbose and defensive to maximize reliability.

(function () {
  'use strict';

  /* ---------- Utilities ---------- */
  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from((ctx || document).querySelectorAll(s));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
  const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

  /* ---------- Prevent duplicate wiring ---------- */
  function markWired(el, name) {
    if (!el) return false;
    const key = `data-wired-${name}`;
    if (el.hasAttribute(key)) return true;
    el.setAttribute(key, '1');
    return false;
  }

  /* ---------- Temporary UI message (non-blocking) ---------- */
  function showTempMessage(msg, timeout = 3000) {
    try {
      const id = 'temp-msg-box';
      let box = document.getElementById(id);
      if (box) box.remove();
      box = document.createElement('div');
      box.id = id;
      box.style.cssText = 'position:fixed;left:50%;top:18px;transform:translateX(-50%);background:#fff;padding:12px 18px;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,0.12);z-index:5000;font-weight:600;color:#0056a4';
      box.textContent = msg;
      document.body.appendChild(box);
      setTimeout(() => { box.style.opacity = '0'; setTimeout(() => box.remove(), 350); }, timeout);
    } catch (e) { console.warn('showTempMessage failed', e); }
  }

  /* ---------- Header scroll palette ---------- */
  function wireHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;
    if (markWired(header, 'header-scroll')) return;

    // apply palette change on scroll
    const apply = () => {
      if (window.scrollY > 100) {
        header.style.background = 'linear-gradient(135deg, rgba(0,31,63,0.95) 0%, rgba(0,86,164,0.95) 100%)';
        header.style.backdropFilter = 'blur(10px)';
      } else {
        header.style.background = 'linear-gradient(135deg, #001f3f 0%, #0056a4 100%)';
        header.style.backdropFilter = 'none';
      }
    };

    apply();
    window.addEventListener('scroll', apply, { passive: true });
  }


  
  /* ---------- Smooth scroll for internal anchors ---------- */
  function wireSmoothScroll() {
    const anchors = $$('a[href^="#"]');
    anchors.forEach(a => {
      // ignore if anchor is just '#'
      const href = a.getAttribute('href');
      if (!href || href === '#' || href.startsWith('#!')) return;
      if (markWired(a, 'smooth-scroll')) return;
      a.addEventListener('click', function (ev) {
        // allow ctrl/cmd click open in new tab
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
        ev.preventDefault();
        const target = document.querySelector(href);
        if (!target) return;
        const header = document.querySelector('.header');
        const headerHeight = header ? header.offsetHeight : 0;
        const top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 12;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

  /* ---------- Ripple effect for buttons ---------- */
  function wireRipple() {
    const selectors = ['.btn-primary', '.btn-secondary', '.cta-button', 'button', 'a.btn'];
    selectors.forEach(sel => {
      $$(sel).forEach(btn => {
        if (markWired(btn, 'ripple')) return;
        btn.style.position = btn.style.position || 'relative';
        btn.style.overflow = 'hidden';
        btn.addEventListener('click', function (e) {
          // Do not create ripple for right-click or ctrl/cmd click
          if (e.button !== 0) return;
          const rect = this.getBoundingClientRect();
          const size = Math.max(rect.width, rect.height) * 1.2;
          const x = e.clientX - rect.left - size / 2;
          const y = e.clientY - rect.top - size / 2;
          const ripple = document.createElement('span');
          ripple.style.cssText = `
            position:absolute;left:${x}px;top:${y}px;
            width:${size}px;height:${size}px;border-radius:50%;
            background:rgba(255,255,255,0.28);pointer-events:none;transform:scale(0);
            transition:transform 420ms ease, opacity 420ms ease;
            z-index: 10;
          `;
          this.appendChild(ripple);
          requestAnimationFrame(() => {
            ripple.style.transform = 'scale(1)';
            ripple.style.opacity = '0';
          });
          setTimeout(() => ripple.remove(), 500);
        });
      });
    });
  }

  /* ---------- Scroll animations using IntersectionObserver ---------- */
  function wireScrollAnimations() {
    if (!('IntersectionObserver' in window)) return;
    const targets = $$('.service-card, .feature-item, .area-item, .review-card, .blog-card, .hero-content');
    if (!targets.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(el => {
      el.style.opacity = el.style.opacity || '0';
      el.style.transform = el.style.transform || 'translateY(30px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });
  }
/* ---------- Auto visit popup modal (every page load) ---------- */
function wireVisitPopup() {
  const modal = document.getElementById('visitPopup');
  if (!modal) return;
  if (typeof markWired === 'function' && markWired(modal, 'visit-popup')) return;

  const dialog   = modal.querySelector('.visit-popup-dialog');
  const backdrop = modal.querySelector('.visit-popup-backdrop');
  const closers  = modal.querySelectorAll('[data-popup-close]');

  function openPopup() {
    modal.classList.add('show');
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
    setTimeout(() => dialog && dialog.focus(), 20);
  }

  function closePopup() {
    modal.classList.remove('show');
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
  }

  // Skip / close buttons
  closers.forEach(el => {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      closePopup();
    });
  });

  // Click on dark background closes
  if (backdrop) {
    backdrop.addEventListener('click', closePopup);
  }

  // ESC closes
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      closePopup();
    }
  });

  // 🔥 Always open after 4 seconds on every page load
  setTimeout(openPopup, 4000);

  // Expose so form submit can close it
  window.__visitPopup = { open: openPopup, close: closePopup };
}

/* ---------- Gallery: premium slider (desktop + mobile) ---------- */
function initGallery() {
  const slider = document.querySelector('.gallery-slider');
  if (!slider) return;

  const track = slider.querySelector('.slides');
  if (!track) return;

  const slides = Array.from(track.querySelectorAll('img'));
  const total = slides.length;
  if (!total) return;

  // make sure each image behaves as a full-width slide
  slides.forEach(img => {
    img.style.flex = '0 0 100%';
    img.style.display = 'block';
  });

  let index = 0;
  const INTERVAL = 4000;
  let autoTimer = null;
  let isPaused = false;

  function goTo(i) {
    index = (i % total + total) % total;
    track.style.transform = `translateX(-${index * 100}%)`;
  }

  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  function stopAuto() {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  }

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(() => {
      if (!isPaused) next();
    }, INTERVAL);
  }

  function restartAuto() {
    stopAuto();
    startAuto();
  }



  /* ----- Keyboard navigation ----- */
  track.setAttribute('tabindex', '0');
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      next();
      restartAuto();
    } else if (e.key === 'ArrowLeft') {
      prev();
      restartAuto();
    }
  });

  /* ----- Hover / focus pause (desktop) ----- */
  ['mouseenter', 'focusin'].forEach(ev =>
    slider.addEventListener(ev, () => { isPaused = true; }, { passive: true })
  );
  ['mouseleave', 'focusout'].forEach(ev =>
    slider.addEventListener(ev, () => { isPaused = false; }, { passive: true })
  );

  /* ----- Touch swipe (mobile) ----- */
  let startX = 0;
  let startY = 0;
  let isDragging = false;
  let isScrolling = false;

  track.addEventListener('touchstart', (ev) => {
    const t = ev.changedTouches[0];
    startX = t.clientX;
    startY = t.clientY;
    isDragging = false;
    isScrolling = false;
  }, { passive: true });

  track.addEventListener('touchmove', (ev) => {
    const t = ev.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;

    if (!isDragging && !isScrolling) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
        // user scrolling vertically – let the page scroll
        isScrolling = true;
        return;
      }
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
        // horizontal swipe intent
        isDragging = true;
        isPaused = true;
        stopAuto();
      }
    }

    if (isDragging) {
      ev.preventDefault(); // avoid page jitter while swiping
    }
  }, { passive: false });

  track.addEventListener('touchend', (ev) => {
    const t = ev.changedTouches[0];
    const dx = t.clientX - startX;

    if (isDragging) {
      const SWIPE_MIN = 40;
      if (dx < -SWIPE_MIN) next();
      else if (dx > SWIPE_MIN) prev();
    }

    isDragging = false;
    isScrolling = false;

    setTimeout(() => {
      isPaused = false;
      restartAuto();
    }, 200);
  }, { passive: true });

  /* ----- Only autoplay when visible ----- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) startAuto();
        else stopAuto();
      });
    }, { threshold: 0.25 });

    io.observe(slider);
  } else {
    startAuto();
  }

  // expose for debugging if needed
  window.__gallery = {
    next,
    prev,
    goTo,
    stopAuto,
    startAuto,
    getIndex: () => index
  };
}

  /* ---------- Forms: Hero and Contact (Google Forms + local UX) ---------- */
  function wireForms() {
    // helper to safely send to Google forms (no-cors)
    function postToGoogle(formAction, fieldsMap, onSuccess, onFailure) {
      try {
        const formData = new FormData();
        for (const k in fieldsMap) formData.append(k, fieldsMap[k] || '');
        fetch(formAction, { method: 'POST', body: formData, mode: 'no-cors' })
          .then(() => onSuccess && onSuccess())
          .catch(() => onFailure && onFailure());
      } catch (e) { if (onFailure) onFailure(); }
    }

    // HERO form
    const heroForm = document.getElementById('contactForm');
    if (heroForm && !markWired(heroForm, 'hero-form')) {
      heroForm.addEventListener('submit', function (ev) {
        ev.preventDefault();
        const name = heroForm.elements['entry.579895981']?.value?.trim();
        const email = heroForm.elements['entry.1031545939']?.value?.trim();
        const phone = heroForm.elements['entry.781832122']?.value?.trim();
        if (!name || !email || !phone) { showTempMessage('Please fill name, email and phone.'); return; }

        const action = 'https://docs.google.com/forms/d/e/1FAIpQLSebhr2KKH64XRGeJYL-6cfSjjNf94exDi3poXVJBAijP-DAaQ/formResponse';
        const fields = {
          'entry.579895981': name,
          'entry.1031545939': email,
          'entry.781832122': phone,
          'entry.2100982451': heroForm.elements['entry.2100982451']?.value || '',
          'entry.429443743': heroForm.elements['entry.429443743']?.value || ''
        };
        const btn = heroForm.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; const t = btn.innerHTML; btn.innerHTML = 'Sending...'; setTimeout(()=>{ btn.disabled=false; btn.innerHTML=t; }, 3500); }
        postToGoogle(action, fields, () => { heroForm.reset(); showTempMessage('Thank you! Your request has been submitted.'); }, () => { showTempMessage('Thank you! Your request has been submitted.'); });
      });
    }

    // CONTACT form
    const contactForm = document.getElementById('contactGoogleForm');
    if (contactForm && !markWired(contactForm, 'contact-form')) {
      contactForm.addEventListener('submit', function (ev) {
        ev.preventDefault();
        const name = contactForm.elements['entry.201621307']?.value?.trim();
        const email = contactForm.elements['entry.1900406405']?.value?.trim();
        const phone = contactForm.elements['entry.2112128069']?.value?.trim();
        if (!name || !email || !phone) { showTempMessage('Please fill name, email and phone.'); return; }

        const action = 'https://docs.google.com/forms/d/e/1FAIpQLSeH9dCZmtVaeI131ojygIElQ3LzkwljTopEXOgNiTKhtI7naA/formResponse';
        const fields = {
          'entry.201621307': name,
          'entry.1900406405': email,
          'entry.2112128069': phone,
          'entry.1048436006': contactForm.elements['entry.1048436006']?.value || '',
          'entry.653498714': contactForm.elements['entry.653498714']?.value || '',
          'entry.1106468625': contactForm.elements['entry.1106468625']?.value || ''
        };
        const btn = contactForm.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; const t = btn.innerHTML; btn.innerHTML = 'Sending...'; setTimeout(()=>{ btn.disabled=false; btn.innerHTML=t; }, 3500); }
        postToGoogle(action, fields, () => { contactForm.reset(); showTempMessage('Thank you! Your message has been sent.'); }, () => { showTempMessage('Thank you! Your message has been sent.'); });
      });
    }
    // Auto visit popup form
    const visitPopupForm = document.getElementById('visitPopupForm');
    if (visitPopupForm && (!typeof markWired === 'function' || !markWired(visitPopupForm, 'visit-popup-form'))) {
      visitPopupForm.addEventListener('submit', function (ev) {
        ev.preventDefault();

        const name  = visitPopupForm.elements['entry.579895981']?.value?.trim();
        const email = visitPopupForm.elements['entry.1031545939']?.value?.trim();
        const phone = visitPopupForm.elements['entry.781832122']?.value?.trim();

        if (!name || !email || !phone) {
          if (typeof showTempMessage === 'function') {
            showTempMessage('Please fill name, email and phone.');
          }
          return;
        }

        const action = 'https://docs.google.com/forms/d/e/1FAIpQLSebhr2KKH64XRGeJYL-6cfSjjNf94exDi3poXVJBAijP-DAaQ/formResponse';

        const fields = {
          'entry.579895981': name,
          'entry.1031545939': email,
          'entry.781832122': phone,
          'entry.2100982451': visitPopupForm.elements['entry.2100982451']?.value || '',
          'entry.429443743': visitPopupForm.elements['entry.429443743']?.value || ''
        };

        const btn = visitPopupForm.querySelector('button[type="submit"]');
        let originalHtml = btn ? btn.innerHTML : null;
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = 'Sending...';
        }

        function done() {
          if (btn) {
            setTimeout(() => {
              btn.disabled = false;
              btn.innerHTML = originalHtml;
            }, 500);
          }

          visitPopupForm.reset();
          if (window.__visitPopup && typeof window.__visitPopup.close === 'function') {
            window.__visitPopup.close();
          }
          if (typeof showTempMessage === 'function') {
            showTempMessage('Thank you! We will call you shortly.');
          }
        }

        if (typeof postToGoogle === 'function') {
          postToGoogle(action, fields, done, done);
        } else {
          // fallback: just close & thank user
          done();
        }
      });
    }

    // WhatsApp dynamic buttons (data attributes) — encode properly
    $$('[data-wa-text]').forEach(el => {
      if (markWired(el, 'wa')) return;
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const base = el.dataset.waBase || 'https://wa.me/919821119300';
        const text = el.dataset.waText || '';
        const encoded = encodeURIComponent(text);
        window.location.href = `${base}?text=${encoded}`;
      });
    });

    // Generic form duplicate submission guard
    $$('form').forEach(form => {
      if (markWired(form, 'dupguard')) return;
      let last = 0;
      form.addEventListener('submit', (e) => {
        const now = Date.now();
        if (now - last < 1500) { e.preventDefault(); return; }
        last = now;
      });
    });
  }
/* ---------- Hamburger (mobile) ---------- */
function wireHamburger() {
  const hamb = document.querySelector('.hamburger');
  const nav = document.querySelector('.nav-links');
  if (!hamb || !nav) return;
  if (markWired(hamb, 'hamburger')) return;

  // ensure aria state exists
  hamb.setAttribute('aria-expanded', hamb.getAttribute('aria-expanded') || 'false');

  function openNav() {
    nav.classList.add('show');
    hamb.setAttribute('aria-expanded', 'true');
    // optional: prevent body scroll when menu open
    document.documentElement.classList.add('nav-open');
  }
  function closeNav() {
    nav.classList.remove('show');
    hamb.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('nav-open');
  }
  function toggleNav() {
    if (nav.classList.contains('show')) closeNav(); else openNav();
  }

  // click / tap
  hamb.addEventListener('click', function(e){
    e.preventDefault();
    toggleNav();
  });

  // keyboard support (Enter / Space)
  hamb.addEventListener('keydown', function(e){
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      toggleNav();
    }
    // allow Esc to close
    if (e.key === 'Escape') closeNav();
  });

  // close when clicking a nav link
  nav.addEventListener('click', function(e){
    const a = e.target.closest('a');
    if (a) closeNav();
  });

  // close when clicking outside (mobile-only)
  document.addEventListener('click', function(e){
    if (!nav.classList.contains('show')) return;
    if (hamb.contains(e.target) || nav.contains(e.target)) return;
    closeNav();
  });

  // optional: close on resize if desktop breakpoint
  window.addEventListener('resize', function(){
    if (window.innerWidth > 768 && nav.classList.contains('show')) closeNav();
  }, { passive: true });
}

   document.addEventListener('DOMContentLoaded', function () {
    wireHeaderScroll();
    wireSmoothScroll();
    wireRipple();
    wireScrollAnimations();
    initGallery();
    wireForms();
    wireHamburger();
    wireVisitPopup();   // <--- auto popup
  });


})();


/* ===== Certificate Lightbox Logic ===== */
(function(){
  const box = document.getElementById('certLightbox');
  const boxImg = document.getElementById('certLightboxImg');
  const closeBtn = document.querySelector('.cert-close');

  if (!box || !boxImg || !closeBtn) return;

  // SELECT ALL certificate images (supports .cert-img or images inside .certificate)
  const certImages = document.querySelectorAll('.cert-img, .certificate img');

  certImages.forEach(img => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => {
      boxImg.src = img.src;
      box.style.display = 'flex';
    });
  });

  // Close logic
  closeBtn.addEventListener('click', () => box.style.display = 'none');
  box.addEventListener('click', (e) => {
    if (e.target === box) box.style.display = 'none';
  });

  // ESC to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') box.style.display = 'none';
  });
})();

/* ===== Continuous JS-driven infinite testimonials scroll (mobile + desktop) ===== */
(function initContinuousTestimonials() {
  try {
    const slider = document.querySelector('.rc-slider');
    if (!slider) return;
    if (slider.dataset.rcInited) return;
    slider.dataset.rcInited = '1';

    const track = slider.querySelector('.rc-track');
    if (!track) return;

    // defensive variables
    let clonesCreated = false;
    let rafId = null;
    let startTime = null;
    let pxPerSecond = 60; // base speed; tweak lower=slower, higher=faster
    let offset = 0;
    let trackHalfWidth = 0;
    let isPaused = false;
    let lastResize = 0;

    // helpers
    const isTouch = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // create clones for seamless loop (idempotent)
    function ensureClones() {
      if (clonesCreated) return;
      const items = Array.from(track.children);
      if (!items.length) return;
      items.forEach(n => {
        const c = n.cloneNode(true);
        c.setAttribute('data-rc-clone', '1');
        c.setAttribute('aria-hidden', 'true');
        track.appendChild(c);
      });
      clonesCreated = true;
    }

    function removeClones() {
      Array.from(track.querySelectorAll('[data-rc-clone]')).forEach(n => n.remove());
      clonesCreated = false;
    }

    // compute widths
    function recompute() {
      // ensure clones present
      ensureClones();

      // force reflow so sizes are accurate
      void track.offsetWidth;

      // total width of track
      const totalWidth = Array.from(track.children).reduce((sum, el) => {
        const w = el.getBoundingClientRect().width;
        return sum + Math.ceil(w);
      }, 0);

      // half width is the original content width (since we duplicated)
      trackHalfWidth = totalWidth / 2 || totalWidth;

      // reset offset when recomputing to avoid jumps
      offset = offset % trackHalfWidth;
      // set initial transform
      track.style.transform = `translateX(${-offset}px)`;
    }

    // animation loop (pixel-by-pixel)
    function step(ts) {
      if (!startTime) startTime = ts;
      const dt = ts - startTime;
      startTime = ts;
      if (!isPaused) {
        // move by pxPerSecond * dt(ms)/1000
        offset += (pxPerSecond * dt) / 1000;
        if (offset >= trackHalfWidth) {
          // wrap seamlessly
          offset = offset - trackHalfWidth;
        }
        track.style.transform = `translateX(${-offset}px)`;
      }
      rafId = requestAnimationFrame(step);
    }

    // start the continuous animation
    function start() {
      if (prefersReduced()) return; // respect reduced motion
      // apply JS-mode CSS class so we hide native scroll etc.
      track.classList.add('rc-js-scroll');
      recompute();
      stop(); // ensure no duplicate rAF
      startTime = null;
      rafId = requestAnimationFrame(step);
    }

    function stop() {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; startTime = null; }
    }

    // Pause & resume helpers
    function pause() { isPaused = true; }
    function resume() { isPaused = false; }

    // Interaction handlers to pause while user interacts
    function addInteractionListeners() {
      // pointer (mouse) interactions
      slider.addEventListener('mouseenter', pause, { passive: true });
      slider.addEventListener('mouseleave', resume, { passive: true });
      // pointerdown/touchstart to pause
      track.addEventListener('pointerdown', pause, { passive: true });
      window.addEventListener('pointerup', resume, { passive: true });
      // touch events
      track.addEventListener('touchstart', pause, { passive: true });
      window.addEventListener('touchend', resume, { passive: true });
      // focus (keyboard)
      track.addEventListener('focusin', pause);
      track.addEventListener('focusout', resume);
    }

    // Remove listeners if needed (not used but kept for completeness)
    function removeInteractionListeners() {
      slider.removeEventListener('mouseenter', pause);
      slider.removeEventListener('mouseleave', resume);
      track.removeEventListener('pointerdown', pause);
      window.removeEventListener('pointerup', resume);
      track.removeEventListener('touchstart', pause);
      window.removeEventListener('touchend', resume);
      track.removeEventListener('focusin', pause);
      track.removeEventListener('focusout', resume);
    }

    // Resize handling (debounced)
    function handleResize() {
      const now = Date.now();
      if (now - lastResize < 120) return;
      lastResize = now;
      // recompute dimensions and restart to avoid jumps
      recompute();
    }
    window.addEventListener('resize', function(){ clearTimeout(window._rcResizeT); window._rcResizeT = setTimeout(handleResize, 140); }, { passive: true });

    // Setup: clones + listeners + start animation
    ensureClones();
    addInteractionListeners();

    // Make it scrollable visually for touch while JS runs, but we actually control transform; ensure no vertical scroll
    track.style.overflowY = 'hidden';
    track.style.touchAction = 'pan-x';

    // Determine speed: slightly slower on mobile for readability
    if (isTouch()) pxPerSecond = 40; // calmer on mobile
    else pxPerSecond = 60; // desktop default

    // Start animation
    start();

    // expose handle for debugging/tuning
    window.__rcContinuous = {
      start, stop, pause, resume,
      setSpeed: (s) => { pxPerSecond = Number(s) || pxPerSecond; },
      recompute,
      isRunning: () => !!rafId
    };

  } catch (err) {
    console.warn('initContinuousTestimonials error', err);
  }
})();
// ===== MOBILE FOOTER ACCORDION =====
document.querySelectorAll('.footer-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.parentElement.classList.toggle('open');
  });
});
