import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { Package, Plus, Edit, XCircle, Trash2 } from 'lucide-react';

const SuperAdminPackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPkgId, setEditingPkgId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    durationMonths: 1,
    maxAdmins: 1,
    features: ''
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/packages');
      setPackages(res.data.packages);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        features: formData.features.split(',').map(f => f.trim()).filter(f => f)
      };
      
      if (isEditModalOpen) {
        await api.put(`/api/packages/${editingPkgId}`, payload);
      } else {
        await api.post('/api/packages', payload);
      }

      setIsModalOpen(false);
      setIsEditModalOpen(false);
      resetForm();
      fetchPackages();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save package');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      durationMonths: 1,
      maxAdmins: 1,
      features: ''
    });
    setEditingPkgId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (pkg) => {
    setEditingPkgId(pkg._id);
    setFormData({
      name: pkg.name,
      price: pkg.price,
      durationMonths: pkg.durationMonths,
      maxAdmins: pkg.maxAdmins,
      features: pkg.features.join(', ')
    });
    setIsEditModalOpen(true);
  };

  const deletePackage = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this package?')) return;
    try {
      await api.delete(`/api/packages/${id}`);
      fetchPackages();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete package');
    }
  };

  if (loading) return <div className="p-6">Loading packages...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Package Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage subscription plans and features</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors"
        >
          <Plus className="h-5 w-5" />
          Create Package
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map(pkg => (
          <div key={pkg._id} className={`bg-white rounded-2xl p-6 shadow-sm border ${pkg.isActive ? 'border-slate-200' : 'border-red-200 bg-red-50'} hover:shadow-md transition-shadow relative overflow-hidden`}>
            {!pkg.isActive && (
              <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                INACTIVE
              </div>
            )}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-xl uppercase">{pkg.name}</h3>
                  <p className="text-primary-600 font-semibold text-lg">₹{pkg.price} <span className="text-sm text-slate-500 font-normal">/ {pkg.durationMonths === 1 ? 'month' : pkg.durationMonths === 12 ? 'year' : `${pkg.durationMonths} months`}</span></p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-sm font-medium text-slate-700 border-b pb-2">Limits</p>
              <p className="text-sm text-slate-600">• Max Admins: <span className="font-semibold text-slate-800">{pkg.maxAdmins}</span></p>
              
              <p className="text-sm font-medium text-slate-700 border-b pb-2 mt-4">Features</p>
              <ul className="text-sm text-slate-600 space-y-1">
                {pkg.features.map((f, i) => (
                  <li key={i}>• {f}</li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button 
                onClick={() => openEditModal(pkg)}
                className="text-slate-500 hover:text-primary-600 transition-colors p-2 rounded-lg hover:bg-primary-50"
                title="Edit Package"
              >
                <Edit className="h-5 w-5" />
              </button>
              {pkg.isActive && (
                <button 
                  onClick={() => deletePackage(pkg._id)}
                  className="text-slate-500 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                  title="Deactivate Package"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Package Form Modal */}
      {(isModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary-500" />
                {isEditModalOpen ? 'Edit Package' : 'Create Package'}
              </h2>
              <button onClick={() => { setIsModalOpen(false); setIsEditModalOpen(false); }} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Package Name (e.g., Starter, Pro)</label>
                  <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹)</label>
                    <input type="number" name="price" required value={formData.price} onChange={handleInputChange} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Duration (Months)</label>
                    <select name="durationMonths" value={formData.durationMonths} onChange={handleInputChange} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="1">Monthly (1)</option>
                      <option value="12">Yearly (12)</option>
                      <option value="24">2 Years (24)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Admins Allowed</label>
                  <input type="number" name="maxAdmins" required min="1" value={formData.maxAdmins} onChange={handleInputChange} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Features (Comma separated)</label>
                  <textarea name="features" rows="3" placeholder="e.g., 5 Users, Standard Support, No API Access" value={formData.features} onChange={handleInputChange} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => { setIsModalOpen(false); setIsEditModalOpen(false); }} className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-500 transition-colors shadow-sm">
                  {isEditModalOpen ? 'Save Changes' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPackages;
