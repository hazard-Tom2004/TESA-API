import express from "express";
import {
  registerUser,
  verifyEmail,
  resendVerificationEmail,
  userLogin,
  createAdmin,
  revokeAdmin,
  changeUserPassword,
  userLogout,
  userRequestReset,
  verifyUserResetToken,
  userResetPassword,
  refreshTokenHandler
} from "../controllers/authController.js";
import rateLimit from "../middlewares/rateLimit.js";
import { verifyToken, requiredRole } from "../middlewares/auth.js";
const router = express.Router();

//Authentication
router.post("/register-user", registerUser);
router.get("/verify-account/:token", verifyEmail);
router.post("/resend-verification-email", rateLimit, resendVerificationEmail);
router.post("/user-login", userLogin);
router.post(
  "/super-admin/create-admin",
  verifyToken,
  requiredRole("super_admin"),
  createAdmin
);
router.post(
  "/super-admin/revoke-admin",
  verifyToken,
  requiredRole("super_admin"),
  revokeAdmin
);
router.put("/change-password-user", verifyToken, changeUserPassword);
router.post("/user-logout", userLogout);
router.post("/request-reset", userRequestReset);
router.get("/verify-reset-token", verifyUserResetToken);
router.post("/update-user-password", userResetPassword);
router.post("/refresh-token", refreshTokenHandler)
// module.exports = router
export default router;
