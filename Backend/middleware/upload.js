const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Absolute upload dir: Backend/uploads/products
const uploadDir = path.join(__dirname, '..', 'uploads', 'products');
fs.mkdirSync(uploadDir, { recursive: true });

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ALLOWED_EXT.includes(ext) ? ext : '.jpg';
    const base = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${base}${safeExt}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (ALLOWED_MIME.includes(file.mimetype) && ALLOWED_EXT.includes(ext)) {
    return cb(null, true);
  }
  const err = new Error('Only image files (jpg, jpeg, png, webp, gif) are allowed');
  err.code = 'INVALID_FILE_TYPE';
  return cb(err);
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

// Wrap multer array() to return clean 400 JSON errors instead of HTML/crash
const handleUpload = (field = 'images', maxCount = MAX_FILES) => (req, res, next) => {
  upload.array(field, maxCount)(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Each image must be 5MB or smaller' });
      }
      if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ success: false, message: `Maximum ${maxCount} images allowed` });
      }
      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({ success: false, message: err.message });
      }
      return res.status(400).json({ success: false, message: err.message || 'Image upload failed' });
    }
    return next();
  });
};

// Convert a stored file to a public web path (never expose absolute fs path)
const toPublicImagePath = (file) => `/uploads/products/${file.filename}`;

// ---- Brand verification documents (sensitive, admin-reviewed only) ----
// BRAND_DOC_DIR override exists so tests can isolate uploads per suite.
const brandDocDir = process.env.BRAND_DOC_DIR || path.join(__dirname, '..', 'uploads', 'brand-documents');
fs.mkdirSync(brandDocDir, { recursive: true });

const BRAND_DOC_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const BRAND_DOC_MIME = ['application/pdf', 'image/jpeg', 'image/png'];
const BRAND_DOC_EXT = ['.pdf', '.jpg', '.jpeg', '.png'];

const brandDocStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, brandDocDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = BRAND_DOC_EXT.includes(ext) ? ext : '.pdf';
    const base = `brand-doc-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${base}${safeExt}`);
  },
});

const brandDocFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (BRAND_DOC_MIME.includes(file.mimetype) && BRAND_DOC_EXT.includes(ext)) {
    return cb(null, true);
  }
  const err = new Error('Invalid verification document. Please upload a PDF, JPG, JPEG, or PNG file up to 5 MB.');
  err.code = 'INVALID_DOC_TYPE';
  return cb(err);
};

const brandDocUpload = multer({
  storage: brandDocStorage,
  limits: { fileSize: BRAND_DOC_MAX_SIZE },
  fileFilter: brandDocFileFilter,
});

// Single verification document (field: verificationDocument)
const handleBrandDocUpload = (field = 'verificationDocument') => (req, res, next) => {
  brandDocUpload.single(field)(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Invalid verification document. Please upload a PDF, JPG, JPEG, or PNG file up to 5 MB.' });
      }
      if (err.code === 'INVALID_DOC_TYPE') {
        return res.status(400).json({ success: false, message: err.message });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ success: false, message: 'Only one verification document is allowed' });
      }
      return res.status(400).json({ success: false, message: err.message || 'Verification document upload failed' });
    }
    return next();
  });
};

module.exports = { upload, handleUpload, toPublicImagePath, MAX_FILES, MAX_FILE_SIZE, handleBrandDocUpload, BRAND_DOC_MAX_SIZE, brandDocDir };
