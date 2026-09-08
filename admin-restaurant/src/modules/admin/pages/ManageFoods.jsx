import React, { useEffect, useState } from 'react';
import { Edit, Plus, Search, Trash2, X } from 'lucide-react';
import API from '../../../services/api';
import { uploadImageToCloudinary } from '../../../services/cloudinary';
const defaultForm = {
  name: '',
  description: '',
  category_id: '',
  restaurant_id: '',
  price: '',
  image: '',
  status: 'available',
};
export default function ManageFoods() {
  const [foods, setFoods] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get('search') || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editingFood, setEditingFood] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [foodsResponse, restaurantsResponse, categoriesResponse] = await Promise.all([
        API.get('/foods'),
        API.get('/restaurants'),
        API.get('/categories'),
      ]);

      setFoods(foodsResponse.data.data || foodsResponse.data || []);
      setRestaurants(restaurantsResponse.data.data || restaurantsResponse.data || []);
      setCategories(categoriesResponse.data.data || categoriesResponse.data || []);
    } catch (error) {
      console.error('Failed to load menu data:', error);
      alert(error.response?.data?.message || 'Failed to load menu data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAdd = () => {
    setEditingFood(null);
    setForm({
      ...defaultForm,
      restaurant_id: restaurants[0]?.id || '',
      category_id: categories[0]?.id || '',
    });
  };

  const openEdit = (food) => {
    setEditingFood(food);
    setForm({
      name: food.name || '',
      description: food.description || '',
      category_id: food.category_id || food.category?.id || '',
      restaurant_id: food.restaurant_id || food.restaurant?.id || '',
      price: food.price || '',
      image: food.image || '',
      status: food.status || 'available',
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const image = form.image instanceof File
        ? await uploadImageToCloudinary(form.image, 'foods')
        : form.image;
      const payload = {
        name: form.name,
        description: form.description || '',
        category_id: Number(form.category_id),
        restaurant_id: Number(form.restaurant_id),
        price: Number(form.price),
        status: form.status || 'available',
        ...(image ? { image } : {}),
      };

      if (editingFood) {
        await API.put(`/foods/${editingFood.id}`, payload);
      } else {
        await API.post('/foods', payload);
      }
      setEditingFood(null);
      setForm(defaultForm);
      await loadData();
    } catch (error) {
      console.error('Failed to save food:', error);
      const validationErrors = error.response?.data?.errors;
      const details = validationErrors
        ? Object.values(validationErrors).flat().join(' ')
        : error.response?.data?.message || error.message;
      alert(`Failed to save food item: ${details || 'Please check your inputs.'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (food) => {
    if (!window.confirm(`Delete ${food.name}?`)) return;

    try {
      await API.delete(`/foods/${food.id}`);
      setFoods((current) => current.filter((item) => item.id !== food.id));
    } catch (error) {
      console.error('Failed to delete food:', error);
      alert(error.response?.data?.message || 'Failed to delete food item.');
    }
  };

  const filteredFoods = foods.filter((food) => {
    const query = search.toLowerCase();
    return [food.name, food.restaurant?.name, food.category?.name]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-[#fffaf8] min-h-screen space-y-6 text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Menu / Foods</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Super admin can manage every restaurant menu item.</p>
        </div>
        <button onClick={openAdd} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold">
          <Plus size={16} /> Add Food
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search food or restaurant..." className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        {loading ? <div className="p-8 text-center text-slate-500">Loading menu...</div> : (
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-slate-50 text-xs text-slate-400 uppercase">
              <tr>
                <th className="py-3 px-5">Food</th>
                <th className="py-3 px-5">Restaurant</th>
                <th className="py-3 px-5">Category</th>
                <th className="py-3 px-5">Price</th>
                <th className="py-3 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredFoods.map((food) => (
                <tr key={food.id} className="hover:bg-orange-50/30">
                  <td className="py-4 px-5 font-semibold text-slate-900">{food.name}</td>
                  <td className="py-4 px-5 text-slate-600">{food.restaurant?.name || 'N/A'}</td>
                  <td className="py-4 px-5 text-slate-500">{food.category?.name || 'N/A'}</td>
                  <td className="py-4 px-5 font-bold text-orange-600">${Number(food.price || 0).toFixed(2)}</td>
                  <td className="py-4 px-5">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(food)} className="p-2 rounded-lg text-sky-600 hover:bg-sky-50" title="Edit"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(food)} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredFoods.length === 0 && <tr><td colSpan="5" className="py-8 text-center text-slate-400">No food items found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {(editingFood || form.name === '') && form.restaurant_id !== '' && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{editingFood ? 'Edit Food' : 'Add Food'}</h3>
              <button type="button" onClick={() => { setEditingFood(null); setForm(defaultForm); }}><X size={20} className="text-slate-400" /></button>
            </div>
            <input required placeholder="Food name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500" />
            <textarea placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select required value={form.restaurant_id} onChange={(event) => setForm({ ...form, restaurant_id: event.target.value })} className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-orange-500">
                <option value="">Restaurant</option>
                {restaurants.map((restaurant) => <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>)}
              </select>
              <select required value={form.category_id} onChange={(event) => setForm({ ...form, category_id: event.target.value })} className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-orange-500">
                <option value="">Category</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </div>
            <input required type="number" min="0" step="0.01" placeholder="Price" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500" />
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setForm({ ...form, image: event.target.files?.[0] || '' })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500" />
            <button disabled={saving} className="w-full py-2.5 bg-orange-600 text-white rounded-xl font-semibold disabled:opacity-50">{saving ? 'Saving...' : 'Save Food'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
