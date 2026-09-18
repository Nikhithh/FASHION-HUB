import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiUser, FiLock, FiMapPin, FiEdit, FiTrash2 } from 'react-icons/fi';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  // Update-profile form
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  // Change-password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);

  // Saved addresses
  const [addresses, setAddresses] = useState([]);
  const [addrLabel, setAddrLabel] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrPostal, setAddrPostal] = useState('');
  const [addrCountry, setAddrCountry] = useState('');
  const [editingAddrId, setEditingAddrId] = useState(null);
  const [addrSaving, setAddrSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await api.get('/users/profile');
        if (res.data && res.data.success) {
          setProfile(res.data.data);
          setName(res.data.data.name || '');
        }
      } catch (err) {
        console.error('Failed to load profile', err);
        toast.error(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    const fetchAddresses = async () => {
      try {
        const res = await api.get('/users/addresses');
        if (res.data && res.data.success) setAddresses(res.data.data || []);
      } catch (err) {
        console.error('Failed to load addresses', err);
      }
    };
    fetchProfile();
    fetchAddresses();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error('Name must be at least 2 characters long');
      return;
    }
    setSaving(true);
    try {
      const res = await api.put('/users/profile', { name: trimmed });
      if (res.data && res.data.success) {
        setProfile(res.data.data);
        // Keep navbar/auth in sync with the new name
        if (setUser && user) setUser({ ...user, name: res.data.data.name });
        toast.success('Profile updated successfully!');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const resetAddrForm = () => {
    setAddrLabel('');
    setAddrStreet('');
    setAddrCity('');
    setAddrPostal('');
    setAddrCountry('');
    setEditingAddrId(null);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!addrStreet.trim() || !addrCity.trim() || !addrPostal.trim() || !addrCountry.trim()) {
      toast.error('Street, city, postal code and country are required');
      return;
    }
    setAddrSaving(true);
    try {
      const payload = {
        label: addrLabel.trim(),
        address: addrStreet.trim(),
        city: addrCity.trim(),
        postalCode: addrPostal.trim(),
        country: addrCountry.trim(),
      };
      const res = editingAddrId
        ? await api.put(`/users/addresses/${editingAddrId}`, payload)
        : await api.post('/users/addresses', payload);
      if (res.data && res.data.success) {
        setAddresses(res.data.data || []);
        toast.success(editingAddrId ? 'Address updated!' : 'Address added!');
        resetAddrForm();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save address');
    } finally {
      setAddrSaving(false);
    }
  };

  const startEditAddress = (addr) => {
    setEditingAddrId(addr._id);
    setAddrLabel(addr.label || '');
    setAddrStreet(addr.address || '');
    setAddrCity(addr.city || '');
    setAddrPostal(addr.postalCode || '');
    setAddrCountry(addr.country || '');
  };

  const handleDeleteAddress = async (addrId) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      const res = await api.delete(`/users/addresses/${addrId}`);
      if (res.data && res.data.success) {
        setAddresses(res.data.data || []);
        if (editingAddrId === addrId) resetAddrForm();
        toast.success('Address deleted');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete address');
    }
  };

  const handleChangePassword = async (e) => {    e.preventDefault();
    if (!currentPassword) {
      toast.error('Current password is required');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    if (newPassword === currentPassword) {
      toast.error('New password must be different from current password');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setChanging(true);
    try {
      const res = await api.put('/users/change-password', { currentPassword, newPassword });
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChanging(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-16 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded"></div>
        <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
      </div>
    );
  }

  return (
    <div className="pb-16 max-w-2xl mx-auto space-y-8 text-left">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
        <FiUser className="text-purple-600 dark:text-purple-400" />
        My Profile
      </h1>

      {/* Profile details */}
      <form onSubmit={handleUpdateProfile} className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-5">
        <h2 className="font-bold text-lg text-gray-950 dark:text-white uppercase tracking-wider">Account Details</h2>
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
          <input
            type="text"
            required
            minLength={2}
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-2.5 bg-white dark:bg-[#16171d] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email (read only)</label>
          <input
            type="email"
            value={profile?.email || user?.email || ''}
            readOnly
            disabled
            className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-850 border border-gray-300 dark:border-gray-800 rounded-xl text-sm text-gray-500 cursor-not-allowed focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Role (read only)</label>
          <input
            type="text"
            value={profile?.role || user?.role || ''}
            readOnly
            disabled
            className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-850 border border-gray-300 dark:border-gray-800 rounded-xl text-sm text-gray-500 capitalize cursor-not-allowed focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold rounded-xl shadow-sm"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {/* Saved addresses */}
      <div className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-5">
        <h2 className="font-bold text-lg text-gray-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <FiMapPin className="text-purple-600 dark:text-purple-400" />
          Saved Addresses ({addresses.length})
        </h2>

        {addresses.length > 0 && (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {addresses.map((addr) => (
              <li key={addr._id} className="py-3 flex items-start justify-between gap-4">
                <div className="text-sm">
                  {addr.label && (
                    <p className="font-bold text-gray-900 dark:text-gray-200">{addr.label}</p>
                  )}
                  <p className="text-gray-600 dark:text-gray-400">
                    {addr.address}, {addr.city} {addr.postalCode}, {addr.country}
                  </p>
                </div>
                <div className="flex gap-3 flex-shrink-0">
                  <button type="button" onClick={() => startEditAddress(addr)} className="text-blue-600 hover:text-blue-800" title="Edit address">
                    <FiEdit size={16} />
                  </button>
                  <button type="button" onClick={() => handleDeleteAddress(addr._id)} className="text-red-600 hover:text-red-800" title="Delete address">
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleSaveAddress} className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider pt-4">
            {editingAddrId ? 'Edit Address' : 'Add New Address'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Label (optional)</label>
              <input
                type="text"
                value={addrLabel}
                onChange={(e) => setAddrLabel(e.target.value)}
                placeholder="Home, Office..."
                maxLength={30}
                className="w-full px-4 py-2.5 bg-white dark:bg-[#16171d] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Street Address *</label>
              <input
                type="text"
                required
                value={addrStreet}
                onChange={(e) => setAddrStreet(e.target.value)}
                placeholder="123 Fashion Ave, Apt 4B"
                className="w-full px-4 py-2.5 bg-white dark:bg-[#16171d] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">City *</label>
              <input
                type="text"
                required
                value={addrCity}
                onChange={(e) => setAddrCity(e.target.value)}
                placeholder="New York"
                className="w-full px-4 py-2.5 bg-white dark:bg-[#16171d] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Postal Code *</label>
              <input
                type="text"
                required
                value={addrPostal}
                onChange={(e) => setAddrPostal(e.target.value)}
                placeholder="10001"
                className="w-full px-4 py-2.5 bg-white dark:bg-[#16171d] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Country *</label>
              <input
                type="text"
                required
                value={addrCountry}
                onChange={(e) => setAddrCountry(e.target.value)}
                placeholder="United States"
                className="w-full px-4 py-2.5 bg-white dark:bg-[#16171d] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={addrSaving}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold rounded-xl shadow-sm text-sm"
            >
              {addrSaving ? 'Saving...' : editingAddrId ? 'Update Address' : 'Add Address'}
            </button>
            {editingAddrId && (
              <button
                type="button"
                onClick={resetAddrForm}
                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Change password */}
      <form onSubmit={handleChangePassword} className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-5">
        <h2 className="font-bold text-lg text-gray-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <FiLock className="text-purple-600 dark:text-purple-400" />
          Change Password
        </h2>
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Current Password</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full px-4 py-2.5 bg-white dark:bg-[#16171d] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full px-4 py-2.5 bg-white dark:bg-[#16171d] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full px-4 py-2.5 bg-white dark:bg-[#16171d] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={changing}
          className="px-6 py-2.5 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-200 dark:text-gray-900 disabled:opacity-50 text-white font-semibold rounded-xl"
        >
          {changing ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
