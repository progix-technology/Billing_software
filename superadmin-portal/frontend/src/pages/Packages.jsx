import React, { useState, useEffect } from 'react';
import api from '../api';
import { Package as PkgIcon, Plus, Check, Loader2, Trash2 } from 'lucide-react';

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    durationDays: 365,
    description: '',
    featuresText: ''
  });

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/packages');
      if (res.data.success) {
        setPackages(res.data.packages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const features = formData.featuresText.split('\n').map(s => s.trim()).filter(Boolean);
      await api.post('/packages', {
        name: formData.name,
        price: Number(formData.price),
        durationDays: Number(formData.durationDays),
        description: formData.description,
        features
      });
      setIsModalOpen(false);
      setFormData({ name: '', price: '', durationDays: 365, description: '', featuresText: '' });
      fetchPackages();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create package');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this package?')) return;
    try {
      await api.delete(`/packages/${id}`);
      fetchPackages();
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <PkgIcon className="h-6 w-6 text-indigo-400" />
            <span>Pricing Tiers & Packages</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure software plans, pricing, and subscription duration.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30"
        >
          <Plus className="h-4 w-4" />
          <span>New Plan Tier</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">Loading packages...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {packages.map((pkg) => (
            <div key={pkg._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative flex flex-col justify-between">
              {pkg.isPopular && (
                <span className="absolute top-4 right-4 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                  Popular
                </span>
              )}
              <div>
                <h3 className="text-lg font-black text-white">{pkg.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{pkg.description}</p>
                <div className="my-4">
                  <span className="text-3xl font-black text-white">₹{pkg.price}</span>
                  <span className="text-xs text-slate-400 ml-1">/ {pkg.durationDays >= 36500 ? 'Lifetime' : `${pkg.durationDays} Days`}</span>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-800">
                  {pkg.features?.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800/80 mt-6 flex justify-end">
                <button
                  onClick={() => handleDelete(pkg._id)}
                  className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 text-xs flex items-center gap-1.5 font-bold"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-black text-white mb-4">Create New Plan Tier</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Platinum 2-Year"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="7999"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    required
                    placeholder="730"
                    value={formData.durationDays}
                    onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Short Description</label>
                <input
                  type="text"
                  placeholder="Best for chain retail stores"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Features (One per line)</label>
                <textarea
                  rows="4"
                  placeholder="Unlimited Invoicing&#10;Barcode Generation&#10;Thermal Print"
                  value={formData.featuresText}
                  onChange={(e) => setFormData({ ...formData, featuresText: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Packages;
