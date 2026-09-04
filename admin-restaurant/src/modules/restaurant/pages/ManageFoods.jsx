import { useState, useEffect } from 'react';
import { Plus, Search, Star, Edit, Trash2, X } from 'lucide-react';
import API from '../../../services/api';

const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80';

const getFoodStatus = (food) => {
  if (food.status) {
    return food.status.toLowerCase();
  }

  return food.available === false ? 'unavailable' : 'available';
};

export default function ManageFoods() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    restaurant_id: '',
    price: '',
    image: '',
  });

  const fetchFoods = async () => {
    try {
      const response = await API.get('/foods');
      const foodData = response.data.data || response.data;
      setFoods(Array.isArray(foodData) ? foodData : []);
    } catch (error) {
      console.error('Error fetching foods:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await API.get('/categories');
      const catData = response.data.data || response.data;
      setCategories(Array.isArray(catData) ? catData : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchRestaurants = async () => {
    try {
      const response = await API.get('/restaurants');
      const resData = response.data.data || response.data;
      setRestaurants(Array.isArray(resData) ? resData : []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
  };

  const buildFoodPayload = (food, overrides = {}) => ({
    name: food.name || '',
    description: food.description || food.desc || '',
    price: Number(food.price),
    category_id: Number(food.category_id || food.category?.id),
    restaurant_id: Number(food.restaurant_id || food.restaurant?.id || restaurants[0]?.id),
    image: food.image || DEFAULT_FOOD_IMAGE,
    ...overrides,
  });

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchFoods();
      fetchCategories();
      fetchRestaurants();
    });
  }, []);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingFood(null);
    setFormData({
      name: '',
      description: '',
      category_id: categories[0]?.id || '',
      restaurant_id: restaurants[0]?.id || '',
      price: '',
      image: ''
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (food) => {
    setEditingFood(food);
    setFormData({
      name: food.name || '',
      description: food.description || food.desc || '',
      category_id: food.category_id || food.category?.id || '',
      restaurant_id: food.restaurant_id || food.restaurant?.id || restaurants[0]?.id || '',
      price: food.price || '',
      image: food.image || '',
    });
    setIsModalOpen(true);
  };

  // Toggle Available (Status)
  const handleToggleAvailable = async (id) => {
    const previousFoods = foods;
    const foodToUpdate = foods.find(f => f.id === id);
    if (!foodToUpdate) return;

    const newStatus = getFoodStatus(foodToUpdate) === 'available' ? 'unavailable' : 'available';
    const payload = buildFoodPayload(foodToUpdate, { status: newStatus });

    if (!payload.category_id || !payload.restaurant_id || Number.isNaN(payload.price)) {
      alert('Cannot update availability because this food item is missing required data.');
      return;
    }

    setFoods(foods.map((food) => (
      food.id === id ? { ...food, status: newStatus, available: newStatus === 'available' } : food
    )));

    try {
      const response = await API.put(`/foods/${id}`, payload);
      const updated = response.data.data || response.data;

      if (updated.id) {
        setFoods((currentFoods) => currentFoods.map((food) => (
          food.id === id ? updated : food
        )));
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
      setFoods(previousFoods);
      alert('Failed to update availability.');
    }
  };

  // Delete Item
  const handleDeleteFood = async (id) => {
    if (confirm('Are you sure you want to delete this food item?')) {
      try {
        await API.delete(`/foods/${id}`);
        setFoods(foods.filter((food) => food.id !== id));
      } catch (error) {
        console.error('Error deleting food:', error);
        alert('Failed to delete food item.');
      }
    }
  };

  // Save Form (Create or Update)
  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        category_id: Number(formData.category_id),
        restaurant_id: Number(formData.restaurant_id || restaurants[0]?.id || 1),
        image: formData.image || DEFAULT_FOOD_IMAGE,
      };

      if (editingFood) {
        // Update Food
        const response = await API.put(`/foods/${editingFood.id}`, payload);
        const updated = response.data.data || response.data;
        setFoods(foods.map((item) => (item.id === editingFood.id ? (updated.id ? updated : { ...item, ...payload }) : item)));
      } else {
        // Create Food
        const response = await API.post('/foods', payload);
        const created = response.data.data || response.data;
        setFoods([created.id ? created : { id: Date.now(), ...payload, rating: 5.0, status: 'available' }, ...foods]);
      }
      setIsModalOpen(false);
      fetchFoods(); 
    } catch (error) {
      console.error('Detailed Error:', error.response?.data);
      const errorMsg = error.response?.data?.message || JSON.stringify(error.response?.data?.errors) || 'Please check your inputs.';
      alert('Failed to save food item: ' + errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter Items
  const filteredFoods = foods.filter((food) => {
    const foodName = food.name || '';
    const matchesSearch = foodName.toLowerCase().includes(searchQuery.toLowerCase());

    const categoryName = food.category?.name || food.category || '';
    const matchesCategory = selectedCategory === 'All Categories' || categoryName === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 sm:p-6 bg-[#fcfbfa] min-h-screen space-y-4 sm:space-y-6 text-gray-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Menu & Foods</h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5 sm:mt-1">{filteredFoods.length} items in your menu</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#ea580c] hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-sm w-full sm:w-auto"
        >
          <Plus size={16} /> Add Food
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search food items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500 transition"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-44 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-500 cursor-pointer"
        >
          <option value="All Categories">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>{cat.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-10 text-xs font-semibold text-gray-500">Loading foods...</div>
      ) : (
        <>
          {/* Mobile View: Cards Layout */}
          <div className="grid grid-cols-1 gap-3 sm:hidden">
            {filteredFoods.map((food) => {
              const isAvailable = getFoodStatus(food) === 'available';
              return (
                <div key={food.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={food.image || DEFAULT_FOOD_IMAGE}
                      alt={food.name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-gray-900 text-sm truncate">{food.name}</h3>
                        <span className="font-bold text-gray-900 text-sm shrink-0">${food.price}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{food.description || food.desc}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#f6f2ec] text-gray-600 text-[10px] font-semibold">
                          {food.category?.name || food.category || 'General'}
                        </span>
                        <div className="flex items-center gap-1 font-bold text-gray-800 text-[11px]">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          <span>{food.rating || '5.0'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-gray-500">Available:</span>
                      <button
                        onClick={() => handleToggleAvailable(food.id)}
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                          isAvailable ? 'bg-orange-500' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                            isAvailable ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(food)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                      >
                        <Edit size={14} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteFood(food.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop/Tablet View: Table */}
          <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#faf8f5] text-gray-400 text-xs font-semibold">
                    <th className="py-3 px-5">Item</th>
                    <th className="py-3 px-5">Category</th>
                    <th className="py-3 px-5">Price</th>
                    <th className="py-3 px-5">Rating</th>
                    <th className="py-3 px-5">Available</th>
                    <th className="py-3 px-5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium">
                  {filteredFoods.map((food) => {
                    const isAvailable = getFoodStatus(food) === 'available';
                    return (
                      <tr key={food.id} className="hover:bg-gray-50/50 transition">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <img
                              src={food.image || DEFAULT_FOOD_IMAGE}
                              alt={food.name}
                              className="w-10 h-10 rounded-xl object-cover shrink-0"
                            />
                            <div>
                              <h2 className="font-bold text-gray-900">{food.name}</h2>
                              <p className="text-[11px] text-gray-400 truncate max-w-[160px]">{food.description || food.desc}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-5">
                          <span className="px-3 py-1 rounded-full bg-[#f6f2ec] text-gray-600 text-[11px] font-semibold">
                            {food.category?.name || food.category || 'General'}
                          </span>
                        </td>

                        <td className="py-3.5 px-5 font-bold text-gray-900">${food.price}</td>

                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-1 font-bold text-gray-800">
                            <Star size={14} className="fill-amber-400 text-amber-400" />
                            <span>{food.rating || '5.0'}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-5">
                          <button
                            onClick={() => handleToggleAvailable(food.id)}
                            className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                              isAvailable ? 'bg-orange-500' : 'bg-gray-300'
                            }`}
                          >
                            <div
                              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                                isAvailable ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </td>

                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3 text-gray-500">
                            <button onClick={() => handleOpenEditModal(food)} className="hover:text-gray-900 transition">
                              <Edit size={16} />
                            </button>
                            <button onClick={() => handleDeleteFood(food.id)} className="hover:text-rose-500 transition">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal Dialog (Add & Edit Food) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-sm sm:text-base font-bold text-gray-900">
                {editingFood ? 'Edit Food Item' : 'Add New Food Item'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Food Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Bacon Cheeseburger"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Restaurant</label>
                  <select
                    required
                    value={formData.restaurant_id}
                    onChange={(e) => setFormData({ ...formData, restaurant_id: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="">Select Restaurant</option>
                    {restaurants.map((res) => (
                      <option key={res.id} value={res.id}>{res.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="12.99"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ingredients, details..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Image URL (Optional)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
                  />
                  <img 
                    src={formData.image || DEFAULT_FOOD_IMAGE} 
                    alt="Preview" 
                    className="w-9 h-9 rounded-lg object-cover border border-gray-200 shrink-0"
                    onError={(e) => { e.target.src = DEFAULT_FOOD_IMAGE; }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#ea580c] text-white text-xs font-bold rounded-xl hover:bg-orange-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : (editingFood ? 'Save Changes' : 'Add Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}