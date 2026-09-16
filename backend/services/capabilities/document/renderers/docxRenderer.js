const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    AlignmentType,
    Header,
    Footer,
    PageNumber,
    ShadingType,
    VerticalAlign
} = require('docx');
const tokens = require('../designTokens');

const HEADING_MAP = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3
};

function hexToDocxColor(hex) {
    return String(hex || tokens.colors.primary).replace('#', '');
}

function paragraph(text, options = {}) {
    return new Paragraph({
        spacing: { after: 160 },
        alignment: options.align,
        children: [
            new TextRun({
                text: String(text),
                size: options.size || tokens.typography.body * 2,
                color: options.color || hexToDocxColor(tokens.colors.text),
                bold: options.bold,
                italics: options.italics
            })
        ]
    });
}

function buildCoverPage(metadata) {
    const primary = hexToDocxColor(tokens.colors.primary);
    const accent = hexToDocxColor(tokens.colors.accent);

    const coverCells = [
        new TableRow({
            children: [
                new TableCell({
                    shading: { fill: primary, type: ShadingType.CLEAR },
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 800, bottom: 800, left: 600, right: 600 },
                    children: [
                        paragraph(metadata.documentType, { size: 18, color: 'E0E7FF', align: AlignmentType.CENTER }),
                        new Paragraph({
                            spacing: { before: 400, after: 200 },
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: metadata.title, bold: true, size: 56, color: 'FFFFFF' })]
                        }),
                        metadata.subtitle
                            ? new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 600 },
                                children: [new TextRun({ text: metadata.subtitle, size: 28, color: 'C7D2FE' })]
                            })
                            : new Paragraph({ spacing: { after: 600 } }),
                        paragraph(metadata.author || '', { size: 22, color: 'FFFFFF', align: AlignmentType.CENTER }),
                        paragraph(metadata.organization || '', { size: 20, color: 'E0E7FF', align: AlignmentType.CENTER }),
                        paragraph(metadata.date || '', { size: 20, color: 'E0E7FF', align: AlignmentType.CENTER })
                    ]
                })
            ]
        })
    ];

    return [
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE }
            },
            rows: coverCells
        }),
        new Paragraph({ pageBreakBefore: true })
    ];
}

function buildSectionElements(section) {
    const elements = [];

    if (section.type === 'divider') {
        return [
            new Paragraph({
                spacing: { before: 200, after: 200 },
                border: {
                    bottom: { style: BorderStyle.SINGLE, size: 6, color: hexToDocxColor(tokens.colors.border) }
                },
                children: []
            })
        ];
    }

    if (section.type === 'metadata' && section.tables?.length) {
        for (const table of section.tables) {
            if (!table.headers?.length) continue;
            const rows = (table.rows || []).map((row) => new TableRow({
                children: row.map((cell, idx) => new TableCell({
                    margins: { top: 60, bottom: 60, left: 120, right: 120 },
                    children: [paragraph(cell, {
                        size: 20,
                        color: idx === 0 ? hexToDocxColor(tokens.colors.muted) : hexToDocxColor(tokens.colors.text),
                        bold: idx === 0
                    })]
                }))
            }));
            elements.push(new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                    insideHorizontal: { style: BorderStyle.NONE },
                    insideVertical: { style: BorderStyle.NONE }
                },
                rows: rows
            }));
        }
        elements.push(new Paragraph({ spacing: { after: 240 } }));
        return elements;
    }

    const level = HEADING_MAP[section.level] || HeadingLevel.HEADING_2;

    if (section.pageBreakBefore) {
        elements.push(new Paragraph({ pageBreakBefore: true }));
    }

    if (section.heading) {
        elements.push(new Paragraph({
            heading: level,
            spacing: { before: 280, after: 160 },
            children: [new TextRun({
                text: section.heading,
                bold: true,
                color: hexToDocxColor(tokens.colors.primary),
                size: (section.level === 1 ? tokens.typography.h1 : section.level === 3 ? tokens.typography.h3 : tokens.typography.h2) * 2
            })]
        }));
    }

    for (const callout of section.callouts || []) {
        elements.push(new Paragraph({
            spacing: { before: 120, after: 120 },
            shading: { fill: 'EEF2FF', type: ShadingType.CLEAR },
            border: {
                left: { style: BorderStyle.SINGLE, size: 12, color: hexToDocxColor(tokens.colors.accent) }
            },
            children: [
                ...(callout.title ? [new TextRun({ text: callout.title + '\n', bold: true, color: hexToDocxColor(tokens.colors.primary), size: 22 })] : []),
                new TextRun({ text: callout.content, size: tokens.typography.body * 2, color: hexToDocxColor(tokens.colors.text) })
            ]
        }));
    }

    for (const p of section.paragraphs || []) {
        elements.push(paragraph(p));
    }

    for (const bullet of section.bullets || []) {
        elements.push(new Paragraph({
            spacing: { after: 80 },
            bullet: { level: 0 },
            children: [new TextRun({ text: bullet, size: tokens.typography.body * 2 })]
        }));
    }

    for (let i = 0; i < (section.numberedItems || []).length; i++) {
        elements.push(paragraph(`${i + 1}. ${section.numberedItems[i]}`));
    }

    for (const table of section.tables || []) {
        if (!table.headers?.length) continue;
        const headerRow = new TableRow({
            tableHeader: true,
            children: table.headers.map((h) => new TableCell({
                shading: { fill: hexToDocxColor(tokens.colors.tableHeader), type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({
                    children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 20 })]
                })]
            }))
        });
        const dataRows = (table.rows || []).map((row) => new TableRow({
            children: row.map((cell) => new TableCell({
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [paragraph(cell, { size: 20 })]
            }))
        }));
        elements.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...dataRows]
        }));
        elements.push(new Paragraph({ spacing: { after: 200 } }));
    }

    return elements;
}

function buildSourcesSection(sources) {
    if (!sources?.length) return [];
    const elements = [
        new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 280, after: 160 },
            children: [new TextRun({ text: 'Sources', bold: true, color: hexToDocxColor(tokens.colors.primary), size: tokens.typography.h2 * 2 })]
        })
    ];
    sources.forEach((source, index) => {
        const label = `${index + 1}. ${source.title}${source.type ? ` (${source.type})` : ''}`;
        elements.push(paragraph(label, { size: 20 }));
    });
    return elements;
}

async function renderDocx(document) {
    const isArtifact = document.layout === 'artifact' || document.layout === 'artifact-concise' || document.layout === 'artifact-report';
    const isSimple = isArtifact || document.layout === 'two-page-simple' || document.template === 'two-page-report';
    const children = isSimple
        ? [
            new Paragraph({
                spacing: { after: 120 },
                children: [new TextRun({
                    text: document.metadata.title,
                    bold: true,
                    size: 52,
                    color: hexToDocxColor(tokens.colors.primary)
                })]
            }),
            document.metadata.subtitle
                ? paragraph(document.metadata.subtitle, { size: 24, color: hexToDocxColor(tokens.colors.muted) })
                : null,
            isArtifact
                ? null
                : paragraph(`${document.metadata.author || ''} · ${document.metadata.date || ''}`, {
                    size: 20,
                    color: hexToDocxColor(tokens.colors.muted)
                }),
            new Paragraph({ spacing: { after: 280 } }),
            ...document.sections.flatMap(buildSectionElements),
            ...buildSourcesSection(document.sources)
        ].filter(Boolean)
        : [
            ...buildCoverPage(document.metadata),
            ...document.sections.flatMap(buildSectionElements),
            ...buildSourcesSection(document.sources)
        ];

    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    margin: { top: 720, right: 720, bottom: 720, left: 720 }
                }
            },
            headers: {
                default: new Header({
                    children: [new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [new TextRun({
                            text: document.metadata.organization || 'DevOS',
                            size: 16,
                            color: hexToDocxColor(tokens.colors.muted)
                        })]
                    })]
                })
            },
            footers: {
                default: new Footer({
                    children: [new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({ text: document.metadata.title + '  |  Page ', size: 16, color: hexToDocxColor(tokens.colors.muted) }),
                            new TextRun({ children: [PageNumber.CURRENT], size: 16, color: hexToDocxColor(tokens.colors.muted) })
                        ]
                    })]
                })
            },
            children
        }]
    });

    return await Packer.toBuffer(doc);
}

module.exports = { renderDocx };
