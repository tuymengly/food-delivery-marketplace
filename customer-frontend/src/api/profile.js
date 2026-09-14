import api from './axios';

export const getProfile = () => api.get('/user');
export const updateProfile = (data) => api.put('/profile', data);
export const changePassword = (data) => api.put('/change-password', data);

export const uploadProfileImage = async (file) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) throw new Error('Profile image upload is not configured.');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'food-delivery/profiles');
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.secure_url) throw new Error(result.error?.message || 'Profile image upload failed.');
  return result.secure_url;
};