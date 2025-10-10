const cloudinary = require('cloudinary').v2;

const {
  CLOUD_NAME = '',
  API_KEY = '',
  API_SECRET = '',
  FOLDER_NAME = 'winkget'
} = process.env;

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
});

function uploadBuffer(buffer, filename, folder = FOLDER_NAME) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', public_id: undefined, filename_override: filename },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

module.exports = { cloudinary, uploadBuffer };


