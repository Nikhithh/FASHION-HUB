const authService = require('../services/authService');
const { generateToken } = require('../utils/jwtHelper');
const crypto = require('crypto');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../services/emailService');

// Reset tokens are valid for 15 minutes
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Helper to set HTTP-only cookie with JWT token
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days matching JWT expiration
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Only HTTPS in production
    sameSite: 'strict',
  };

  res.status(statusCode).cookie('token', token, cookieOptions).json({
    success: true,
    token,
    user,
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body);
    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register a seller + brand in ONE application
 * @route   POST /api/auth/register-seller
 * @access  Public (multipart/form-data with verificationDocument file)
 *
 * Creates the User (role = seller) and the Brand (Pending) together.
 * Issues NO token/session — the seller must wait for admin approval.
 */
const registerSeller = async (req, res, next) => {
  const path = require('path');
  const fs = require('fs');
  const removeUploadedDoc = () => {
    if (req.file) {
      fs.unlink(path.join(require('../middleware/upload').brandDocDir, req.file.filename), () => {});
    }
  };
  try {
    const { name, email, password, brandName, brandDescription, logo, website, location, contactPhone } = req.body;
    const { user, brand } = await authService.registerSellerWithBrand(
      { name, email, password },
      {
        name: brandName,
        description: brandDescription,
        logo,
        website,
        location,
        contactPhone,
      },
      req.file
    );
    res.status(201).json({
      success: true,
      message: 'Your seller application has been submitted and is pending admin verification.',
      user,
      brand,
    });
  } catch (error) {
    // Never leave stray uploaded files behind on validation/service errors
    // (e.g. duplicate email) — the doc belongs to a failed application.
    removeUploadedDoc();
    next(error);
  }
};

/**
 * @desc    Login user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const user = await authService.loginUser(req.body);
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user / clear cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logout = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000), // expire in 10 seconds
      httpOnly: true,
    });
    res.status(200).json({
      success: true,
      message: 'User logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get the caller's seller/brand verification status
 * @route   GET /api/auth/seller-status
 * @access  Private
 *
 * Lets the Brand/Seller login page and the seller route guard distinguish
 * Pending vs Rejected vs Approved without trusting any frontend-supplied role.
 * Non-sellers receive role info with approved: false and no brand details.
 */
const getSellerStatus = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'seller') {
      return res.status(200).json({
        success: true,
        role: req.user ? req.user.role : null,
        approved: false,
        verificationStatus: null,
        brands: [],
      });
    }
    const Brand = require('../models/Brand');
    const owned = await Brand.find({ seller: req.user._id }).select('name verificationStatus');
    const brands = (owned || []).map((b) => ({
      _id: b._id,
      name: b.name,
      verificationStatus: b.verificationStatus,
    }));
    const approved = brands.some((b) => b.verificationStatus === 'Approved');
    const verificationStatus = approved
      ? 'Approved'
      : brands.some((b) => b.verificationStatus === 'Rejected')
        ? 'Rejected'
        : brands.length > 0
          ? 'Pending'
          : null; // no brand yet — may submit first application
    res.status(200).json({ success: true, role: 'seller', approved, verificationStatus, brands });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Request a password reset link
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    // Generic response either way — never reveal whether the email exists
    const generic = () =>
      res.status(200).json({
        success: true,
        message: 'If an account exists for this email, a password reset link has been sent.',
      });

    const user = await User.findOne({ email });
    if (!user) return generic();

    // Cryptographically secure token; store only its hash with an expiry
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = hashResetToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    await sendPasswordResetEmail(user.email, resetUrl);

    // Dev/testing only: expose the token so the flow is testable without an inbox.
    // Never returned in production.
    if (process.env.NODE_ENV === 'production') return generic();
    return res.status(200).json({
      success: true,
      message: 'If an account exists for this email, a password reset link has been sent.',
      resetToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password with a valid reset token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const hashed = hashResetToken(req.params.token || '');
    const user = await User.findOne({
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires +password');

    if (!user) {
      res.status(400);
      throw new Error('Reset token is invalid or has expired');
    }

    user.password = req.body.password; // hashed by pre-save hook
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  registerSeller,
  login,
  logout,
  getProfile,
  getSellerStatus,
  forgotPassword,
  resetPassword,
};
