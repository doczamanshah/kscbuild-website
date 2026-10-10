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

  /* Contact form: preselect project type from ?project=, submit via fetch, fall back to a normal POST */
  var form = document.getElementById('inquiry-form');
  if (form) {
    try {
      var q = new URLSearchParams(location.search).get('project');
      var sel = form.querySelector('[name="Project type"]');
      var map = { commercial: 'Commercial project', home: 'New custom home', renovation: 'Renovation or addition', development: 'Residential development' };
      if (q && sel && map[q]) sel.value = map[q];
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
      fetch(form.getAttribute('data-ajax'), {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload)
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok && j && (j.success === 'true' || j.success === true), j: j }; }); })
        .then(function (res) {
          if (res.ok) { location.href = form.getAttribute('data-thanks'); return; }
          throw new Error((res.j && res.j.message) || 'Request failed');
        })
        .catch(function () {
          submit.disabled = false; submit.textContent = 'Send my inquiry';
          status.className = 'status err';
          status.innerHTML = 'Something went wrong sending your inquiry. Please try again, or email us directly at <a href="mailto:support@kscbuild.com">support@kscbuild.com</a> or call <a href="tel:+19382166630">(938) 216-6630</a>.';
        });
    });
  }

  /* Current year in footer */
  var y = document.querySelector('[data-year]'); if (y) y.textContent = new Date().getFullYear();
})();
