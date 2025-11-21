/**
 * mobile.js - mobile helpers for hero, nav, sticky call, forms and vh fix
 * Drop into your project as mobile.js or merge into main.js (ensure not duplicated).
 */
(function () {
  'use strict';

  /* utilities */
  const $ = (s, ctx=document) => ctx.querySelector(s);
  const $$ = (s, ctx=document) => Array.from((ctx||document).querySelectorAll(s));
 const debounce = (fn, wait = 120) => {
  let t;
  return (arg) => {
    clearTimeout(t);
    t = setTimeout(() => fn(arg), wait);
  };
};

  /* ====== vh fix ====== */
  function setVh() {
    try {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    } catch (e){}
  }
  setVh();
  window.addEventListener('resize', debounce(setVh, 120), { passive: true });
  window.addEventListener('orientationchange', debounce(setVh, 220), { passive: true });

  /* ====== Body lock helper ====== */
  const BodyLock = {
    lockClass: 'mobile-nav-open',
    lock() {
      document.documentElement.classList.add(this.lockClass);
      document.body.classList.add(this.lockClass);
      this._y = window.scrollY || document.documentElement.scrollTop;
      document.body.style.top = `-${this._y}px`;
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    },
    unlock() {
      document.documentElement.classList.remove(this.lockClass);
      document.body.classList.remove(this.lockClass);
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      if (typeof this._y === 'number') window.scrollTo(0, this._y);
      this._y = 0;
    }
  };


  /* ====== Sticky call button ====== */
  function wireStickyCall() {
    const sticky = document.querySelector('.sticky-call-button');
    if (!sticky) return;
    let shown=false;
    const SHOW_AFTER=160;
    function apply() {
      if (document.documentElement.classList.contains('mobile-nav-open')) { sticky.style.display='none'; shown=false; return; }
      if (window.scrollY > SHOW_AFTER && !shown) { sticky.style.display='flex'; shown=true; }
      if (window.scrollY <= SHOW_AFTER && shown) { sticky.style.display='none'; shown=false; }
    }
    apply();
    window.addEventListener('scroll', debounce(apply, 120), { passive: true });
    window.addEventListener('orientationchange', ()=>{ sticky.style.display='none'; setTimeout(apply, 600); });
  }
function wireMobileSlider() {
  const wrap = document.querySelector('.rc-slider') || document.querySelector('.gallery-slider');
  if (!wrap) return;

  const track = wrap.querySelector('.rc-track') || wrap.querySelector('.slides');
  if (!track) return;

  const items = Array.from(track.children);
  if (!items.length) return;

  let idx = 0, timer = null, paused = false;
  const INTERVAL = 3000;

  function show(i) {
    idx = ((i % items.length) + items.length) % items.length;
    track.style.transform = `translateX(-${idx * 100}%)`;
  }

  function next() { show(idx + 1); }
  function start() { stop(); timer = setInterval(() => { if (!paused) next(); }, INTERVAL); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  // Hover / focus pause
  track.addEventListener('mouseenter', () => { paused = true; stop(); });
  track.addEventListener('mouseleave', () => { paused = false; start(); });

  // Keyboard arrows
  track.setAttribute('tabindex', '0');
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') show(idx - 1);
  });

  // Start when visible
  const io = ('IntersectionObserver' in window)
    ? new IntersectionObserver((entries) => {
        entries.forEach(en => { if (en.isIntersecting) start(); else stop(); });
      }, { threshold: 0.25 })
    : null;

  if (io) io.observe(wrap); else start();

  window.__mobileSlider = { start, stop, next, show };
}

  /* ====== Forms: basic anti-double + phone format + small validation UX ====== */
  function wireForms() {
    const forms = Array.from(document.querySelectorAll('#contactForm, #contactGoogleForm'));
    if (!forms.length) return;
    forms.forEach(form=>{
      let lastSubmit = 0;
      form.addEventListener('submit', function(e){
        const now = Date.now();
        if (now - lastSubmit < 1200) { e.preventDefault(); return; }
        lastSubmit = now;
        const name = form.querySelector('input[type="text"], input[name*="name"]');
        const phone = form.querySelector('input[type="tel"], input[name*="phone"]');
        if (name && !name.value.trim()) { e.preventDefault(); shake(name); return; }
        if (phone && !phone.value.trim()) { e.preventDefault(); shake(phone); return; }
        const btn = form.querySelector('button[type="submit"]');
        if (btn) { btn.disabled=true; const t=btn.innerHTML; btn.innerHTML='Sending...'; setTimeout(()=>{ btn.disabled=false; btn.innerHTML=t; },4000); }
      });
      const phoneEl = form.querySelector('input[type="tel"], input[name*="phone"]');
      if (phoneEl) {
        phoneEl.addEventListener('input', debounce((ev)=>{
          const raw = ev.target.value.replace(/[^\d\+]/g,'').slice(0,15);
          if (raw.startsWith('+')) ev.target.value = raw;
          else if (raw.length > 5) ev.target.value = raw.replace(/^(\d{0,5})(\d{0,5})(\d{0,5}).*$/, (m,a,b,c)=> (a? a + (b? ' ' + b : '') + (c? ' ' + c : '') : ''));
          else ev.target.value = raw;
        }, 250));
      }
    });
    function shake(el){ if(!el) return; el.classList.add('input-error-shake'); el.focus(); setTimeout(()=>el.classList.remove('input-error-shake'),600); }
  }

  /* ====== Init ====== */
  function init() {
    wireMobileNav();
    wireStickyCall();
    wireMobileSlider();
    wireForms();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
