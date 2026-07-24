import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Camera, CheckCircle, AlertCircle, Save, Shield, Edit2, X } from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();

  // Mode states
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  // Basic Info state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setProfileImage(user.profileImage || '');
      setImagePreview(user.profileImage || '');
    }
  }, [user]);

  const handleCancelDetails = () => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setProfileImage(user.profileImage || '');
      setImagePreview(user.profileImage || '');
    }
    setIsEditingDetails(false);
    setError('');
  };

  const handleCancelPassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsEditingPassword(false);
    setError('');
  };

  const handleImageChange = (e) => {
    if (!isEditingDetails) return; // Prevent change if not in edit mode
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError('Image file is too large. Maximum size allowed is 8MB.');
      e.target.value = null;
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result);
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateBasicInfo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      const res = await api.put('/api/auth/profile', {
        username,
        email,
        profileImage,
      });

      if (res.data.success) {
        setSuccess('Basic profile details updated successfully!');
        if (res.data.user) {
          updateUser(res.data.user);
        }
        setIsEditingDetails(false);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password fields do not match.');
      return;
    }

    setLoading(true);
    setSuccess('');
    setError('');

    try {
      const res = await api.put('/api/auth/profile', {
        currentPassword,
        newPassword,
      });

      if (res.data.success) {
        setSuccess('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setIsEditingPassword(false);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="h-6 w-6 text-primary-500" />
          My Profile Configuration
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal details, credentials, profile image, and platform security credentials.
        </p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl flex items-center gap-3 text-sm animate-fade-in">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center gap-3 text-sm animate-fade-in">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & General Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col items-center justify-between transition-all">
          <div className="w-full flex flex-col items-center">
            <h3 className="w-full font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 text-sm uppercase tracking-wider text-slate-400">
              <Shield className="h-5 w-5 text-primary-500" /> Avatar Summary
            </h3>

            {/* Avatar Preview */}
            <div className="relative mt-8 group">
              <div className="h-32 w-32 rounded-full overflow-hidden border-2 border-primary-600 dark:border-primary-500 bg-slate-100 dark:bg-slate-950 flex items-center justify-center text-4xl font-black text-slate-800 dark:text-slate-100 uppercase shadow-lg">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  user ? user.username.slice(0, 2) : 'US'
                )}
              </div>
              
              {/* Only show camera edit icon if in edit mode */}
              {isEditingDetails && (
                <label className="absolute bottom-1 right-1 h-10 w-10 bg-primary-600 hover:bg-primary-500 text-white rounded-full flex items-center justify-center cursor-pointer shadow-md transition-all border-2 border-white dark:border-slate-900">
                  <Camera className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="text-center mt-6 space-y-2">
              <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 uppercase">{user?.username}</h4>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 capitalize border border-primary-200 dark:border-primary-500/20">
                {user?.role} Access
              </span>
            </div>

            <div className="w-full mt-8 space-y-3.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl">
              <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-slate-800 pb-2">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Account Status</span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-500 font-semibold uppercase text-[10px]">Active</span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Email ID</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[150px]">{user?.email}</span>
              </div>
            </div>
          </div>
          
          <div className="w-full mt-6 text-center text-[10px] text-slate-400">
            {isEditingDetails ? 'Recommended avatar: 1:1 ratio square (max 8MB).' : 'Click "Edit Profile Details" in the forms panel to modify settings.'}
          </div>
        </div>

        {/* Right Column: Edit Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form 1: General Details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm transition-all">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider text-slate-400">
                <User className="h-5 w-5 text-primary-500" /> Account details
              </h3>
              
              {!isEditingDetails && (
                <button
                  type="button"
                  onClick={() => setIsEditingDetails(true)}
                  className="flex items-center gap-1 bg-primary-50 hover:bg-primary-100 text-primary-600 px-3 py-1.5 rounded-xl border border-primary-200/50 text-xs font-bold transition-all"
                >
                  <Edit2 className="h-3 w-3" /> Edit Profile Details
                </button>
              )}
            </div>

            <form onSubmit={handleUpdateBasicInfo} className="space-y-4 text-xs md:text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Username / Profile Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      disabled={!isEditingDetails}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`w-full border rounded-xl py-2 pl-10 pr-3 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all ${
                        isEditingDetails
                          ? 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
                          : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-500 cursor-not-allowed'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="email"
                      required
                      disabled={!isEditingDetails}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full border rounded-xl py-2 pl-10 pr-3 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all ${
                        isEditingDetails
                          ? 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
                          : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-500 cursor-not-allowed'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">System Authorization Role</label>
                <input
                  type="text"
                  disabled
                  value={user?.role || 'staff'}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl py-2 px-3 text-slate-400 capitalize cursor-not-allowed font-semibold"
                />
              </div>

              {isEditingDetails && (
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelDetails}
                    className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-4 py-2.5 rounded-xl text-xs transition-all border border-slate-200 dark:border-slate-700"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md text-xs disabled:opacity-50 transition-all"
                  >
                    <Save className="h-4 w-4" />
                    {loading ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Form 2: Password Update */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm transition-all">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider text-slate-400">
                <Lock className="h-5 w-5 text-primary-500" /> Security Credentials
              </h3>
              
              {!isEditingPassword && (
                <button
                  type="button"
                  onClick={() => setIsEditingPassword(true)}
                  className="flex items-center gap-1 bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                >
                  <Lock className="h-3 w-3" /> Change Password
                </button>
              )}
            </div>

            {isEditingPassword ? (
              <form onSubmit={handleChangePassword} className="space-y-4 text-xs md:text-sm">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-3 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-3 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Verify new password"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-3 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelPassword}
                    className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-4 py-2.5 rounded-xl text-xs transition-all border border-slate-200 dark:border-slate-700"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md text-xs disabled:opacity-50 transition-all"
                  >
                    <Save className="h-4 w-4" />
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl text-xs text-slate-500 leading-relaxed">
                Password credentials are currently locked. Click the "Change Password" button to verify your old password and supply new security details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
