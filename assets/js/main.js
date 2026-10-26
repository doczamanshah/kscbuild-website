/* Keystone Constructions — site behaviour (no dependencies) */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = navigator.connection && navigator.connection.saveData;

  /* Mobile navigation */
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
    });
  }

  /* Ambient videos: play only while visible, skip when the user prefers less motion or data */
  var vids = document.querySelectorAll('video[data-ambient]');
  if (vids.length) {
    if (reduce || saveData || !('IntersectionObserver' in window)) {
      vids.forEach(function (v) { v.removeAttribute('autoplay'); v.pause(); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var v = en.target;
          if (en.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
          else v.pause();
        });
      }, { threshold: 0.2 });
      vids.forEach(function (v) { io.observe(v); });
    }
  }

  /* Testimonial carousel */
  var car = document.querySelector('[data-carousel]');
  if (car) {
    var slides = car.querySelectorAll('blockquote');
    var dots = car.querySelectorAll('.dots button');
    var i = 0, timer = null;
    function show(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('active', k === i); s.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
      dots.forEach(function (d, k) { d.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
    }
    function start() { if (slides.length > 1 && !reduce) timer = setInterval(function () { show(i + 1); }, 7000); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    dots.forEach(function (d, k) { d.addEventListener('click', function () { stop(); show(k); start(); }); });
    car.addEventListener('mouseenter', stop); car.addEventListener('mouseleave', start);
    car.addEventListener('focusin', stop); car.addEventListener('focusout', start);
    show(0); start();
  }

  /* Keep the visit's source (e.g. ?src=grove-sign) on links to the inquiry form */
  try {
    var visitSrc = new URLSearchParams(location.search).get('src');
    if (visitSrc && !document.getElementById('inquiry-form')) {
      document.querySelectorAll('a[href*="contact/"]').forEach(function (a) {
        var u = new URL(a.getAttribute('href'), location.href);
        if (!u.searchParams.get('src')) u.searchParams.set('src', visitSrc);
        a.setAttribute('href', u.pathname + u.search + u.hash);
      });
    }
  } catch (e) {}

  /* Contact form: preselect project type from ?project=, submit via fetch, fall back to a normal POST */
  var form = document.getElementById('inquiry-form');
  if (form) {
    try {
      var q = new URLSearchParams(location.search).get('project');
      var sel = form.querySelector('[name="Project type"]');
      var map = { commercial: 'Commercial project', home: 'New custom home', development: 'Residential development' };
      if (q && sel && map[q]) sel.value = map[q];
      var params = new URLSearchParams(location.search);
      var siteMap = { own: 'Yes, I own a lot', find: 'Not yet, help me find one', keystone: 'A Keystone homesite' };
      var hs = params.get('homesite'), siteSel = form.querySelector('[name="Homesite"]');
      if (hs && siteSel && siteMap[hs]) siteSel.value = siteMap[hs];
      var src = params.get('src'), srcIn = form.querySelector('[name="Lead source (auto)"]');
      if (src && srcIn) srcIn.value = src.replace(/[^a-z0-9-]/gi, '').slice(0, 40);
      var lot = params.get('lot'), lotIn = form.querySelector('[name="Homesite of interest (auto)"]');
      if (lot && lotIn) lotIn.value = lot.replace(/[^a-z0-9 -]/gi, '').slice(0, 40);
      if (src && /-sign$/i.test(src)) { var hear = form.querySelector('[name="How they heard about us"]'); if (hear) hear.value = 'A Keystone yard sign'; }
    } catch (e) {}
    var status = form.querySelector('.status');
    var submit = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', function (e) {
      if (!window.fetch || !form.checkValidity()) return; // native validation / no-JS path
      e.preventDefault();
      var data = new FormData(form);
      var payload = {};
      data.forEach(function (v, k) { payload[k] = v; });
      submit.disabled = true; submit.textContent = 'Sending…';
      status.className = 'status';
      // Two independent deliveries: the Keystone Privé pipeline and the FormSubmit email to support@.
      // The inquiry counts as sent if either one gets it.
      var toPipeline = form.getAttribute('data-intake') ? fetch(form.getAttribute('data-intake'), {
        method: 'POST', keepalive: true,
        headers: { 'Content-Type': 'application/json', 'apikey': form.getAttribute('data-intake-key') },
        body: JSON.stringify({ p: payload })
      }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { return !!(j && j.ok); })
        .catch(function () { return false; }) : Promise.resolve(false);
      var toEmail = fetch(form.getAttribute('data-ajax'), {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload)
      }).then(function (r) { return r.json().then(function (j) { return r.ok && j && (j.success === 'true' || j.success === true); }); })
        .catch(function () { return false; });
      Promise.all([toPipeline, toEmail])
        .then(function (res) {
          if (res[0] || res[1]) { location.href = form.getAttribute('data-thanks'); return; }
          throw new Error('Request failed');
        })
        .catch(function () {
          submit.disabled = false; submit.textContent = 'Send my inquiry';
          status.className = 'status err';
          status.innerHTML = 'Something went wrong sending your inquiry. Please try again, or email us directly at <a href="mailto:support@kscbuild.com">support@kscbuild.com</a> or call <a href="tel:+19382166630">(938) 216-6630</a>.';
        });
    });
  }

  /* Homesites: filter build opportunities by region */
  var chips = document.querySelectorAll('[data-region]');
  if (chips.length) {
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var r = c.getAttribute('data-region');
        chips.forEach(function (o) { o.setAttribute('aria-pressed', o === c ? 'true' : 'false'); });
        document.querySelectorAll('[data-group]').forEach(function (g) { g.hidden = !(r === 'all' || g.getAttribute('data-group') === r); });
      });
    });
  }

  /* Current year in footer */
  var y = document.querySelector('[data-year]'); if (y) y.textContent = new Date().getFullYear();
})();
