import { useState, useRef } from 'react';
import { Upload, CheckCircle2 } from 'lucide-react';

export default function RestaurantProfile() {
  const fileInputRef = useRef(null);
  const [showToast, setShowToast] = useState(false);

  // Form State
  const [profile, setProfile] = useState({
    coverImage: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=1200&auto=format&fit=crop&q=80',
    name: 'The Burger Lab',
    cuisine: 'American · Burgers',
    phone: '+44 20 7946 0958',
    email: 'hello@burgerlab.com',
    address: '12 Burger Lane, London EC1A',
    deliveryFee: '2.99',
    minOrder: '15.00',
    avgDeliveryTime: '20-30 min',
    description:
      'Craft burgers with premium locally-sourced beef. Our secret sauce has been perfected over 10 years of obsessive tinkering.',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfile((prev) => ({ ...prev, coverImage: imageUrl }));
    }
  };

  // Save Changes Handler
  const handleSubmit = (e) => {
    e.preventDefault();
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="p-6 bg-[#fcfbfa] min-h-screen space-y-6 text-gray-800">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-gray-900 text-white text-xs font-semibold rounded-xl shadow-xl transition-all">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>Profile changes saved successfully!</span>
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
            {/* Restaurant Name */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">
                Restaurant Name
              </label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#f5efe6] border border-transparent rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:bg-white focus:border-orange-500 transition"
              />
            </div>

            {/* Cuisine Type */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">
                Cuisine Type
              </label>
              <input
                type="text"
                name="cuisine"
                value={profile.cuisine}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#f5efe6] border border-transparent rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:bg-white focus:border-orange-500 transition"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">
                Phone
              </label>
              <input
                type="text"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#f5efe6] border border-transparent rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:bg-white focus:border-orange-500 transition"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#f5efe6] border border-transparent rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:bg-white focus:border-orange-500 transition"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={profile.address}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#f5efe6] border border-transparent rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:bg-white focus:border-orange-500 transition"
              />
            </div>

            {/* Delivery Fee */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">
                Delivery Fee ($)
              </label>
              <input
                type="text"
                name="deliveryFee"
                value={profile.deliveryFee}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#f5efe6] border border-transparent rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:bg-white focus:border-orange-500 transition"
              />
            </div>

            {/* Min. Order */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">
                Min. Order ($)
              </label>
              <input
                type="text"
                name="minOrder"
                value={profile.minOrder}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#f5efe6] border border-transparent rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:bg-white focus:border-orange-500 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">
                Avg. Delivery Time
              </label>
              <input
                type="text"
                name="avgDeliveryTime"
                value={profile.avgDeliveryTime}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#f5efe6] border border-transparent rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:bg-white focus:border-orange-500 transition"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1">
              Description
            </label>
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
            className="px-6 py-2.5 bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
