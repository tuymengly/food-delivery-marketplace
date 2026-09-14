import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Camera, CheckCircle2, KeyRound, Loader2, Save, Shield, User } from 'lucide-react';
import { getAdminProfile, updateAdminPassword, updateAdminProfile } from '../../../services/adminService';
import { uploadImageToCloudinary } from '../../../services/cloudinary';

const emptyPasswords = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const profileFromResponse = (response) => response.data?.data || response.data || {};

export default function Profile() {
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    status: '',
    profile_image: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState(emptyPasswords);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [notice, setNotice] = useState('');

  const publishProfile = (updatedProfile) => {
    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const nextUser = { ...savedUser, ...updatedProfile };
    localStorage.setItem('user', JSON.stringify(nextUser));
    localStorage.setItem('admin_user', JSON.stringify(nextUser));
    window.dispatchEvent(new CustomEvent('admin-profile-updated', { detail: updatedProfile }));
  };

  useEffect(() => {
    let mounted = true;

    getAdminProfile()
      .then((response) => {
        if (!mounted) return;
        const user = profileFromResponse(response);
        const nextProfile = {
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          role: user.role || 'Admin',
          status: user.status || 'Active',
          profile_image: user.profile_image || user.avatar || '',
        };
        setProfile(nextProfile);
        setPreview(nextProfile.profile_image);
        publishProfile(nextProfile);
      })
      .catch((requestError) => {
        if (mounted) setError(requestError.response?.data?.message || 'Could not load your profile.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  useEffect(() => () => {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
  }, [preview]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');

    try {
      setSavingProfile(true);
      const response = await updateAdminProfile({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        profile_image: profile.profile_image || null,
      });
      const savedProfile = profileFromResponse(response);
      const updatedProfile = { ...profile, ...savedProfile };
      setProfile(updatedProfile);
      publishProfile(updatedProfile);
      setNotice('Profile details saved.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save your profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePhoto = async () => {
    if (!selectedFile) return;

    setError('');
    setNotice('');
    try {
      setSavingPhoto(true);
      const imageUrl = await uploadImageToCloudinary(selectedFile, 'profiles');
      const response = await updateAdminProfile({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        profile_image: imageUrl,
      });
      const savedProfile = profileFromResponse(response);
      const updatedProfile = { ...profile, ...savedProfile, profile_image: savedProfile.profile_image || imageUrl };
      setProfile(updatedProfile);
      setPreview(updatedProfile.profile_image);
      setSelectedFile(null);
      publishProfile(updatedProfile);
      setNotice('Profile photo saved.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Could not save your profile photo.');
    } finally {
      setSavingPhoto(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setNotice('');

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    try {
      setChangingPassword(true);
      await updateAdminPassword({
        current_password: passwords.currentPassword,
        new_password: passwords.newPassword,
        new_password_confirmation: passwords.confirmPassword,
      });
      setPasswords(emptyPasswords);
      setNotice('Password changed successfully.');
    } catch (requestError) {
      setPasswordError(requestError.response?.data?.message || 'Could not change your password.');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return <div className="flex items-center gap-2 py-20 text-sm text-slate-500"><Loader2 size={18} className="animate-spin" /> Loading profile...</div>;
  }

  return (
    <div className="max-w-4xl space-y-8 p-1 sm:p-2">
      <header className="border-b border-slate-300 pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2563EB]">Account</p>
        <h1 className="mt-1 text-2xl font-bold text-[#0B1F3A]">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your personal information and account security.</p>
      </header>

      {(error || notice) && (
        <div className={`flex items-center gap-2 border px-3 py-2.5 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {error ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{error || notice}</span>
        </div>
      )}

      <section className="border-b border-slate-300 pb-8">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <User size={18} className="text-[#2563EB]" />
          <h2 className="text-base font-bold text-slate-900">Personal information</h2>
        </div>

        <div className="grid gap-8 py-6 md:grid-cols-[180px_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Profile photo</p>
            <div className="mt-3 flex items-center gap-3 md:block">
              {preview ? (
                <img src={preview} alt="Admin profile" className="h-24 w-24 rounded-md border border-slate-300 object-cover" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-md bg-[#163A63] text-3xl font-bold text-white">
                  {profile.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
              )}
              <div className="mt-0 md:mt-3">
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="sr-only" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  <Camera size={14} /> Change photo
                </button>
                {selectedFile && (
                  <button type="button" onClick={handleSavePhoto} disabled={savingPhoto} className="mt-2 flex items-center gap-2 bg-[#0B1F3A] px-3 py-2 text-xs font-semibold text-white hover:bg-[#163A63] disabled:opacity-60">
                    {savingPhoto ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save photo
                  </button>
                )}
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">JPG, PNG, or WEBP. Maximum 5 MB.</p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">Full name
                <input required value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} className="dashboard-input mt-1.5 w-full px-3 py-2 text-sm" />
              </label>
              <label className="block text-sm font-semibold text-slate-700">Phone number
                <input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} className="dashboard-input mt-1.5 w-full px-3 py-2 text-sm" />
              </label>
            </div>
            <label className="block text-sm font-semibold text-slate-700">Email address <span className="font-normal text-slate-400">(read-only)</span>
              <input type="email" value={profile.email} readOnly className="dashboard-input mt-1.5 w-full bg-slate-50 px-3 py-2 text-sm text-slate-500" />
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">Role
                <input value={profile.role} readOnly className="dashboard-input mt-1.5 w-full bg-slate-50 px-3 py-2 text-sm capitalize text-slate-500" />
              </label>
              <label className="block text-sm font-semibold text-slate-700">Status
                <input value={profile.status} readOnly className="dashboard-input mt-1.5 w-full bg-slate-50 px-3 py-2 text-sm text-slate-500" />
              </label>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={savingProfile} className="flex items-center gap-2 bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163A63] disabled:opacity-60">
                {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save changes
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="max-w-3xl pb-8">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Shield size={18} className="text-[#2563EB]" />
          <h2 className="text-base font-bold text-slate-900">Security</h2>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-5 py-6">
          {passwordError && <div className="flex items-center gap-2 border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"><AlertCircle size={16} /> {passwordError}</div>}
          <div className="grid gap-5 sm:grid-cols-3">
            <label className="block text-sm font-semibold text-slate-700">Current password
              <input required type="password" value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} className="dashboard-input mt-1.5 w-full px-3 py-2 text-sm" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">New password
              <input required minLength={8} type="password" value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} className="dashboard-input mt-1.5 w-full px-3 py-2 text-sm" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">Confirm password
              <input required minLength={8} type="password" value={passwords.confirmPassword} onChange={(event) => setPasswords({ ...passwords, confirmPassword: event.target.value })} className="dashboard-input mt-1.5 w-full px-3 py-2 text-sm" />
            </label>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={changingPassword} className="flex items-center gap-2 border border-[#0B1F3A] bg-white px-4 py-2 text-sm font-semibold text-[#0B1F3A] hover:bg-slate-50 disabled:opacity-60">
              {changingPassword ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />} Change password
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
