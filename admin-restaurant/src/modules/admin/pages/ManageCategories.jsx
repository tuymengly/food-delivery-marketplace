import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

const initialCategories = [
  { id: 1, name: 'Burgers', count: '42 restaurants', icon: '🍔' },
  { id: 2, name: 'Pizza', count: '38 restaurants', icon: '🍕' },
  { id: 3, name: 'Sushi', count: '25 restaurants', icon: '🍱' },
  { id: 4, name: 'Indian', count: '31 restaurants', icon: '🍲' },
  { id: 5, name: 'Healthy', count: '29 restaurants', icon: '🥗' },
  { id: 6, name: 'Asian', count: '44 restaurants', icon: '🍜' },
  { id: 7, name: 'Desserts', count: '18 restaurants', icon: '🍰' },
  { id: 8, name: 'Drinks', count: '22 restaurants', icon: '🥤' },
];

export default function ManageCategories() {
  const [categories, setCategories] = useState(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🍔');

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setName('');
    setIcon('🍔');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category, e) => {
    e.stopPropagation();
    setEditingCategory(category);
    setName(category.name);
    setIcon(category.icon);
    setIsModalOpen(true);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm('តើអ្នកពិតជាចង់លុប Category នេះមែនទេ?')) {
      setCategories(categories.filter((item) => item.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCategory) {
      setCategories(
        categories.map((cat) =>
          cat.id === editingCategory.id ? { ...cat, name, icon } : cat
        )
      );
    } else {
      const newCategory = {
        id: Date.now(),
        name,
        icon,
        count: '0 restaurants',
      };
      setCategories([...categories, newCategory]);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-[#e03a11] space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Category Management</h2>
          <p className="text-xs sm:text-sm text-gray-500">{categories.length} categories</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 bg-[#e03a11] hover:bg-[#c6320e] text-white px-4 sm:px-5 py-2.5 rounded-2xl font-semibold text-sm transition shadow-sm cursor-pointer w-full sm:w-auto"
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      {/* Categories Grid - Responsive breakpoints */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {categories.map((category) => (
          <div
            key={category.id}
            className="group relative bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition"
          >
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-xl sm:text-2xl shrink-0">
                {category.icon}
              </div>
              <div className="truncate">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight truncate">
                  {category.name}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5 sm:mt-1 truncate">{category.count}</p>
              </div>
            </div>

            {/* Action Buttons: Visible on mobile, hover-only on desktop */}
            <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 flex flex-row md:flex-col gap-1.5 sm:gap-2 text-stone-400 shrink-0 ml-2">
              <button
                onClick={(e) => handleOpenEditModal(category, e)}
                className="p-1.5 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition"
                aria-label="Edit category"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={(e) => handleDelete(category.id, e)}
                className="p-1.5 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                aria-label="Delete category"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal - Responsive padding and scroll protection */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 text-gray-400 hover:text-gray-600 p-1 rounded-full"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 pr-6">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Icon (Emoji)
                </label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-lg text-center focus:outline-none focus:border-[#e03a11]"
                  maxLength={2}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Burgers, Drinks..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e03a11]"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#e03a11] hover:bg-[#c6320e] text-white font-semibold text-sm rounded-xl transition"
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