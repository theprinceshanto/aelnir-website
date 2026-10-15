// Loads the Aelnir design system's React components (vendor/aelnir-ds) and
// renders them to static HTML at build time, so the site ships the real
// component markup without shipping React.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const bundle = readFileSync(new URL('../vendor/aelnir-ds/components/bundle.js', import.meta.url), 'utf8');
const sandbox = { window: { React } };
vm.runInNewContext(bundle, sandbox, { filename: 'aelnir-ds/bundle.js' });
const DS = sandbox.window.Aelnir;
if (!DS || !DS.Card) throw new Error('Aelnir design system did not load from vendor/aelnir-ds/components/bundle.js');

let slots = 0;

/**
 * Render a design-system component to HTML.
 * `inner` is trusted HTML placed where the component renders its children.
 */
export function c(name, props = {}, inner) {
  const Component = DS[name];
  if (!Component) throw new Error(`Unknown Aelnir component: ${name}`);
  const slot = inner == null ? undefined : `@@SLOT${slots++}@@`;
  const html = renderToStaticMarkup(React.createElement(Component, props, slot));
  return slot ? html.replace(slot, inner) : html;
}

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape text for HTML content and attributes. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ESC[ch]);
}
