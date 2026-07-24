import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Barcode from 'react-barcode';
import { Package, Plus, Edit2, Trash2, X, Search, AlertCircle, ArrowUpCircle, ChevronDown, Printer } from 'lucide-react';

const Products = () => {
  const { user } = useAuth();
  const { settings } = useSettings();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtering & Pagination
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState('CREATE'); // CREATE or EDIT
  const [editId, setEditId] = useState(null);

  const [showStockModal, setShowStockModal] = useState(false);
  const [stockProductId, setStockProductId] = useState(null);
  const [stockProductTitle, setStockProductTitle] = useState('');

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printProduct, setPrintProduct] = useState(null);
  const printRef = React.useRef(null);

  // Form Fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [gstPercentage, setGstPercentage] = useState(18);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [minStockLevel, setMinStockLevel] = useState(5);
  const [image, setImage] = useState('');

  // Stock In Fields
  const [inwardQuantity, setInwardQuantity] = useState(10);
  const [inwardPrice, setInwardPrice] = useState(0);
  const [inwardRemarks, setInwardRemarks] = useState('');

  const [error, setError] = useState('');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [expandedFilterCats, setExpandedFilterCats] = useState({});

  const toggleFilterCat = (catId, e) => {
    e.stopPropagation();
    setExpandedFilterCats((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const getSelectedCategoryName = () => {
    if (!categoryFilter) return 'All Categories';
    const cat = categories.find(c => c._id === categoryFilter);
    return cat ? cat.name : 'All Categories';
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/products', {
        params: {
          search,
          category: categoryFilter,
          lowStock: lowStockFilter,
          page,
          limit: 10,
        },
      });
      if (res.data.success) {
        setProducts(res.data.products);
        setTotalPages(res.data.pages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/api/categories');
      if (res.data.success) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, lowStockFilter, page]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const canModify = user && ['admin', 'manager'].includes(user.role);

  const openCreateModal = () => {
    setFormMode('CREATE');
    setName('');
    setSku('');
    setBarcode('');
    setCategory('');
    setSubCategory('');
    setDescription('');
    setPurchasePrice(0);
    setSellingPrice(0);
    setGstPercentage(18);
    setStockQuantity(0);
    setMinStockLevel(5);
    setImage('');
    setError('');
    setShowFormModal(true);
  };

  const openEditModal = (p) => {
    setFormMode('EDIT');
    setEditId(p._id);
    setName(p.name);
    setSku(p.sku);
    setBarcode(p.barcode || '');
    setCategory(p.category?._id || p.category || '');
    setSubCategory(p.subCategory?._id || p.subCategory || '');
    setDescription(p.description || '');
    setPurchasePrice(p.purchasePrice);
    setSellingPrice(p.sellingPrice);
    setGstPercentage(p.gstPercentage);
    setStockQuantity(p.stockQuantity);
    setMinStockLevel(p.minStockLevel);
    setImage(p.image || '');
    setError('');
    setShowFormModal(true);
  };

  const openStockModal = (p) => {
    setStockProductId(p._id);
    setStockProductTitle(p.name);
    setInwardQuantity(10);
    setInwardPrice(p.purchasePrice);
    setInwardRemarks('');
    setError('');
    setShowStockModal(true);
  };

  const handlePrintBarcode = (p) => {
    setPrintProduct(p);
    setShowPrintModal(true);
  };

  const triggerBarcodePrint = () => {
    const printContent = `
      <style>
        @media print {
          @page { margin: 0; }
          body { 
            display: flex; 
            justify-content: center; 
            align-items: flex-start; 
            padding-top: 20px; 
            -webkit-print-color-adjust: exact; 
          }
        }
      </style>
      <div style="display: flex; justify-content: center; width: 100%;">
        ${printRef.current.outerHTML}
      </div>
    `;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Refresh to restore React bindings
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name,
      sku: sku.trim() || undefined,
      barcode: barcode.trim() || undefined,
      category,
      subCategory: subCategory || null,
      description,
      purchasePrice: parseFloat(purchasePrice),
      sellingPrice: parseFloat(sellingPrice),
      gstPercentage: parseInt(gstPercentage),
      stockQuantity: parseInt(stockQuantity),
      minStockLevel: parseInt(minStockLevel),
      image,
    };

    try {
      if (formMode === 'CREATE') {
        const res = await api.post('/api/products', payload);
        if (res.data.success) {
          setShowFormModal(false);
          fetchProducts();
        }
      } else {
        const res = await api.put(`/api/products/${editId}`, payload);
        if (res.data.success) {
          setShowFormModal(false);
          fetchProducts();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product details');
    }
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/api/products/${stockProductId}/stock-in`, {
        quantity: parseInt(inwardQuantity),
        supplierPrice: parseFloat(inwardPrice),
        remarks: inwardRemarks,
      });
      if (res.data.success) {
        setShowStockModal(false);
        fetchProducts();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to adjust stock level');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await api.delete(`/api/products/${id}`);
      if (res.data.success) {
        fetchProducts();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove product');
    }
  };

  // Convert uploaded image file to base64 string
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="h-6 w-6 text-primary-500" />
            Products Inventory Catalog
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage products, tracking quantities, barcodes, SKU items, and tax percentages.
          </p>
        </div>
        {canModify && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-primary-900/20 transition-all duration-200 text-sm"
          >
            <Plus className="h-4 w-4" /> Add Product
          </button>
        )}
      </div>

      {/* Filter and Content Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-colors duration-300">
        {/* Table Filter Panel */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search name, SKU, or barcode..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-primary-500 text-slate-800 dark:text-slate-200 transition-colors"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-4 text-sm font-semibold text-slate-800 dark:text-slate-200 transition-colors focus:outline-none focus:border-primary-500 min-w-[160px]"
              >
                <span>{getSelectedCategoryName()}</span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isFilterDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsFilterDropdownOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-40 max-h-80 overflow-y-auto transition-all animate-fade-in text-xs md:text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryFilter('');
                        setPage(1);
                        setIsFilterDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl transition-colors font-medium ${categoryFilter === ''
                          ? 'bg-primary-500/10 text-primary-600 font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      All Categories
                    </button>

                    {categories
                      .filter(c => !c.parent)
                      .map((c) => {
                        const subCats = categories.filter(sub => sub.parent && (sub.parent._id === c._id || sub.parent === c._id));
                        const hasSubs = subCats.length > 0;
                        const isExpanded = !!expandedFilterCats[c._id];
                        const isSelected = categoryFilter === c._id;

                        return (
                          <div key={c._id} className="space-y-0.5 mt-1">
                            <div
                              className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors cursor-pointer ${isSelected
                                  ? 'bg-primary-500/10 text-primary-600 font-bold'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                }`}
                              onClick={() => {
                                setCategoryFilter(c._id);
                                setPage(1);
                                setIsFilterDropdownOpen(false);
                              }}
                            >
                              <span className="font-semibold">{c.name}</span>
                              {hasSubs && (
                                <button
                                  type="button"
                                  onClick={(e) => toggleFilterCat(c._id, e)}
                                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                              )}
                            </div>

                            {hasSubs && isExpanded && (
                              <div className="pl-4 space-y-0.5 border-l border-slate-100 dark:border-slate-800 ml-4 mt-0.5">
                                {subCats.map((sub) => {
                                  const isSubSelected = categoryFilter === sub._id;
                                  return (
                                    <button
                                      key={sub._id}
                                      type="button"
                                      onClick={() => {
                                        setCategoryFilter(sub._id);
                                        setPage(1);
                                        setIsFilterDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors text-xs ${isSubSelected
                                          ? 'bg-primary-500/10 text-primary-600 font-bold'
                                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                                        }`}
                                    >
                                      {sub.name}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </>
              )}
            </div>

            {/* Low Stock Toggle */}
            <label className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={lowStockFilter}
                onChange={(e) => { setLowStockFilter(e.target.checked); setPage(1); }}
                className="rounded border-slate-300 dark:border-slate-700 text-primary-600 focus:ring-primary-500 h-4 w-4 bg-slate-50 dark:bg-slate-950"
              />
              <span>Critical Low Stock only</span>
            </label>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent mx-auto" />
            <p className="mt-3 text-sm">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Package className="h-10 w-10 mx-auto text-slate-400 mb-2" />
            <p className="text-sm">No products found</p>
          </div>
        ) : (
          <div className="rounded-b-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <th className="py-4 px-6">Product</th>
                    <th className="py-4 px-6">SKU / Barcode</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">Prices</th>
                    <th className="py-4 px-6">GST %</th>
                    <th className="py-4 px-6">Stock</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                  {products.map((p) => {
                    const isLowStock = p.stockQuantity <= p.minStockLevel;
                    return (
                      <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-slate-700 dark:text-slate-300">
                        {/* Name / Image */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 overflow-hidden">
                              {p.image ? (
                                <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                              ) : (
                                <Package className="h-5 w-5" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">{p.name}</p>
                              <p className="text-xs text-slate-400 truncate max-w-xs">{p.description || 'No description'}</p>
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="py-4 px-6">
                          <p className="font-mono text-xs font-semibold text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded-full inline-block">
                            {p.sku}
                          </p>
                          {p.barcode && <p className="text-xs text-slate-400 font-mono mt-1">Barcode: {p.barcode}</p>}
                        </td>

                        {/* Category */}
                        <td className="py-4 px-6 text-slate-500 dark:text-slate-400">
                          {p.category ? (
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-200">{p.category.name}</p>
                              {p.subCategory && (
                                <p className="text-xs text-slate-400 mt-0.5 font-medium">&rarr; {p.subCategory.name}</p>
                              )}
                            </div>
                          ) : (
                            'Uncategorized'
                          )}
                        </td>

                        {/* Prices */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <p className="text-xs text-slate-400">Cost: ₹{p.purchasePrice.toFixed(2)}</p>
                          <p className="font-semibold text-slate-900 dark:text-white mt-0.5">Sell: ₹{p.sellingPrice.toFixed(2)}</p>
                        </td>

                        {/* Tax */}
                        <td className="py-4 px-6 font-semibold">
                          {p.gstPercentage}%
                        </td>

                        {/* Stock */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold px-2.5 py-0.5 rounded-full text-xs whitespace-nowrap ${isLowStock
                                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                : 'bg-emerald-500/10 text-emerald-500'
                              }`}>
                              {p.stockQuantity} Units
                            </span>
                            {isLowStock && (
                              <span className="text-[10px] uppercase font-bold text-red-500 inline-flex items-center gap-1 whitespace-nowrap">
                                <AlertCircle className="h-3.5 w-3.5" /> Low
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                          {canModify && (
                            <>
                              <button
                                onClick={() => handlePrintBarcode(p)}
                                className="inline-flex p-2 text-indigo-600 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                title="Print Barcode"
                              >
                                <Printer className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openStockModal(p)}
                                className="inline-flex p-2 text-emerald-600 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                title="Purchase stock"
                              >
                                <ArrowUpCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openEditModal(p)}
                                className="inline-flex p-2 text-slate-500 hover:text-primary-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Edit product"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(p._id)}
                                className="inline-flex p-2 text-slate-500 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Delete product"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
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

      {/* Product Form Modal */}
      {showFormModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm overflow-y-auto z-40 p-4 md:py-10 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden transition-colors duration-300 mx-auto my-4 md:my-8">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/40">
              <h3 className="font-bold text-slate-900 dark:text-white">
                {formMode === 'CREATE' ? 'Add New Inventory Product' : 'Modify Product Profile'}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-500 rounded-xl">
                  {error}
                </div>
              )}

              {/* Section 1: General Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-primary-600 uppercase tracking-wider border-b border-cream-200 pb-1.5">
                  1. General Specifications
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                      Product Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. HP Laserjet Printer"
                      className="w-full bg-cream-50/50 border border-cream-200 focus:border-primary-500 rounded-xl py-2 px-3 focus:outline-none text-sm text-slate-900"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                      Category
                    </label>
                    {categories.length === 0 ? (
                      <div className="p-2.5 border border-amber-500/20 bg-amber-50/50 rounded-xl text-xs text-amber-700 flex justify-between items-center">
                        <span>No categories.</span>
                        <Link to="/categories" className="text-primary-600 font-bold hover:underline">
                          Create Category &rarr;
                        </Link>
                      </div>
                    ) : (
                      <select
                        value={category}
                        required
                        onChange={(e) => { setCategory(e.target.value); setSubCategory(''); }}
                        className="w-full bg-cream-50/50 border border-cream-200 focus:border-primary-500 rounded-xl py-2.5 px-3 focus:outline-none text-sm text-slate-900"
                      >
                        <option value="">Select Category</option>
                        {categories.filter(c => !c.parent).map((c) => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Subcategory */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                      Subcategory (Optional)
                    </label>
                    <select
                      value={subCategory}
                      onChange={(e) => setSubCategory(e.target.value)}
                      disabled={!category}
                      className="w-full bg-cream-50/50 border border-cream-200 focus:border-primary-500 rounded-xl py-2.5 px-3 focus:outline-none text-sm text-slate-900 disabled:opacity-50"
                    >
                      <option value="">No Subcategory</option>
                      {categories
                        .filter(c => c.parent && (c.parent._id === category || c.parent === category))
                        .map((c) => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                    Description / Details
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe packaging, dimensions, color variants, or specs..."
                    rows={2}
                    className="w-full bg-cream-50/50 border border-cream-200 focus:border-primary-500 rounded-xl py-2 px-3 focus:outline-none text-sm text-slate-900"
                  />
                </div>

                {/* Product Image */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                    Product Image (Optional upload)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100"
                    />
                    {image && (
                      <div className="h-10 w-10 rounded border border-cream-200 overflow-hidden flex-shrink-0">
                        <img src={image} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Pricing & GST */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-primary-600 uppercase tracking-wider border-b border-cream-200 pb-1.5">
                  2. Pricing & Taxation (INR)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Purchase Price */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                      Purchase Cost (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      className="w-full bg-cream-50/50 border border-cream-200 focus:border-primary-500 rounded-xl py-2 px-3 focus:outline-none text-sm text-slate-900 font-semibold"
                    />
                  </div>

                  {/* Selling Price */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                      Selling Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      className="w-full bg-cream-50/50 border border-cream-200 focus:border-primary-500 rounded-xl py-2 px-3 focus:outline-none text-sm text-slate-900 font-bold"
                    />
                  </div>

                  {/* GST Percentage */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                      GST Rate (%)
                    </label>
                    <select
                      value={gstPercentage}
                      onChange={(e) => setGstPercentage(parseInt(e.target.value))}
                      className="w-full bg-cream-50/50 border border-cream-200 focus:border-primary-500 rounded-xl py-2.5 px-3 focus:outline-none text-sm text-slate-900"
                    >
                      {settings?.gstSlabs?.map(slab => (
                        <option key={slab} value={slab}>{slab}% Slab</option>
                      )) || (
                        <>
                          <option value="0">0% Slab (Nil)</option>
                          <option value="5">5% Slab</option>
                          <option value="12">12% Slab</option>
                          <option value="18">18% Slab</option>
                          <option value="28">28% Slab</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Stock Levels */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-primary-600 uppercase tracking-wider border-b border-cream-200 pb-1.5">
                  3. Stock Levels & Thresholds
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Stock Quantity */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                      {formMode === 'CREATE' ? 'Initial Stock Level (Qty)' : 'Adjusted Stock level'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      className="w-full bg-cream-50/50 border border-cream-200 focus:border-primary-500 rounded-xl py-2 px-3 focus:outline-none text-sm text-slate-900 font-bold text-primary-600"
                    />
                  </div>

                  {/* Min Stock Level */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                      Low Stock Warning limit (Qty)
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={minStockLevel}
                      onChange={(e) => setMinStockLevel(e.target.value)}
                      className="w-full bg-cream-50/50 border border-cream-200 focus:border-primary-500 rounded-xl py-2 px-3 focus:outline-none text-sm text-slate-900 text-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Identifiers */}
              <div className="space-y-4 pb-4">
                <h4 className="text-xs font-bold text-primary-600 uppercase tracking-wider border-b border-cream-200 pb-1.5">
                  4. Codes & Barcodes (Identifiers)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* SKU */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                      SKU Code (Auto generated if blank)
                    </label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="e.g. MONITOR-384"
                      className="w-full bg-cream-50/50 border border-cream-200 focus:border-primary-500 rounded-xl py-2 px-3 focus:outline-none text-sm text-slate-900 font-mono"
                    />
                  </div>

                  {/* Barcode */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                      Barcode string (Auto-generated if blank)
                    </label>
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="e.g. 00000001 (Auto-generated)"
                      className="w-full bg-cream-50/50 border border-cream-200 focus:border-primary-500 rounded-xl py-2 px-3 focus:outline-none text-sm text-slate-900 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Footer controls */}
              <div className="flex justify-end gap-3 pt-4 border-t border-cream-200">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2.5 border border-cream-200 rounded-xl text-slate-500 hover:bg-cream-200 hover:text-slate-700 transition-colors text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white rounded-xl shadow-lg shadow-primary-500/10 transition-all text-sm font-bold"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Stock Inward Adjustment Modal */}
      {showStockModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-40 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transition-colors duration-300">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/40">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
                Purchase Stock Inward
              </h3>
              <button onClick={() => setShowStockModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleStockSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-500 rounded-lg">
                  {error}
                </div>
              )}

              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl mb-2">
                <span className="text-xs text-slate-400">Product Selected:</span>
                <p className="font-bold text-slate-800 dark:text-white mt-0.5">{stockProductTitle}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  Add Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={inwardQuantity}
                  onChange={(e) => setInwardQuantity(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 focus:outline-none focus:border-primary-500 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  Supplier Purchase Cost per Unit (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={inwardPrice}
                  onChange={(e) => setInwardPrice(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 focus:outline-none focus:border-primary-500 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  Inward Remarks (e.g. Batch # or Supplier Invoice Ref)
                </label>
                <input
                  type="text"
                  value={inwardRemarks}
                  onChange={(e) => setInwardRemarks(e.target.value)}
                  placeholder="e.g. Purchased from Royal Distributors"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 focus:outline-none focus:border-primary-500 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg transition-colors text-sm font-semibold"
                >
                  Stock Inward
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      {/* Print Barcode Modal */}
      {showPrintModal && printProduct && createPortal(
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden transition-colors duration-300">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/40">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Printer className="h-5 w-5 text-indigo-500" />
                Print Barcode Label
              </h3>
              <button onClick={() => setShowPrintModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center space-y-6">
              {/* This is the area that gets printed */}
              <div 
                ref={printRef} 
                className="bg-white p-4 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center w-full"
                style={{ width: '250px' }} // Standard small sticker size approx
              >
                <div className="text-center mb-1">
                  <p className="font-bold text-[10px] uppercase text-black leading-tight truncate w-full px-2" style={{ maxWidth: '200px' }}>
                    {settings?.storeName || 'Store'}
                  </p>
                  <p className="font-bold text-sm text-black leading-tight truncate w-full px-2 mt-1" style={{ maxWidth: '200px' }}>
                    {printProduct.name}
                  </p>
                  <p className="text-[10px] text-black">
                    MRP: <span className="font-bold">Rs. {printProduct.sellingPrice.toFixed(2)}</span>
                  </p>
                </div>
                
                {printProduct.barcode ? (
                  <Barcode 
                    value={printProduct.barcode} 
                    format="CODE128"
                    width={1.5}
                    height={40}
                    displayValue={true}
                    fontSize={12}
                    margin={0}
                    background="#ffffff"
                    lineColor="#000000"
                  />
                ) : (
                  <div className="py-6 px-4 bg-red-50 text-red-500 text-xs text-center border border-red-100 rounded">
                    No barcode assigned.<br/>Edit product to generate one.
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={triggerBarcodePrint}
                  disabled={!printProduct.barcode}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  <Printer className="h-4 w-4" /> Print Label
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Products;
