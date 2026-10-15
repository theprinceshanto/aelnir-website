// Splits a privacy policy written in Markdown into an intro and one section
// per level-two heading, so each section can be laid out as its own row.
import { marked } from 'marked';

marked.setOptions({ gfm: true });

// Text from the repositories is trusted (it is our own policy), but raw HTML
// in it is still escaped so a stray tag cannot break the page.
const renderer = new marked.Renderer();
renderer.html = ({ text }) => text.replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Straight quotes and apostrophes to typographic ones, outside code. */
function smart(html) {
  return html
    .split(/(<code>[\s\S]*?<\/code>|<[^>]+>)/)
    .map((part) => (part.startsWith('<') ? part : part
      .replace(/(^|[\s(\[—–-])"/g, '$1“').replace(/"/g, '”')
      .replace(/(^|[\s(\[—–-])'/g, '$1‘').replace(/'/g, '’')))
    .join('');
}

const META = /^\s*\*\*(effective date|developer|contact)[^*]*\*\*/i;

export function splitPolicy(source) {
  const tokens = marked.lexer(source);
  const intro = [];
  const sections = [];
  let current = null;

  for (const token of tokens) {
    if (token.type === 'heading' && token.depth === 1) continue;
    if (token.type === 'heading' && token.depth === 2) {
      current = { title: token.text, tokens: [] };
      sections.push(current);
      continue;
    }
    if (token.type === 'heading' && token.depth >= 3) token.depth = 3;
    // The effective date, developer and contact lines are shown in the page header.
    if (!current && token.type === 'paragraph' && META.test(token.raw)) continue;
    (current ? current.tokens : intro).push(token);
  }

  const render = (list) => {
    const html = marked.parser(Object.assign(list, { links: tokens.links }), { renderer });
    return smart(html.replace(/<h[3-6]>/g, '<h3 class="title">').replace(/<\/h[3-6]>/g, '</h3>'));
  };

  return {
    intro: intro.length ? render(intro) : '',
    sections: sections.map((s, i) => ({
      id: `s${i + 1}`,
      n: String(i + 1).padStart(2, '0'),
      title: smart(s.title),
      html: render(s.tokens)
    }))
  };
}
