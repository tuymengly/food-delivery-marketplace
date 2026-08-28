import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, X, FolderTree, Layers } from 'lucide-react';

export default function ManageCategories() {
  const [searchQuery, setSearchQuery] = useState('');

  const [categories, setCategories] = useState([
    { id: 1, name: 'Popular', itemCount: 12, status: 'Active', icon: '🔥' },
    { id: 2, name: 'Burgers', itemCount: 8, status: 'Active', icon: '🍔' },
    { id: 3, name: 'Sides', itemCount: 5, status: 'Active', icon: '🍟' },
    { id: 4, name: 'Drinks', itemCount: 6, status: 'Active', icon: '🥤' },
    { id: 5, name: 'Desserts', itemCount: 4, status: 'Inactive', icon: '🍦' },
  ]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', icon: '🍽️', status: 'Active' });

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', icon: '🍽️', status: 'Active' });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, icon: category.icon, status: category.status });
    setIsModalOpen(true);
  };

  // Delete Category
  const handleDeleteCategory = (id) => {
    if (confirm('Are you sure you want to delete this category?')) {
      setCategories(categories.filter((cat) => cat.id !== id));
    }
  };

  // Save Form (Create or Update)
  const handleSave = (e) => {
    e.preventDefault();
    if (editingCategory) {
      setCategories(
        categories.map((cat) =>
          cat.id === editingCategory.id ? { ...cat, ...formData } : cat
        )
      );
    } else {
      const newCategory = {
        id: Date.now(),
        ...formData,
        itemCount: 0,
      };
      setCategories([...categories, newCategory]);
    }
    setIsModalOpen(false);
  };

  // Toggle Status Active / Inactive
  const handleToggleStatus = (id) => {
    setCategories(
      categories.map((cat) =>
        cat.id === id ? { ...cat, status: cat.status === 'Active' ? 'Inactive' : 'Active' } : cat
      )
    );
  };

  // Filter Categories
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 bg-[#fcfbfa] min-h-screen space-y-4 sm:space-y-6 text-gray-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Food Categories</h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5 sm:mt-1">
            Manage menu categories for your restaurant
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#ea580c] hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-sm w-full sm:w-auto"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500 transition"
        />
      </div>

      {/* Mobile View: Cards Layout */}
      <div className="grid grid-cols-1 gap-3 sm:hidden">
        {filteredCategories.map((cat) => (
          <div key={cat.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#fdf2ee] flex items-center justify-center text-xl shrink-0">
                  {cat.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{cat.name}</h3>
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 font-medium mt-0.5">
                    <Layers size={12} /> {cat.itemCount} items
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleToggleStatus(cat.id)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                  cat.status === 'Active'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {cat.status}
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-50">
              <button
                onClick={() => handleOpenEditModal(cat)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
              >
                <Edit size={14} /> Edit
              </button>
              <button
                onClick={() => handleDeleteCategory(cat.id)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
              >
                <Trash2 size={14} /> Delete
              </button>
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
                <th className="py-3 px-5">Category Name</th>
                <th className="py-3 px-5">Items Count</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-medium">
              {filteredCategories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50/50 transition">
                  {/* Icon & Name */}
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#fdf2ee] flex items-center justify-center text-lg shrink-0">
                        {cat.icon}
                      </div>
                      <span className="font-bold text-gray-900">{cat.name}</span>
                    </div>
                  </td>

                  {/* Item Count */}
                  <td className="py-3.5 px-5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold text-[11px]">
                      <Layers size={13} /> {cat.itemCount} items
                    </span>
                  </td>

                  {/* Status Badge & Toggle */}
                  <td className="py-3.5 px-5">
                    <button
                      onClick={() => handleToggleStatus(cat.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition ${
                        cat.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {cat.status}
                    </button>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3 text-gray-500">
                      <button
                        onClick={() => handleOpenEditModal(cat)}
                        className="hover:text-gray-900 transition"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="hover:text-rose-500 transition"
                      >
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

      {/* Modal Dialog (Add & Edit Category) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-sm sm:text-base font-bold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Category Icon (Emoji)
                </label>
                <input
                  type="text"
                  required
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="e.g. 🍕"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Pizza"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
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
                  {editingCategory ? 'Save Changes' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}