const { Router } = require("express");
const router = Router();
const { verifyToken } = require("../Middleware/auth");
const {
  register,
  login,
  logout,
  emailVerification,
  resendVerificationEmail,
  passwordResetEmail,
  resetPassword,
  payment,
  verifyPayment,
} = require("../Controller/Controller");

router.route("/user/register").post(register);
router.route("/user/login").post(login);
router.route("/user/logout").get(verifyToken, logout);

router.route("/verify-email").post(emailVerification);
router.route("/resendOTP").post(resendVerificationEmail);
router.route("/passwordResetEmail").post(passwordResetEmail);
router.route("/resetPassword").post(resetPassword);

router.route("/payment").post(payment);
router.route("/paymentVerification").post(verifyPayment);

module.exports = router;
