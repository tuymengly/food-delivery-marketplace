import React, { useState, useRef, useEffect } from 'react';
import { Upload, CheckCircle2, Loader2, AlertCircle, Clock, ImagePlus, X, FileText, FilePlus2, Hourglass, ShieldAlert, ShieldCheck } from 'lucide-react';
import API from '../../../services/api';
import { uploadImageToCloudinary, uploadFileToCloudinary } from '../../../services/cloudinary';

const DAYS = [
  ['monday', 'Monday'],
  ['tuesday', 'Tuesday'],
  ['wednesday', 'Wednesday'],
  ['thursday', 'Thursday'],
  ['friday', 'Friday'],
  ['saturday', 'Saturday'],
  ['sunday', 'Sunday'],
];

const defaultOpeningHours = () =>
  DAYS.reduce((acc, [key]) => ({ ...acc, [key]: { open: '09:00', close: '22:00', closed: false } }), {});

export default function RestaurantProfile() {
  const fileInputRef = useRef(null);
  const photosInputRef = useRef(null);
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [profile, setProfile] = useState({
    coverImage: '',
    name: '',
    cuisine: '',
    phone: '',
    email: '',
    address: '',
    deliveryFee: '',
    minOrder: '',
    avgDeliveryTime: '',
    description: '',
    status: 'pending',
    rejectionReason: '',
    openingHours: defaultOpeningHours(),
    photos: [],
    documents: [],
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const fetchProfile = async () => {
    try {
      setFetching(true);
      const response = await API.get('/restaurant/profile');
      const data = response.data.data || response.data;

      setProfile({
        coverImage: data.image || data.cover_image || 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=1200&auto=format&fit=crop&q=80',
        name: data.name || '',
        cuisine: data.cuisine || '',
        phone: data.phone || '',
        email: data.user?.email || data.email || '',
        address: data.address || '',
        deliveryFee: data.delivery_fee || '',
        minOrder: data.min_order || '',
        avgDeliveryTime: data.avg_delivery_time || '',
        description: data.description || '',
        status: data.status || 'pending',
        rejectionReason: data.rejection_reason || '',
        openingHours: { ...defaultOpeningHours(), ...(data.opening_hours || {}) },
        photos: Array.isArray(data.photos) ? data.photos : [],
        documents: Array.isArray(data.documents) ? data.documents : [],
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load restaurant profile.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const imageUrl = URL.createObjectURL(file);
      setProfile((prev) => ({ ...prev, coverImage: imageUrl }));
    }
  };

  const handleDayChange = (dayKey, field, value) => {
    setProfile((prev) => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [dayKey]: { ...prev.openingHours[dayKey], [field]: value },
      },
    }));
  };

  const handlePhotosSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingPhotos(true);
    setError('');
    try {
      const uploadedUrls = await Promise.all(files.map((file) => uploadImageToCloudinary(file, 'restaurants/photos')));
      setProfile((prev) => ({ ...prev, photos: [...prev.photos, ...uploadedUrls] }));
    } catch (err) {
      console.error('Error uploading photos:', err);
      setError(err.message || 'Failed to upload one or more photos.');
    } finally {
      setUploadingPhotos(false);
      if (photosInputRef.current) photosInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index) => {
    setProfile((prev) => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
  };

  const handleDocumentFileSelected = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!newDocName.trim()) {
      setError('Please give the document a name before uploading.');
      e.target.value = '';
      return;
    }
    setUploadingDoc(true);
    setError('');
    try {
      const url = await uploadFileToCloudinary(file, 'restaurants/documents');
      setProfile((prev) => ({ ...prev, documents: [...prev.documents, { name: newDocName.trim(), url }] }));
      setNewDocName('');
    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err.message || 'Failed to upload document.');
    } finally {
      setUploadingDoc(false);
      e.target.value = '';
    }
  };

  const handleRemoveDocument = (index) => {
    setProfile((prev) => ({ ...prev, documents: prev.documents.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const image = selectedFile
        ? await uploadImageToCloudinary(selectedFile, 'restaurants')
        : profile.coverImage;

      const response = await API.put('/restaurant/profile', {
        name: profile.name,
        cuisine: profile.cuisine,
        phone: profile.phone,
        email: profile.email,
        address: profile.address,
        delivery_fee: profile.deliveryFee,
        min_order: profile.minOrder,
        avg_delivery_time: profile.avgDeliveryTime,
        description: profile.description,
        opening_hours: profile.openingHours,
        photos: profile.photos,
        documents: profile.documents,
        ...(image ? { image } : {}),
      });

      setSelectedFile(null);
      const saved = response.data.data || response.data;
      const updatedProfile = {
        ...profile,
        coverImage: saved.image || image || profile.coverImage,
        name: saved.name || profile.name,
        cuisine: saved.cuisine || profile.cuisine,
        phone: saved.phone || profile.phone,
        email: saved.user?.email || profile.email,
        address: saved.address || profile.address,
        deliveryFee: saved.delivery_fee ?? profile.deliveryFee,
        minOrder: saved.min_order ?? profile.minOrder,
        avgDeliveryTime: saved.avg_delivery_time || profile.avgDeliveryTime,
        description: saved.description || profile.description,
        status: saved.status || profile.status,
        rejectionReason: saved.rejection_reason || '',
        openingHours: { ...defaultOpeningHours(), ...(saved.opening_hours || profile.openingHours) },
        photos: Array.isArray(saved.photos) ? saved.photos : profile.photos,
        documents: Array.isArray(saved.documents) ? saved.documents : profile.documents,
      };
      setProfile(updatedProfile);
      const updatedRestaurant = {
        ...saved,
        image: updatedProfile.coverImage,
        name: updatedProfile.name,
      };
      localStorage.setItem('restaurant', JSON.stringify(updatedRestaurant));
      window.dispatchEvent(new Event('restaurantUpdated'));

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      const validationErrors = err.response?.data?.errors;
      const details = validationErrors
        ? Object.values(validationErrors).flat().join(' ')
        : err.response?.data?.message || err.message;
      setError(details || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 rounded-none">
        <Loader2 className="animate-spin text-blue-900" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 bg-slate-100 min-h-screen space-y-6 text-slate-800 font-sans rounded-none">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider rounded-none shadow-2xl transition-all border border-slate-700">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 border border-rose-300 text-rose-800 px-5 py-4 rounded-none text-xs font-bold uppercase tracking-wide flex items-center gap-3 shadow-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Application Status Banners */}
      {profile.status === 'pending' && (
        <div className="flex items-start gap-4 bg-amber-50 border border-amber-300 text-amber-900 px-5 py-4 rounded-none shadow-sm">
          <Hourglass size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-xs uppercase tracking-wide">Application Under Review</p>
            <p className="mt-1 text-xs font-medium">Your restaurant application is pending admin approval. It will not be visible to customers until approved.</p>
          </div>
        </div>
      )}
      {profile.status === 'rejected' && (
        <div className="flex items-start gap-4 bg-rose-50 border border-rose-300 text-rose-900 px-5 py-4 rounded-none shadow-sm">
          <ShieldAlert size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-xs uppercase tracking-wide">Application Rejected</p>
            <p className="mt-1 text-xs font-medium">{profile.rejectionReason || 'Your application was rejected. Please update your information and it will be reviewed again.'}</p>
          </div>
        </div>
      )}
      {profile.status === 'active' && (
        <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-300 text-emerald-900 px-5 py-4 rounded-none shadow-sm">
          <ShieldCheck size={18} className="shrink-0" />
          <p className="font-bold text-xs uppercase tracking-wide">Your restaurant is approved and visible to customers.</p>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-300 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Restaurant Profile</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        
        {/* Cover Image Header */}
        <div className="relative h-48 sm:h-56 w-full rounded-none overflow-hidden border border-slate-300 shadow-sm group bg-slate-200">
          {profile.coverImage ? (
            <img
              src={profile.coverImage}
              alt="Restaurant Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs">
              No Cover Image
            </div>
          )}
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity" />

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleCoverUpload}
            accept="image/*"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-900 rounded-none text-[11px] font-bold uppercase tracking-wider transition opacity-0 group-hover:opacity-100 shadow-lg"
          >
            <Upload size={14} /> Change Cover
          </button>
        </div>

        {/* Profile Details Form Card */}
        <div className="bg-white p-6 rounded-none border border-slate-300 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-3">
            General Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-700 mb-1.5">Restaurant Name</label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-none text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-900 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-700 mb-1.5">Cuisine Type</label>
              <input
                type="text"
                name="cuisine"
                value={profile.cuisine}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-none text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-900 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-700 mb-1.5">Phone</label>
              <input
                type="text"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-none text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-900 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-none text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-900 transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-700 mb-1.5">Address</label>
              <input
                type="text"
                name="address"
                value={profile.address}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-none text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-900 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-700 mb-1.5">Delivery Fee ($)</label>
              <input
                type="text"
                name="deliveryFee"
                value={profile.deliveryFee}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-none text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-900 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-700 mb-1.5">Min. Order ($)</label>
              <input
                type="text"
                name="minOrder"
                value={profile.minOrder}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-none text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-900 transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-700 mb-1.5">Avg. Delivery Time</label>
              <input
                type="text"
                name="avgDeliveryTime"
                value={profile.avgDeliveryTime}
                onChange={handleChange}
                placeholder="e.g. 30-45 mins"
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-none text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-900 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-700 mb-1.5">Description</label>
            <textarea
              rows={3}
              name="description"
              value={profile.description}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-none text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-900 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Opening Hours Card */}
        <div className="bg-white p-6 rounded-none border border-slate-300 shadow-sm space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-3">
            <Clock size={16} className="text-blue-900" /> Opening Hours
          </h2>
          <div className="divide-y divide-slate-200">
            {DAYS.map(([key, label]) => {
              const day = profile.openingHours[key] || { open: '', close: '', closed: false };
              return (
                <div key={key} className="flex flex-wrap items-center gap-4 py-3">
                  <span className="w-28 text-xs font-bold uppercase tracking-wider text-slate-700">{label}</span>
                  <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!day.closed}
                      onChange={(e) => handleDayChange(key, 'closed', e.target.checked)}
                      className="accent-blue-900 w-3.5 h-3.5 rounded-none cursor-pointer"
                    />
                    Closed
                  </label>
                  {!day.closed && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={day.open || ''}
                        onChange={(e) => handleDayChange(key, 'open', e.target.value)}
                        className="px-3 py-1.5 bg-white border border-slate-300 rounded-none text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                      />
                      <span className="text-slate-400 text-xs font-bold uppercase">To</span>
                      <input
                        type="time"
                        value={day.close || ''}
                        onChange={(e) => handleDayChange(key, 'close', e.target.value)}
                        className="px-3 py-1.5 bg-white border border-slate-300 rounded-none text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Photos Gallery Card */}
        <div className="bg-white p-6 rounded-none border border-slate-300 shadow-sm space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-wide">
              <ImagePlus size={16} className="text-blue-900" /> Restaurant Photos
            </h2>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">
              Add photos of your restaurant, food, and interior.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {profile.photos.map((url, index) => (
              <div key={index} className="relative group bg-slate-100 border border-slate-300 rounded-none h-28">
                <img src={url} alt={`Restaurant photo ${index + 1}`} className="w-full h-full object-cover rounded-none" />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(index)}
                  className="absolute top-0 right-0 w-7 h-7 flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-none"
                  title="Remove Photo"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={() => photosInputRef.current?.click()}
              disabled={uploadingPhotos}
              className="h-28 flex flex-col items-center justify-center gap-2 border border-dashed border-slate-400 bg-slate-50 hover:bg-slate-100 hover:border-blue-900 text-slate-500 hover:text-blue-900 transition-colors text-[10px] font-bold uppercase tracking-widest rounded-none disabled:opacity-50"
            >
              {uploadingPhotos ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
              {uploadingPhotos ? 'Uploading...' : 'Add Photos'}
            </button>
          </div>
          
          <input
            type="file"
            ref={photosInputRef}
            onChange={handlePhotosSelected}
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
          />
        </div>

        {/* Documents Card */}
        <div className="bg-white p-6 rounded-none border border-slate-300 shadow-sm space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-wide">
              <FileText size={16} className="text-blue-900" /> Submitted Documents
            </h2>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">
              Upload business license, food safety certificate, or ID (Optional).
            </p>
          </div>

          <div className="space-y-3">
            {profile.documents.map((doc, index) => (
              <div key={index} className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-300 rounded-none text-xs">
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-bold text-slate-700 hover:text-blue-900 uppercase tracking-wide">
                  <FileText size={14} /> {doc.name}
                </a>
                <button type="button" onClick={() => handleRemoveDocument(index)} className="text-slate-500 hover:text-rose-700 p-1">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <input
              type="text"
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              placeholder="Document name (e.g. Business License)"
              className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-none text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-900 placeholder:text-slate-400"
            />
            <label className={`flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-900 border border-slate-300 rounded-none text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${uploadingDoc ? 'opacity-50 pointer-events-none' : ''}`}>
              {uploadingDoc ? <Loader2 size={14} className="animate-spin" /> : <FilePlus2 size={14} />}
              {uploadingDoc ? 'Uploading...' : 'Upload File'}
              <input type="file" onChange={handleDocumentFileSelected} accept="image/*,application/pdf" className="hidden" />
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-slate-300 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-blue-900 hover:bg-blue-950 text-white border border-blue-950 text-xs font-bold uppercase tracking-widest rounded-none transition shadow-sm flex items-center gap-2 disabled:opacity-75 w-full sm:w-auto justify-center"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}