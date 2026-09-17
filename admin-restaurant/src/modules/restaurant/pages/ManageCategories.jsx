import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, X, Layers, Folder, Loader2, AlertCircle, ImagePlus } from 'lucide-react';
import API from '../../../services/api';
import { uploadImageToCloudinary } from '../../../services/cloudinary';

export default function ManageCategories() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', image: null });
  const [imagePreview, setImagePreview] = useState('');

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
    setFormData({ name: '', description: '', image: null });
    setImagePreview('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
      image: null,
    });
    setImagePreview(category.image || '');
    setIsModalOpen(true);
  };

  const handleDeleteCategory = async (id) => {
    const category = categories.find((item) => item.id === id);
    if (getItemCount(category || {}) > 0) {
      alert('This category has food items. Move or delete the food items first.');
      return;
    }
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

    try {
      let imageUrl = editingCategory?.image || '';
      if (formData.image instanceof File) {
        imageUrl = await uploadImageToCloudinary(formData.image, 'categories');
      }
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        image: imageUrl || null,
      };

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
    <div className="p-4 sm:p-8 bg-slate-100 min-h-screen space-y-6 text-slate-800 font-sans rounded-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Food Categories</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {filteredCategories.length} categories found
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold tracking-wide transition-colors uppercase w-full sm:w-auto rounded-none border border-blue-950"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search categories by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 text-xs font-medium focus:outline-none focus:border-blue-900 text-slate-900 placeholder:text-slate-400 rounded-none transition-colors"
        />
      </div>

      {/* Main Content State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-300 rounded-none">
          <Loader2 className="w-8 h-8 text-blue-900 animate-spin" />
          <p className="mt-3 text-xs text-slate-500 font-semibold uppercase tracking-wider">Loading categories...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-none text-center">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-2" />
          <p className="text-rose-800 text-sm font-bold uppercase tracking-wide">{error}</p>
        </div>
      ) : (
        <>
          {/* Mobile View: Crisp Cards */}
          <div className="grid grid-cols-1 gap-4 sm:hidden">
            {filteredCategories.map((cat) => (
              <div key={cat.id} className="bg-white p-4 border border-slate-300 space-y-3 rounded-none">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-14 h-14 bg-slate-100 border border-slate-300 text-slate-400 flex items-center justify-center shrink-0 overflow-hidden rounded-none">
                    {cat.image ? <img src={cat.image} alt="" className="w-full h-full object-cover" /> : <Folder size={24} />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{cat.name}</h3>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 border border-slate-300 bg-slate-100 text-[10px] text-slate-700 font-semibold uppercase rounded-none">
                      <Layers size={12} /> {getItemCount(cat)} items
                    </span>
                  </div>
                </div>

                {cat.description && (
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{cat.description}</p>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => handleOpenEditModal(cat)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-none transition uppercase tracking-wide"
                  >
                    <Edit size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-none transition uppercase tracking-wide"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop/Tablet View: Sharp Table */}
          <div className="hidden sm:block bg-white border border-slate-300 overflow-hidden rounded-none shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-5 border-b border-slate-800">Category Name</th>
                    <th className="py-3.5 px-5 border-b border-slate-800">Description</th>
                    <th className="py-3.5 px-5 border-b border-slate-800">Items Count</th>
                    <th className="py-3.5 px-5 border-b border-slate-800 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs font-medium">
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                        No categories found.
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 border border-slate-300 text-slate-400 flex items-center justify-center shrink-0 overflow-hidden rounded-none">
                              {cat.image ? <img src={cat.image} alt="" className="w-full h-full object-cover" /> : <Folder size={20} />}
                            </div>
                            <span className="font-bold text-slate-900 text-sm">{cat.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-slate-500 max-w-xs truncate">
                          {cat.description || '—'}
                        </td>
                        <td className="py-4 px-5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-300 text-slate-800 font-semibold text-[11px] uppercase rounded-none">
                            <Layers size={13} /> {getItemCount(cat)} items
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-3 text-slate-600">
                            <button
                              onClick={() => handleOpenEditModal(cat)}
                              className="p-1.5 hover:bg-slate-200 border border-transparent hover:border-slate-300 text-slate-700 transition rounded-none"
                              aria-label="Edit category"
                              title="Edit category"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="p-1.5 hover:bg-rose-100 border border-transparent hover:border-rose-200 text-rose-700 transition rounded-none"
                              aria-label="Delete category"
                              title="Delete category"
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

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-400 w-full max-w-md p-6 shadow-2xl space-y-5 rounded-none">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-900 p-1 border border-transparent hover:border-slate-300 transition rounded-none"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Pizza"
                  className="w-full px-3 py-2 bg-white border border-slate-300 text-xs font-medium focus:outline-none focus:border-blue-900 text-slate-900 rounded-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Category Image
                </label>
                <label className="flex items-center gap-3 w-full px-3 py-3 bg-slate-50 border border-dashed border-slate-300 rounded-none cursor-pointer hover:border-blue-900 hover:bg-slate-100 transition-colors">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Category preview" className="w-14 h-14 object-cover border border-slate-300 rounded-none shrink-0" />
                  ) : (
                    <div className="w-14 h-14 border border-slate-300 bg-white flex items-center justify-center shrink-0">
                      <ImagePlus size={22} className="text-slate-400" />
                    </div>
                  )}
                  <span className="text-xs text-slate-600 font-medium font-sans">
                    {formData.image ? formData.image.name : 'Choose an image (JPG, PNG, WEBP)'}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFormData({ ...formData, image: file });
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 text-xs font-medium focus:outline-none focus:border-blue-900 text-slate-900 resize-none rounded-none transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold uppercase tracking-wider border border-slate-300 rounded-none transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold uppercase tracking-wider border border-blue-950 rounded-none transition"
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