import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import useSessionStorage from '../hooks/useSessionStorage';
import { Calculator, Search, Trash2, CreditCard, ChevronRight, UserPlus, X, Printer, Download, CheckCircle, Camera, Key, Copy, Check, PhoneCall, AlertTriangle, Zap, Loader2 } from 'lucide-react';
import CameraScanner from '../components/CameraScanner';
import InvoiceTemplate from '../components/InvoiceTemplate';
import { printInvoiceElement, downloadInvoicePDF } from '../utils/printHelper';

const Billing = () => {
  const { settings } = useSettings();
  // Master Lists
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Search & Cart states - regular state for high-performance zero-lag typing
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useSessionStorage('billing_selectedCustomer', null);
  const [cart, setCart] = useSessionStorage('billing_cart', []);

  // Invoice configuration states
  const [isInterstate, setIsInterstate] = useSessionStorage('billing_isInterstate', false);
  const [paymentMethod, setPaymentMethod] = useSessionStorage('billing_paymentMethod', 'CASH');
  const [paidAmount, setPaidAmount] = useSessionStorage('billing_paidAmount', '');
  const [remarks, setRemarks] = useState(() => {
    try {
      const item = sessionStorage.getItem('billing_remarks');
      return item ? JSON.parse(item) : '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        sessionStorage.setItem('billing_remarks', JSON.stringify(remarks));
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [remarks]);

  // Inline New Customer states
  const [showCustModal, setShowCustModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustGst, setNewCustGst] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [custError, setCustError] = useState('');
  const [isCustSubmitting, setIsCustSubmitting] = useState(false);

  // Post Checkout Preview Modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState(null);
  const [printLayout, setPrintLayout] = useState('A4'); // 'A4' | 'A5' | 'thermal'
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (settings?.invoiceSettings?.layout) {
      setPrintLayout(settings.invoiceSettings.layout);
    }
  }, [settings?.invoiceSettings?.layout]);

  // License & Subscription Lock States
  const [licenseStatus, setLicenseStatus] = useState(null);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [licenseMsg, setLicenseMsg] = useState({ type: '', text: '' });
  const [copiedId, setCopiedId] = useState(false);

  const printAreaRef = useRef(null);

  const fetchLicense = async () => {
    try {
      const res = await api.get('/api/license/status');
      if (res.data.success) {
        setLicenseStatus(res.data);
        if (res.data.isExpired) {
          setShowLicenseModal(true);
        }
      }
    } catch (err) {
      console.error('License status check failed', err);
    }
  };

  const handleActivateLicense = async (e) => {
    e.preventDefault();
    if (!licenseKeyInput.trim()) return;
    setLicenseLoading(true);
    setLicenseMsg({ type: '', text: '' });
    try {
      const res = await api.post('/api/license/activate', { licenseKey: licenseKeyInput.trim() });
      if (res.data.success) {
        const planText = res.data.planName || 'Active';
        setLicenseMsg({ type: 'success', text: res.data.message || `Subscription active! Plan: ${planText}` });
        setLicenseKeyInput('');
        await fetchLicense();
        setTimeout(() => setShowLicenseModal(false), 1500);
      }
    } catch (err) {
      setLicenseMsg({ type: 'error', text: err.response?.data?.message || 'Invalid license key.' });
    } finally {
      setLicenseLoading(false);
    }
  };

  // Load lists
  const fetchProducts = async () => {
    try {
      const res = await api.get('/api/products', { params: { limit: 100 } });
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/api/customers', { params: { limit: 100 } });
      if (res.data.success) {
        setCustomers(res.data.customers);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchLicense();
  }, []);

  // Handle adding product to cart
  const addToCart = (product) => {
    if (product.stockQuantity <= 0) {
      return alert(`Product '${product.name}' is out of stock!`);
    }

    const existing = cart.find(item => item.product._id === product._id);
    if (existing) {
      if (existing.quantity >= product.stockQuantity) {
        return alert(`Cannot add more. Only ${product.stockQuantity} units available in inventory.`);
      }
      setCart(cart.map(item =>
        item.product._id === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1, discountPercentage: 0 }]);
    }
    setProductSearch('');
  };

  // Adjust cart items
  const updateQty = (productId, newQty, stockQty) => {
    if (newQty <= 0) return;
    if (newQty > stockQty) {
      return alert(`Only ${stockQty} units available in inventory.`);
    }
    setCart(cart.map(item =>
      item.product._id === productId
        ? { ...item, quantity: parseInt(newQty) }
        : item
    ));
  };

  const updateDiscount = (productId, disc) => {
    const val = parseFloat(disc) || 0;
    if (val < 0 || val > 100) return;
    setCart(cart.map(item =>
      item.product._id === productId
        ? { ...item, discountPercentage: val }
        : item
    ));
  };

  const updateGstRate = (productId, rate) => {
    const val = parseFloat(rate);
    const safeRate = isNaN(val) ? 0 : Math.max(0, val);
    setCart(cart.map(item =>
      item.product._id === productId
        ? { ...item, gstPercentage: safeRate }
        : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product._id !== productId));
  };

  // Memoized Calculation helpers - prevents heavy recalculations on keystroke
  const { items: calculatedItems, subTotal, totalDiscount, totalGst, grandTotal } = useMemo(() => {
    let subTotal = 0;
    let totalDiscount = 0;
    let totalGst = 0;

    const itemsCalculated = cart.map(item => {
      const unitPrice = item.product?.sellingPrice || 0;
      const quantity = item.quantity || 1;
      const gross = unitPrice * quantity;

      const discAmt = (gross * (item.discountPercentage || 0)) / 100;
      const taxable = gross - discAmt;

      const gstRate = item.gstPercentage !== undefined ? item.gstPercentage : (item.product?.gstPercentage || 0);
      const gstAmt = (taxable * gstRate) / 100;

      const total = taxable + gstAmt;

      subTotal += taxable;
      totalDiscount += discAmt;
      totalGst += gstAmt;

      return {
        ...item,
        gross,
        discAmt,
        taxable,
        gstAmt,
        total
      };
    });

    const grandTotal = Math.round(subTotal + totalGst);

    return {
      items: itemsCalculated,
      subTotal,
      totalDiscount,
      totalGst,
      grandTotal
    };
  }, [cart]);

  // Auto-fill paid amount when cart grandTotal changes
  useEffect(() => {
    if (cart.length > 0) {
      setPaidAmount(grandTotal);
    } else {
      setPaidAmount('');
    }
  }, [grandTotal]);

  // Create Customer Inline
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      alert('Please enter Customer Name');
      return;
    }
    if (!newCustPhone.trim()) {
      alert('Please enter Customer Mobile / Phone number');
      return;
    }

    setIsCustSubmitting(true);
    setCustError('');
    try {
      const res = await api.post('/api/customers', {
        name: newCustName.trim(),
        phone: newCustPhone.trim(),
        gstNumber: newCustGst.trim().toUpperCase(),
        address: newCustAddress.trim(),
      });

      if (res.data.success) {
        setSelectedCustomer(res.data.customer);
        fetchCustomers();
        setShowCustModal(false);
        setNewCustName('');
        setNewCustPhone('');
        setNewCustGst('');
        setNewCustAddress('');
        alert('Customer registered and selected successfully!');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to register customer';
      setCustError(errMsg);
      alert('Error: ' + errMsg);
    } finally {
      setIsCustSubmitting(false);
    }
  };

  // Checkout POST
  const handleCheckout = async () => {
    if (licenseStatus && licenseStatus.isExpired) {
      setShowLicenseModal(true);
      return;
    }

    if (cart.length === 0) {
      return alert('Checkout cart is empty. Please add items to checkout.');
    }

    // Default to walk-in if no customer is selected
    const custId = selectedCustomer ? selectedCustomer._id : 'walk-in';

    const payload = {
      customerId: custId,
      items: cart.map(item => ({
        productId: item.product._id,
        quantity: item.quantity,
        discountPercentage: item.discountPercentage,
        gstPercentage: item.gstPercentage !== undefined ? item.gstPercentage : item.product.gstPercentage,
        isInterstate
      })),
      paidAmount: paidAmount === '' ? grandTotal : parseFloat(paidAmount),
      paymentMethod,
      remarks,
    };

    try {
      const res = await api.post('/api/invoices', payload);
      if (res.data.success) {
        setCreatedInvoice(res.data.invoice);
        setCart([]);
        setPaidAmount('');
        setRemarks('');
        fetchProducts(); // Refresh stock levels
        setShowPreviewModal(true);
      }
    } catch (err) {
      if (err.response?.data?.isLicenseExpired) {
        setShowLicenseModal(true);
      } else {
        alert(err.response?.data?.message || 'Checkout failed');
      }
    }
  };

  const handleDownloadPDF = async () => {
    if (!createdInvoice || !printAreaRef.current) return;
    setIsDownloadingPdf(true);
    try {
      await downloadInvoicePDF(printAreaRef, createdInvoice.invoiceNumber, printLayout);
    } catch (err) {
      console.error(err);
      alert('Failed to generate styled PDF download: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const triggerBrowserPrint = () => {
    printInvoiceElement(printAreaRef, `Invoice-${createdInvoice?.invoiceNumber || 'Receipt'}`, printLayout);
  };

  // Memoized product suggestions - instant search response
  const productSuggestions = useMemo(() => {
    if (!productSearch.trim()) return [];
    const query = productSearch.toLowerCase().trim();
    return products.filter(p =>
      (p.name && p.name.toLowerCase().includes(query)) ||
      (p.sku && p.sku.toLowerCase().includes(query)) ||
      (p.barcode && p.barcode.includes(query))
    ).slice(0, 5);
  }, [products, productSearch]);

  // Memoized customer suggestions
  const customerSuggestions = useMemo(() => {
    if (!customerSearch.trim()) return [];
    const query = customerSearch.toLowerCase().trim();
    return customers.filter(c =>
      (c.name && c.name.toLowerCase().includes(query)) ||
      (c.phone && c.phone.includes(query))
    ).slice(0, 5);
  }, [customers, customerSearch]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[calc(100vh-120px)] pb-6 lg:pb-0">
      {/* Left 2 Cols: Cart & Products */}
      <div className="lg:col-span-2 flex flex-col space-y-6 overflow-hidden min-h-[500px] lg:min-h-0">
        {/* Checkout Header Selector */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-wrap gap-4 items-center justify-between transition-colors">
          <div className="flex-1 min-w-[250px] relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search or Select Customer by name/phone..."
              value={selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.phone})` : customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                if (selectedCustomer) setSelectedCustomer(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (!selectedCustomer && customerSearch.trim()) {
                    const searchVal = customerSearch.trim();
                    const isNum = /^\d+$/.test(searchVal);
                    if (isNum) {
                      setNewCustPhone(searchVal);
                      setNewCustName('');
                    } else {
                      setNewCustName(searchVal);
                      setNewCustPhone('');
                    }
                    setShowCustModal(true);
                  }
                }
              }}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-9 pr-9 text-sm focus:outline-none focus:border-primary-500 text-slate-800 dark:text-slate-200"
            />
            {selectedCustomer && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomer(null);
                  setCustomerSearch('');
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
                title="Clear selected customer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {/* Customer suggestion lists */}
            {customerSuggestions.length > 0 && !selectedCustomer && (
              <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-30 max-h-40 overflow-y-auto">
                {customerSuggestions.map(c => (
                  <button
                    key={c._id}
                    onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm flex justify-between"
                  >
                    <span>{c.name}</span>
                    <span className="text-xs text-slate-400">{c.phone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedCustomer({ _id: 'walk-in', name: 'Walk-in Customer', phone: 'Cash Sale' });
                setCustomerSearch('');
              }}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all border ${selectedCustomer?._id === 'walk-in'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20'
                }`}
              title="Fast checkout for retail cash customers without saving profile"
            >
              <Zap className="h-3.5 w-3.5" /> Walk-in (Cash)
            </button>

            <button
              type="button"
              onClick={() => setShowCustModal(true)}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-2 bg-primary-500/10 text-primary-400 rounded-xl hover:bg-primary-500/20 transition-all border border-primary-500/20"
            >
              <UserPlus className="h-4 w-4" /> Register Client
            </button>

            {/* Interstate flag */}
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                checked={isInterstate}
                onChange={(e) => setIsInterstate(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-primary-600 focus:ring-primary-500 h-4 w-4 bg-slate-50 dark:bg-slate-950"
              />
              <span>IGST (Interstate)</span>
            </label>
          </div>
        </div>

        {/* Dynamic Cart Table Panel */}
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Calculator className="h-5 w-5 text-primary-500" /> POS Cart Checkout
            </h3>
            {/* Product selection search */}
            <div className="relative w-72 flex gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Scan Barcode or Search product..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      // Match exact barcode first
                      const exactMatch = products.find(p => p.barcode && p.barcode === productSearch.trim());
                      if (exactMatch) {
                        addToCart(exactMatch);
                        setProductSearch('');
                      } else if (productSuggestions.length === 1) {
                        // Fallback to single suggestion match
                        addToCart(productSuggestions[0]);
                        setProductSearch('');
                      }
                    }
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-primary-500 text-slate-800 dark:text-slate-200"
                />
                {/* Product suggestions list */}
                {productSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto">
                    {productSuggestions.map(p => (
                      <button
                        key={p._id}
                        onClick={() => addToCart(p)}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs flex justify-between items-center"
                      >
                        <div>
                          <p className="font-bold">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">SKU: {p.sku} | Stock: {p.stockQuantity}</p>
                        </div>
                        <span className="font-bold text-primary-500">₹{p.sellingPrice.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                  if (isMobile) {
                    setShowScanner(true);
                  } else {
                    alert('Please connect a physical USB/Bluetooth Barcode Scanner to your computer. Laptop webcams are not supported for barcode scanning.');
                  }
                }}
                className="bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-xl transition-colors flex items-center justify-center shrink-0"
                title="Scan with Camera"
              >
                <Camera className="h-5 w-5" />
              </button>
            </div>
          </div>

          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
              <Calculator className="h-16 w-16 text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-sm font-semibold">Your POS Checkout is empty</p>
              <p className="text-xs text-slate-500 mt-1">Scan a barcode or use the product search input above to add items.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-colors">
              <table className="w-full text-left border-collapse text-xs md:text-sm min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4 text-right">Price</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Disc %</th>
                    <th className="py-3 px-4 text-center">GST %</th>
                    <th className="py-3 px-4 text-right">GST Split</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {calculatedItems.map((item) => {
                    const product = item.product;
                    return (
                      <tr key={product._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 text-slate-700 dark:text-slate-300">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{product.name}</p>
                          <span className="font-mono text-[9px] text-slate-400">SKU: {product.sku}</span>
                        </td>
                        <td className="py-3 px-4 text-right">₹{product.sellingPrice.toFixed(2)}</td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="number"
                            min="1"
                            max={product.stockQuantity}
                            value={item.quantity}
                            onChange={(e) => updateQty(product._id, e.target.value, product.stockQuantity)}
                            className="w-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-1 text-center font-bold"
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discountPercentage}
                            onChange={(e) => updateDiscount(product._id, e.target.value)}
                            className="w-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-1 text-center"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={item.gstPercentage !== undefined ? item.gstPercentage : product.gstPercentage}
                              onChange={(e) => updateGstRate(product._id, e.target.value)}
                              className="w-14 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-1 text-center font-bold text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500"
                            />
                            <span className="text-xs font-semibold text-slate-400">%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-[10px] text-slate-400">
                          {isInterstate ? (
                            <span>IGST: ₹{item.gstAmt.toFixed(1)}</span>
                          ) : (
                            <span>C/SGST: ₹{(item.gstAmt / 2).toFixed(1)} ea.</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">₹{item.total.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => removeFromCart(product._id)}
                            className="text-slate-400 hover:text-red-500 inline-flex p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Checkout Summary & Total */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 flex flex-col justify-between overflow-y-auto transition-colors">
        <div className="space-y-6">
          <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 uppercase text-xs tracking-wider">
            Checkout Bill Summary
          </h3>

          {/* Pricing Ledger Details */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Items Count:</span>
              <span className="font-semibold">{cart.length} Products</span>
            </div>

            <div className="flex justify-between text-slate-500">
              <span>Cart Subtotal:</span>
              <span className="font-semibold text-slate-900 dark:text-white">₹{subTotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-slate-500">
              <span>Total discount given:</span>
              <span className="font-semibold text-red-500">-₹{totalDiscount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-slate-500">
              <span>Total calculated GST:</span>
              <span className="font-semibold text-slate-900 dark:text-white">₹{totalGst.toFixed(2)}</span>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-4 border-t border-dashed border-slate-200 dark:border-slate-800">
              <span className="text-base font-bold text-slate-800 dark:text-slate-200">Grand Total:</span>
              <span className="text-2xl font-black text-primary-500">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {/* Pay Method */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none"
              >
                <option value="CASH">Cash payment</option>
                <option value="UPI">UPI payment</option>
                <option value="CARD">Card payment</option>
                <option value="CREDIT">Credit Billing (Dues tracking)</option>
              </select>
            </div>

            {/* Cash Paid Input */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Paid Amount (₹)</label>
              <input
                type="number"
                placeholder={grandTotal}
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none"
              />
              {paidAmount !== '' && parseFloat(paidAmount) < grandTotal && (
                <span className="text-[10px] font-bold text-orange-500 block mt-1.5">
                  Balance due: ₹{(grandTotal - parseFloat(paidAmount)).toFixed(2)} will be debited to customer.
                </span>
              )}
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Bill Remarks (Text Area)</label>
              <textarea
                rows={2}
                placeholder="Voucher reference / special notes..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Process button */}
        <button
          onClick={handleCheckout}
          disabled={cart.length === 0}
          className="w-full mt-6 bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white font-semibold py-3.5 rounded-xl shadow-xl shadow-primary-900/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
        >
          <CreditCard className="h-5 w-5" /> Execute POS Checkout
        </button>
      </div>

      {/* New Customer Registration Dialog */}
      {showCustModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transition-colors duration-300">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/40">
              <h3 className="font-bold text-slate-900 dark:text-white">Register Walk-in Client</h3>
              <button onClick={() => setShowCustModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
              {custError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-500 rounded-lg">
                  {custError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Anand Sharma"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 focus:outline-none focus:border-primary-500 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="10 digit mobile"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 focus:outline-none focus:border-primary-500 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  GSTIN ID (Optional)
                </label>
                <input
                  type="text"
                  value={newCustGst}
                  onChange={(e) => setNewCustGst(e.target.value)}
                  placeholder="e.g. 27AAAAA1111A1Z1"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 focus:outline-none focus:border-primary-500 text-sm text-slate-900 dark:text-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  Address (Text Area)
                </label>
                <textarea
                  rows={2}
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="City, State, Pin Code"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 focus:outline-none focus:border-primary-500 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isCustSubmitting}
                  onClick={() => setShowCustModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCustSubmitting}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl shadow-lg transition-colors text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isCustSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{isCustSubmitting ? 'Registering...' : 'Register Client'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Bill Checkout Preview & Printer Dialog */}
      {showPreviewModal && createdInvoice && createPortal(
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-40 animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden transition-colors duration-300 my-8">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center bg-slate-50 dark:bg-slate-950/40 gap-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Invoice Created: {createdInvoice.invoiceNumber}</h3>
                  <p className="text-[10px] text-slate-400">Transaction validated in ledger registry</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Print Layout Toggle - 3 layout options matching Settings */}
                <div className="flex bg-slate-200 dark:bg-slate-800 rounded-xl p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setPrintLayout('A4')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      printLayout === 'A4'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    A4 Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintLayout('A5')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      printLayout === 'A5'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    A5 Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintLayout('thermal')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      printLayout === 'thermal'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    80mm Thermal
                  </button>
                </div>

                <button
                  onClick={triggerBrowserPrint}
                  className="flex items-center gap-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm"
                >
                  <Printer className="h-3.5 w-3.5" /> Print
                </button>

                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloadingPdf}
                  className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm disabled:opacity-60"
                >
                  {isDownloadingPdf ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  {isDownloadingPdf ? 'Downloading...' : 'Download PDF'}
                </button>

                <button onClick={() => setShowPreviewModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Scrollable print template canvas */}
            <div className="p-4 max-h-[75vh] overflow-x-auto overflow-y-auto bg-slate-100 dark:bg-slate-950 flex justify-center border-b border-slate-100 dark:border-slate-800">
              <div ref={printAreaRef} className="w-full flex justify-center" style={{ minWidth: 'min-content' }}>
                {createdInvoice && (
                  <InvoiceTemplate
                    invoice={{
                      ...createdInvoice,
                      customer: selectedCustomer || createdInvoice.customer,
                    }}
                    settings={settings}
                    layout={printLayout}
                  />
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 flex justify-end">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold shadow-lg"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Camera Scanner Modal */}
      {showScanner && (
        <CameraScanner
          onClose={() => setShowScanner(false)}
          onScanSuccess={(decodedText) => {
            const match = products.find(p => p.barcode && p.barcode === decodedText);
            if (match) {
              addToCart(match);
              setShowScanner(false);
            } else {
              alert(`Scanned barcode: ${decodedText}. No product found!`);
            }
          }}
        />
      )}

      {/* Subscription Expired / License Key Modal */}
      {showLicenseModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl shrink-0">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Subscription Plan Required
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Your billing subscription or free trial period has ended. Please enter your offline license activation key to unlock checkout.
                </p>
              </div>
            </div>

            {/* Machine ID Box */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Your Machine Hardware ID</span>
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <code className="text-xs font-mono font-bold text-primary-600 dark:text-primary-400 select-all">
                  {licenseStatus?.machineId || 'PRGX-OFFLINE'}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    if (licenseStatus?.machineId) {
                      navigator.clipboard.writeText(licenseStatus.machineId);
                      setCopiedId(true);
                      setTimeout(() => setCopiedId(false), 2500);
                    }
                  }}
                  className="px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg flex items-center gap-1 transition-colors"
                >
                  {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedId ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Support Hotline */}
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-amber-700 dark:text-amber-400 block">Need a License Key?</span>
                <span className="text-slate-600 dark:text-slate-300 text-[11px]">Call or WhatsApp Progix Technology Support:</span>
              </div>
              <a
                href="tel:+918953208952"
                className="font-mono font-bold text-xs bg-amber-600 text-white px-3 py-1.5 rounded-xl shadow-sm hover:bg-amber-500 transition-colors flex items-center gap-1.5"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                +91 89532 08952
              </a>
            </div>

            {/* Activation Form */}
            <form onSubmit={handleActivateLicense} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                  Enter License Activation Key
                </label>
                <input
                  type="text"
                  required
                  placeholder="PRGX-GOLD-..."
                  value={licenseKeyInput}
                  onChange={(e) => setLicenseKeyInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold tracking-wider text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {licenseMsg.text && (
                <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${licenseMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                  }`}>
                  {licenseMsg.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  <span>{licenseMsg.text}</span>
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                {!licenseStatus?.isExpired && (
                  <button
                    type="button"
                    onClick={() => setShowLicenseModal(false)}
                    className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Close
                  </button>
                )}
                <button
                  type="submit"
                  disabled={licenseLoading || !licenseKeyInput.trim()}
                  className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-semibold shadow-lg transition-colors disabled:opacity-50"
                >
                  {licenseLoading ? 'Activating...' : 'Activate Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Billing;
