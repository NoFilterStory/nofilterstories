/* No Filters Stories — shared behaviour (menu, consent, lightbox, age gate) */
(function () {
  'use strict';

  /* Mobile menu */
  window.toggleMenu = function () {
    var b = document.getElementById('hamburger'), m = document.getElementById('mobile-menu');
    if (!b || !m) return;
    b.classList.toggle('open'); m.classList.toggle('open');
    document.body.style.overflow = m.classList.contains('open') ? 'hidden' : '';
  };

  /* Consent: analytics is denied by default in the page head.
     Restore a previously accepted choice on every page. */
  try {
    if (localStorage.getItem('cookieConsent') === 'accepted' && typeof gtag === 'function') {
      gtag('consent', 'update', { analytics_storage: 'granted' });
    }
  } catch (e) {}

  /* Cookie banner for pages that use the shared one (data-shared-consent) */
  var banner = document.getElementById('cookie-banner');
  if (banner && document.body.hasAttribute('data-shared-consent')) {
    var stored = null;
    try { stored = localStorage.getItem('cookieConsent'); } catch (e) {}
    banner.style.display = stored ? 'none' : 'flex';
    var acc = document.getElementById('cookie-btn-accept'), dec = document.getElementById('cookie-btn-decline');
    if (acc) acc.addEventListener('click', function () {
      try { localStorage.setItem('cookieConsent', 'accepted'); } catch (e) {}
      banner.style.display = 'none';
      if (typeof gtag === 'function') gtag('consent', 'update', { analytics_storage: 'granted' });
    });
    if (dec) dec.addEventListener('click', function () {
      try { localStorage.setItem('cookieConsent', 'declined'); } catch (e) {}
      banner.style.display = 'none';
      if (typeof gtag === 'function') gtag('consent', 'update', { analytics_storage: 'denied' });
    });
  }

  /* Image protection (kept from the previous site) */
  document.addEventListener('contextmenu', function (e) { if (e.target.tagName === 'IMG') e.preventDefault(); });
  document.addEventListener('dragstart', function (e) { if (e.target.tagName === 'IMG') e.preventDefault(); });

  /* Lightbox */
  var lb = document.getElementById('lightbox');
  var items = Array.prototype.slice.call(document.querySelectorAll('.grid .ph-item'));
  if (items.length && lb) {
    var img = lb.querySelector('img'), count = lb.querySelector('.lb-count'), idx = 0;
    function src(i) {
      var el = items[i], im = el.querySelector('img');
      return el.getAttribute('data-full') || im.currentSrc || im.getAttribute('src') || im.getAttribute('data-src');
    }
    function show(i) {
      idx = (i + items.length) % items.length;
      img.src = src(idx);
      img.alt = items[idx].querySelector('img').alt;
      count.textContent = (idx + 1) + ' / ' + items.length;
    }
    function open(i) { show(i); lb.classList.add('open'); document.body.style.overflow = 'hidden'; }
    function close() { lb.classList.remove('open'); document.body.style.overflow = ''; img.src = ''; }
    items.forEach(function (el, i) { el.addEventListener('click', function () { open(i); }); });
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
    var x0 = null;
    lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }

  /* Age gate (boudoir page only) */
  var gate = document.getElementById('age-gate');
  if (gate) {
    function release() {
      gate.classList.remove('show');
      document.querySelectorAll('img[data-src]').forEach(function (im) {
        im.src = im.getAttribute('data-src'); im.removeAttribute('data-src');
      });
    }
    var ok = false;
    try { ok = sessionStorage.getItem('ageOK') === '1'; } catch (e) {}
    if (ok) release(); else gate.classList.add('show');
    document.getElementById('gate-enter').addEventListener('click', function () {
      try { sessionStorage.setItem('ageOK', '1'); } catch (e) {}
      release();
    });
    document.getElementById('gate-leave').addEventListener('click', function () {
      window.location.href = 'gallery.html';
    });
  }

  /* Contact form (home page) */
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('.form-submit');
      btn.textContent = 'Sending...'; btn.disabled = true;
      function fail() {
        btn.textContent = 'Send Message'; btn.disabled = false;
        document.getElementById('form-error').style.display = 'block';
      }
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
        .then(function (r) {
          if (r.ok) { form.style.display = 'none'; document.getElementById('form-success').style.display = 'block'; }
          else fail();
        }).catch(fail);
    });
  }
})();
