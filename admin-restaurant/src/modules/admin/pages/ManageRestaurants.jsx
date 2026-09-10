import React, { useState, useEffect } from 'react';
import { Search, Eye, Plus, Check, X, Star, Edit, Trash2 } from 'lucide-react';
import { getRestaurants, createRestaurant, updateRestaurant, deleteRestaurant, updateRestaurantStatus } from '../../../services/adminService';
import { uploadImageToCloudinary } from '../../../services/cloudinary';

export default function ManageRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    description: '',
    image: '',
    owner_email: '',
    owner_password: '',
    status: 'active',
  });

  const fetchRestaurantsData = async () => {
    try {
      setLoading(true);
      const res = await getRestaurants();
      setRestaurants(res.data.data || res.data || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurantsData();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateRestaurantStatus(id, newStatus);
      fetchRestaurantsData(); 
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update restaurant status.');
    }
  };

  const handleOpenAdd = () => {
    setEditingRestaurant(null);
    setFormError('');
    setFormData({
      name: '', address: '', phone: '', description: '', image: '', owner_email: '', owner_password: '', status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (restaurant) => {
    setEditingRestaurant(restaurant);
    setFormError('');
    setFormData({
      name: restaurant.name || '',
      address: restaurant.address || '',
      phone: restaurant.phone || '',
      description: restaurant.description || '',
      image: restaurant.image || '',
      owner_email: restaurant.user?.email || '',
      owner_password: '',
      status: restaurant.status || 'active',
    });
    setIsModalOpen(true);
  };

  const handleSaveRestaurant = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const image = formData.image instanceof File
        ? await uploadImageToCloudinary(formData.image, 'restaurants')
        : formData.image;
      if (editingRestaurant) {
        await updateRestaurant(editingRestaurant.id, {
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          description: formData.description,
          ...(image ? { image } : {}),
          status: formData.status,
        });
      } else {
        await createRestaurant({ ...formData, ...(image ? { image } : {}) });
      }
      setIsModalOpen(false);
      setEditingRestaurant(null);
      await fetchRestaurantsData();
    } catch (error) {
      console.error('Restaurant save error:', error.response?.data || error);
      const validationErrors = error.response?.data?.errors || {};
      const details = Object.values(validationErrors).flat().join(' ');
      setFormError(details || error.response?.data?.message || 'Failed to save restaurant.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (restaurant) => {
    if (!window.confirm(`Delete ${restaurant.name}? This will also remove its menu.`)) return;

    try {
      await deleteRestaurant(restaurant.id);
      setRestaurants((current) => current.filter((item) => item.id !== restaurant.id));
    } catch (error) {
      console.error('Restaurant delete error:', error.response?.data || error);
      alert(error.response?.data?.message || 'Failed to delete restaurant.');
    }
  };

  // Filter Logic
  const filteredRestaurants = restaurants.filter((res) => {
    const ownerName = res.user?.name || res.owner || res.owner_name || '';
    const matchesSearch =
      res.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const resStatus = res.status?.toLowerCase();
    const filterStatus = statusFilter.toLowerCase();
    const matchesStatus = statusFilter === 'All Status' || resStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = restaurants.filter((r) => r.status?.toLowerCase() === 'pending').length;

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading restaurants...</div>;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-[#fffaf8] min-h-screen space-y-6 text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Restaurant Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {restaurants.length} total restaurants •{' '}
            <span className="text-orange-600 font-medium">{pendingCount} pending approval</span>
          </p>
        </div>

        <button 
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium text-xs sm:text-sm rounded-xl shadow-xs transition w-full sm:w-auto cursor-pointer"
        >
          <Plus size={16} /> Add Restaurant
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by restaurant or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500 shadow-xs"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none cursor-pointer shadow-xs shrink-0"
        >
          <option value="All Status">All Status</option>
          <option value="Active">Active</option>
          <option value="Pending">Pending</option>
          <option value="Disabled">Disabled</option>
        </select>
      </div>

      {/* Restaurant Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-wider uppercase bg-slate-50/50">
                <th className="py-3.5 px-4 sm:px-6">Restaurant</th>
                <th className="py-3.5 px-4 sm:px-6">Owner</th>
                <th className="py-3.5 px-4 sm:px-6">Address & Phone</th>
                <th className="py-3.5 px-4 sm:px-6">Status</th>
                <th className="py-3.5 px-4 sm:px-6">Rating</th>
                <th className="py-3.5 px-4 sm:px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredRestaurants.length > 0 ? (
                filteredRestaurants.map((item) => (
                  <tr key={item.id} className="hover:bg-orange-50/10 transition">
                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 bg-orange-100 text-orange-600">
                          {item.name?.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-900">{item.name}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-slate-600 font-medium whitespace-nowrap">
                      <div>{item.user?.name || item.owner || item.owner_name || 'N/A'}</div>
                      <div className="text-xs text-slate-400 font-normal">{item.user?.email || 'No email'}</div>
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-slate-500 text-xs whitespace-nowrap">
                      <div>{item.address || 'No address'}</div>
                      <div className="text-slate-400">{item.phone || 'No phone'}</div>
                    </td>

                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                        ['active', 'Active'].includes(item.status) ? 'bg-emerald-100/80 text-emerald-600' :
                        ['pending', 'Pending'].includes(item.status) ? 'bg-amber-100/80 text-amber-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    <td className="py-4 px-4 sm:px-6 font-semibold text-slate-700 whitespace-nowrap">
                      {item.rating ? (
                        <span className="flex items-center gap-1 text-slate-800">
                          <Star size={14} className="fill-amber-400 text-amber-400" /> {item.rating}
                        </span>
                      ) : '—'}
                    </td>

                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {['active', 'Active'].includes(item.status) && (
                          <button
                            onClick={() => handleStatusChange(item.id, 'Disabled')}
                            className="px-2.5 py-1 bg-stone-100 text-stone-600 text-xs font-semibold rounded-lg hover:bg-stone-200 transition cursor-pointer"
                          >
                            Disable
                          </button>
                        )}

                        {['pending', 'Pending'].includes(item.status) && (
                          <>
                            <button
                              onClick={() => handleStatusChange(item.id, 'Active')}
                              className="px-2.5 py-1 bg-emerald-100 text-emerald-600 text-xs font-semibold rounded-lg hover:bg-emerald-200 transition flex items-center gap-1 cursor-pointer"
                            >
                              <Check size={12} /> Approve
                            </button>
                            <button
                              onClick={() => handleStatusChange(item.id, 'Disabled')}
                              className="px-2.5 py-1 bg-rose-100 text-rose-600 text-xs font-semibold rounded-lg hover:bg-rose-200 transition flex items-center gap-1 cursor-pointer"
                            >
                              <X size={12} /> Reject
                            </button>
                          </>
                        )}

                        {['disabled', 'Disabled', 'inactive'].includes(item.status) && (
                          <button
                            onClick={() => handleStatusChange(item.id, 'Active')}
                            className="px-2.5 py-1 bg-sky-100 text-sky-600 text-xs font-semibold rounded-lg hover:bg-sky-200 transition cursor-pointer"
                          >
                            Enable
                          </button>
                        )}

                        <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition ml-1 cursor-pointer">
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                          title="Edit restaurant"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete restaurant"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-slate-400">
                    No restaurants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Restaurant */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg">{editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}</h3>
              <button type="button" onClick={() => { setIsModalOpen(false); setEditingRestaurant(null); }} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveRestaurant} className="space-y-3">
              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Restaurant Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                  placeholder="e.g. Pizza Hut"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Address *</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                  placeholder="e.g. Phnom Penh"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                    placeholder="e.g. 012345678"
                />
              </div>

              {!editingRestaurant && <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Owner Gmail *</label>
                <input
                  type="email"
                  required
                  value={formData.owner_email}
                  onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                  placeholder="restaurant@gmail.com"
                />
              </div>}

              {!editingRestaurant && <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Login Password *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.owner_password}
                  onChange={(e) => setFormData({ ...formData, owner_password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                  placeholder="At least 8 characters"
                />
              </div>}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                  placeholder="Optional details..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Restaurant Image (Optional)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || '' })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingRestaurant(null); }}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold"
                >
                  {saving ? 'Saving...' : 'Save Restaurant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
