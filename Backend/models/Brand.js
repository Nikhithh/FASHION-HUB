const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Please add a brand name'] },
  description: { type: String },
  logo: { type: String },
  website: { type: String, trim: true },
  location: { type: String, trim: true },
  contactPhone: { type: String, trim: true },
  verificationStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Manual admin verification document (evidence of brand legitimacy).
  // NOTE: presence of a file is NOT proof of genuineness — an admin must
  // manually review the document before approving the brand.
  verificationDocument: { type: String },
  verificationDocumentName: { type: String },
  verificationDocumentMimeType: { type: String },
  verificationDocumentUploadedAt: { type: Date },
  // Admin review fields (manual verification only)
  adminVerificationNote: { type: String },
  rejectionReason: { type: String },
  verifiedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Brand', brandSchema);
