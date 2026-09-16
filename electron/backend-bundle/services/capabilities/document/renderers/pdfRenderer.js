const puppeteer = require('puppeteer');
const { buildDocumentHtml } = require('./htmlBuilder');

let browserInstance = null;

async function getBrowser() {
    if (browserInstance && browserInstance.connected) {
        return browserInstance;
    }
    if (browserInstance) {
        await browserInstance.close().catch(() => {});
        browserInstance = null;
    }
    browserInstance = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
    });
    return browserInstance;
}

async function renderPdf(document) {
    const html = buildDocumentHtml(document);
    let browser;
    let page;

    try {
        browser = await getBrowser();
        page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '18mm',
                bottom: '22mm',
                left: '18mm'
            },
            displayHeaderFooter: true,
            headerTemplate: '<div></div>',
            footerTemplate: `
                <div style="width:100%; font-size:8px; color:#64748b; padding:0 18mm; text-align:center;">
                    <span>${document.metadata.title.replace(/"/g, '')}</span>
                    &nbsp;|&nbsp;
                    Page <span class="pageNumber"></span> of <span class="totalPages"></span>
                </div>
            `
        });
        return Buffer.from(pdfBuffer);
    } finally {
        if (page) {
            await page.close().catch(() => {});
        }
    }
}

async function closeBrowser() {
    if (browserInstance) {
        await browserInstance.close().catch(() => {});
        browserInstance = null;
    }
}

module.exports = { renderPdf, closeBrowser };
