const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const uploadImageToCloudinary = async (file, folder = 'foods') => {
  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary upload is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', `food-delivery/${folder}`);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.secure_url) {
    throw new Error(data.error?.message || 'Cloudinary image upload failed.');
  }

  return data.secure_url;
};

// Uses Cloudinary's "auto" resource type so non-image files (PDFs, docs)
// used for restaurant application documents upload correctly too.
export const uploadFileToCloudinary = async (file, folder = 'documents') => {
  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary upload is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', `food-delivery/${folder}`);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    { method: 'POST', body: formData }
  );
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.secure_url) {
    throw new Error(data.error?.message || 'Cloudinary file upload failed.');
  }

  return data.secure_url;
};
