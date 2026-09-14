import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Folder, ImagePlus } from 'lucide-react';
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '../../../services/adminService';
import { uploadImageToCloudinary } from '../../../services/cloudinary';

export default function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

 
  const fetchCategoriesData = async () => {
    try {
      const response = await getCategories();
      setCategories(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoriesData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setImage(null);
    setImagePreview('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category, e) => {
    e.stopPropagation();
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description || '');
    setImage(null);
    setImagePreview(category.image || '');
    setIsModalOpen(true);
  };

  // ២. លុប Category តាម API
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    const category = categories.find((item) => item.id === id);
    if ((category?.foods_count ?? category?.foods?.length ?? 0) > 0) {
      alert('This category has food items. Move or delete the food items first.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteCategory(id);
        fetchCategoriesData();
      } catch (error) {
        alert(error.response?.data?.message || 'An error occurred while deleting the category!');
      }
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      let imageUrl = editingCategory?.image || '';
      if (image instanceof File) {
        imageUrl = await uploadImageToCloudinary(image, 'categories');
      }
      const payload = {
        name: name.trim(),
        description: description.trim(),
        image: imageUrl || null,
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
      } else {
        await createCategory(payload);
      }
      fetchCategoriesData();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error details:', error.response?.data);
      const msg = error.response?.data?.message || 'An error occurred while saving the category!';
      alert(`Failed: ${msg}`);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-500 font-medium">Loading Categories...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0B1F3B]">Category Management</h2>
          <p className="text-xs sm:text-sm text-slate-500">{categories.length} categories</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 bg-[#0B1F3B] hover:bg-[#132C52] text-white px-4 sm:px-5 py-2.5 font-semibold text-sm transition cursor-pointer w-full sm:w-auto"
        >
          <Plus size={17} />
          Add Category
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="group relative bg-white p-4 sm:p-5 border border-[#D6DBE3] flex items-center justify-between hover:border-[#0B1F3B] transition"
          >
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#0B1F3B] text-white flex items-center justify-center shrink-0 overflow-hidden">
                {category.image ? <img src={category.image} alt="" className="w-full h-full object-cover" /> : <Folder size={20} />}
              </div>
              <div className="truncate">
                <h3 className="font-semibold text-[#1A2233] text-sm sm:text-base leading-tight truncate">
                  {category.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">
                  {category.description || 'No description'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 flex flex-row md:flex-col gap-1 text-slate-400 shrink-0 ml-2">
              <button
                onClick={(e) => handleOpenEditModal(category, e)}
                className="p-1.5 hover:text-[#0B1F3B] hover:bg-[#EEF2F8] transition cursor-pointer"
                aria-label="Edit category"
              >
                <Edit2 size={15} />
              </button>
              <button
                onClick={(e) => handleDelete(category.id, e)}
                className="p-1.5 hover:text-[#A6321E] hover:bg-[#FBEEEC] transition cursor-pointer"
                aria-label="Delete category"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Section */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0B1F3B]/50 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto border border-[#D6DBE3]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#D6DBE3] bg-[#0B1F3B]">
              <h3 className="text-base sm:text-lg font-bold text-white">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/70 hover:text-white transition cursor-pointer"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fast Food, Drinks..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[#D6DBE3] text-sm focus:outline-none focus:border-[#0B1F3B]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Category Image</label>
                <label className="flex items-center gap-3 w-full px-4 py-3 bg-[#FAFBFC] border border-dashed border-[#D6DBE3] cursor-pointer hover:border-[#0B1F3B] transition">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Category preview" className="w-14 h-14 object-cover border border-[#D6DBE3]" />
                  ) : (
                    <ImagePlus size={20} className="text-[#0B1F3B]" />
                  )}
                  <span className="text-xs text-slate-500">
                    {image ? image.name : 'Choose an image (JPG, PNG, WEBP)'}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImage(file);
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Optional description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[#D6DBE3] text-sm focus:outline-none focus:border-[#0B1F3B] h-24 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#0B1F3B] hover:bg-[#132C52] text-white font-semibold text-sm transition cursor-pointer"
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