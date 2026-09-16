const tokens = require('../designTokens');

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function buildTableHtml(table) {
    if (!table?.headers?.length) return '';
    const headers = table.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
    const rows = (table.rows || []).map((row) => {
        const cells = row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('');
        return `<tr>${cells}</tr>`;
    }).join('');
    return `<table class="data-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
}

function buildSectionHtml(section) {
    const parts = [];

    if (section.type === 'divider') {
        return '<hr class="section-divider" />';
    }

    if (section.type === 'metadata' && section.tables?.length) {
        for (const table of section.tables) {
            parts.push(buildTableHtml({ ...table, headers: ['', ''] }));
        }
        return `<section class="doc-section metadata-section">${parts.join('')}</section>`;
    }

    if (section.pageBreakBefore) {
        parts.push('<div class="page-break"></div>');
    }
    const level = Math.min(Math.max(section.level || 2, 1), 3);
    const tag = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3';

    if (section.heading) {
        parts.push(`<${tag} class="section-heading level-${level}">${escapeHtml(section.heading)}</${tag}>`);
    }

    for (const callout of section.callouts || []) {
        parts.push(`
            <div class="callout callout-${callout.type || 'info'}">
                ${callout.title ? `<div class="callout-title">${escapeHtml(callout.title)}</div>` : ''}
                <div class="callout-body">${escapeHtml(callout.content)}</div>
            </div>
        `);
    }

    for (const p of section.paragraphs || []) {
        parts.push(`<p>${escapeHtml(p)}</p>`);
    }

    if (section.bullets?.length) {
        parts.push('<ul>' + section.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('') + '</ul>');
    }

    if (section.numberedItems?.length) {
        parts.push('<ol>' + section.numberedItems.map((n) => `<li>${escapeHtml(n)}</li>`).join('') + '</ol>');
    }

    for (const table of section.tables || []) {
        parts.push(buildTableHtml(table));
    }

    return `<section class="doc-section">${parts.join('')}</section>`;
}

function buildDocumentHtml(document) {
    const { metadata, sections, sources } = document;
    const isArtifact = document.layout === 'artifact' || document.layout === 'artifact-concise' || document.layout === 'artifact-report';
    const isSimple = isArtifact || document.layout === 'two-page-simple' || document.template === 'two-page-report';
    const c = tokens.colors;
    const t = tokens.typography;

    const sectionsHtml = sections.map(buildSectionHtml).join('');
    const sourcesHtml = sources.length
        ? `<section class="doc-section sources-section">
            <h2 class="section-heading level-2">Sources</h2>
            <ol class="sources-list">
                ${sources.map((s, i) => `
                    <li>
                        ${s.url ? `<a href="${escapeHtml(s.url)}">${escapeHtml(s.title)}</a>` : escapeHtml(s.title)}
                        ${s.type ? `<span class="source-type">${escapeHtml(s.type)}</span>` : ''}
                    </li>
                `).join('')}
            </ol>
        </section>`
        : '';

    const simpleHeader = `
      <div class="simple-header">
        <h1>${escapeHtml(metadata.title)}</h1>
        ${metadata.subtitle ? `<div class="subtitle">${escapeHtml(metadata.subtitle)}</div>` : ''}
        <div class="meta">${escapeHtml(metadata.author || '')} · ${escapeHtml(metadata.date || '')}</div>
      </div>`;

    const coverBlock = isSimple ? simpleHeader : `
  <div class="cover">
    <div class="doc-type">${escapeHtml(metadata.documentType)}</div>
    <h1>${escapeHtml(metadata.title)}</h1>
    ${metadata.subtitle ? `<div class="subtitle">${escapeHtml(metadata.subtitle)}</div>` : ''}
    <div class="meta">
      ${metadata.author ? `<div>${escapeHtml(metadata.author)}</div>` : ''}
      ${metadata.organization ? `<div>${escapeHtml(metadata.organization)}</div>` : ''}
      <div>${escapeHtml(metadata.date)}</div>
    </div>
  </div>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(metadata.title)}</title>
<style>
  @page {
    size: A4;
    margin: ${tokens.spacing.pageMarginMm}mm;
  }
  * { box-sizing: border-box; }
  body {
    font-family: ${t.fontFamily};
    color: ${c.text};
    font-size: ${t.body}pt;
    line-height: ${t.lineHeight};
    background: ${c.background};
    margin: 0;
  }
  .page-break { page-break-before: always; }
  .simple-header {
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 2px solid ${c.border};
  }
  .simple-header h1 {
    font-size: ${t.h1 + 4}pt;
    color: ${c.primary};
    margin: 0 0 6px;
  }
  .simple-header .subtitle { color: ${c.muted}; margin-bottom: 4px; }
  .simple-header .meta { color: ${c.muted}; font-size: ${t.small}pt; }
  .section-divider {
    border: none;
    border-top: 1px solid ${c.border};
    margin: 18px 0;
  }
  .metadata-section .data-table th { background: transparent; color: ${c.muted}; font-weight: 600; width: 28%; }
  .metadata-section .data-table td { border: none; padding: 4px 10px; }
  .metadata-section .data-table tr:nth-child(even) td { background: transparent; }
  .cover {
    page-break-after: always;
    min-height: 240mm;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    background: ${c.primary};
    color: #fff;
    padding: 48px;
  }
  .cover .doc-type {
    font-size: ${t.small}pt;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    opacity: 0.85;
    margin-bottom: 24px;
  }
  .cover h1 {
    font-size: ${t.coverTitle}pt;
    font-weight: 700;
    margin: 0 0 12px;
    line-height: 1.15;
  }
  .cover .subtitle {
    font-size: ${t.coverSubtitle}pt;
    opacity: 0.92;
    margin-bottom: 48px;
  }
  .cover .meta {
    font-size: ${t.body}pt;
    opacity: 0.9;
    line-height: 1.8;
  }
  .content { padding: 0; }
  .section-heading {
    color: ${c.primary};
    font-weight: 700;
    margin: ${tokens.spacing.sectionGap}px 0 ${tokens.spacing.paragraphGap}px;
    page-break-after: avoid;
  }
  .section-heading.level-1 { font-size: ${t.h1}pt; border-bottom: 2px solid ${c.accent}; padding-bottom: 6px; }
  .section-heading.level-2 { font-size: ${t.h2}pt; }
  .section-heading.level-3 { font-size: ${t.h3}pt; color: ${c.accent}; }
  p { margin: 0 0 ${tokens.spacing.paragraphGap}px; }
  ul, ol { margin: 0 0 ${tokens.spacing.paragraphGap}px; padding-left: 22px; }
  li { margin-bottom: ${tokens.spacing.listGap}px; }
  .doc-section { page-break-inside: avoid; margin-bottom: 8px; }
  .callout {
    border-left: 4px solid ${c.accent};
    background: ${c.calloutBg};
    border: 1px solid ${c.calloutBorder};
    border-left-width: 4px;
    padding: 14px 16px;
    margin: 12px 0 16px;
    border-radius: 8px;
    page-break-inside: avoid;
  }
  .callout-title { font-weight: 700; color: ${c.primary}; margin-bottom: 6px; }
  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0 16px;
    font-size: ${t.body - 1}pt;
    page-break-inside: avoid;
  }
  .data-table th {
    background: ${c.tableHeader};
    color: ${c.tableHeaderText};
    padding: 8px 10px;
    text-align: left;
    font-weight: 600;
  }
  .data-table td {
    border: 1px solid ${c.border};
    padding: 8px 10px;
    vertical-align: top;
  }
  .data-table tr:nth-child(even) td { background: ${c.surface}; }
  .sources-list { font-size: ${t.body - 1}pt; }
  .sources-list a { color: ${c.accent}; text-decoration: none; }
  .source-type {
    display: block;
    font-size: ${t.small}pt;
    color: ${c.muted};
    margin-top: 2px;
  }
  .page-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: center;
    font-size: ${t.small}pt;
    color: ${c.muted};
    padding: 8px 0;
  }
</style>
</head>
<body>
  ${coverBlock}
  <div class="content">
    ${sectionsHtml}
    ${sourcesHtml}
  </div>
</body>
</html>`;
}

module.exports = { buildDocumentHtml, escapeHtml };
