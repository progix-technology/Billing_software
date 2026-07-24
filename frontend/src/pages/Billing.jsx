import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import useSessionStorage from '../hooks/useSessionStorage';
import { Calculator, Search, Trash2, CreditCard, ChevronRight, UserPlus, X, Printer, Download, CheckCircle, Camera } from 'lucide-react';
import CameraScanner from '../components/CameraScanner';

const Billing = () => {
  const { settings } = useSettings();
  // Master Lists
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Search & Cart states
  const [productSearch, setProductSearch] = useSessionStorage('billing_productSearch', '');
  const [customerSearch, setCustomerSearch] = useSessionStorage('billing_customerSearch', '');
  const [selectedCustomer, setSelectedCustomer] = useSessionStorage('billing_selectedCustomer', null);
  const [cart, setCart] = useSessionStorage('billing_cart', []);

  // Invoice configuration states
  const [isInterstate, setIsInterstate] = useSessionStorage('billing_isInterstate', false);
  const [paymentMethod, setPaymentMethod] = useSessionStorage('billing_paymentMethod', 'CASH');
  const [paidAmount, setPaidAmount] = useSessionStorage('billing_paidAmount', '');
  const [remarks, setRemarks] = useSessionStorage('billing_remarks', '');

  // Inline New Customer states
  const [showCustModal, setShowCustModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustGst, setNewCustGst] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [custError, setCustError] = useState('');

  // Post Checkout Preview Modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState(null);
  const [printLayout, setPrintLayout] = useState('A4'); // A4 or THERMAL
  const [showScanner, setShowScanner] = useState(false);

  const printAreaRef = useRef(null);

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

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product._id !== productId));
  };

  // Calculation helpers
  const calculateCartDetails = () => {
    let subTotal = 0;
    let totalDiscount = 0;
    let totalGst = 0;

    const itemsCalculated = cart.map(item => {
      const unitPrice = item.product.sellingPrice;
      const quantity = item.quantity;
      const gross = unitPrice * quantity;

      const discAmt = (gross * item.discountPercentage) / 100;
      const taxable = gross - discAmt;

      const gstRate = item.product.gstPercentage;
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
  };

  const { items: calculatedItems, subTotal, totalDiscount, totalGst, grandTotal } = calculateCartDetails();

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
    if (!newCustName.trim() || !newCustPhone.trim()) return;

    try {
      const res = await api.post('/api/customers', {
        name: newCustName,
        phone: newCustPhone,
        gstNumber: newCustGst,
        address: newCustAddress,
      });

      if (res.data.success) {
        setSelectedCustomer(res.data.customer);
        fetchCustomers();
        setShowCustModal(false);
        setNewCustName('');
        setNewCustPhone('');
        setNewCustGst('');
        setNewCustAddress('');
      }
    } catch (err) {
      setCustError(err.response?.data?.message || 'Failed to register customer');
    }
  };

  // Checkout POST
  const handleCheckout = async () => {
    if (!selectedCustomer) {
      return alert('Please select a Customer for this invoice.');
    }
    if (cart.length === 0) {
      return alert('Checkout cart is empty.');
    }

    const payload = {
      customerId: selectedCustomer._id,
      items: cart.map(item => ({
        productId: item.product._id,
        quantity: item.quantity,
        discountPercentage: item.discountPercentage,
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
      alert(err.response?.data?.message || 'Checkout failed');
    }
  };

  const handleDownloadPDF = async () => {
    if (!createdInvoice) return;
    try {
      const response = await api.get(`/api/invoices/${createdInvoice._id}/pdf`, {
        responseType: 'blob'
      });
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `Invoice-${createdInvoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF download');
    }
  };

  const triggerBrowserPrint = () => {
    const printContent = printAreaRef.current.innerHTML;
    const originalContent = document.body.innerHTML;

    // Create printable body frame
    document.body.innerHTML = `
      <html>
        <head>
          <title>Print Invoice</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #000; background: #fff; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f2f2f2; }
            .totals { float: right; width: 250px; margin-top: 20px; font-size: 12px; }
            .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
            .header-info { display: flex; justify-content: space-between; font-size: 12px; line-height: 1.6; }
            .title { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 2px; }
            .subtitle { text-align: center; font-size: 10px; color: #555; margin-bottom: 20px; }
            /* Thermal Specific styles */
            .thermal { width: 80mm; margin: 0 auto; padding: 5px; font-family: 'Courier New', Courier, monospace; font-size: 11px; }
            .thermal table, .thermal th, .thermal td { border: none; border-bottom: 1px dashed #000; padding: 4px 2px; font-size: 10px; }
            .thermal th { background: none; }
            .thermal .title { font-size: 14px; }
            .thermal .totals { float: none; width: 100%; }
          </style>
        </head>
        <body>
          <div>${printContent}</div>
        </body>
      </html>
    `;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Reload context state
  };

  // Search product suggestions
  const productSuggestions = productSearch.trim()
    ? products.filter(p =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.barcode && p.barcode.includes(productSearch))
    ).slice(0, 5)
    : [];

  // Search customer suggestions
  const customerSuggestions = customerSearch.trim()
    ? customers.filter(c =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
    ).slice(0, 5)
    : [];

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
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-primary-500 text-slate-800 dark:text-slate-200"
            />
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

          <div className="flex gap-2">
            <button
              onClick={() => setShowCustModal(true)}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-2 bg-primary-500/10 text-primary-400 rounded-xl hover:bg-primary-500/20 transition-all"
            >
              <UserPlus className="h-4 w-4" /> Register Walk-in
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
                        <td className="py-3 px-4 text-center font-semibold">{product.gstPercentage}%</td>
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
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Bill Remarks</label>
              <input
                type="text"
                placeholder="Voucher reference / special notes..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none"
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
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-40 animate-fade-in">
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
                  Customer Name
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Anand Sharma"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 focus:outline-none focus:border-primary-500 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  Phone Number
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
                  Address
                </label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="City, State"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 focus:outline-none focus:border-primary-500 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCustModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl shadow-lg transition-colors text-sm font-semibold"
                >
                  Register Client
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden transition-colors duration-300 my-8">
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
                {/* Print Layout Toggle */}
                <div className="flex bg-slate-200 dark:bg-slate-800 rounded-xl p-1 text-xs">
                  <button
                    onClick={() => setPrintLayout('A4')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${printLayout === 'A4' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
                      }`}
                  >
                    A4 Invoice
                  </button>
                  <button
                    onClick={() => setPrintLayout('THERMAL')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${printLayout === 'THERMAL' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
                      }`}
                  >
                    80mm Thermal
                  </button>
                </div>

                <button
                  onClick={triggerBrowserPrint}
                  className="flex items-center gap-1 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl text-xs font-semibold"
                >
                  <Printer className="h-3.5 w-3.5" /> Print
                </button>

                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-1 bg-primary-600 hover:bg-primary-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold"
                >
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </button>

                <button onClick={() => setShowPreviewModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Scrollable print template canvas */}
            <div className="p-6 max-h-[60vh] overflow-y-auto bg-slate-50 dark:bg-slate-950 flex justify-center border-b border-slate-100 dark:border-slate-800">
              <div ref={printAreaRef} className="bg-white text-slate-900 p-6 shadow-md rounded border border-slate-200/50 w-full max-w-[650px]">

                {/* Print Layout A4 */}
                {printLayout === 'A4' ? (
                  <div className="space-y-6">
                    {/* Header */}
                    <div>
                      <div className="text-center font-bold text-xl uppercase tracking-wider text-slate-950">{settings?.storeName || 'Enterprise Billing Solutions'}</div>
                      <div className="text-center text-[10px] text-slate-500">GSTIN: {settings?.storeGst || 'N/A'} | Address: {settings?.storeAddress || 'N/A'}</div>
                    </div>

                    <hr className="border-slate-200" />

                    {/* Meta section */}
                    <div className="flex justify-between text-xs text-slate-700 leading-relaxed">
                      <div>
                        <span className="font-bold block text-slate-950">Invoice Metadata:</span>
                        <p>Number: <span className="font-bold font-mono text-slate-950">{createdInvoice.invoiceNumber}</span></p>
                        <p>Date: {new Date(createdInvoice.createdAt).toLocaleDateString()}</p>
                        <p>Payment: {createdInvoice.paymentMethod} ({createdInvoice.status})</p>
                      </div>
                      <div>
                        <span className="font-bold block text-slate-950">Bill To:</span>
                        <p>Customer: <span className="font-bold text-slate-950">{selectedCustomer?.name}</span></p>
                        <p>Phone: {selectedCustomer?.phone}</p>
                        {selectedCustomer?.gstNumber && <p>GSTIN: <span className="font-mono">{selectedCustomer.gstNumber}</span></p>}
                      </div>
                    </div>

                    {/* Table */}
                    <table className="w-full text-[11px] text-left border-collapse border border-slate-200">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 border-b border-slate-200">
                          <th className="p-2 border border-slate-200">Description</th>
                          <th className="p-2 border border-slate-200 text-right">Price</th>
                          <th className="p-2 border border-slate-200 text-center">Qty</th>
                          <th className="p-2 border border-slate-200 text-right">Disc %</th>
                          <th className="p-2 border border-slate-200 text-center">GST %</th>
                          <th className="p-2 border border-slate-200 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {createdInvoice.items.map((item) => (
                          <tr key={item._id} className="border-b border-slate-200">
                            <td className="p-2 border border-slate-200 font-bold">{item.name}</td>
                            <td className="p-2 border border-slate-200 text-right">₹{item.unitPrice.toFixed(2)}</td>
                            <td className="p-2 border border-slate-200 text-center">{item.quantity}</td>
                            <td className="p-2 border border-slate-200 text-right">{item.discountPercentage}%</td>
                            <td className="p-2 border border-slate-200 text-center">{item.gstPercentage}%</td>
                            <td className="p-2 border border-slate-200 text-right font-bold">₹{item.total.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Summary Total details */}
                    <div className="flex justify-end text-xs">
                      <div className="w-64 space-y-2 border border-slate-200 p-3 rounded bg-slate-50">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>₹{createdInvoice.subTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Discount:</span>
                          <span>-₹{createdInvoice.totalDiscount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>GST Tax:</span>
                          <span>₹{createdInvoice.totalGst.toFixed(2)}</span>
                        </div>
                        <hr className="border-slate-300" />
                        <div className="flex justify-between font-bold text-slate-950 text-sm">
                          <span>Grand Total:</span>
                          <span>₹{createdInvoice.grandTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-1 text-[11px] text-slate-500">
                          <span>Paid Amount:</span>
                          <span>₹{createdInvoice.paidAmount.toFixed(2)}</span>
                        </div>
                        {createdInvoice.balanceAmount > 0 && (
                          <div className="flex justify-between text-red-500 font-semibold text-[11px]">
                            <span>Due Balance:</span>
                            <span>₹{createdInvoice.balanceAmount.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Thermal Layout (80mm) */
                  <div className="thermal font-mono leading-tight max-w-[280px] mx-auto text-slate-950 text-xs">
                    <div className="text-center font-bold uppercase text-sm">{settings?.storeName || 'Enterprise POS'}</div>
                    <div className="text-center text-[9px] text-slate-600 mb-4">GST: {settings?.storeGst || 'N/A'} | {settings?.storeAddress || 'N/A'}</div>

                    <div className="border-b border-dashed border-slate-400 pb-2 mb-2">
                      <p>BILL: {createdInvoice.invoiceNumber}</p>
                      <p>DATE: {new Date(createdInvoice.createdAt).toLocaleString()}</p>
                      <p>CUST: {selectedCustomer?.name}</p>
                      <p>PHONE: {selectedCustomer?.phone}</p>
                    </div>

                    <table className="w-full mb-2">
                      <thead>
                        <tr className="border-b border-dashed border-slate-400 text-left font-bold text-[10px]">
                          <th className="py-1">ITEM</th>
                          <th className="py-1 text-center">QTY</th>
                          <th className="py-1 text-right">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {createdInvoice.items.map((item) => (
                          <tr key={item._id} className="text-[10px]">
                            <td className="py-1">{item.name}</td>
                            <td className="py-1 text-center">{item.quantity}</td>
                            <td className="py-1 text-right font-bold">₹{item.total.toFixed(0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="border-t border-dashed border-slate-400 pt-2 space-y-1 text-[10px]">
                      <div className="flex justify-between">
                        <span>SUBTOTAL:</span>
                        <span>₹{createdInvoice.subTotal.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>DISCOUNT:</span>
                        <span>-₹{createdInvoice.totalDiscount.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST TAX:</span>
                        <span>₹{createdInvoice.totalGst.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-sm border-t border-dashed border-slate-400 pt-1">
                        <span>TOTAL:</span>
                        <span>₹{createdInvoice.grandTotal.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PAID:</span>
                        <span>₹{createdInvoice.paidAmount.toFixed(0)}</span>
                      </div>
                      {createdInvoice.balanceAmount > 0 && (
                        <div className="flex justify-between font-bold text-red-500">
                          <span>DUE:</span>
                          <span>₹{createdInvoice.balanceAmount.toFixed(0)}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-center text-[9px] mt-6 border-t border-dashed border-slate-400 pt-2">
                      *** Thank You! Visit Again ***
                    </div>
                  </div>
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
    </div>
  );
};

export default Billing;
