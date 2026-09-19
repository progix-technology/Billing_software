import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { Building2, Users, CheckCircle2, XCircle, Plus, Edit, Key } from 'lucide-react';
import { Skeleton, Stack } from '../components/UI/Skeleton';

const SuperAdminDashboard = () => {
  const [tenants, setTenants] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTenantId, setEditingTenantId] = useState(null);
  const [isAdminsModalOpen, setIsAdminsModalOpen] = useState(false);
  const [selectedTenantForAdmins, setSelectedTenantForAdmins] = useState(null);
  const [newPasswords, setNewPasswords] = useState({});
  
  // Form State
  const [formData, setFormData] = useState({
    businessName: '',
    contactEmail: '',
    contactPhone: '',
    plan: 'basic',
    adminUsername: '',
    adminEmail: '',
    adminPassword: ''
  });

  const [editFormData, setEditFormData] = useState({
    businessName: '',
    contactEmail: '',
    contactPhone: '',
    plan: 'basic',
    status: 'active',
    validTill: ''
  });

  useEffect(() => {
    fetchTenants();
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await api.get('/api/packages');
      setPackages(res.data.packages.filter(p => p.isActive));
    } catch (err) {
      console.error('Failed to load packages', err);
    }
  };

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/tenants');
      setTenants(res.data.tenants);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load tenants';
      setError(errorMessage);
      console.error('Tenant fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/tenants', formData);
      setIsModalOpen(false);
      setFormData({
        businessName: '',
        contactEmail: '',
        contactPhone: '',
        plan: 'basic',
        adminUsername: '',
        adminEmail: '',
        adminPassword: ''
      });
      fetchTenants();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create tenant');
    }
  };

  const openEditModal = (tenant) => {
    setEditingTenantId(tenant._id);
    setEditFormData({
      businessName: tenant.businessName || '',
      contactEmail: tenant.contactEmail || '',
      contactPhone: tenant.contactPhone || '',
      plan: tenant.plan || 'basic',
      status: tenant.status || 'active',
      // Format validTill for input[type="date"]
      validTill: tenant.validTill ? new Date(tenant.validTill).toISOString().split('T')[0] : ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/tenants/${editingTenantId}`, editFormData);
      setIsEditModalOpen(false);
      fetchTenants();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update tenant');
    }
  };

  const handlePasswordChange = (userId, value) => {
    setNewPasswords((prev) => ({ ...prev, [userId]: value }));
  };

  const handleResetPasswordSubmit = async (userId) => {
    if (!newPasswords[userId] || newPasswords[userId].length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    try {
      await api.put(`/api/tenants/${selectedTenantForAdmins._id}/users/${userId}/password`, {
        password: newPasswords[userId]
      });
      alert('Password reset successfully');
      setNewPasswords((prev) => ({ ...prev, [userId]: '' }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const openAdminsModal = (tenant) => {
    setSelectedTenantForAdmins(tenant);
    setIsAdminsModalOpen(true);
    setNewPasswords({});
  };

  if (loading) return (
    <div className="space-y-6">
      <Stack spacing={2} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <Skeleton variant="text" style={{ fontSize: '2rem' }} width="40%" />
        <Skeleton variant="text" style={{ fontSize: '1rem' }} width="20%" />
      </Stack>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <Stack key={i} spacing={2} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex gap-4 items-center">
              <Skeleton variant="circular" width={40} height={40} />
              <Skeleton variant="text" width="60%" height={24} />
            </div>
            <Skeleton variant="rectangular" height={80} className="w-full rounded-xl" />
            <Skeleton variant="rounded" height={40} className="w-full" />
          </Stack>
        ))}
      </div>
    </div>
  );

  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tenants Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage businesses using the platform</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Tenant
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants.map(tenant => (
          <div key={tenant._id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-lg">{tenant.businessName}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    tenant.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {tenant.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => openEditModal(tenant)}
                className="text-slate-400 hover:text-primary-600 transition-colors p-1"
                title="Edit Tenant"
              >
                <Edit className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 text-sm text-slate-600 mb-4">
              <p><strong>Email:</strong> {tenant.contactEmail || 'N/A'}</p>
              <p><strong>Phone:</strong> {tenant.contactPhone || 'N/A'}</p>
              <p><strong>Plan:</strong> <span className="uppercase text-primary-600 font-semibold">{tenant.plan}</span></p>
              <p><strong>Expires:</strong> {tenant.validTill ? new Date(tenant.validTill).toLocaleDateString() : 'N/A'}</p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <Users className="h-4 w-4" />
                <span>{tenant.adminCount} Admins</span>
              </div>
              <button 
                onClick={() => openAdminsModal(tenant)}
                className="text-xs font-medium text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-colors"
              >
                Manage Admins
              </button>
            </div>
          </div>
        ))}
        {tenants.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed">
            No tenants found. Click "Add Tenant" to onboard a business.
          </div>
        )}
      </div>

      {/* Add Tenant Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary-500" />
                Onboard New Tenant
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-6">
                
                {/* Business Details */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2">Business Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Business Name *</label>
                      <input type="text" name="businessName" required value={formData.businessName} onChange={handleInputChange} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Subscription Plan</label>
                      <select name="plan" value={formData.plan} onChange={handleInputChange} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                        {packages.map(pkg => (
                          <option key={pkg._id} value={pkg.name}>{pkg.name.toUpperCase()} (₹{pkg.price})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
                      <input type="email" name="contactEmail" value={formData.contactEmail} onChange={handleInputChange} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                      <input type="text" name="contactPhone" value={formData.contactPhone} onChange={handleInputChange} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                  </div>
                </div>

                {/* Admin User Details */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2">Primary Admin Account</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Admin Username *</label>
                      <input type="text" name="adminUsername" required value={formData.adminUsername} onChange={handleInputChange} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Admin Email *</label>
                      <input type="email" name="adminEmail" required value={formData.adminEmail} onChange={handleInputChange} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Admin Password *</label>
                      <input type="password" name="adminPassword" required value={formData.adminPassword} onChange={handleInputChange} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                  </div>
                </div>

              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-500 transition-colors shadow-sm">
                  Create Tenant & Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tenant Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary-500" />
                Edit Tenant
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2">Business & Subscription Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Business Name *</label>
                      <input type="text" name="businessName" required value={editFormData.businessName} onChange={handleEditInputChange} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Account Status</label>
                      <select name="status" value={editFormData.status} onChange={handleEditInputChange} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Subscription Plan</label>
                      <select name="plan" value={editFormData.plan} onChange={handleEditInputChange} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                        {packages.map(pkg => (
                          <option key={pkg._id} value={pkg.name}>{pkg.name.toUpperCase()} (₹{pkg.price})</option>
                        ))}
                        {/* If the current plan is not in the active packages list, still show it as an option so it doesn't break */}
                        {!packages.find(p => p.name === editFormData.plan) && (
                          <option value={editFormData.plan}>{editFormData.plan.toUpperCase()} (Legacy)</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Validity Date</label>
                      <input type="date" name="validTill" value={editFormData.validTill} onChange={handleEditInputChange} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
                      <input type="email" name="contactEmail" value={editFormData.contactEmail} onChange={handleEditInputChange} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                      <input type="text" name="contactPhone" value={editFormData.contactPhone} onChange={handleEditInputChange} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-500 transition-colors shadow-sm">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Admins Modal */}
      {isAdminsModalOpen && selectedTenantForAdmins && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary-500" />
                Manage Admins - {selectedTenantForAdmins.businessName}
              </h2>
              <button onClick={() => setIsAdminsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh] no-scrollbar">
              {(!selectedTenantForAdmins.users || selectedTenantForAdmins.users.length === 0) ? (
                <div className="text-center py-8 text-slate-500">No admins found for this tenant.</div>
              ) : (
                <div className="space-y-4">
                  {selectedTenantForAdmins.users.map((user) => (
                    <div key={user._id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50 gap-4">
                      <div>
                        <p className="font-semibold text-slate-800">{user.username}</p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder="New Password" 
                            className="w-40 md:w-48 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={newPasswords[user._id] || ''}
                            onChange={(e) => handlePasswordChange(user._id, e.target.value)}
                          />
                        </div>
                        <button 
                          onClick={() => handleResetPasswordSubmit(user._id)}
                          className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                        >
                          <Key className="h-4 w-4" />
                          Reset
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SuperAdminDashboard;
