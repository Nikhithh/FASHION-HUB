/**
 * Email service abstraction for auth flows.
 *
 * No real SMTP provider is wired yet. In production this module should be
 * swapped to send real emails (e.g. nodemailer / SendGrid) without changing
 * the controllers: they only call `sendPasswordResetEmail(email, resetUrl)`.
 *
 * In non-production environments the reset URL is logged so developers and
 * automated tests can complete the flow without an inbox.
 */

const sendPasswordResetEmail = async (email, resetUrl) => {
  if (process.env.NODE_ENV === 'production') {
    // TODO: integrate real email provider here.
    return { sent: false, reason: 'no-provider' };
  }
  // Development/testing only: visible, non-secret-leaking channel (server logs).
  // eslint-disable-next-line no-console
  console.log(`[email-stub] Password reset for ${email}: ${resetUrl}`);
  return { sent: true, stub: true };
};

module.exports = { sendPasswordResetEmail };
