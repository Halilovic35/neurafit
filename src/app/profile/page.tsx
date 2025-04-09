'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

export default function ProfilePage() {
  const { user, updateProfile, changePassword, deleteAccount } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.profile?.name || '',
    avatar: user?.profile?.avatar || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [deleteFeedback, setDeleteFeedback] = useState('');

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(profileData);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      toast.success('Password changed successfully');
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error('Failed to change password');
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await deleteAccount(deleteConfirmPassword);
      toast.success('Account deleted successfully');
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

      {/* General User Information */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-md">
        <h2 className="text-2xl font-semibold mb-4">General Information</h2>
        {isEditing ? (
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Avatar URL</label>
              <input
                type="text"
                value={profileData.avatar}
                onChange={(e) => setProfileData({ ...profileData, avatar: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              {user.profile?.avatar && (
                <Image
                  src={user.profile.avatar}
                  alt="Profile"
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              )}
              <div>
                <p className="font-medium">{user.profile?.name || 'No name set'}</p>
                <p className="text-gray-500">{user.email}</p>
                <p className="text-sm mt-1">
                  Subscription Status:{' '}
                  <span className={user.subscription?.isPremium ? 'text-green-500' : 'text-gray-500'}>
                    {user.subscription?.isPremium ? 'Premium' : 'Free'}
                  </span>
                </p>
                {user.subscription?.isPremium && user.subscription.endDate && (
                  <p className="text-sm text-gray-500">
                    Premium expires: {new Date(user.subscription.endDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Edit Profile
            </button>
          </div>
        )}
      </section>

      {/* Change Password */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Change Password</h2>
        {isChangingPassword ? (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Current Password</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Change Password
              </button>
              <button
                type="button"
                onClick={() => setIsChangingPassword(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsChangingPassword(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Change Password
          </button>
        )}
      </section>

      {/* Delete Account */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Delete Account</h2>
        {isDeletingAccount ? (
          <form onSubmit={handleDeleteAccount} className="space-y-4">
            <p className="text-red-500">
              Warning: This action cannot be undone. Your account and all associated data will be
              permanently deleted.
            </p>
            <div>
              <label className="block text-sm font-medium mb-1">
                Enter your password to confirm deletion
              </label>
              <input
                type="password"
                value={deleteConfirmPassword}
                onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Please tell us why you're leaving (optional)
              </label>
              <textarea
                value={deleteFeedback}
                onChange={(e) => setDeleteFeedback(e.target.value)}
                className="w-full p-2 border rounded"
                rows={3}
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Confirm Delete
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDeletingAccount(false);
                  setDeleteConfirmPassword('');
                  setDeleteFeedback('');
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsDeletingAccount(true)}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Delete Account
          </button>
        )}
      </section>
    </div>
  );
} 