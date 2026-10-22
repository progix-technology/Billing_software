// Enterprise Silent / Iframe Print and High-Fidelity PDF Generation Utility

function buildInvoiceFullHtml(contentHtml, title = 'Tax Invoice', layout = 'A4') {
  let pageSizeCss = 'size: A4 portrait; margin: 4mm 6mm 4mm 6mm;';
  if (layout === 'A5') {
    pageSizeCss = 'size: A5 portrait; margin: 3mm 4mm 3mm 4mm;';
  } else if (layout === 'thermal' || layout === 'THERMAL') {
    pageSizeCss = 'size: 80mm auto; margin: 2mm 1mm;';
  }

  // Extract all compiled Tailwind CSS rules directly from document.styleSheets
  let allCssRules = '';
  try {
    for (const sheet of document.styleSheets) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        if (rules) {
          for (let i = 0; i < rules.length; i++) {
            allCssRules += rules[i].cssText + '\n';
          }
        }
      } catch (e) {
        // Cross-origin sheets
      }
    }
  } catch (err) {}

  // Resolve absolute URLs for stylesheets
  const headLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .map((el) => `<link rel="stylesheet" href="${el.href}">`)
    .join('\n');

  // Base path so any relative images resolve to current app/document location
  const basePath = window.location.href.split('#')[0].split('?')[0];

  return `<!DOCTYPE html>
<html>
  <head>
    <title>${title}</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <base href="${basePath}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    ${headLinks}
    <style>
      ${allCssRules}
    </style>
    <style>
      * {
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      @page {
        ${pageSizeCss}
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #0f172a;
        font-size: ${layout === 'A5' ? '10px' : '11px'};
        line-height: 1.35;
      }
      #print-root {
        width: 100% !important;
        margin: 0 auto !important;
        padding: 0 !important;
        background: #ffffff !important;
      }
      .invoice-canvas {
        box-shadow: none !important;
        border: none !important;
        margin: 0 auto !important;
        width: 100% !important;
        max-width: 100% !important;
        padding: 0 !important;
        display: block !important;
      }
      .thermal-invoice {
        width: 80mm !important;
        max-width: 80mm !important;
        margin: 0 auto !important;
        padding: 4px !important;
        font-family: 'Courier New', Courier, monospace !important;
      }
      table {
        border-collapse: collapse !important;
        width: 100% !important;
      }
      tr, td, th {
        page-break-inside: avoid !important;
      }
      .grid {
        page-break-inside: avoid !important;
      }
    </style>
  </head>
  <body>
    <div id="print-root">${contentHtml}</div>
  </body>
</html>`;
}

export function printInvoiceElement(elementRef, title = 'Tax Invoice', layout = 'A4') {
  if (!elementRef || !elementRef.current) {
    window.print();
    return;
  }

  const printContent = elementRef.current.innerHTML;

  // Remove any previous print iframes
  const existingIframe = document.getElementById('print-iframe-holder');
  if (existingIframe) {
    existingIframe.remove();
  }

  // Create an isolated hidden iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'print-iframe-holder';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const pri = iframe.contentWindow;
  const fullHtml = buildInvoiceFullHtml(printContent, title, layout);

  pri.document.open();
  pri.document.write(fullHtml);
  pri.document.close();

  // Allow styles, fonts, and images (logos/QR) to load before triggering print
  setTimeout(() => {
    pri.focus();
    pri.print();
    setTimeout(() => {
      try {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      } catch (e) {
        // cleanup ignore
      }
    }, 2500);
  }, 450);
}

export async function downloadInvoicePDF(elementRef, invoiceNumber = 'Receipt', layout = 'A4') {
  if (!elementRef || !elementRef.current) {
    throw new Error('Invoice preview element not found.');
  }

  const fullHtml = buildInvoiceFullHtml(
    elementRef.current.innerHTML,
    `Invoice-${invoiceNumber}`,
    layout
  );

  // 1. If running in Electron, use native vector printToPDF for 100% fidelity
  let electron = null;
  if (typeof window !== 'undefined' && window.require) {
    try {
      electron = window.require('electron');
    } catch (e) {
      // ignore
    }
  }

  if (electron && electron.ipcRenderer) {
    const res = await electron.ipcRenderer.invoke('save-invoice-pdf', {
      html: fullHtml,
      filename: `Invoice-${invoiceNumber}`,
      layout,
    });
    if (res && res.error) {
      throw new Error(res.error);
    }
    return res;
  }

  // 2. Browser fallback: trigger native browser print styled specifically for Save as PDF
  printInvoiceElement(elementRef, `Invoice-${invoiceNumber}`, layout);
  return { success: true };
}
