import { useEffect, useRef, useState } from 'react';
import { Camera, KeyRound, Save } from 'lucide-react';
import { changePassword, getProfile, updateProfile, uploadProfileImage } from '../api/profile';

const initialPassword = { current_password: '', new_password: '', new_password_confirmation: '' };

export default function Profile() {
  const fileInput = useRef(null);
  const [user, setUser] = useState({ name: '', email: '', phone: '', profile_image: '' });
  const [preview, setPreview] = useState('');
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState(initialPassword);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    getProfile()
      .then(({ data }) => {
        const profile = data.data?.user || data.data || data;
        setUser({ name: profile.name || '', email: profile.email || '', phone: profile.phone || '', profile_image: profile.profile_image || '' });
        setPreview(profile.profile_image || '');
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Could not load your profile.'));
  }, []);

  const publish = (profile) => {
    const nextUser = { ...JSON.parse(localStorage.getItem('user') || '{}'), ...profile };
    localStorage.setItem('user', JSON.stringify(nextUser));
    localStorage.setItem('currentUser', JSON.stringify(nextUser));
    window.dispatchEvent(new Event('authChanged'));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true); setError(''); setMessage('');
    try {
      let image = user.profile_image;
      if (file) image = await uploadProfileImage(file);
      const { data } = await updateProfile({ name: user.name, phone: user.phone, profile_image: image || null });
      const saved = data.data || data;
      const updated = { ...user, ...saved, profile_image: saved.profile_image || image };
      setUser(updated); setPreview(updated.profile_image); setFile(null); publish(updated); setMessage('Profile saved.');
    } catch (requestError) { setError(requestError.response?.data?.message || requestError.message || 'Could not save your profile.'); }
    finally { setSaving(false); }
  };

  const savePassword = async (event) => {
    event.preventDefault(); setChangingPassword(true); setError(''); setMessage('');
    if (password.new_password !== password.new_password_confirmation) {
      setError('New password and confirmation do not match.');
      setChangingPassword(false);
      return;
    }
    try { await changePassword(password); setPassword(initialPassword); setMessage('Password changed.'); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Could not change your password.'); }
    finally { setChangingPassword(false); }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-800 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your account information.</p>
        {(message || error) && <p className={`mt-5 border px-3 py-2 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{error || message}</p>}

        <form onSubmit={saveProfile} className="mt-8 border-t border-slate-300 pt-6">
          <div className="flex items-start gap-5">
            {preview ? <img src={preview} alt="Profile" className="h-20 w-20 rounded-md border border-slate-300 object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-md bg-orange-500 text-2xl font-bold text-white">{user.name.charAt(0).toUpperCase() || 'U'}</div>}
            <div>
              <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { const selected = event.target.files?.[0]; if (selected) { setFile(selected); setPreview(URL.createObjectURL(selected)); } }} />
              <button type="button" onClick={() => fileInput.current?.click()} className="flex items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 cursor-pointer"><Camera size={15} /> Change photo</button>
              <p className="mt-2 text-xs text-slate-500">JPG, PNG, or WEBP.</p>
            </div>
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">Full name<input required value={user.name} onChange={(event) => setUser({ ...user, name: event.target.value })} className="mt-1 block w-full border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-orange-500" /></label>
            <label className="text-sm font-semibold">Phone number<input value={user.phone} onChange={(event) => setUser({ ...user, phone: event.target.value })} className="mt-1 block w-full border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-orange-500" /></label>
            <label className="text-sm font-semibold sm:col-span-2">Email address<input readOnly value={user.email} className="mt-1 block w-full border border-slate-300 bg-slate-100 px-3 py-2 font-normal text-slate-500" /></label>
          </div>
          <button disabled={saving} className="mt-5 flex items-center gap-2 bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"><Save size={15} /> {saving ? 'Saving...' : 'Save changes'}</button>
        </form>

        <form onSubmit={savePassword} className="mt-10 border-t border-slate-300 pt-6">
          <h2 className="text-lg font-bold text-slate-900">Change password</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">{[['current_password', 'Current password'], ['new_password', 'New password'], ['new_password_confirmation', 'Confirm password']].map(([key, label]) => <label key={key} className="text-sm font-semibold">{label}<input required minLength={8} type="password" value={password[key]} onChange={(event) => setPassword({ ...password, [key]: event.target.value })} className="mt-1 block w-full border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-orange-500" /></label>)}</div>
          <button disabled={changingPassword} className="mt-5 flex items-center gap-2 border border-orange-600 bg-white px-4 py-2 text-sm font-semibold text-orange-700 disabled:opacity-60"><KeyRound size={15} /> Change password</button>
        </form>
      </div>
    </main>
  );
}