import React, { useState } from 'react';
import { Plus, Search, Star, Edit, Trash2, X } from 'lucide-react';

export default function ManageFoods() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  const [foods, setFoods] = useState([
    {
      id: 1,
      name: 'Classic Smash Burger',
      desc: 'Double smash patty, American cheese, special sauce',
      category: 'Popular',
      price: '14.99',
      rating: 4.8,
      available: true,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&auto=format&fit=crop&q=80',
    },
    {
      id: 2,
      name: 'Spicy Jalapeño Burger',
      desc: 'Beef patty, pepper jack, fresh jalapeños',
      category: 'Burgers',
      price: '15.99',
      rating: 4.7,
      available: true,
      image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=100&auto=format&fit=crop&q=80',
    },
    {
      id: 3,
      name: 'Crispy Chicken Burger',
      desc: 'Buttermilk fried chicken, coleslaw, pickles',
      category: 'Burgers',
      price: '13.99',
      rating: 4.6,
      available: true,
      image: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=100&auto=format&fit=crop&q=80',
    },
    {
      id: 4,
      name: 'Truffle Fries',
      desc: 'Hand-cut fries with truffle oil, parmesan',
      category: 'Sides',
      price: '7.99',
      rating: 4.5,
      available: true,
      image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=100&auto=format&fit=crop&q=80',
    },
    {
      id: 5,
      name: 'Vanilla Milkshake',
      desc: 'Thick creamy vanilla milkshake with whipped cream',
      category: 'Drinks',
      price: '6.99',
      rating: 4.4,
      available: true,
      image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=100&auto=format&fit=crop&q=80',
    },
  ]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    desc: '',
    category: 'Burgers',
    price: '',
    image: '',
  });

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingFood(null);
    setFormData({ name: '', desc: '', category: 'Burgers', price: '', image: '' });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (food) => {
    setEditingFood(food);
    setFormData({
      name: food.name,
      desc: food.desc,
      category: food.category,
      price: food.price,
      image: food.image,
    });
    setIsModalOpen(true);
  };

  // Toggle Available
  const handleToggleAvailable = (id) => {
    setFoods(foods.map((food) => (food.id === id ? { ...food, available: !food.available } : food)));
  };

  // Delete Item
  const handleDeleteFood = (id) => {
    if (confirm('Are you sure you want to delete this food item?')) {
      setFoods(foods.filter((food) => food.id !== id));
    }
  };

  // Save Form (Create or Update)
  const handleSave = (e) => {
    e.preventDefault();
    const defaultImg = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80';

    if (editingFood) {
      // Update
      setFoods(
        foods.map((item) =>
          item.id === editingFood.id
            ? { ...item, ...formData, image: formData.image || item.image }
            : item
        )
      );
    } else {
      // Create
      const newFood = {
        id: Date.now(),
        ...formData,
        rating: 5.0,
        available: true,
        image: formData.image || defaultImg,
      };
      setFoods([newFood, ...foods]);
    }
    setIsModalOpen(false);
  };

  // Filter Items
  const filteredFoods = foods.filter((food) => {
    const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || food.category === selectedCategory;
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
          <option value="Popular">Popular</option>
          <option value="Burgers">Burgers</option>
          <option value="Sides">Sides</option>
          <option value="Drinks">Drinks</option>
        </select>
      </div>

      {/* Mobile View: Cards Layout */}
      <div className="grid grid-cols-1 gap-3 sm:hidden">
        {filteredFoods.map((food) => (
          <div key={food.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-start gap-3">
              <img
                src={food.image}
                alt={food.name}
                className="w-14 h-14 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-gray-900 text-sm truncate">{food.name}</h3>
                  <span className="font-bold text-gray-900 text-sm shrink-0">${food.price}</span>
                </div>
                <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{food.desc}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#f6f2ec] text-gray-600 text-[10px] font-semibold">
                    {food.category}
                  </span>
                  <div className="flex items-center gap-1 font-bold text-gray-800 text-[11px]">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    <span>{food.rating}</span>
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
                    food.available ? 'bg-orange-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                      food.available ? 'translate-x-4' : 'translate-x-0'
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
        ))}
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
              {filteredFoods.map((food) => (
                <tr key={food.id} className="hover:bg-gray-50/50 transition">
                  {/* Item Image & Info */}
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <img
                        src={food.image}
                        alt={food.name}
                        className="w-10 h-10 rounded-xl object-cover shrink-0"
                      />
                      <div>
                        <h2 className="font-bold text-gray-900">{food.name}</h2>
                        <p className="text-[11px] text-gray-400 truncate max-w-[160px]">{food.desc}</p>
                      </div>
                    </div>
                  </td>

                  {/* Category Badge */}
                  <td className="py-3.5 px-5">
                    <span className="px-3 py-1 rounded-full bg-[#f6f2ec] text-gray-600 text-[11px] font-semibold">
                      {food.category}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="py-3.5 px-5 font-bold text-gray-900">${food.price}</td>

                  {/* Rating */}
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-1 font-bold text-gray-800">
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                      <span>{food.rating}</span>
                    </div>
                  </td>

                  {/* Available Switch Toggle */}
                  <td className="py-3.5 px-5">
                    <button
                      onClick={() => handleToggleAvailable(food.id)}
                      className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                        food.available ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                          food.available ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>

                  {/* Actions */}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="Popular">Popular</option>
                    <option value="Burgers">Burgers</option>
                    <option value="Sides">Sides</option>
                    <option value="Drinks">Drinks</option>
                  </select>
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={formData.desc}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                  placeholder="Ingredients, details..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Image URL (Optional)</label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
                />
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
                  className="px-4 py-2 bg-[#ea580c] text-white text-xs font-bold rounded-xl hover:bg-orange-700 transition"
                >
                  {editingFood ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}