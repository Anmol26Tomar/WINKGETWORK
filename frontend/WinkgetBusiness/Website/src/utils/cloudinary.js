// Simple Cloudinary upload helper for frontend
// Requires VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET env vars
// Optional: VITE_CLOUDINARY_FOLDER to group uploads under a folder (e.g., winkget)

const CLOUD_NAME = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) || ''
const UPLOAD_PRESET = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET) || ''
const FOLDER = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_CLOUDINARY_FOLDER) || ''

export async function uploadImageToCloudinary(file) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary is not configured. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET')
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  if (FOLDER) formData.append('folder', FOLDER)

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = data.error?.message || 'Failed to upload image'
    throw new Error(message)
  }
  return data.secure_url || data.url
}

export async function uploadImagesToCloudinary(files) {
  const uploads = Array.from(files).map(f => uploadImageToCloudinary(f))
  return Promise.all(uploads)
}

export default { uploadImageToCloudinary, uploadImagesToCloudinary }


