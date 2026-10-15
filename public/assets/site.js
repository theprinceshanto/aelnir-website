// Small enhancements on top of the static pages: the products filter, the
// tester-spot counter, and sending forms to Google Forms.
(function () {
  'use strict';

  /* ---------- Products filter ---------- */
  var filters = document.querySelector('[data-filters]');
  if (filters) {
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-filter-item]'));
    var count = document.querySelector('[data-filter-count]');
    filters.addEventListener('click', function (event) {
      var button = event.target.closest('[data-filter]');
      if (!button) return;
      var value = button.getAttribute('data-filter');
      Array.prototype.forEach.call(filters.querySelectorAll('[data-filter]'), function (b) {
        var on = b === button;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.classList.toggle('ae-btn-secondary', on);
        b.classList.toggle('ae-btn-ghost', !on);
      });
      var shown = 0;
      items.forEach(function (item) {
        var match = value === 'all' || item.getAttribute('data-status') === value;
        item.hidden = !match;
        if (match) shown += 1;
      });
      if (count) count.textContent = 'Showing ' + shown + ' of ' + items.length + ' apps';
    });
  }

  /* ---------- Tester spots ---------- */
  var spotBoxes = Array.prototype.slice.call(document.querySelectorAll('[data-spots]'));
  var spotState = null;

  function paintSpots(taken) {
    spotBoxes.forEach(function (box) {
      var cap = Number(box.getAttribute('data-cap'));
      var shown = Math.max(0, Math.min(cap, taken));
      var left = cap - shown;
      var label = box.querySelector('[data-spots-label]');
      if (label) label.textContent = left > 0 ? left + ' of ' + cap + ' spots left' : 'All ' + cap + ' spots are taken';
      var meter = box.querySelector('[data-meter]');
      if (meter) {
        Array.prototype.forEach.call(meter.children, function (cell, i) { cell.classList.toggle('on', i < shown); });
        meter.setAttribute('aria-label', shown + ' of ' + cap + ' tester spots taken');
      }
    });
    var full = spotBoxes.length && taken >= Number(spotBoxes[0].getAttribute('data-cap'));
    document.querySelectorAll('[data-form="tester"]').forEach(function (form) {
      var box = form.closest('[data-form-box]');
      if (!box || !full || box.getAttribute('data-sent')) return;
      form.hidden = true;
      var fullState = box.querySelector('[data-state="full"]');
      if (fullState) fullState.hidden = false;
    });
  }

  if (spotBoxes.length) {
    spotState = { taken: Number(spotBoxes[0].getAttribute('data-taken')) || 0, cap: Number(spotBoxes[0].getAttribute('data-cap')) };
    var csv = spotBoxes[0].getAttribute('data-csv');
    if (csv) {
      fetch(csv, { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.text() : Promise.reject(r.status); })
        .then(function (text) {
          var match = text.match(/\d+/);
          if (match) { spotState.taken = Number(match[0]); paintSpots(spotState.taken); }
        })
        .catch(function () { /* keep the number the page was built with */ });
    }
  }

  /* ---------- Forms ---------- */
  var formsConfig = null;
  function loadConfig() {
    if (formsConfig) return Promise.resolve(formsConfig);
    var src = document.querySelector('link[href$="assets/site.css"]').getAttribute('href').replace('site.css', 'forms.json');
    return fetch(src).then(function (r) { return r.json(); }).then(function (json) { formsConfig = json; return json; });
  }

  function fieldValue(form, name) {
    var el = form.elements[name];
    if (!el) return '';
    if (el.type === 'checkbox') return el.checked;
    return el.value.trim();
  }

  function googleBody(form, fields) {
    var body = new URLSearchParams();
    Object.keys(fields).forEach(function (name) {
      var spec = fields[name];
      var value = fieldValue(form, name);
      if (typeof spec === 'string') { if (spec && value) body.append(spec, value); }
      else if (spec && spec.entry && value === true) body.append(spec.entry, spec.value);
    });
    return body;
  }

  function mailBody(form) {
    var lines = [];
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      var label = form.querySelector('label[for="' + el.id + '"]');
      var name = label ? label.textContent : el.name;
      lines.push(name + ': ' + (el.type === 'checkbox' ? (el.checked ? 'Yes' : 'No') : el.value.trim()));
    });
    return lines.join('\n');
  }

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function showSent(form, kind) {
    var box = form.closest('[data-form-box]');
    box.setAttribute('data-sent', 'true');
    form.hidden = true;
    var sent = box.querySelector('[data-state="sent"]');
    if (kind === 'tester' && spotState) {
      var mine = Math.min(spotState.cap, spotState.taken + 1);
      var badge = sent.querySelector('[data-my-spot] .ae-badge');
      if (badge) badge.lastChild.textContent = 'Spot ' + mine + ' of ' + spotState.cap + ' held';
      paintSpots(mine);
      // Light up the visitor's own square in every counter on the page.
      document.querySelectorAll('[data-meter]').forEach(function (meter) {
        var cell = meter.children[mine - 1];
        if (cell) cell.classList.add('mine');
      });
    }
    // The phone dock's pinned button pointed at this form; it has done its job.
    var pinned = document.querySelector('.dock > .ae-btn');
    if (pinned && /#enquiry$|\/join\/$/.test(pinned.getAttribute('href'))) pinned.hidden = true;
    sent.hidden = false;
    sent.setAttribute('tabindex', '-1');
    sent.focus({ preventScroll: true });
    sent.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    // If smooth scrolling did not happen (some browsers skip it), jump there.
    setTimeout(function () {
      var top = sent.getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * 0.6) sent.scrollIntoView({ block: 'start' });
    }, 700);
  }

  function setBusy(button, busy) {
    if (busy) {
      button.setAttribute('data-label', button.textContent);
      if (button.getAttribute('data-busy-label')) button.textContent = button.getAttribute('data-busy-label');
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
    } else {
      if (button.getAttribute('data-label')) button.textContent = button.getAttribute('data-label');
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  }

  document.querySelectorAll('form[data-form]').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var kind = form.getAttribute('data-form');
      var submit = form.querySelector('[type="submit"]');
      var error = form.querySelector('[data-form-error]');
      if (error) error.hidden = true;
      setBusy(submit, true);

      loadConfig().then(function (config) {
        var spec = config[kind] || {};
        if (spec.action) {
          // Google Forms does not allow reading its reply, so a sent request counts as success.
          return fetch(spec.action, { method: 'POST', mode: 'no-cors', body: googleBody(form, spec.fields || {}) })
            .then(function () { showSent(form, kind); });
        }
        // Not connected to a Google Form yet: hand the details to the visitor's email app.
        var subject = kind === 'tester' ? (form.getAttribute('data-product') + ' tester spot') : 'New project enquiry';
        window.location.href = 'mailto:' + config.contactEmail + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(mailBody(form));
        showSent(form, kind);
      }).catch(function () {
        if (error) error.hidden = false;
      }).then(function () {
        setBusy(submit, false);
      });
    });
  });
})();
