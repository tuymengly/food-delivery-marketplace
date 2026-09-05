import React, { useState, useRef, useEffect } from 'react';
import { Upload, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import API from '../../../services/api'; 
import { uploadImageToCloudinary } from '../../../services/cloudinary';

export default function RestaurantProfile() {
  const fileInputRef = useRef(null);
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
  });

  const [selectedFile, setSelectedFile] = useState(null);

  const fetchProfile = async () => {
    try {
      setFetching(true);
      // ផ្លាស់ប្តូរ Endpoint ទៅតាម Backend របស់អ្នក (ឧទាហរណ៍: /restaurant/profile ឬ /profile)
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
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load restaurant profile.');
    } finally {
      setFetching(false);
    }
  };

  // ១. ទាញយកទិន្នន័យ Profile ដើមពេល Load ទំព័រ
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
      setSelectedFile(file); // រក្សាទុក File សម្រាប់ Upload ទៅ Backend
      const imageUrl = URL.createObjectURL(file);
      setProfile((prev) => ({ ...prev, coverImage: imageUrl }));
    }
  };

  // ២. រក្សាទុកទិន្នន័យបញ្ជូនទៅ Backend
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
      <div className="min-h-screen flex items-center justify-center bg-[#fcfbfa]">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#fcfbfa] min-h-screen space-y-6 text-gray-800">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-gray-900 text-white text-xs font-semibold rounded-xl shadow-xl transition-all">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Restaurant Profile</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        {/* Cover Image Header */}
        <div className="relative h-48 sm:h-56 w-full rounded-2xl overflow-hidden shadow-sm group">
          <img
            src={profile.coverImage}
            alt="Restaurant Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />
          
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
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-gray-800 rounded-xl text-xs font-bold transition shadow-md backdrop-blur-sm"
          >
            <Upload size={14} /> Change Cover
          </button>
        </div>

        {/* Profile Details Form Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">Restaurant Name</label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#f5efe6] border border-transparent rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:bg-white focus:border-orange-500 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">Cuisine Type</label>
              <input
                type="text"
                name="cuisine"
                value={profile.cuisine}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#f5efe6] border border-transparent rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:bg-white focus:border-orange-500 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#f5efe6] border border-transparent rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:bg-white focus:border-orange-500 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#f5efe6] border border-transparent rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:bg-white focus:border-orange-500 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={profile.address}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#f5efe6] border border-transparent rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:bg-white focus:border-orange-500 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">Delivery Fee ($)</label>
              <input
                type="text"
                name="deliveryFee"
                value={profile.deliveryFee}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#f5efe6] border border-transparent rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:bg-white focus:border-orange-500 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">Min. Order ($)</label>
              <input
                type="text"
                name="minOrder"
                value={profile.minOrder}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#f5efe6] border border-transparent rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:bg-white focus:border-orange-500 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">Avg. Delivery Time</label>
              <input
                type="text"
                name="avgDeliveryTime"
                value={profile.avgDeliveryTime}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#f5efe6] border border-transparent rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:bg-white focus:border-orange-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1">Description</label>
            <textarea
              rows={3}
              name="description"
              value={profile.description}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-[#f5efe6] border border-transparent rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:bg-white focus:border-orange-500 transition"
            />
          </div>
        </div>

        {/* Action Button */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            <span>Save Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
}
