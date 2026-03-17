const multer = require('multer');
const path = require('path');

// Use memory storage for Cloudinary upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Flutter's http.MultipartRequest can sometimes default to 'application/octet-stream'
  // Or if it's explicitly an image
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/octet-stream') {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

module.exports = upload;
