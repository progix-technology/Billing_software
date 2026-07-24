import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../context/AuthContext';
import { Users, Plus, Edit2, Trash2, X, Search, FileSpreadsheet, Eye, IndianRupee } from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState('CREATE'); // CREATE or EDIT
  const [editId, setEditId] = useState(null);

  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [ledgerCustomer, setLedgerCustomer] = useState(null);
  const [ledgerList, setLedgerList] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Record payment state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentRemarks, setPaymentRemarks] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [outstandingBalance, setOutstandingBalance] = useState(0);
  
  const [error, setError] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/customers', {
        params: { search, page, limit: 10 },
      });
      if (res.data.success) {
        setCustomers(res.data.customers);
        setTotalPages(res.data.pages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, page]);

  const openCreateModal = () => {
    setFormMode('CREATE');
    setName('');
    setPhone('');
    setEmail('');
    setGstNumber('');
    setAddress('');
    setNotes('');
    setOutstandingBalance(0);
    setError('');
    setShowFormModal(true);
  };

  const openEditModal = (c) => {
    setFormMode('EDIT');
    setEditId(c._id);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email || '');
    setGstNumber(c.gstNumber || '');
    setAddress(c.address || '');
    setNotes(c.notes || '');
    setOutstandingBalance(c.outstandingBalance);
    setError('');
    setShowFormModal(true);
  };

  const openLedgerModal = async (c) => {
    setLedgerCustomer(c);
    setLedgerLoading(true);
    setShowLedgerModal(true);
    setShowPaymentForm(false);
    setPaymentAmount(0);
    setPaymentRemarks('');
    try {
      const res = await api.get(`/api/customers/${c._id}/ledger`);
      if (res.data.success) {
        setLedgerList(res.data.ledger);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const payload = {
      name,
      phone,
      email,
      gstNumber: gstNumber.toUpperCase(),
      address,
      notes,
      outstandingBalance: parseFloat(outstandingBalance),
    };

    try {
      if (formMode === 'CREATE') {
        const res = await api.post('/api/customers', payload);
        if (res.data.success) {
          setShowFormModal(false);
          fetchCustomers();
        }
      } else {
        const res = await api.put(`/api/customers/${editId}`, payload);
        if (res.data.success) {
          setShowFormModal(false);
          fetchCustomers();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save customer');
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (paymentAmount <= 0) return;

    try {
      const res = await api.post('/api/payments', {
        customerId: ledgerCustomer._id,
        type: 'INBOUND',
        amount: parseFloat(paymentAmount),
        paymentMethod,
        remarks: paymentRemarks,
      });

      if (res.data.success) {
        // Refresh ledger
        const ledgerRes = await api.get(`/api/customers/${ledgerCustomer._id}/ledger`);
        if (ledgerRes.data.success) {
          setLedgerList(ledgerRes.data.ledger);
        }
        
        // Hide payment form, reset states
        setShowPaymentForm(false);
        setPaymentAmount(0);
        setPaymentRemarks('');
        
        // Refresh customer list
        fetchCustomers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record payment');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      const res = await api.delete(`/api/customers/${id}`);
      if (res.data.success) {
        fetchCustomers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete customer');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-primary-500" />
            Customer Profiles & Ledgers
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Maintain client directories, review sales logs, check outstanding dues, and post payment clearances.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-primary-900/20 transition-all duration-200 text-sm"
        >
          <Plus className="h-4 w-4" /> Add Customer
        </button>
      </div>

      {/* Customer List Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors duration-300">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-primary-500 text-slate-800 dark:text-slate-200 transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent mx-auto" />
            <p className="mt-3 text-sm">Loading customer directory...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="h-10 w-10 mx-auto text-slate-400 mb-2" />
            <p className="text-sm">No customers registered yet</p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <th className="py-4 px-6">Customer Name</th>
                    <th className="py-4 px-6">Contact Info</th>
                    <th className="py-4 px-6">GST Number</th>
                    <th className="py-4 px-6">Outstanding Dues</th>
                    <th className="py-4 px-6 text-right">Ledgers & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                  {customers.map((c) => {
                    const owesMoney = c.outstandingBalance > 0;
                    return (
                      <tr key={c._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-slate-700 dark:text-slate-300">
                        <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">
                          <div>
                            {c.name}
                            {c.notes && <p className="text-xs font-normal text-slate-400 truncate max-w-xs">{c.notes}</p>}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p>{c.phone}</p>
                          {c.email && <p className="text-xs text-slate-400">{c.email}</p>}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs">
                          {c.gstNumber || 'N/A'}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`font-bold rounded-full text-xs px-2 py-0.5 ${
                            owesMoney
                              ? 'bg-red-500/10 text-red-500 border border-red-500/25'
                              : 'bg-emerald-500/10 text-emerald-500'
                          }`}>
                            {owesMoney ? `₹${c.outstandingBalance.toFixed(2)} Due` : 'Clean Account'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => openLedgerModal(c)}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-primary-500/10 text-primary-400 rounded-lg hover:bg-primary-500/20 transition-colors"
                          >
                            <Eye className="h-4 w-4" /> Ledger Statement
                          </button>
                          <button
                            onClick={() => openEditModal(c)}
                            className="inline-flex p-2 text-slate-500 hover:text-primary-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c._id)}
                            className="inline-flex p-2 text-slate-500 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm text-slate-500">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Customer Form Modal */}
      {showFormModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-40 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden transition-colors duration-300">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/40">
              <h3 className="font-bold text-slate-900 dark:text-white">
                {formMode === 'CREATE' ? 'Add New Customer Profile' : 'Edit Customer Details'}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-500 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
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
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 focus:outline-none focus:border-primary-500 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. rajesh@gmail.com"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 focus:outline-none focus:border-primary-500 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                    GSTIN Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="e.g. 27AAAAA1111A1Z1"
                    maxLength={15}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 focus:outline-none focus:border-primary-500 text-sm text-slate-900 dark:text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street name, City, Pin Code"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 focus:outline-none focus:border-primary-500 text-sm text-slate-900 dark:text-white"
                />
              </div>

              {formMode === 'CREATE' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                    Opening Outstanding Dues (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={outstandingBalance}
                    onChange={(e) => setOutstandingBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 focus:outline-none focus:border-primary-500 text-sm text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional client details..."
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 focus:outline-none focus:border-primary-500 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl shadow-lg transition-colors text-sm font-semibold"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Ledger details Modal */}
      {showLedgerModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-40 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden transition-colors duration-300">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/40">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FileSpreadsheet className="h-5 w-5 text-primary-500" />
                  Account Statement Ledger
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 capitalize">
                  Statement for {ledgerCustomer?.name} | Phone: {ledgerCustomer?.phone}
                </p>
              </div>
              <button onClick={() => setShowLedgerModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Ledger Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <span className="text-xs text-slate-400">Total Outstanding Balance</span>
                  <p className="text-2xl font-black text-red-500 mt-1">
                    ₹{ledgerCustomer?.outstandingBalance.toFixed(2)}
                  </p>
                </div>
                
                <div className="md:col-span-2 flex items-end justify-end">
                  {!showPaymentForm && ledgerCustomer?.outstandingBalance > 0 && (
                    <button
                      onClick={() => setShowPaymentForm(true)}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl shadow-lg font-semibold text-sm transition-all"
                    >
                      <IndianRupee className="h-4 w-4" /> Record Payment / Clear Dues
                    </button>
                  )}
                </div>
              </div>

              {/* Inbound payment form inside ledger modal */}
              {showPaymentForm && (
                <form onSubmit={handlePaymentSubmit} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 animate-fade-in">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-300">Enter Payment Details</span>
                    <button type="button" onClick={() => setShowPaymentForm(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Payment Amount (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Method</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm"
                      >
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="CARD">Card</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Remarks</label>
                      <input
                        type="text"
                        value={paymentRemarks}
                        onChange={(e) => setPaymentRemarks(e.target.value)}
                        placeholder="e.g. Receipt #4862"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 text-xs font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md"
                    >
                      Save Receipt
                    </button>
                  </div>
                </form>
              )}

              {/* Ledger Statement Table */}
              {ledgerLoading ? (
                <div className="p-8 text-center text-slate-500">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent mx-auto" />
                  <p className="mt-2 text-xs">Compiling transaction history...</p>
                </div>
              ) : ledgerList.length === 0 ? (
                <p className="text-center py-8 text-sm text-slate-500">No invoice or payment activities logged</p>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950/50 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Reference</th>
                        <th className="py-3 px-4 text-right">Debit (Sale)</th>
                        <th className="py-3 px-4 text-right">Credit (Paid)</th>
                        <th className="py-3 px-4 text-right">Running Balance</th>
                        <th className="py-3 px-4">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {ledgerList.map((entry) => (
                        <tr key={entry._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 text-slate-600 dark:text-slate-300">
                          <td className="py-3 px-4">{new Date(entry.date).toLocaleDateString()}</td>
                          <td className="py-3 px-4 font-bold">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                              entry.type === 'INVOICE'
                                ? 'bg-orange-500/10 text-orange-500'
                                : 'bg-emerald-500/10 text-emerald-500'
                            }`}>
                              {entry.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{entry.reference}</td>
                          <td className="py-3 px-4 text-right font-bold text-red-500">{entry.debit > 0 ? `₹${entry.debit.toFixed(2)}` : '-'}</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-500">{entry.credit > 0 ? `₹${entry.credit.toFixed(2)}` : '-'}</td>
                          <td className="py-3 px-4 text-right font-bold font-mono">₹{entry.balance.toFixed(2)}</td>
                          <td className="py-3 px-4 text-slate-500 truncate max-w-xs">{entry.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Customers;
