import React from 'react';
import { numberToWordsIndian } from '../utils/numberToWords';
import { MapPin, Phone, Mail, Globe } from 'lucide-react';

export const THEME_PALETTES = {
  navy: {
    primary: '#0f2744',
    secondary: '#1e3a5f',
    accent: '#0284c7',
    border: '#94a3b8',
    tableHeader: '#0f2744',
    lightBg: '#f8fafc',
  },
  indigo: {
    primary: '#312e81',
    secondary: '#3730a3',
    accent: '#4f46e5',
    border: '#a5b4fc',
    tableHeader: '#312e81',
    lightBg: '#eef2ff',
  },
  emerald: {
    primary: '#064e3b',
    secondary: '#065f46',
    accent: '#059669',
    border: '#86efac',
    tableHeader: '#064e3b',
    lightBg: '#f0fdf4',
  },
  crimson: {
    primary: '#881337',
    secondary: '#9f1239',
    accent: '#e11d48',
    border: '#fca5a5',
    tableHeader: '#881337',
    lightBg: '#fff1f2',
  },
  slate: {
    primary: '#1e293b',
    secondary: '#334155',
    accent: '#475569',
    border: '#cbd5e1',
    tableHeader: '#1e293b',
    lightBg: '#f8fafc',
  },
  monochrome: {
    primary: '#000000',
    secondary: '#27272a',
    accent: '#3f3f46',
    border: '#a1a1aa',
    tableHeader: '#18181b',
    lightBg: '#fafafa',
  },
};

const InvoiceTemplate = ({
  invoice,
  settings,
  layout = 'A4', // 'A4' | 'A5' | 'thermal'
  theme = 'navy',
  previewMode = false,
  customRef = null,
}) => {
  if (!invoice) return null;

  const invSet = settings?.invoiceSettings || {};
  const activeTheme = THEME_PALETTES[invSet.themeColor || theme] || THEME_PALETTES.navy;

  // Company Brand Data
  const brandName = invSet.brandName || settings?.storeName || 'PRO BILLING SOLUTIONS';
  const tagline = invSet.tagline || settings?.storeTagline || 'Complete Retail & Wholesale Solutions';
  const logo = invSet.logo || null;
  const address = invSet.address || settings?.storeAddress || 'Main Market, City Center, India';
  const phone = invSet.phone || settings?.storePhone || '+91 98765 43210';
  const altPhone = invSet.altPhone || '';
  const email = (settings?.storeEmail && settings.storeEmail !== 'contact@business.com')
    ? settings.storeEmail
    : (invSet.email || settings?.storeEmail || 'contact@business.com');
  const website = invSet.website || 'www.business.com';
  const gstin = invSet.gstin || settings?.storeGst || '27AAAAA1111A1Z1';
  const pan = invSet.pan || '';
  const stateName = invSet.stateName || 'Uttar Pradesh';
  const stateCode = invSet.stateCode || '09';

  // Bank & UPI Data
  const bank = invSet.bankDetails || {};
  const upiId = bank.upiId || '';
  const upiQrImage = bank.upiQrImage || '';

  // Options & Toggles
  const cols = invSet.showColumns || {
    sno: true,
    hsn: true,
    unit: true,
    rate: true,
    discount: true,
    taxable: true,
    gstRate: true,
    gstBreakup: true,
    total: true,
  };

  const invoiceTitle = invSet.invoiceTitle !== undefined ? invSet.invoiceTitle : 'TAX INVOICE';
  const headerLeftText = invSet.headerLeftText !== undefined ? invSet.headerLeftText : 'GST INVOICE';
  const headerRightText = invSet.headerRightText !== undefined ? invSet.headerRightText : 'ORIGINAL FOR RECIPIENT';
  const termsText = invSet.terms || '1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged after due date.\n3. Subject to local jurisdiction only.';
  const footerNote = invSet.footerNote || 'Thank you for your business! Visit Again.';
  const showSignatory = invSet.showSignatory !== false;
  const signatoryLabel = invSet.signatoryLabel || 'Authorized Signatory';
  const showGstSummary = invSet.showGstSummary !== false;
  const gstSectionTitle = invSet.gstSectionTitle || 'GST TAX SLABS SUMMARY:';

  // Invoice Data
  const items = invoice.items || [];
  const subTotal = invoice.subTotal || 0;
  const totalDiscount = invoice.totalDiscount || 0;
  const totalGst = invoice.totalGst || 0;
  const grandTotal = invoice.grandTotal || 0;
  const paidAmount = invoice.paidAmount || 0;
  const balanceAmount = invoice.balanceAmount || 0;
  const invoiceNumber = invoice.invoiceNumber || 'INV-20261022-0001';
  const invoiceDate = invoice.createdAt ? new Date(invoice.createdAt) : new Date();
  const customer = invoice.customer || { name: 'Sharma Electronics & Retailers', phone: '+91 98765 01234' };
  const paymentMethod = invoice.paymentMethod || 'UPI / CASH';
  const status = invoice.status || 'PAID';

  const grandTotalWords = numberToWordsIndian(grandTotal);

  // Group GST by rates for GST Breakdown table
  const gstBreakdown = {};
  items.forEach((item) => {
    const rate = item.gstPercentage || 0;
    const gross = (item.unitPrice || 0) * (item.quantity || 1);
    const discAmt = item.discountAmount !== undefined ? item.discountAmount : (gross * (item.discountPercentage || 0)) / 100;
    const taxable = item.taxableAmount !== undefined ? item.taxableAmount : (gross - discAmt);
    const cgst = item.cgst || (item.igst ? 0 : (item.gstAmt ? item.gstAmt / 2 : (taxable * rate) / 200));
    const sgst = item.sgst || (item.igst ? 0 : (item.gstAmt ? item.gstAmt / 2 : (taxable * rate) / 200));
    const igst = item.igst || 0;
    const taxAmt = cgst + sgst + igst;

    if (!gstBreakdown[rate]) {
      gstBreakdown[rate] = { rate, taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
    }
    gstBreakdown[rate].taxable += taxable;
    gstBreakdown[rate].cgst += cgst;
    gstBreakdown[rate].sgst += sgst;
    gstBreakdown[rate].igst += igst;
    gstBreakdown[rate].totalTax += taxAmt;
  });

  const totalQuantity = items.reduce((sum, it) => sum + (it.quantity || 0), 0);

  // =========================================================================
  // THERMAL 80mm RECEIPT LAYOUT
  // =========================================================================
  if (layout === 'thermal') {
    return (
      <div
        ref={customRef}
        className="thermal-invoice font-mono text-[11px] leading-tight text-slate-900 bg-white p-2.5 max-w-[300px] mx-auto select-none"
        style={{ width: '80mm' }}
      >
        <div className="text-center pb-2 border-b border-dashed border-slate-400">
          <h1 className="font-extrabold text-sm uppercase tracking-tight">{brandName}</h1>
          {tagline && <p className="text-[9px] text-slate-600">{tagline}</p>}
          <p className="text-[9px] mt-0.5">{address}</p>
          <p className="text-[9px]">Ph: {phone} {altPhone ? `| ${altPhone}` : ''}</p>
          {gstin && <p className="text-[9px] font-bold">GSTIN: {gstin}</p>}
        </div>

        <div className="py-1.5 border-b border-dashed border-slate-400 text-[9px] space-y-0.5">
          <div className="flex justify-between font-bold">
            <span>BILL: #{invoiceNumber}</span>
            <span>{invoiceDate.toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span>CUST: {customer.name}</span>
            <span>Ph: {customer.phone}</span>
          </div>
          {customer.gstNumber && <div>GST: {customer.gstNumber}</div>}
          <div className="flex justify-between text-slate-600">
            <span>Pay: {paymentMethod}</span>
            <span className="font-bold uppercase">[{status}]</span>
          </div>
        </div>

        <table className="w-full my-1.5 text-[9px]">
          <thead>
            <tr className="border-b border-dashed border-slate-400 font-bold text-left">
              <th className="py-1">ITEM</th>
              <th className="py-1 text-center">QTY</th>
              <th className="py-1 text-right">RATE</th>
              <th className="py-1 text-right">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-slate-200">
                <td className="py-1 pr-1 font-semibold">
                  {item.name}
                  {item.hsnCode && <span className="block text-[8px] text-slate-500 font-normal">HSN: {item.hsnCode}</span>}
                </td>
                <td className="py-1 text-center">{item.quantity}</td>
                <td className="py-1 text-right">₹{item.unitPrice?.toFixed(0)}</td>
                <td className="py-1 text-right font-bold">₹{item.total?.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-dashed border-slate-400 pt-1.5 space-y-0.5 text-[10px]">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₹{subTotal.toFixed(2)}</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between text-rose-600">
              <span>Discount:</span>
              <span>-₹{totalDiscount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>GST Tax:</span>
            <span>₹{totalGst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-xs border-t border-dashed border-slate-400 pt-1">
            <span>GRAND TOTAL:</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Paid:</span>
            <span>₹{paidAmount.toFixed(2)}</span>
          </div>
          {balanceAmount > 0 && (
            <div className="flex justify-between font-bold text-rose-600">
              <span>Due:</span>
              <span>₹{balanceAmount.toFixed(2)}</span>
            </div>
          )}
        </div>

        {(upiQrImage || upiId) && (
          <div className="text-center my-2 border-t border-dashed border-slate-400 pt-1.5">
            <p className="text-[8px] font-bold uppercase mb-1">Scan & Pay via UPI</p>
            {upiQrImage ? (
              <img src={upiQrImage} alt="UPI QR" className="w-20 h-20 mx-auto object-contain" />
            ) : (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=${encodeURIComponent(brandName)}&am=${grandTotal}&cu=INR`)}`}
                alt="UPI QR"
                className="w-20 h-20 mx-auto object-contain border border-slate-200"
              />
            )}
            <p className="text-[8px] font-mono mt-0.5">{upiId}</p>
          </div>
        )}

        <div className="text-center text-[8px] border-t border-dashed border-slate-400 pt-1.5 mt-1.5 text-slate-600">
          <p className="font-semibold text-slate-800">{footerNote}</p>
          <p className="text-[7px]">PRO Billing Software</p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STANDARD GST TAX INVOICE (A4 / A5)
  // Perfectly aligned, fully boxed, zero horizontal overflow/clipping
  // =========================================================================
  return (
    <div
      ref={customRef}
      className={`invoice-canvas bg-white text-slate-900 border border-slate-300 shadow-lg print:shadow-none print:border-none print:m-0 mx-auto select-none ${
        layout === 'A5' ? 'w-full max-w-[620px] p-4 text-[10px]' : 'w-full max-w-[780px] p-5 text-[11px]'
      }`}
      style={{
        color: '#0f172a',
        backgroundColor: '#ffffff',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* 1. TOP HEADER TITLE BAR */}
      <div
        className="text-white text-center py-1.5 px-4 rounded-t-sm flex items-center justify-between"
        style={{ backgroundColor: activeTheme.primary }}
      >
        <span className="text-[9px] tracking-widest uppercase font-semibold text-slate-200">
          {headerLeftText}
        </span>
        <h1 className="text-sm font-black uppercase tracking-widest">
          {invoiceTitle}
        </h1>
        <span className="text-[9px] tracking-widest uppercase font-semibold text-slate-200">
          {headerRightText}
        </span>
      </div>

      {/* 2. COMPANY DETAILS & INVOICE META GRID (Clean 2-Column Box) */}
      <div className="grid grid-cols-12 border-x border-b border-slate-300 bg-white">
        {/* Left Side: Seller / Company Details (7 Cols) */}
        <div className="col-span-7 p-3 border-r border-slate-300 space-y-1">
          <div className="flex items-start gap-2.5">
            {logo && (
              <img
                src={logo}
                alt="Logo"
                style={{ maxHeight: '48px', maxWidth: '100px', width: 'auto', height: 'auto', objectFit: 'contain' }}
                className="max-h-12 max-w-[90px] object-contain shrink-0 rounded"
              />
            )}
            <div>
              {/* BADA BRAND NAME */}
              <h2
                className="text-lg md:text-xl font-black uppercase tracking-tight leading-tight"
                style={{ color: activeTheme.primary }}
              >
                {brandName}
              </h2>
              {tagline && (
                <p className="text-[10px] font-semibold text-slate-600">
                  {tagline}
                </p>
              )}
            </div>
          </div>

          <div className="text-[10px] leading-snug text-slate-600 pt-1 space-y-0.5">
            <p className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
              <span>{address}</span>
            </p>
            <p className="flex items-center gap-1">
              <Phone className="h-3 w-3 text-slate-400 shrink-0" />
              <span>{phone} {altPhone ? `| ${altPhone}` : ''}</span>
              {email && <span className="ml-2">✉ {email}</span>}
            </p>
          </div>

          {/* GSTIN / State Row */}
          <div className="pt-1.5 border-t border-slate-200 flex flex-wrap gap-x-4 gap-y-0.5 text-[10px]">
            {gstin && (
              <span className="font-bold text-slate-900">
                GSTIN: <span className="font-mono text-slate-800">{gstin}</span>
              </span>
            )}
            {pan && <span>PAN: <strong>{pan}</strong></span>}
            <span>State: <strong>{stateName} ({stateCode})</strong></span>
          </div>
        </div>

        {/* Right Side: Invoice Number, Date & Payment Status (5 Cols) */}
        <div className="col-span-5 p-3 space-y-1 text-[10px] bg-slate-50/50 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex justify-between items-center pb-1 border-b border-slate-200">
              <span className="text-slate-500 font-semibold uppercase text-[9px]">Invoice No:</span>
              <span className="font-mono font-bold text-slate-900 text-xs">{invoiceNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Invoice Date:</span>
              <span className="font-semibold text-slate-800">
                {invoiceDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Payment Mode:</span>
              <span className="font-semibold text-slate-800">{paymentMethod}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Place of Supply:</span>
              <span className="font-medium text-slate-800">{customer.state || stateName} ({customer.stateCode || stateCode})</span>
            </div>
          </div>

          <div className="pt-1 border-t border-slate-200 flex justify-between items-center text-[9px]">
            <span className="text-slate-500">Payment Status:</span>
            <span className="px-2 py-0.5 rounded font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
              {status}
            </span>
          </div>
        </div>
      </div>

      {/* 3. BILLED TO (CUSTOMER DETAILS) FULL-WIDTH BOX */}
      <div className="border-x border-b border-slate-300 p-2.5 bg-slate-50 text-[10px] flex justify-between items-start gap-4">
        <div className="space-y-0.5">
          <span className="text-[9px] font-extrabold uppercase tracking-wider block" style={{ color: activeTheme.primary }}>
            Details of Receiver (Billed To):
          </span>
          <p className="font-bold text-slate-900 text-xs">{customer.name}</p>
          {customer.address && <p className="text-slate-600">{customer.address}</p>}
          <p className="text-slate-600">Phone: {customer.phone || 'N/A'}</p>
        </div>

        <div className="text-right space-y-0.5 shrink-0">
          {customer.gstNumber ? (
            <p className="font-bold text-slate-900">
              Buyer GSTIN: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300">{customer.gstNumber}</span>
            </p>
          ) : (
            <p className="text-slate-500 italic">Unregistered Consumer</p>
          )}
          <p className="text-slate-600">State: {customer.state || stateName} ({customer.stateCode || stateCode})</p>
        </div>
      </div>

      {/* 4. PRODUCT TABLE (GRID & COLUMN BREAKDOWN) */}
      <div className="border-x border-b border-slate-300 overflow-x-auto">
        <table className="w-full text-left text-[10px] border-collapse">
          <thead>
            <tr
              className="text-white uppercase font-bold text-[9px] tracking-wider"
              style={{ backgroundColor: activeTheme.tableHeader }}
            >
              {cols.sno && <th className="p-1.5 text-center border-r border-slate-400/40 w-7">#</th>}
              <th className="p-1.5 border-r border-slate-400/40">Item Description</th>
              {cols.hsn && <th className="p-1.5 text-center border-r border-slate-400/40 w-16">HSN</th>}
              <th className="p-1.5 text-center border-r border-slate-400/40 w-12">Qty</th>
              {cols.rate && <th className="p-1.5 text-right border-r border-slate-400/40 w-16">Rate (₹)</th>}
              {cols.discount && <th className="p-1.5 text-right border-r border-slate-400/40 w-14">Disc</th>}
              {cols.taxable && <th className="p-1.5 text-right border-r border-slate-400/40 w-18">Taxable (₹)</th>}
              {cols.gstRate && <th className="p-1.5 text-center border-r border-slate-400/40 w-12">GST %</th>}
              {cols.gstBreakup && <th className="p-1.5 text-right border-r border-slate-400/40 w-18">Tax (₹)</th>}
              {cols.total && <th className="p-1.5 text-right w-20">Total (₹)</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item, idx) => {
              const gross = (item.unitPrice || 0) * (item.quantity || 1);
              const discAmt = item.discountAmount !== undefined ? item.discountAmount : (gross * (item.discountPercentage || 0)) / 100;
              const taxable = item.taxableAmount !== undefined ? item.taxableAmount : (gross - discAmt);
              const gstRate = item.gstPercentage || 0;
              const cgst = item.cgst || (item.igst ? 0 : (item.gstAmt ? item.gstAmt / 2 : (taxable * gstRate) / 200));
              const sgst = item.sgst || (item.igst ? 0 : (item.gstAmt ? item.gstAmt / 2 : (taxable * gstRate) / 200));
              const igst = item.igst || 0;
              const totalTax = cgst + sgst + igst;
              const finalTotal = item.total !== undefined ? item.total : (taxable + totalTax);

              return (
                <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                  {cols.sno && <td className="p-1.5 text-center text-slate-500 border-r border-slate-200">{idx + 1}</td>}
                  <td className="p-1.5 border-r border-slate-200">
                    <span className="font-bold text-slate-900 block">{item.name}</span>
                    {item.sku && <span className="text-[8px] text-slate-500 font-mono">SKU: {item.sku}</span>}
                  </td>
                  {cols.hsn && (
                    <td className="p-1.5 text-center font-mono text-[9px] text-slate-600 border-r border-slate-200">
                      {item.hsnCode || '—'}
                    </td>
                  )}
                  <td className="p-1.5 text-center font-bold text-slate-800 border-r border-slate-200">
                    {item.quantity} {cols.unit ? <span className="text-[8px] font-normal text-slate-500">{item.unit || 'Pcs'}</span> : ''}
                  </td>
                  {cols.rate && <td className="p-1.5 text-right text-slate-700 border-r border-slate-200">₹{item.unitPrice?.toFixed(2)}</td>}
                  {cols.discount && (
                    <td className="p-1.5 text-right text-rose-600 border-r border-slate-200">
                      {discAmt > 0 ? `-₹${discAmt.toFixed(2)}` : '—'}
                    </td>
                  )}
                  {cols.taxable && <td className="p-1.5 text-right font-medium text-slate-800 border-r border-slate-200">₹{taxable.toFixed(2)}</td>}
                  {cols.gstRate && (
                    <td className="p-1.5 text-center font-semibold text-slate-700 border-r border-slate-200">
                      {gstRate}%
                    </td>
                  )}
                  {cols.gstBreakup && (
                    <td className="p-1.5 text-right font-mono text-[9px] text-slate-600 border-r border-slate-200">
                      ₹{totalTax.toFixed(2)}
                    </td>
                  )}
                  {cols.total && (
                    <td className="p-1.5 text-right font-bold text-slate-900">
                      ₹{finalTotal.toFixed(2)}
                    </td>
                  )}
                </tr>
              );
            })}

          </tbody>

          {/* Table Footer Total Qty Row */}
          <tfoot>
            <tr className="bg-slate-100 font-bold border-t border-slate-300 text-[10px]">
              {cols.sno && <td className="p-1.5 text-center border-r border-slate-200"></td>}
              <td className="p-1.5 border-r border-slate-200">Total Items: {items.length}</td>
              {cols.hsn && <td className="p-1.5 border-r border-slate-200"></td>}
              <td className="p-1.5 text-center border-r border-slate-200">{totalQuantity}</td>
              {cols.rate && <td className="p-1.5 border-r border-slate-200"></td>}
              {cols.discount && (
                <td className="p-1.5 text-right text-rose-600 border-r border-slate-200">
                  {totalDiscount > 0 ? `-₹${totalDiscount.toFixed(2)}` : ''}
                </td>
              )}
              {cols.taxable && <td className="p-1.5 text-right border-r border-slate-200">₹{subTotal.toFixed(2)}</td>}
              {cols.gstRate && <td className="p-1.5 border-r border-slate-200"></td>}
              {cols.gstBreakup && <td className="p-1.5 text-right border-r border-slate-200">₹{totalGst.toFixed(2)}</td>}
              {cols.total && <td className="p-1.5 text-right font-black">₹{grandTotal.toFixed(2)}</td>}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 5. TAX BREAKDOWN & SUMMARY ROW */}
      <div className="grid grid-cols-12 border-x border-b border-slate-300 bg-white">
        {/* Left Side: Tax Breakdown Table & In Words (7 Cols) */}
        <div className="col-span-7 p-2.5 border-r border-slate-300 space-y-2">
          {showGstSummary && Object.keys(gstBreakdown).length > 0 && (
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                {gstSectionTitle}
              </span>
              <table className="w-full text-left text-[9px] border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-1">Rate</th>
                    <th className="p-1 text-right">Taxable (₹)</th>
                    <th className="p-1 text-right">CGST (₹)</th>
                    <th className="p-1 text-right">SGST (₹)</th>
                    <th className="p-1 text-right">Total Tax (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {Object.values(gstBreakdown).map((b, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-1 font-sans font-bold">{b.rate}%</td>
                      <td className="p-1 text-right">₹{b.taxable.toFixed(2)}</td>
                      <td className="p-1 text-right">₹{b.cgst.toFixed(2)}</td>
                      <td className="p-1 text-right">₹{b.sgst.toFixed(2)}</td>
                      <td className="p-1 text-right font-bold text-slate-900">₹{b.totalTax.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="pt-1">
            <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">
              Invoice Amount in Words:
            </span>
            <p className="font-bold text-slate-900 italic text-[10px]">
              {grandTotalWords}
            </p>
          </div>
        </div>

        {/* Right Side: Totals Card (5 Cols) */}
        <div className="col-span-5 p-2.5 bg-slate-50/50 space-y-1 text-[10px]">
          <div className="flex justify-between text-slate-600">
            <span>Taxable Amount (Subtotal):</span>
            <span className="font-mono">₹{subTotal.toFixed(2)}</span>
          </div>

          {totalDiscount > 0 && (
            <div className="flex justify-between text-rose-600">
              <span>Total Discount:</span>
              <span className="font-mono">-₹{totalDiscount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-600">
            <span>Total GST Tax:</span>
            <span className="font-mono">₹{totalGst.toFixed(2)}</span>
          </div>

          <div
            className="flex justify-between items-center p-2 rounded text-white my-1"
            style={{ backgroundColor: activeTheme.primary }}
          >
            <span className="font-bold uppercase text-[10px]">Grand Total</span>
            <span className="font-mono font-black text-sm">₹{grandTotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-[9px] text-slate-500 pt-0.5">
            <span>Amount Paid:</span>
            <span className="font-mono font-bold text-emerald-600">₹{paidAmount.toFixed(2)}</span>
          </div>

          {balanceAmount > 0 && (
            <div className="flex justify-between text-[10px] font-bold text-rose-600 pt-0.5 border-t border-dashed border-slate-300">
              <span>Balance Due:</span>
              <span className="font-mono">₹{balanceAmount.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* 6. BANK DETAILS, TERMS & AUTHORIZED SIGNATORY (3 COLUMNS) */}
      <div className="grid grid-cols-12 border-x border-b border-slate-300 bg-white text-[9px] rounded-b-sm">
        {/* Bank & UPI QR (5 Cols) */}
        <div className="col-span-5 p-2.5 border-r border-slate-300 flex items-center gap-2.5">
          {(upiQrImage || upiId) && (
            <div className="shrink-0 text-center">
              {upiQrImage ? (
                <img src={upiQrImage} alt="QR" className="w-16 h-16 object-contain border border-slate-200 rounded p-0.5" />
              ) : (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=${encodeURIComponent(brandName)}&am=${grandTotal}&cu=INR`)}`}
                  alt="QR"
                  className="w-16 h-16 object-contain border border-slate-200 rounded p-0.5"
                />
              )}
              <span className="block text-[7px] text-slate-500 font-bold mt-0.5">Scan to Pay</span>
            </div>
          )}
          <div className="space-y-0.5 leading-snug">
            <span className="font-bold uppercase tracking-wider block" style={{ color: activeTheme.primary }}>
              Bank Payment Details:
            </span>
            {bank.bankName && <p><strong>Bank:</strong> {bank.bankName}</p>}
            {bank.accountNo && <p><strong>A/C:</strong> <span className="font-mono font-bold">{bank.accountNo}</span></p>}
            {bank.ifsc && <p><strong>IFSC:</strong> <span className="font-mono">{bank.ifsc}</span></p>}
            {upiId && <p><strong>UPI:</strong> <span className="font-mono text-emerald-700 font-bold">{upiId}</span></p>}
          </div>
        </div>

        {/* Terms & Conditions (4 Cols) */}
        <div className="col-span-4 p-2.5 border-r border-slate-300 text-slate-600 leading-snug space-y-0.5">
          <span className="font-bold uppercase tracking-wider text-slate-700 block">
            Terms & Conditions:
          </span>
          <p className="whitespace-pre-line text-[8px] text-slate-500">
            {termsText}
          </p>
        </div>

        {/* Authorized Signatory (3 Cols) */}
        <div className="col-span-3 p-2.5 flex flex-col justify-between items-center text-center bg-slate-50/40">
          <span className="text-[8px] font-bold uppercase text-slate-600">
            For {brandName}
          </span>
          <div className="h-8 flex items-center justify-center">
            <span className="text-[8px] text-slate-300 italic font-mono">[Signature & Stamp]</span>
          </div>
          <span className="text-[8px] font-bold border-t border-slate-300 w-full pt-0.5 text-slate-700">
            {signatoryLabel}
          </span>
        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="text-center pt-2 text-slate-400 text-[8px] flex justify-between items-center">
        <span>{footerNote}</span>
        <span>Computer Generated GST Tax Invoice</span>
      </div>
    </div>
  );
};

export default InvoiceTemplate;
