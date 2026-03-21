const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const path = require('path');
const fs = require('fs');

// Use memory storage for multer since we upload directly to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    // Convert buffer to Base64 to upload to Cloudinary
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'avatars',
      resource_type: 'image'
    });

    res.status(200).json({
      success: true,
      data: {
        secure_url: result.secure_url
      }
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, message: 'Image upload failed' });
  }
});

const editorStorage = multer.memoryStorage();

const editorFileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/octet-stream'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, WEBP, and HEIC are allowed.'));
  }
};

const uploadEditorArgs = multer({
  storage: editorStorage,
  fileFilter: editorFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('image');

router.post('/editor-image', uploadEditorArgs, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'editor-images',
      resource_type: 'image'
    });

    res.status(200).json({
      success: true,
      url: result.secure_url
    });
  } catch (error) {
    console.error('Editor Image Upload Error:', error);
    res.status(500).json({ success: false, message: 'Image upload failed' });
  }
});

module.exports = router;
