import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, X, Layers, Folder, Loader2, AlertCircle } from 'lucide-react';
import API from '../../../services/api';

export default function ManageCategories() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const fetchCategories = async () => {
    try {
      const response = await API.get('/categories');
      const categoryData = response.data.data || response.data;
      setCategories(Array.isArray(categoryData) ? categoryData : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to fetch categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchCategories();
    });
  }, []);

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await API.delete(`/categories/${id}`);
      setCategories((currentCategories) => currentCategories.filter((cat) => cat.id !== id));
    } catch (err) {
      console.error('Error deleting category:', err);
      alert(err.response?.data?.message || 'Failed to delete category.');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
    };

    try {
      if (editingCategory) {
        const response = await API.put(`/categories/${editingCategory.id}`, payload);
        const updated = response.data.data || response.data;
        setCategories((currentCategories) => currentCategories.map((cat) => (
          cat.id === editingCategory.id ? { ...cat, ...updated } : cat
        )));
      } else {
        const response = await API.post('/categories', payload);
        const created = response.data.data || response.data;
        setCategories((currentCategories) => [created, ...currentCategories]);
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error('Error saving category:', err.response?.data || err);
      const errorMsg = err.response?.data?.message || JSON.stringify(err.response?.data?.errors) || 'Please check your inputs.';
      alert('Failed to save category: ' + errorMsg);
    }
  };

  const filteredCategories = categories.filter((cat) => {
    const name = cat.name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getItemCount = (category) => category.foods_count ?? category.foods?.length ?? category.itemCount ?? 0;

  return (
    <div className="p-4 sm:p-6 bg-[#fcfbfa] min-h-screen space-y-4 sm:space-y-6 text-gray-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Food Categories</h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5 sm:mt-1">
            {filteredCategories.length} categories
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#ea580c] hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-sm w-full sm:w-auto"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
          <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
          <p className="mt-3 text-xs text-gray-500 font-semibold">Loading categories...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
          <p className="text-rose-700 text-sm font-semibold">{error}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:hidden">
            {filteredCategories.map((cat) => (
              <div key={cat.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#fdf2ee] text-orange-600 flex items-center justify-center shrink-0">
                    <Folder size={19} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm truncate">{cat.name}</h3>
                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 font-medium mt-0.5">
                      <Layers size={12} /> {getItemCount(cat)} items
                    </span>
                  </div>
                </div>

                {cat.description && (
                  <p className="text-[11px] text-gray-400 line-clamp-2">{cat.description}</p>
                )}

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

          <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#faf8f5] text-gray-400 text-xs font-semibold">
                    <th className="py-3 px-5">Category Name</th>
                    <th className="py-3 px-5">Description</th>
                    <th className="py-3 px-5">Items Count</th>
                    <th className="py-3 px-5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium">
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-gray-400">
                        No categories found.
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-gray-50/50 transition">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#fdf2ee] text-orange-600 flex items-center justify-center shrink-0">
                              <Folder size={18} />
                            </div>
                            <span className="font-bold text-gray-900">{cat.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-gray-500 max-w-xs truncate">
                          {cat.description || 'No description'}
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold text-[11px]">
                            <Layers size={13} /> {getItemCount(cat)} items
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3 text-gray-500">
                            <button
                              onClick={() => handleOpenEditModal(cat)}
                              className="hover:text-gray-900 transition"
                              aria-label="Edit category"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="hover:text-rose-500 transition"
                              aria-label="Delete category"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

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
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
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
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500 resize-none"
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
