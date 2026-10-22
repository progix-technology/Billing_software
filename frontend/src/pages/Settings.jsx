import React, { useState, useEffect, useRef } from 'react';
import { api } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import InvoiceTemplate, { THEME_PALETTES } from '../components/InvoiceTemplate';
import { printInvoiceElement } from '../utils/printHelper';
import {
  Settings,
  Download,
  Upload,
  Store,
  Database,
  CheckCircle,
  AlertCircle,
  Key,
  Copy,
  Check,
  PhoneCall,
  Calendar,
  FileText,
  Printer,
  Palette,
  QrCode,
  Building,
  Sliders,
  Sparkles,
  Eye,
  Trash2,
  RefreshCw,
  Percent,
} from 'lucide-react';

const createSampleInvoice = (rates = [18, 12, 18]) => {
  const baseItems = [
    {
      name: 'Wireless Bluetooth 2D Barcode Scanner',
      sku: 'SCN-8801',
      hsnCode: '8471',
      unit: 'Pcs',
      quantity: 2,
      unitPrice: 2499.0,
      discountPercentage: 5,
      discountAmount: 249.9,
      taxableAmount: 4748.1,
    },
    {
      name: 'High Quality Thermal Paper Roll (80mm)',
      sku: 'ROL-80MM',
      hsnCode: '4802',
      unit: 'Box',
      quantity: 5,
      unitPrice: 450.0,
      discountPercentage: 0,
      discountAmount: 0,
      taxableAmount: 2250.0,
    },
    {
      name: 'Heavy Duty Thermal POS Receipt Printer',
      sku: 'PRN-POS90',
      hsnCode: '8443',
      unit: 'Pcs',
      quantity: 1,
      unitPrice: 6500.0,
      discountPercentage: 10,
      discountAmount: 650.0,
      taxableAmount: 5850.0,
    },
  ];

  let subTotal = 0;
  let totalDiscount = 0;
  let totalGst = 0;

  const items = baseItems.map((item, idx) => {
    const rate = Number(rates[idx] !== undefined ? rates[idx] : 18);
    const taxAmt = (item.taxableAmount * rate) / 100;
    const cgst = taxAmt / 2;
    const sgst = taxAmt / 2;
    const total = item.taxableAmount + taxAmt;

    subTotal += item.taxableAmount;
    totalDiscount += item.discountAmount;
    totalGst += taxAmt;

    return {
      ...item,
      gstPercentage: rate,
      cgst,
      sgst,
      igst: 0,
      total,
    };
  });

  const grandTotal = subTotal + totalGst;

  return {
    invoiceNumber: 'INV-20261022-0001',
    createdAt: new Date().toISOString(),
    paymentMethod: 'UPI / CASH',
    status: 'PAID',
    customer: {
      name: 'Sharma Electronics & Retailers',
      phone: '+91 98765 01234',
      address: 'Shop #14, Main Commercial Complex, Lucknow',
      gstNumber: '09AAACH7409R1ZZ',
      state: 'Uttar Pradesh',
      stateCode: '09',
    },
    items,
    subTotal,
    totalDiscount,
    totalGst,
    grandTotal,
    paidAmount: grandTotal,
    balanceAmount: 0,
    remarks: 'Goods supplied with 1-Year replacement warranty.',
  };
};

const SettingsPage = () => {
  const { settings, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('invoice'); // 'invoice' | 'store' | 'license' | 'backup'

  // General Store Profile States
  const [storeName, setStoreName] = useState('PRO BILLING SOLUTIONS');
  const [storeGst, setStoreGst] = useState('27AAAAA1111A1Z1');
  const [storeAddress, setStoreAddress] = useState('Main Market, City Center, India');
  const [storePhone, setStorePhone] = useState('+91 98765 43210');
  const [storeEmail, setStoreEmail] = useState('info@probilling.com');
  const [storeTagline, setStoreTagline] = useState('Wholesale & Retail Distributors');
  const [gstSlabsInput, setGstSlabsInput] = useState('0, 5, 12, 18, 28');
  const [dashboardBanner, setDashboardBanner] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');

  // Invoice Customizer States
  const [invBrandName, setInvBrandName] = useState('PRO BILLING SOLUTIONS');
  const [invTagline, setInvTagline] = useState('Complete Retail & Wholesale Solutions');
  const [invLogo, setInvLogo] = useState('');
  const [invAddress, setInvAddress] = useState('Main Market, City Center, India');
  const [invPhone, setInvPhone] = useState('+91 98765 43210');
  const [invAltPhone, setInvAltPhone] = useState('');
  const [invEmail, setInvEmail] = useState('contact@business.com');
  const [invWebsite, setInvWebsite] = useState('www.business.com');
  const [invGstin, setInvGstin] = useState('27AAAAA1111A1Z1');
  const [invPan, setInvPan] = useState('');
  const [invStateName, setInvStateName] = useState('Uttar Pradesh');
  const [invStateCode, setInvStateCode] = useState('09');
  const [invTitle, setInvTitle] = useState('TAX INVOICE');
  const [headerLeftText, setHeaderLeftText] = useState('GST INVOICE');
  const [headerRightText, setHeaderRightText] = useState('ORIGINAL FOR RECIPIENT');
  const [invTheme, setInvTheme] = useState('navy');
  const [invLayout, setInvLayout] = useState('A4'); // 'A4' | 'A5' | 'thermal'

  // Column Toggles
  const [colSno, setColSno] = useState(true);
  const [colHsn, setColHsn] = useState(true);
  const [colUnit, setColUnit] = useState(true);
  const [colRate, setColRate] = useState(true);
  const [colDiscount, setColDiscount] = useState(true);
  const [colTaxable, setColTaxable] = useState(true);
  const [colGstRate, setColGstRate] = useState(true);
  const [colGstBreakup, setColGstBreakup] = useState(true);
  const [colTotal, setColTotal] = useState(true);

  // Bank & UPI Details
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [holderName, setHolderName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [upiQrImage, setUpiQrImage] = useState('');

  // Terms & Footer
  const [terms, setTerms] = useState(
    '1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged after due date.\n3. Subject to local jurisdiction only.'
  );
  const [footerNote, setFooterNote] = useState('Thank you for your business! Visit Again.');
  const [showSignatory, setShowSignatory] = useState(true);
  const [signatoryLabel, setSignatoryLabel] = useState('Authorized Signatory');

  // GST Tax Slabs & Table Customization States
  const [showGstSummary, setShowGstSummary] = useState(true);
  const [gstSectionTitle, setGstSectionTitle] = useState('GST TAX SLABS SUMMARY:');
  const [sampleItemsGst, setSampleItemsGst] = useState([18, 12, 18]);

  // UI status
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [previewLayout, setPreviewLayout] = useState('A4'); // for live preview toggle
  const printPreviewRef = useRef(null);

  // Offline License States
  const [licenseStatus, setLicenseStatus] = useState(null);
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [licenseMessage, setLicenseMessage] = useState({ type: '', text: '' });
  const [copiedMachineId, setCopiedMachineId] = useState(false);

  const fetchLicense = async () => {
    try {
      const res = await api.get('/api/license/status');
      if (res.data.success) {
        setLicenseStatus(res.data);
      }
    } catch (err) {
      console.error('Failed to load license status', err);
    }
  };

  useEffect(() => {
    fetchLicense();
    if (settings) {
      if (settings.storeName) setStoreName(settings.storeName);
      if (settings.storeGst) setStoreGst(settings.storeGst);
      if (settings.storeAddress) setStoreAddress(settings.storeAddress);
      if (settings.storePhone) setStorePhone(settings.storePhone);
      if (settings.storeEmail) setStoreEmail(settings.storeEmail);
      if (settings.storeTagline) setStoreTagline(settings.storeTagline);
      if (settings.gstSlabs && Array.isArray(settings.gstSlabs)) {
        setGstSlabsInput(settings.gstSlabs.join(', '));
      }
      if (settings.dashboardBanner) {
        setDashboardBanner(settings.dashboardBanner);
        setBannerPreview(settings.dashboardBanner);
      }

      // Populate Invoice Customizer from stored settings
      const inv = settings.invoiceSettings || {};
      if (inv.brandName || settings.storeName) setInvBrandName(inv.brandName || settings.storeName);
      if (inv.tagline || settings.storeTagline) setInvTagline(inv.tagline || settings.storeTagline);
      if (inv.logo) setInvLogo(inv.logo);
      if (inv.address || settings.storeAddress) setInvAddress(inv.address || settings.storeAddress);
      if (inv.phone || settings.storePhone) setInvPhone(inv.phone || settings.storePhone);
      if (inv.altPhone) setInvAltPhone(inv.altPhone);
      if (inv.email || settings.storeEmail) setInvEmail(inv.email || settings.storeEmail);
      if (inv.website) setInvWebsite(inv.website);
      if (inv.gstin || settings.storeGst) setInvGstin(inv.gstin || settings.storeGst);
      if (inv.pan) setInvPan(inv.pan);
      if (inv.stateName) setInvStateName(inv.stateName);
      if (inv.stateCode) setInvStateCode(inv.stateCode);
      if (inv.invoiceTitle !== undefined) setInvTitle(inv.invoiceTitle);
      if (inv.headerLeftText !== undefined) setHeaderLeftText(inv.headerLeftText);
      if (inv.headerRightText !== undefined) setHeaderRightText(inv.headerRightText);
      if (inv.themeColor) setInvTheme(inv.themeColor);
      if (inv.paperSize) {
        setInvLayout(inv.paperSize);
        setPreviewLayout(inv.paperSize);
      }

      if (inv.showColumns) {
        setColSno(inv.showColumns.sno !== false);
        setColHsn(inv.showColumns.hsn !== false);
        setColUnit(inv.showColumns.unit !== false);
        setColRate(inv.showColumns.rate !== false);
        setColDiscount(inv.showColumns.discount !== false);
        setColTaxable(inv.showColumns.taxable !== false);
        setColGstRate(inv.showColumns.gstRate !== false);
        setColGstBreakup(inv.showColumns.gstBreakup !== false);
        setColTotal(inv.showColumns.total !== false);
      }

      if (inv.bankDetails) {
        setBankName(inv.bankDetails.bankName || '');
        setAccountNo(inv.bankDetails.accountNo || '');
        setIfsc(inv.bankDetails.ifsc || '');
        setHolderName(inv.bankDetails.holderName || '');
        setUpiId(inv.bankDetails.upiId || '');
        setUpiQrImage(inv.bankDetails.upiQrImage || '');
      }

      if (inv.terms) setTerms(inv.terms);
      if (inv.footerNote) setFooterNote(inv.footerNote);
      if (inv.showSignatory !== undefined) setShowSignatory(inv.showSignatory);
      if (inv.signatoryLabel) setSignatoryLabel(inv.signatoryLabel);
      if (inv.showGstSummary !== undefined) setShowGstSummary(inv.showGstSummary);
      if (inv.gstSectionTitle !== undefined) setGstSectionTitle(inv.gstSectionTitle);
    }
  }, [settings]);

  // Construct current live configuration object for real-time preview
  const currentInvoiceSettings = {
    brandName: invBrandName,
    tagline: invTagline,
    logo: invLogo,
    address: invAddress,
    phone: invPhone,
    altPhone: invAltPhone,
    email: invEmail,
    website: invWebsite,
    gstin: invGstin,
    pan: invPan,
    stateName: invStateName,
    stateCode: invStateCode,
    invoiceTitle: invTitle,
    headerLeftText: headerLeftText,
    headerRightText: headerRightText,
    themeColor: invTheme,
    paperSize: invLayout,
    showColumns: {
      sno: colSno,
      hsn: colHsn,
      unit: colUnit,
      rate: colRate,
      discount: colDiscount,
      taxable: colTaxable,
      gstRate: colGstRate,
      gstBreakup: colGstBreakup,
      total: colTotal,
    },
    showGstSummary,
    gstSectionTitle,
    bankDetails: {
      bankName,
      accountNo,
      ifsc,
      holderName,
      upiId,
      upiQrImage,
    },
    terms,
    footerNote,
    showSignatory,
    signatoryLabel,
  };

  // Handle Logo Upload (Base64 offline storage)
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setError('Logo size should be less than 3MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setInvLogo(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle UPI QR Sticker Upload (Base64 offline storage)
  const handleQrUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('QR image size should be less than 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setUpiQrImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Save Invoice Customizer Settings
  const handleSaveInvoiceSettings = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      const gstSlabs = gstSlabsInput
        ? gstSlabsInput.split(',').map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n))
        : [0, 5, 12, 18, 28];

      const res = await api.post('/api/settings', {
        storeName: invBrandName || storeName,
        storeGst: invGstin || storeGst,
        storeAddress: invAddress || storeAddress,
        storePhone: invPhone || storePhone,
        storeEmail: invEmail || storeEmail,
        storeTagline: invTagline || storeTagline,
        gstSlabs,
        invoiceSettings: currentInvoiceSettings,
      });

      if (res.data.success) {
        setSuccess('🎉 Invoice Template & Brand Settings saved successfully!');
        if (res.data.settings) {
          updateSettings(res.data.settings);
        }
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save invoice settings.');
    } finally {
      setLoading(false);
    }
  };

  // Test Print invoice preview
  const handleTestPrint = () => {
    printInvoiceElement(printPreviewRef, `Sample-${invTitle}`, previewLayout);
  };

  // Save Store Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      const gstSlabs = gstSlabsInput
        .split(',')
        .map((s) => parseFloat(s.trim()))
        .filter((n) => !isNaN(n));

      const res = await api.post('/api/settings', {
        storeName,
        storeGst,
        storeAddress,
        storePhone,
        storeEmail,
        storeTagline,
        dashboardBanner,
        gstSlabs,
        invoiceSettings: {
          ...(settings?.invoiceSettings || {}),
          email: storeEmail,
          address: storeAddress,
          phone: storePhone,
          brandName: storeName,
          gstin: storeGst,
          tagline: storeTagline,
        }
      });
      if (res.data.success) {
        setSuccess('Store profile successfully saved!');
        if (res.data.settings) {
          updateSettings(res.data.settings);
        }
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save store profile.');
    } finally {
      setLoading(false);
    }
  };

  // Image change for dashboard banner
  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setError('Banner file too large (Max 8MB).');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setDashboardBanner(reader.result);
      setBannerPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Backup & Restore
  const handleDownloadBackup = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/backup/export', { responseType: 'blob' });
      const file = new Blob([response.data], { type: 'application/json' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `probilling-offline-backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccess('Full offline database backup successfully downloaded!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Database backup export failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadRestore = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!window.confirm('WARNING: Restoring will overwrite all current data. Continue?')) {
      e.target.value = null;
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    const formData = new FormData();
    formData.append('backupFile', file);
    try {
      const res = await api.post('/api/backup/restore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setSuccess('Database successfully restored! Reloading...');
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Database restore failed.');
    } finally {
      setLoading(false);
      e.target.value = null;
    }
  };

  // License Activation
  const handleActivateLicense = async (e) => {
    e.preventDefault();
    if (!licenseKeyInput.trim()) return;
    setLicenseLoading(true);
    setLicenseMessage({ type: '', text: '' });
    try {
      const res = await api.post('/api/license/activate', { licenseKey: licenseKeyInput.trim() });
      if (res.data.success) {
        const planText = res.data.planName || 'Active';
        setLicenseMessage({
          type: 'success',
          text: res.data.message || `License successfully activated! Plan: ${planText}`,
        });
        setLicenseKeyInput('');
        fetchLicense();
      }
    } catch (err) {
      setLicenseMessage({
        type: 'error',
        text: err.response?.data?.message || 'Invalid or expired license key.',
      });
    } finally {
      setLicenseLoading(false);
    }
  };

  const handleCopyMachineId = () => {
    if (licenseStatus?.machineId) {
      navigator.clipboard.writeText(licenseStatus.machineId);
      setCopiedMachineId(true);
      setTimeout(() => setCopiedMachineId(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="p-2 bg-primary-600/10 text-primary-600 rounded-xl">
              <FileText className="h-6 w-6" />
            </span>
            Invoice Customizer & System Settings
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Design your professional branded invoices, GST columns, bank QR payments, and system configurations.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl gap-1 border border-slate-200 dark:border-slate-800 self-start md:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('invoice')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'invoice'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Invoice Designer & Format
          </button>
          <button
            onClick={() => setActiveTab('store')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'store'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <Store className="h-3.5 w-3.5" />
            Store Profile
          </button>
          <button
            onClick={() => setActiveTab('license')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'license'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <Key className="h-3.5 w-3.5" />
            Subscription & License
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'backup'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <Database className="h-3.5 w-3.5" />
            Backup & Recovery
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center gap-3 text-xs md:text-sm font-semibold animate-fade-in shadow-sm">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center gap-3 text-xs md:text-sm font-semibold animate-fade-in shadow-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: INVOICE DESIGNER & LIVE INTERACTIVE PREVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'invoice' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form: Customizer Controls (7 Cols on LG) */}
          <div className="lg:col-span-6 space-y-6">
            <form onSubmit={handleSaveInvoiceSettings} className="space-y-6">
              {/* Card 1: Brand & Header Details */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Building className="h-4 w-4 text-primary-500" />
                    Company & Brand Header
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 bg-primary-50 dark:bg-primary-950/50 px-2 py-0.5 rounded">
                    Invoice Top Header
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Business / Brand Name <span className="text-rose-500">* (Prints Large at Top)</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={invBrandName}
                      onChange={(e) => setInvBrandName(e.target.value)}
                      placeholder="e.g. MISHRA TRADING & ELECTRICALS"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Tagline / Business Category
                    </label>
                    <input
                      type="text"
                      value={invTagline}
                      onChange={(e) => setInvTagline(e.target.value)}
                      placeholder="e.g. Wholesale Distributors & Govt Contractors"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Logo Upload */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Company Brand Logo (Optional)
                    </label>
                    <div className="flex items-center gap-3">
                      {invLogo ? (
                        <div className="relative border border-slate-200 dark:border-slate-700 rounded-xl p-1 bg-white">
                          <img src={invLogo} alt="Logo" className="h-10 w-24 object-contain" />
                          <button
                            type="button"
                            onClick={() => setInvLogo('')}
                            className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ) : null}
                      <label className="cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
                        <Upload className="h-3.5 w-3.5" />
                        Upload Logo
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                      <span className="text-[10px] text-slate-400">PNG/JPG up to 3MB</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Complete Store / Office Address
                    </label>
                    <textarea
                      rows={2}
                      value={invAddress}
                      onChange={(e) => {
                        setInvAddress(e.target.value);
                        setStoreAddress(e.target.value);
                      }}
                      placeholder="Shop #, Market Road, Near Landmark, City, State, PIN"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                        Phone / Mobile No.
                      </label>
                      <input
                        type="text"
                        value={invPhone}
                        onChange={(e) => setInvPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                        Alternate Phone
                      </label>
                      <input
                        type="text"
                        value={invAltPhone}
                        onChange={(e) => setInvAltPhone(e.target.value)}
                        placeholder="Optional second number"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                        Store / Official Email
                      </label>
                      <input
                        type="email"
                        value={invEmail}
                        onChange={(e) => {
                          setInvEmail(e.target.value);
                          setStoreEmail(e.target.value);
                        }}
                        placeholder="contact@business.com"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                        Website (Optional)
                      </label>
                      <input
                        type="text"
                        value={invWebsite}
                        onChange={(e) => setInvWebsite(e.target.value)}
                        placeholder="www.business.com"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                        Company GSTIN Code
                      </label>
                      <input
                        type="text"
                        value={invGstin}
                        onChange={(e) => setInvGstin(e.target.value.toUpperCase())}
                        placeholder="27AAAAA1111A1Z1"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                        State & Code
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={invStateName}
                          onChange={(e) => setInvStateName(e.target.value)}
                          placeholder="e.g. Uttar Pradesh"
                          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                        />
                        <input
                          type="text"
                          value={invStateCode}
                          onChange={(e) => setInvStateCode(e.target.value)}
                          placeholder="09"
                          className="w-14 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 text-xs font-mono text-center text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Theme Colors & Document Options */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Palette className="h-4 w-4 text-primary-500" />
                    Color Palette & Invoice Format
                  </h3>
                  <span className="text-[10px] text-slate-400">Styling</span>
                </div>

                {/* Theme Selector */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">
                    Select Invoice Color Accent
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {Object.keys(THEME_PALETTES).map((thKey) => {
                      const th = THEME_PALETTES[thKey];
                      const isSelected = invTheme === thKey;
                      return (
                        <button
                          key={thKey}
                          type="button"
                          onClick={() => setInvTheme(thKey)}
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center ${isSelected
                              ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/40 shadow-sm'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                            }`}
                        >
                          <span
                            className="w-5 h-5 rounded-full border border-white shadow-sm flex items-center justify-center"
                            style={{ backgroundColor: th.primary }}
                          >
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </span>
                          <span className="text-[10px] font-bold uppercase text-slate-700 dark:text-slate-300">
                            {thKey}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Paper Size / Output
                    </label>
                    <select
                      value={invLayout}
                      onChange={(e) => {
                        setInvLayout(e.target.value);
                        setPreviewLayout(e.target.value);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
                    >
                      <option value="A4">Standard A4 Sheet (Full Detail)</option>
                      <option value="A5">Compact A5 Sheet (Half Sheet)</option>
                      <option value="thermal">Thermal 80mm POS Receipt</option>
                    </select>
                  </div>
                </div>

                {/* Top Strip Headings Editor */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                      Top Header Headings (Editable)
                    </label>
                    <span className="text-[10px] text-slate-400">Click a preset or customize directly</span>
                  </div>

                  {/* Presets */}
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    <button
                      type="button"
                      onClick={() => {
                        setHeaderLeftText('GST INVOICE');
                        setInvTitle('TAX INVOICE');
                        setHeaderRightText('ORIGINAL FOR RECIPIENT');
                      }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      Tax Invoice (Default)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHeaderLeftText('COMPOSITION DEALER');
                        setInvTitle('BILL OF SUPPLY');
                        setHeaderRightText('ORIGINAL FOR RECIPIENT');
                      }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      Bill of Supply
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHeaderLeftText('RETAIL SALE');
                        setInvTitle('CASH MEMO');
                        setHeaderRightText('CUSTOMER COPY');
                      }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      Cash Memo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHeaderLeftText('ESTIMATE');
                        setInvTitle('QUOTATION');
                        setHeaderRightText('NOT A TAX INVOICE');
                      }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      Estimate / Quotation
                    </button>
                  </div>

                  {/* 3 Editable Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                        Left Heading
                      </span>
                      <input
                        type="text"
                        value={headerLeftText}
                        onChange={(e) => setHeaderLeftText(e.target.value.toUpperCase())}
                        placeholder="GST INVOICE"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                        Center Main Title
                      </span>
                      <input
                        type="text"
                        value={invTitle}
                        onChange={(e) => setInvTitle(e.target.value.toUpperCase())}
                        placeholder="TAX INVOICE"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                        Right Heading (Copy)
                      </span>
                      <input
                        type="text"
                        value={headerRightText}
                        onChange={(e) => setHeaderRightText(e.target.value.toUpperCase())}
                        placeholder="ORIGINAL FOR RECIPIENT"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Column Display Toggles */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-primary-500" />
                    Product Columns Visibility
                  </h3>
                  <span className="text-[10px] text-slate-400">Toggle columns on printed bill</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs pt-1">
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={colSno}
                      onChange={(e) => setColSno(e.target.checked)}
                      className="rounded text-primary-600 focus:ring-0"
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200">S.No (#)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={colHsn}
                      onChange={(e) => setColHsn(e.target.checked)}
                      className="rounded text-primary-600 focus:ring-0"
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200">HSN/SAC Code</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={colUnit}
                      onChange={(e) => setColUnit(e.target.checked)}
                      className="rounded text-primary-600 focus:ring-0"
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200">Unit (Pcs/Kg)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={colRate}
                      onChange={(e) => setColRate(e.target.checked)}
                      className="rounded text-primary-600 focus:ring-0"
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200">Rate / Unit Price</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={colDiscount}
                      onChange={(e) => setColDiscount(e.target.checked)}
                      className="rounded text-primary-600 focus:ring-0"
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200">Discount Column</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={colTaxable}
                      onChange={(e) => setColTaxable(e.target.checked)}
                      className="rounded text-primary-600 focus:ring-0"
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200">Taxable Value</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={colGstRate}
                      onChange={(e) => setColGstRate(e.target.checked)}
                      className="rounded text-primary-600 focus:ring-0"
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200">GST Rate (%)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={colGstBreakup}
                      onChange={(e) => setColGstBreakup(e.target.checked)}
                      className="rounded text-primary-600 focus:ring-0"
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200">GST Tax (₹)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={colTotal}
                      onChange={(e) => setColTotal(e.target.checked)}
                      className="rounded text-primary-600 focus:ring-0"
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200">Total Amount</span>
                  </label>
                </div>
              </div>

              {/* Card 3.5: GST Tax Slabs & Percentage Customizer */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Percent className="h-4 w-4 text-primary-500" />
                    GST Tax Slabs & Rate Settings
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 bg-primary-50 dark:bg-primary-950/50 px-2 py-0.5 rounded">
                    Tax Configuration
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Toggle Show GST Slabs Summary Table */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Show GST Tax Slabs Summary Table
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Display the Rate, Taxable, CGST, SGST & Total Tax breakdown box on the invoice
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showGstSummary}
                        onChange={(e) => setShowGstSummary(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  {/* GST Table Heading Title */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      GST Slabs Table Heading Title
                    </label>
                    <input
                      type="text"
                      value={gstSectionTitle}
                      onChange={(e) => setGstSectionTitle(e.target.value.toUpperCase())}
                      placeholder="GST TAX SLABS SUMMARY:"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* GST Slabs List */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Store Supported GST Percentage Slabs (%)
                    </label>
                    <input
                      type="text"
                      value={gstSlabsInput}
                      onChange={(e) => setGstSlabsInput(e.target.value)}
                      placeholder="e.g. 0, 5, 12, 18, 28"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Separate rates with commas (e.g. 0, 3, 5, 12, 18, 28). Admin can add or edit any custom rate here.
                    </span>
                  </div>

                  {/* Interactive Sample Rates Tester for Live Preview */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300">
                        Live Preview Sample Tax Rates (%):
                      </span>
                      <span className="text-[10px] text-primary-600 font-semibold">
                        Real-time recalculation
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Edit sample item rates to test how the GST Slabs summary table recalculates on the right:
                    </p>
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {[0, 1, 2].map((idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] font-semibold text-slate-500 block mb-1">
                            Sample Item {idx + 1} Rate
                          </span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={sampleItemsGst[idx]}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setSampleItemsGst((prev) => {
                                  const next = [...prev];
                                  next[idx] = val;
                                  return next;
                                });
                              }}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs font-bold text-center text-slate-900 dark:text-white"
                            />
                            <span className="text-xs font-bold text-slate-400">%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Bank Details & UPI Scan-to-Pay */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-emerald-500" />
                    Bank Details & UPI Scan-to-Pay QR
                  </h3>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded font-bold">
                    Fast Payments
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. State Bank of India"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={accountNo}
                      onChange={(e) => setAccountNo(e.target.value)}
                      placeholder="e.g. 30894028301"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                      placeholder="SBIN0001234"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={holderName}
                      onChange={(e) => setHolderName(e.target.value)}
                      placeholder="e.g. Mishra Traders"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      UPI ID for Auto QR Code (Google Pay / PhonePe / Paytm)
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. 9876543210@upi or business@okaxis"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-600 font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Custom QR Code Sticker Image (Optional)
                    </label>

                    {upiQrImage ? (
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                        <div className="flex items-center gap-3">
                          <img
                            src={upiQrImage}
                            alt="Custom QR Sticker"
                            className="w-12 h-12 object-contain bg-white rounded-lg border border-slate-200 dark:border-slate-700 p-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              Custom QR Sticker Uploaded
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                              Active on Invoice
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors">
                            <Upload className="h-3 w-3" />
                            Change
                            <input type="file" accept="image/*" onChange={handleQrUpload} className="hidden" />
                          </label>
                          <button
                            type="button"
                            onClick={() => setUpiQrImage('')}
                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete QR
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <label className="cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors">
                          <Upload className="h-3.5 w-3.5 text-primary-500" />
                          Upload QR Code Sticker
                          <input type="file" accept="image/*" onChange={handleQrUpload} className="hidden" />
                        </label>
                        <span className="text-[10px] text-slate-400">
                          Upload PhonePe/Paytm/GPay QR image (PNG/JPG up to 2MB)
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400">
                    * If you don't upload an image, entering a UPI ID automatically creates a live QR code on the invoice!
                  </p>
                </div>
              </div>

              {/* Card 5: Terms, Conditions & Signatory */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary-500" />
                    Terms, Conditions & Signatory
                  </h3>
                  <span className="text-[10px] text-slate-400">Footer Policies</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Terms & Conditions (Printed on bottom left)
                  </label>
                  <textarea
                    rows={3}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Footer Thank You Note
                    </label>
                    <input
                      type="text"
                      value={footerNote}
                      onChange={(e) => setFooterNote(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Signatory Seal Label
                    </label>
                    <input
                      type="text"
                      value={signatoryLabel}
                      onChange={(e) => setSignatoryLabel(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 sticky bottom-4 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 px-6 rounded-xl text-sm shadow-lg shadow-primary-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  {loading ? 'Saving Changes...' : 'Save & Apply Invoice Template'}
                </button>

                <button
                  type="button"
                  onClick={handleTestPrint}
                  className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold py-3 px-5 rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Printer className="h-4 w-4 text-primary-400" />
                  Test Print
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Real-Time Interactive Live Invoice Preview */}
          <div className="lg:col-span-6 sticky top-6 space-y-3">
            <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-lg border border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-emerald-400" />
                <span className="font-extrabold text-xs tracking-wider uppercase">Live A4 Preview</span>
                <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Real-Time
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Paper Size selector */}
                <div className="flex bg-slate-800 p-0.5 rounded-xl text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setPreviewLayout('A4')}
                    className={`px-2 py-1 rounded-lg transition-colors ${previewLayout === 'A4' ? 'bg-primary-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    A4
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewLayout('A5')}
                    className={`px-2 py-1 rounded-lg transition-colors ${previewLayout === 'A5' ? 'bg-primary-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    A5
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewLayout('thermal')}
                    className={`px-2 py-1 rounded-lg transition-colors ${previewLayout === 'thermal' ? 'bg-primary-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    Thermal
                  </button>
                </div>

                {/* Print button */}
                <button
                  type="button"
                  onClick={handleTestPrint}
                  title="Print Sample on physical printer"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print
                </button>
              </div>
            </div>

            {/* Scrollable Canvas Container with zero negative offset clipping */}
            <div className="bg-slate-200/80 dark:bg-slate-950 p-3 rounded-2xl border border-slate-300 dark:border-slate-800 max-h-[82vh] overflow-x-auto overflow-y-auto shadow-inner">
              <div className="w-full flex justify-center py-2" style={{ minWidth: 'min-content' }}>
                <div style={{ zoom: previewLayout === 'thermal' ? '1' : '0.85' }} className="transition-all">
                  <InvoiceTemplate
                    customRef={printPreviewRef}
                    invoice={createSampleInvoice(sampleItemsGst)}
                    settings={{
                      storeName: invBrandName,
                      storeGst: invGstin,
                      storeAddress: invAddress,
                      storePhone: invPhone,
                      storeEmail: invEmail,
                      storeTagline: invTagline,
                      invoiceSettings: currentInvoiceSettings,
                    }}
                    layout={previewLayout}
                    theme={invTheme}
                    previewMode={true}
                  />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-center text-slate-400 italic">
              * Exact 1:1 replica of your printed invoice. Scaled at 85% for comfortable viewing without side-cropping.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STORE PROFILE */}
      {/* ========================================================================= */}
      {activeTab === 'store' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm max-w-2xl">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 text-sm uppercase tracking-wider text-slate-400">
            <Store className="h-5 w-5 text-primary-500" /> Store Profile & Tax Slabs
          </h3>
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs md:text-sm mt-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Company / Store Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Company GSTIN code</label>
              <input
                type="text"
                value={storeGst}
                onChange={(e) => setStoreGst(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Billing address (Text Area)</label>
              <textarea
                rows={2}
                value={storeAddress}
                onChange={(e) => {
                  setStoreAddress(e.target.value);
                  setInvAddress(e.target.value);
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Phone Contact</label>
                <input
                  type="text"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Store Email</label>
                <input
                  type="email"
                  value={storeEmail}
                  onChange={(e) => {
                    setStoreEmail(e.target.value);
                    setInvEmail(e.target.value);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">GST Tax Slabs (%)</label>
              <input
                type="text"
                value={gstSlabsInput}
                onChange={(e) => setGstSlabsInput(e.target.value)}
                placeholder="e.g. 0, 5, 12, 18, 28"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-slate-900 dark:text-white font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">Separate tax percentages with commas.</p>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Dashboard Banner Image</label>
              <div className="flex flex-col gap-2">
                {bannerPreview && (
                  <div className="relative w-full h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                    <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setDashboardBanner('');
                        setBannerPreview('');
                      }}
                      className="absolute top-1.5 right-1.5 bg-red-500 text-white p-1 rounded-lg text-[10px] font-bold"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-slate-900 dark:text-white text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-primary-600 hover:bg-primary-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md text-xs disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SOFTWARE LICENSE & SUBSCRIPTION */}
      {/* ========================================================================= */}
      {activeTab === 'license' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6 max-w-4xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider text-slate-400">
              <Key className="h-5 w-5 text-amber-500" /> Software License & Subscription
            </h3>
            {licenseStatus && (
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${licenseStatus.isExpired
                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${licenseStatus.isExpired ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}
                ></span>
                {licenseStatus.isExpired ? 'SUBSCRIPTION EXPIRED' : 'ACTIVE SUBSCRIPTION'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                Machine Hardware ID
              </span>
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <code className="text-xs font-mono font-bold text-slate-900 dark:text-primary-400 select-all">
                  {licenseStatus?.machineId || 'Generating...'}
                </code>
                <button
                  onClick={handleCopyMachineId}
                  title="Copy Machine ID"
                  className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-primary-600"
                >
                  {copiedMachineId ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Plan & Validity</span>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {licenseStatus?.planName || 'Active'}
                </span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {licenseStatus?.daysLeft !== undefined ? `${licenseStatus.daysLeft} left` : ''}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  Valid: {licenseStatus?.expiresAt ? new Date(licenseStatus.expiresAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-primary-500/10 via-amber-500/5 to-transparent border border-primary-500/20 rounded-xl space-y-2">
              <span className="text-[10px] font-bold uppercase text-primary-600 dark:text-primary-400 block tracking-wider">
                Support Helpline
              </span>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">Progix Technology Support</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-mono font-bold">
                <PhoneCall className="h-3.5 w-3.5 text-primary-500" />
                +91 89532 08952
              </p>
            </div>
          </div>

          <form onSubmit={handleActivateLicense} className="pt-2">
            <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">
              Enter Activation License Key
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="e.g. LIFE-99991231-AB6E25E9-70A004..."
                value={licenseKeyInput}
                onChange={(e) => setLicenseKeyInput(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs font-mono text-slate-900 dark:text-white tracking-wider"
              />
              <button
                type="submit"
                disabled={licenseLoading || !licenseKeyInput.trim()}
                className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs px-6 py-2.5 rounded-xl shadow whitespace-nowrap disabled:opacity-50"
              >
                {licenseLoading ? 'Activating...' : 'Activate License'}
              </button>
            </div>

            {licenseMessage.text && (
              <div
                className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 ${licenseMessage.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                  }`}
              >
                {licenseMessage.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <span>{licenseMessage.text}</span>
              </div>
            )}
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DATABASE BACKUP & RESTORE */}
      {/* ========================================================================= */}
      {activeTab === 'backup' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6 max-w-2xl">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 text-sm uppercase tracking-wider text-slate-400">
            <Database className="h-5 w-5 text-primary-500" /> Database Backup & Recovery
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Export a full offline backup of all your products, customers, suppliers, settings, and invoices as a single secure file.
          </p>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Download Backup</span>
                <span className="text-[10px] text-slate-400">Saves your records as a timestamped .json dump</span>
              </div>
              <button
                onClick={handleDownloadBackup}
                disabled={loading}
                className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow"
              >
                <Download className="h-4 w-4" /> Export Backup
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Restore Database</span>
                <span className="text-[10px] text-slate-400">Upload a previously exported .json file to restore</span>
              </div>
              <label className="flex items-center gap-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow cursor-pointer">
                <Upload className="h-4 w-4" /> Restore File
                <input type="file" accept=".json" onChange={handleUploadRestore} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
