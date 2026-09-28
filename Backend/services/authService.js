const User = require('../models/User');

/**
 * Register a new user in the database
 * @param {Object} userData - Contains name, email, password, and optional role
 * @returns {Promise<Object>} Created user object (without password)
 */
const registerUser = async (userData) => {
  const { name, email, password, role } = userData;

  // 1. Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    const error = new Error('User already exists with this email address');
    error.statusCode = 400;
    throw error;
  }

  // 2. Create the new user
  // Defense-in-depth: public registration can never grant the admin role,
  // even if route-level validation is bypassed. Admins are created via seeder
  // or by an existing admin through user management.
  const safeRole = ['customer', 'seller'].includes(role) ? role : 'customer';
  const user = await User.create({
    name,
    email,
    password,
    role: safeRole,
  });

  // Return user object without the password field
  const userObj = user.toObject();
  delete userObj.password;
  
  return userObj;
};

/**
 * Authenticate user credentials
 * @param {Object} credentials - Contains email and password
 * @returns {Promise<Object>} The authenticated user object (without password)
 */
const loginUser = async (credentials) => {
  const { email, password } = credentials;

  // 1. Find user by email, explicitly selecting the password field (since it is deselected by default)
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // 2. Verify password match
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // 3. Seller login gate (authoritative field: Brand.verificationStatus).
  // Sellers with no brand yet may log in to submit their first brand for
  // review. Once a seller owns brand(s), at least one must be Approved;
  // sellers whose brands are all Pending/Rejected stay blocked.
  // NOTE: this is a manual admin-verification gate — no automatic claim
  // about document genuineness is made here.
  if (user.role === 'seller') {
    const Brand = require('../models/Brand');
    const found = Brand.find({ seller: user._id });
    const owned = await (found && typeof found.select === 'function'
      ? found.select('verificationStatus')
      : found);
    if (Array.isArray(owned) && owned.length > 0) {
      const hasApproved = owned.some((b) => b.verificationStatus === 'Approved');
      if (!hasApproved) {
        // Distinguish pending vs rejected so the Brand/Seller login page can
        // show the right message. Generic wording otherwise (no info leak:
        // only the owner learns their own brand status after valid login).
        const hasRejected = owned.some((b) => b.verificationStatus === 'Rejected');
        const error = new Error(
          hasRejected
            ? 'Your brand verification was rejected.'
            : 'Your brand verification is pending.'
        );
        error.statusCode = 403;
        throw error;
      }
    }
  }

  // Convert to object and remove password
  const userObj = user.toObject();
  delete userObj.password;

  return userObj;
};

/**
 * Register a seller AND their brand in one application.
 * Creates the User (role = seller) and the Brand (verificationStatus =
 * Pending, linked via Brand.seller) together so there is no separate
 * "brand registration" step. No JWT/session is issued here — the seller
 * stays blocked until an admin approves the brand.
 *
 * If brand creation fails after the user was created, the orphaned user
 * is removed again (compensating rollback; avoids requiring MongoDB
 * replica-set transactions).
 *
 * @param {Object} userData - { name, email, password }
 * @param {Object} brandData - { name, description, logo, website, location, contactPhone }
 * @param {Object} file - multer file for the verification document
 * @returns {Promise<{user: Object, brand: Object}>}
 */
const registerSellerWithBrand = async (userData, brandData, file) => {
  const { name, email, password } = userData;

  // 1. Email must be unique — fail before creating anything
  const userExists = await User.findOne({ email });
  if (userExists) {
    const error = new Error('User already exists with this email address');
    error.statusCode = 400;
    throw error;
  }

  // 2. Verification document is required for a seller application
  if (!file) {
    const error = new Error('Brand verification document is required. Please upload a PDF, JPG, JPEG, or PNG file up to 5 MB.');
    error.statusCode = 400;
    throw error;
  }

  // 3. Create the seller account
  const user = await User.create({ name, email, password, role: 'seller' });

  // 4. Create the brand linked to the seller (Pending admin review).
  // Manual verification only — the document is evidence, not proof.
  try {
    const Brand = require('../models/Brand');
    const brand = await Brand.create({
      name: brandData.name,
      description: brandData.description,
      logo: brandData.logo,
      website: brandData.website,
      location: brandData.location,
      contactPhone: brandData.contactPhone,
      seller: user._id,
      verificationStatus: 'Pending',
      verificationDocument: `/uploads/brand-documents/${file.filename}`,
      verificationDocumentName: file.originalname,
      verificationDocumentMimeType: file.mimetype,
      verificationDocumentUploadedAt: new Date(),
    });

    const userObj = user.toObject();
    delete userObj.password;
    try {
      const { notifyAdmins } = require('./notificationService');
      await notifyAdmins({
        type: 'NEW_BRAND_APPLICATION',
        title: 'New Brand Application',
        message: `A new brand application "${brand.name}" is waiting for verification.`,
        relatedId: brand._id,
        relatedType: 'Brand',
      });
    } catch (err) {
      // Notifications must never break seller registration
    }
    return { user: userObj, brand };
  } catch (brandError) {
    // Roll back the orphaned seller account so a failed application
    // leaves no half-registered user behind.
    try {
      await User.findByIdAndDelete(user._id);
    } catch (cleanupError) {
      // Best-effort cleanup; surface the original brand error below.
    }
    throw brandError;
  }
};

module.exports = {
  registerUser,
  registerSellerWithBrand,
  loginUser,
};
