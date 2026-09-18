const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');
const Brand = require('../models/Brand');
const { brandDocDir } = require('../middleware/upload');

// @desc    Get all brands
// @route   GET /api/brands
// @access  Public
const getBrands = asyncHandler(async (req, res) => {
  const query = Brand.find();
  // `.populate` exists on real Mongoose queries; mocked models in unit
  // tests may resolve directly to an array, so guard before chaining.
  const brands = typeof query.populate === 'function'
    ? await query.populate('seller', 'name email')
    : await query;
  res.status(200).json({ success: true, count: brands.length, data: brands });
});

// @desc    Get single brand
// @route   GET /api/brands/:id
// @access  Public
const getBrand = asyncHandler(async (req, res) => {
  const query = Brand.findById(req.params.id);
  const brand = query && typeof query.populate === 'function'
    ? await query.populate('seller', 'name email')
    : await query;
  if (!brand) {
    res.status(404);
    throw new Error('Brand not found');
  }
  res.status(200).json({ success: true, data: brand });
});

// Attach an uploaded verification document (multer single file) to a payload object.
const attachVerificationDoc = (payload, file) => {
  if (!file) return;
  payload.verificationDocument = `/uploads/brand-documents/${file.filename}`;
  payload.verificationDocumentName = file.originalname;
  payload.verificationDocumentMimeType = file.mimetype;
  payload.verificationDocumentUploadedAt = new Date();
};

// Safely delete a previously stored verification document file.
const deleteOldDocFile = (docPath) => {
  if (!docPath || typeof docPath !== 'string') return;
  const filename = path.basename(docPath);
  // Prevent path traversal: only delete inside the brand-documents dir
  if (!filename || filename.includes('..')) return;
  const abs = path.join(brandDocDir, filename);
  fs.unlink(abs, () => {});
};

// @desc    Create brand
// @route   POST /api/brands
// @access  Private
const createBrand = asyncHandler(async (req, res) => {
  if (req.user && req.user.role === 'seller') {
    req.body.seller = req.user.id || req.user._id;
  }
  if (req.user && req.user.role !== 'admin') {
    // Sellers/customers can request brands but can never self-approve:
    // every non-admin submission starts as Pending for admin review.
    req.body.verificationStatus = 'Pending';
    // Never trust client-provided review fields
    delete req.body.adminVerificationNote;
    delete req.body.rejectionReason;
    delete req.body.verifiedAt;
  }
  if (req.file) {
    attachVerificationDoc(req.body, req.file);
  }
  const brand = await Brand.create(req.body);
  res.status(201).json({ success: true, data: brand });
});

// Only the owning seller (or an admin) may modify a brand.
// Non-admins can never change verification state or reassign ownership.
const assertBrandOwnership = async (brandId, user, res) => {
  const brand = await Brand.findById(brandId);
  if (!brand) {
    res.status(404);
    throw new Error('Brand not found');
  }
  if (user && user.role !== 'admin') {
    const owner = brand.seller ? brand.seller.toString() : null;
    const me = ((user.id || user._id) || '').toString();
    if (!owner || owner !== me) {
      res.status(403);
      throw new Error('Not authorized to manage this brand');
    }
  }
  return brand;
};

// @desc    Update brand
// @route   PUT /api/brands/:id
// @access  Private
const updateBrand = asyncHandler(async (req, res) => {
  const existing = await assertBrandOwnership(req.params.id, req.user, res);
  if (req.user && req.user.role !== 'admin') {
    delete req.body.verificationStatus;
    delete req.body.seller;
    delete req.body.adminVerificationNote;
    delete req.body.rejectionReason;
    delete req.body.verifiedAt;
  }
  if (req.file) {
    // Approved sellers must go through admin review again when the
    // verification document changes — never silently keep Approved.
    if (req.user && req.user.role !== 'admin' && existing.verificationStatus === 'Approved') {
      req.body.verificationStatus = 'Pending';
      req.body.verifiedAt = undefined;
    } else if (
      req.user && req.user.role !== 'admin' &&
      existing.verificationStatus === 'Rejected'
    ) {
      // Resubmission after rejection re-enters the review queue
      req.body.verificationStatus = 'Pending';
      req.body.rejectionReason = undefined;
    }
    attachVerificationDoc(req.body, req.file);
    deleteOldDocFile(existing.verificationDocument);
  }
  const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!brand) {
    // New file was stored but brand vanished — clean up to avoid orphans
    if (req.file) deleteOldDocFile(`/uploads/brand-documents/${req.file.filename}`);
    res.status(404);
    throw new Error('Brand not found');
  }
  res.status(200).json({ success: true, data: brand });
});

// @desc    Delete brand
// @route   DELETE /api/brands/:id
// @access  Private
const deleteBrand = asyncHandler(async (req, res) => {
  const brand = await assertBrandOwnership(req.params.id, req.user, res);
  deleteOldDocFile(brand.verificationDocument);
  await brand.deleteOne();
  res.status(200).json({ success: true, data: {} });
});

// Resolve a brand's stored document to an absolute path inside brandDocDir.
// Returns null when the stored value is missing or unsafe.
const resolveDocAbsPath = (brand) => {
  if (!brand || !brand.verificationDocument) return null;
  const filename = path.basename(brand.verificationDocument);
  if (!filename || filename.includes('..')) return null;
  return path.join(brandDocDir, filename);
};

const mimeForBrandDoc = (brand, absPath) => {
  if (brand.verificationDocumentMimeType) return brand.verificationDocumentMimeType;
  const ext = path.extname(absPath).toLowerCase();
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.png') return 'image/png';
  return 'image/jpeg';
};

// @desc    Stream a brand verification document (owner seller or admin only)
// @route   GET /api/brands/:id/verification-document
// @access  Private (owner seller, admin)
const getVerificationDocument = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) {
    res.status(404);
    throw new Error('Brand not found');
  }
  const isAdmin = req.user && req.user.role === 'admin';
  const owner = brand.seller ? brand.seller.toString() : null;
  const me = req.user ? ((req.user.id || req.user._id) || '').toString() : '';
  if (!isAdmin && (!owner || owner !== me)) {
    res.status(403);
    throw new Error('Not authorized to view this verification document');
  }
  const absPath = resolveDocAbsPath(brand);
  if (!absPath || !fs.existsSync(absPath)) {
    res.status(404);
    throw new Error('Verification document not found');
  }
  res.setHeader('Content-Type', mimeForBrandDoc(brand, absPath));
  // Inline so PDFs/images open in the browser tab instead of forcing download
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${(brand.verificationDocumentName || 'verification-document').replace(/"/g, '')}"`
  );
  res.sendFile(absPath);
});

module.exports = {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
  getVerificationDocument,
};
