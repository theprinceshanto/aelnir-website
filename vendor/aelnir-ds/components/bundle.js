/* @ds-bundle: {"format":4,"namespace":"Aelnir","components":[{"name":"Logo"},{"name":"PrismLine"},{"name":"Header"},{"name":"Footer"},{"name":"Button"},{"name":"Link"},{"name":"Badge"},{"name":"Card"},{"name":"Alert"},{"name":"Tabs"},{"name":"Modal"},{"name":"Input"},{"name":"Textarea"},{"name":"Select"},{"name":"Checkbox"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;
  var ARMS = ['products', 'studio', 'labs'];
  var uid = 0;
  function useStableId(prefix) {
    var ref = React.useRef(null);
    if (ref.current === null) { uid += 1; ref.current = 'ae' + prefix + uid; }
    return ref.current;
  }
  function cx() { return Array.prototype.filter.call(arguments, Boolean).join(' '); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function omit(obj, keys) {
    var out = {};
    for (var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k) && keys.indexOf(k) === -1) out[k] = obj[k]; }
    return out;
  }

  /* ---------- Brand ---------- */

  var RING = 'M4 60a56 56 0 1 0 112 0a56 56 0 1 0 -112 0ZM20 72a40 40 0 1 0 80 0a40 40 0 1 0 -80 0Z';
  var RING_SM = 'M4 60a56 56 0 1 0 112 0a56 56 0 1 0 -112 0ZM22 71a38 38 0 1 0 76 0a38 38 0 1 0 -76 0Z';
  var ARC = 'M31.72 100.28A40 40 0 0 0 88.28 100.28';
  var WORD = [
    ['', 'M0 40L20 0L40 40H33.85L20 12.3L6.15 40Z'],
    ['', 'M54 0H84V5.5H59.5V17.25H81V22.75H59.5V34.5H84V40H54Z'],
    ['', 'M98 0H103.5V34.5H126V40H98Z'],
    ['', 'M140 40V0H146.2L168.5 31.5V0H174V40H167.8L145.5 8.5V40Z'],
    ['', 'M188 0H193.5V40H188Z'],
    ['evenodd', 'M207.5 40V0H225.5A11.25 11.25 0 0 1 225.5 22.5H213V40ZM213 5.5V17H225.5A5.75 5.75 0 0 0 225.5 5.5Z'],
    ['', 'M216 17H222.5L240 40H233.5Z']
  ];
  function stop(offset, token, opacity) {
    return h('stop', { key: String(offset), offset: offset, style: { stopColor: 'var(--' + token + ')', stopOpacity: opacity } });
  }

  function Mark(props) {
    var id = useStableId('m');
    var size = props.size || 64;
    var arm = props.arm || 'master';
    var mono = !!props.mono;
    var small = size < 48;
    var strokeWidth = Math.max(1.2, 168 / size);
    var children = [];
    if (!mono && !small) {
      children.push(h('defs', { key: 'defs' },
        h('linearGradient', { id: id + 'm', x1: 0, y1: 0, x2: 1, y2: 1 },
          stop(0, 'metal-hi', 1), stop(0.52, 'metal-lo', 1), stop(0.74, 'metal-hi', 1), stop(1, 'metal-lo', 1)),
        h('linearGradient', { id: id + 'p', gradientUnits: 'userSpaceOnUse', x1: 31.72, y1: 0, x2: 88.28, y2: 0 },
          stop(0, 'ember', 0), stop(0.14, 'ember', 1), stop(0.38, 'lime', 1), stop(0.6, 'ice', 1), stop(0.8, 'violet', 1), stop(1, 'violet', 0))));
    }
    children.push(h('path', { key: 'ring', fillRule: 'evenodd', fill: mono || small ? 'currentColor' : 'url(#' + id + 'm)', d: small ? RING_SM : RING }));
    if (!small && !mono) {
      children.push(h('path', {
        key: 'line', d: ARC, fill: 'none', strokeWidth: strokeWidth, strokeLinecap: 'round',
        stroke: arm === 'master' ? 'url(#' + id + 'p)' : 'var(--' + arm + ')'
      }));
    }
    return h('svg', {
      className: 'ae-mark', viewBox: '0 0 120 120', width: size, height: size,
      role: props.decorative ? undefined : 'img',
      'aria-label': props.decorative ? undefined : (arm === 'master' ? 'Aelnir' : 'Aelnir ' + cap(arm)),
      'aria-hidden': props.decorative ? true : undefined
    }, children);
  }

  function Wordmark(props) {
    var height = props.height || 20;
    return h('svg', {
      className: 'ae-wordmark', viewBox: '0 0 240 40', width: height * 6, height: height, fill: 'currentColor',
      role: props.decorative ? undefined : 'img',
      'aria-label': props.decorative ? undefined : 'AELNIR',
      'aria-hidden': props.decorative ? true : undefined
    }, WORD.map(function (w, i) { return h('path', { key: i, fillRule: w[0] || undefined, d: w[1] }); }));
  }

  function Logo(props) {
    var variant = props.variant || 'horizontal';
    var size = props.size || 64;
    var arm = props.arm || 'master';
    var mono = !!props.mono;
    if (variant === 'mark') return h(Mark, { size: size, arm: arm, mono: mono });
    if (variant === 'wordmark') return h('span', { className: cx('ae-logo', props.className) }, h(Wordmark, { height: size / 3 }));
    var stacked = variant === 'stacked';
    var parts = [
      h(Mark, { key: 'mark', size: size, arm: arm, mono: mono, decorative: true }),
      h(Wordmark, { key: 'word', height: stacked ? size / 4 : size / 3, decorative: true })
    ];
    if (arm !== 'master') {
      if (!stacked) parts.push(h('span', { key: 'div', className: 'ae-logo-divider', style: { height: size / 2 }, 'aria-hidden': true }));
      parts.push(h('span', { key: 'arm', className: 'ae-logo-label', style: { fontSize: Math.max(11, size * 0.2) }, 'aria-hidden': true }, arm));
    }
    return h('span', {
      className: cx('ae-logo', stacked ? 'ae-logo-stacked' : 'ae-logo-horizontal', props.className),
      style: { gap: stacked ? size / 4 : size / 3 },
      role: 'img', 'aria-label': arm === 'master' ? 'Aelnir' : 'Aelnir ' + cap(arm)
    }, parts);
  }

  function PrismLine(props) {
    var vertical = props.orientation === 'vertical';
    return h('div', {
      role: 'separator', 'aria-orientation': vertical ? 'vertical' : undefined,
      className: cx('ae-prism', vertical && 'ae-prism-vertical', props.glow && 'ae-prism-glow', props.className)
    });
  }

  /* ---------- Navigation ---------- */

  function Header(props) {
    var nav = props.nav || [];
    return h('header', { className: cx('ae-header', props.className) },
      h('div', { className: 'ae-header-inner' },
        h('a', { className: 'ae-header-home', href: props.homeHref || '/', 'aria-label': 'Aelnir home' },
          h(Logo, { size: 40, arm: props.arm || 'master' })),
        nav.length ? h('nav', { className: 'ae-header-nav', 'aria-label': 'Main' },
          h('ul', null, nav.map(function (item, i) {
            return h('li', { key: i }, h('a', {
              href: item.href, className: 'ae-header-link small', 'aria-current': item.current ? 'page' : undefined
            }, item.label));
          }))) : null,
        props.action ? h('div', { className: 'ae-header-action' }, props.action) : null));
  }

  function Footer(props) {
    var arm = props.arm || 'master';
    var columns = props.columns || [];
    return h('footer', { className: cx('ae-footer', props.className) },
      arm === 'master' ? h(PrismLine, null) : h('div', { className: 'ae-footer-rule', 'aria-hidden': true }),
      h('div', { className: 'ae-footer-inner' },
        h('div', { className: 'ae-footer-brand' },
          h(Logo, { size: 48, arm: arm }),
          props.tagline ? h('p', { className: 'ae-footer-tagline small' }, props.tagline) : null),
        columns.length ? h('div', { className: 'ae-footer-cols' }, columns.map(function (col, i) {
          return h('div', { key: i, className: 'ae-footer-col' },
            h('h2', { className: 'ae-footer-title label' }, col.title),
            h('ul', null, (col.links || []).map(function (link, j) {
              return h('li', { key: j }, h('a', { href: link.href, className: 'ae-footer-link small' }, link.label));
            })));
        })) : null),
      props.note ? h('div', { className: 'ae-footer-note caption' }, props.note) : null);
  }

  /* ---------- Actions ---------- */

  function Button(props) {
    var variant = props.variant || 'secondary';
    var size = props.size || 'md';
    var loading = !!props.loading;
    var rest = omit(props, ['variant', 'size', 'className', 'children', 'loading']);
    return h('button', Object.assign({ type: 'button' }, rest, {
      disabled: props.disabled || loading,
      'aria-busy': loading ? true : undefined,
      className: cx('ae-btn', 'ae-btn-' + variant, 'ae-btn-' + size, size === 'sm' ? 'small' : 'body', props.className)
    }), loading ? h('span', { className: 'ae-spinner', 'aria-hidden': true }) : null, props.children);
  }

  function Link(props) {
    var standalone = props.variant === 'standalone';
    var external = !!props.external;
    var rest = omit(props, ['variant', 'external', 'className', 'children']);
    return h('a', Object.assign({}, rest, {
      className: cx('ae-link', standalone && 'ae-link-standalone label', props.className),
      target: external ? '_blank' : props.target,
      rel: external ? 'noopener noreferrer' : props.rel
    }), props.children, external ? h('span', { className: 'ae-sr' }, ' (opens in a new tab)') : null);
  }

  /* ---------- Display ---------- */

  function Badge(props) {
    var arm = props.arm || (ARMS.indexOf(props.tone) > -1 ? props.tone : null);
    var tone = arm || props.tone || 'neutral';
    return h('span', { className: cx('ae-badge', 'ae-badge-' + tone, 'label', props.className) },
      h('span', { className: 'ae-badge-dot', 'aria-hidden': true }), props.children);
  }

  function Card(props) {
    var level = props.headingLevel || 3;
    var interactive = !!props.href;
    var title = null;
    if (props.title) {
      title = h('h' + level, { className: 'ae-card-title title' },
        interactive ? h('a', { href: props.href, className: 'ae-card-link' }, props.title) : props.title);
    }
    return h('article', { className: cx('ae-card', props.arm && 'ae-card-' + props.arm, interactive && 'ae-card-interactive', props.className) },
      props.eyebrow ? h('div', { className: 'ae-card-eyebrow label' },
        props.arm ? h('span', { className: 'ae-card-dot', 'aria-hidden': true }) : null, props.eyebrow) : null,
      title,
      props.children ? h('div', { className: 'ae-card-body body' }, props.children) : null,
      props.footer ? h('div', { className: 'ae-card-footer' }, props.footer) : null);
  }

  function Alert(props) {
    var tone = props.tone || 'info';
    return h('div', { role: tone === 'danger' ? 'alert' : 'status', className: cx('ae-alert', 'ae-alert-' + tone, props.className) },
      h('span', { className: 'ae-alert-dot', 'aria-hidden': true }),
      h('div', { className: 'ae-alert-content' },
        props.title ? h('p', { className: 'ae-alert-title body' }, props.title) : null,
        props.children ? h('div', { className: 'ae-alert-body small' }, props.children) : null),
      props.onDismiss ? h(Button, { variant: 'ghost', size: 'sm', onClick: props.onDismiss }, 'Dismiss') : null);
  }

  function Tabs(props) {
    var items = props.items || [];
    var base = useStableId('t');
    var state = React.useState(props.defaultId || (items[0] && items[0].id));
    var selected = state[0], setSelected = state[1];
    function onKeyDown(e, i) {
      var n = items.length, j = null;
      if (e.key === 'ArrowRight') j = (i + 1) % n;
      else if (e.key === 'ArrowLeft') j = (i - 1 + n) % n;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = n - 1;
      if (j === null) return;
      e.preventDefault();
      setSelected(items[j].id);
      var el = document.getElementById(base + '-tab-' + items[j].id);
      if (el) el.focus();
    }
    return h('div', { className: cx('ae-tabs', props.className) },
      h('div', { role: 'tablist', 'aria-label': props.label, className: 'ae-tablist' }, items.map(function (item, i) {
        var on = item.id === selected;
        return h('button', {
          key: item.id, id: base + '-tab-' + item.id, type: 'button', role: 'tab',
          'aria-selected': on, 'aria-controls': base + '-panel-' + item.id, tabIndex: on ? 0 : -1,
          className: 'ae-tab small', onClick: function () { setSelected(item.id); },
          onKeyDown: function (e) { onKeyDown(e, i); }
        }, item.label);
      })),
      items.map(function (item) {
        return h('div', {
          key: item.id, id: base + '-panel-' + item.id, role: 'tabpanel', tabIndex: 0,
          'aria-labelledby': base + '-tab-' + item.id, hidden: item.id !== selected, className: 'ae-tabpanel body'
        }, item.content);
      }));
  }

  var FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function Modal(props) {
    var id = useStableId('d');
    var ref = React.useRef(null);
    var closeRef = React.useRef(props.onClose);
    closeRef.current = props.onClose;
    React.useEffect(function () {
      if (!props.open) return undefined;
      var previous = document.activeElement;
      var node = ref.current;
      var first = node ? node.querySelector(FOCUSABLE) : null;
      (first || node).focus();
      function onKey(e) {
        if (e.key === 'Escape' && closeRef.current) { closeRef.current(); return; }
        if (e.key !== 'Tab' || !node) return;
        var list = node.querySelectorAll(FOCUSABLE);
        if (!list.length) { e.preventDefault(); return; }
        var a = list[0], z = list[list.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
      document.addEventListener('keydown', onKey);
      return function () {
        document.removeEventListener('keydown', onKey);
        if (previous && previous.focus) previous.focus();
      };
    }, [props.open]);
    if (!props.open) return null;
    return h('div', {
      className: 'ae-modal-backdrop',
      onMouseDown: function (e) { if (e.target === e.currentTarget && closeRef.current) closeRef.current(); }
    }, h('div', { ref: ref, role: 'dialog', 'aria-modal': true, 'aria-labelledby': id + '-title', tabIndex: -1, className: cx('ae-modal', props.className) },
      h('h2', { id: id + '-title', className: 'ae-modal-title title' }, props.title),
      props.children ? h('div', { className: 'ae-modal-body body' }, props.children) : null,
      props.footer ? h('div', { className: 'ae-modal-footer' }, props.footer) : null));
  }

  /* ---------- Forms ---------- */

  var FIELD_KEYS = ['label', 'hint', 'error', 'id', 'className', 'options', 'placeholder'];

  function field(props, id, control) {
    var note = props.error || props.hint;
    return h('div', { className: cx('ae-field', props.error && 'ae-field-error', props.disabled && 'ae-field-disabled', props.className) },
      h('label', { className: 'ae-label label', htmlFor: id }, props.label),
      control,
      note ? h('p', { id: id + '-note', className: 'ae-note caption' }, note) : null);
  }
  function controlProps(props, id, extra) {
    var note = props.error || props.hint;
    return Object.assign({}, omit(props, FIELD_KEYS), extra, {
      id: id,
      'aria-invalid': props.error ? true : undefined,
      'aria-describedby': note ? id + '-note' : undefined
    });
  }

  function Input(props) {
    var autoId = useStableId('i');
    var id = props.id || autoId;
    return field(props, id, h('input', controlProps(props, id, { type: props.type || 'text', placeholder: props.placeholder, className: 'ae-input body' })));
  }

  function Textarea(props) {
    var autoId = useStableId('x');
    var id = props.id || autoId;
    return field(props, id, h('textarea', controlProps(props, id, { rows: props.rows || 4, placeholder: props.placeholder, className: 'ae-input ae-textarea body' })));
  }

  function Select(props) {
    var autoId = useStableId('s');
    var id = props.id || autoId;
    var options = (props.options || []).map(function (o) { return h('option', { key: o.value, value: o.value }, o.label); });
    if (props.placeholder) options.unshift(h('option', { key: '__placeholder', value: '', disabled: true }, props.placeholder));
    var extra = { className: 'ae-input ae-select body' };
    if (props.placeholder && props.value === undefined && props.defaultValue === undefined) extra.defaultValue = '';
    return field(props, id, h('span', { className: 'ae-select-wrap' }, h('select', controlProps(props, id, extra), options)));
  }

  function Checkbox(props) {
    var autoId = useStableId('c');
    var id = props.id || autoId;
    var note = props.error || props.hint;
    return h('div', { className: cx('ae-check', props.error && 'ae-field-error', props.disabled && 'ae-field-disabled', props.className) },
      h('input', controlProps(props, id, { type: 'checkbox', className: 'ae-check-box' })),
      h('div', { className: 'ae-check-text' },
        h('label', { htmlFor: id, className: 'ae-check-label body' }, props.label),
        note ? h('p', { id: id + '-note', className: 'ae-note caption' }, note) : null));
  }

  var api = {
    Logo: Logo, PrismLine: PrismLine, Header: Header, Footer: Footer, Button: Button, Link: Link,
    Badge: Badge, Card: Card, Alert: Alert, Tabs: Tabs, Modal: Modal,
    Input: Input, Textarea: Textarea, Select: Select, Checkbox: Checkbox
  };
  window.Aelnir = Object.assign(window.Aelnir || {}, api);
})();
