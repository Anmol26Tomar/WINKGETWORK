require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { Agent } = require('../models/Agent');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const TYPE_TO_FIELD = {
  driving_license: 'drivingLicenseUrl',
  aadhar_card: 'aadharCardUrl',
  vehicle_registration: 'vehicleRegistrationUrl',
  insurance: 'insuranceUrl',
  driver_vehicle_photo: 'driverVehiclePhotoUrl',
};

exports.uploadDocument = async (req, res) => {
  try {
    const { type } = req.params; // one of TYPE_TO_FIELD keys
    let { file } = req.body; // data URI or base64 string
    const agentId = req.agent._id;

    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    const presetFromBody = (req.body && req.body.uploadPreset) || '';
    const CLOUDINARY_UPLOAD_PRESET = presetFromBody || process.env.CLOUDINARY_UPLOAD_PRESET;
    if (!CLOUDINARY_CLOUD_NAME) {
      return res.status(500).json({ success: false, message: 'CLOUDINARY_CLOUD_NAME missing' });
    }
    if (!CLOUDINARY_UPLOAD_PRESET && (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET)) {
      return res.status(500).json({ success: false, message: 'Provide CLOUDINARY_UPLOAD_PRESET for unsigned upload or API KEY/SECRET for signed upload' });
    }

    if (!TYPE_TO_FIELD[type]) {
      return res.status(400).json({ success: false, message: 'Invalid document type' });
    }
    if (!file) {
      return res.status(400).json({ success: false, message: 'File (base64/data URI) is required' });
    }
    // Normalize base64 -> data URI if needed
    if (!file.startsWith('data:')) {
      file = `data:image/jpeg;base64,${file}`;
    }

    let upload;
    const folder = `winkget/agent_docs/${agentId}`;
    if (CLOUDINARY_UPLOAD_PRESET) {
      // Unsigned upload path - avoid options that force signing
      const options = { upload_preset: CLOUDINARY_UPLOAD_PRESET, resource_type: 'image' };
      // Only set folder if your preset allows dynamic folders; otherwise omit
      if (process.env.CLOUDINARY_PRESET_ALLOWS_FOLDER === 'true') {
        options.folder = folder;
      }
      upload = await cloudinary.uploader.upload(file, options);
    } else {
      // Signed upload path, keep options minimal to reduce signature scope
      upload = await cloudinary.uploader.upload(file, {
        folder,
        resource_type: 'image',
      });
    }

    const field = TYPE_TO_FIELD[type];
    await Agent.findByIdAndUpdate(agentId, { [field]: upload.secure_url });

    res.json({ success: true, url: upload.secure_url, field });
  } catch (e) {
    console.error('uploadDocument error', { message: e?.message, http_code: e?.http_code });
    res.status(500).json({ success: false, message: e?.message || 'Upload failed' });
  }
};


