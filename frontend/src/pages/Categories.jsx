import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../context/AuthContext';
import { Tags, Plus, Edit2, Trash2, X, Search, ChevronDown, ChevronRight } from 'lucide-react';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); // CREATE or EDIT
  const [editId, setEditId] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');
  const [subCategoriesInput, setSubCategoriesInput] = useState('');
  const [error, setError] = useState('');
  const [expandedIds, setExpandedIds] = useState({});

  const toggleRow = (id) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/categories');
      if (res.data.success) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setModalMode('CREATE');
    setCategoryName('');
    setCategoryDesc('');
    setSubCategoriesInput('');
    setError('');
    setShowModal(true);
  };

  const openEditModal = (cat) => {
    setModalMode('EDIT');
    setEditId(cat._id);
    setCategoryName(cat.name);
    setCategoryDesc(cat.description || '');
    
    // Find children and compile into comma-separated text
    const childSubs = categories.filter(c => c.parent?._id === cat._id || c.parent === cat._id);
    const subNames = childSubs.map(s => s.name).join(', ');
    setSubCategoriesInput(subNames);
    
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    const subCategoriesArray = subCategoriesInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      const payload = {
        name: categoryName,
        description: categoryDesc,
        subCategories: subCategoriesArray,
      };

      if (modalMode === 'CREATE') {
        const res = await api.post('/api/categories', payload);
        if (res.data.success) {
          setShowModal(false);
          fetchCategories();
        }
      } else {
        const res = await api.put(`/api/categories/${editId}`, payload);
        if (res.data.success) {
          setShowModal(false);
          fetchCategories();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await api.delete(`/api/categories/${id}`);
      if (res.data.success) {
        fetchCategories();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const mainCategoriesOnly = categories.filter(c => !c.parent);
  const filteredCategories = mainCategoriesOnly.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Tags className="h-6 w-6 text-primary-500" />
            Categories Management
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure categorizations to catalog and sort inventory products.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-primary-900/20 transition-all duration-200 text-sm"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {/* Categories Table Wrapper */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors duration-300">
        {/* Table Filter Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-primary-500 text-slate-800 dark:text-slate-200 transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent mx-auto" />
            <p className="mt-3 text-sm">Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Tags className="h-10 w-10 mx-auto text-slate-400 mb-2" />
            <p className="text-sm">No categories found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Description</th>
                  <th className="py-4 px-6">Subcategories</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
              {filteredCategories.map((cat) => {
                const childSubs = categories.filter(c => c.parent?._id === cat._id || c.parent === cat._id);
                const isExpanded = !!expandedIds[cat._id];
                return (
                  <React.Fragment key={cat._id}>
                    <tr 
                      className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer select-none"
                      onClick={() => toggleRow(cat._id)}
                    >
                      <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="text-slate-400">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </span>
                        {cat.name}
                      </td>
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400">{cat.description || 'N/A'}</td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-600">
                          {childSubs.length} Subcategories
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openEditModal(cat)}
                          className="inline-flex p-2 text-slate-500 hover:text-primary-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat._id)}
                          className="inline-flex p-2 text-slate-500 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      childSubs.length > 0 ? (
                        childSubs.map((sub, idx) => {
                          const isLast = idx === childSubs.length - 1;
                          const treePrefix = isLast ? '└─ ' : '├─ ';
                          return (
                            <tr 
                              key={sub._id} 
                              className="bg-slate-50/10 dark:bg-slate-950/5 text-slate-600 dark:text-slate-450 border-b border-slate-100/50 dark:border-slate-850/30"
                            >
                              <td className="py-2.5 pl-14 pr-6 font-medium text-slate-600 dark:text-slate-450">
                                <span className="text-slate-400 dark:text-slate-650 font-mono select-none mr-2">{treePrefix}</span>
                                {sub.name}
                              </td>
                              <td className="py-2.5 px-6 text-slate-400 dark:text-slate-500 text-xs italic">
                                Subcategory
                              </td>
                              <td className="py-2.5 px-6 text-slate-400 dark:text-slate-500 text-xs">
                                —
                              </td>
                              <td className="py-2.5 px-6"></td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr className="bg-slate-50/10 dark:bg-slate-950/5 text-slate-400">
                          <td colSpan={4} className="py-3 pl-14 pr-6 text-xs italic">
                            No subcategories defined for this category.
                          </td>
                        </tr>
                      )
                    )}
                  </React.Fragment>
                );
              })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal Dialog */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-40 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transition-colors duration-300">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/40">
              <h3 className="font-bold text-slate-900 dark:text-white">
                {modalMode === 'CREATE' ? 'Add New Category' : 'Edit Category'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-500 rounded-lg">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. Electronics"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 focus:outline-none focus:border-primary-500 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  Subcategories (Comma separated - e.g. Mobile, Laptop, Tablet)
                </label>
                <input
                  type="text"
                  value={subCategoriesInput}
                  onChange={(e) => setSubCategoriesInput(e.target.value)}
                  placeholder="e.g. Mobile, Laptop, Tablet"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 focus:outline-none focus:border-primary-500 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  Description
                </label>
                <textarea
                  value={categoryDesc}
                  onChange={(e) => setCategoryDesc(e.target.value)}
                  placeholder="Short explanation for categorization..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 focus:outline-none focus:border-primary-500 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl shadow-lg transition-colors text-sm font-semibold"
                >
                  Save Changes
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

export default Categories;
