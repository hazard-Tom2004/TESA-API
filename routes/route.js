import express from "express";
import {
  registerUser,
  verifyEmail,
  resendVerificationEmail,
  loginStudent,
  loginAdmin,
  loginSuperAdmin,
  changeUserPassword,
  userLogout,
  userRequestReset,
  verifyUserResetToken,
  userResetPassword,
  refreshTokenHandler,
} from "../controllers/authController.js";
import {
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser,
  uploadAvatar,
  assignAdmin,
  revokeAdmin,
} from "../controllers/userController.js";
import {
  createCourse,
  getCourses,
  getCourseDetails,
  updateCourse,
  deleteCourse,
  syncCourse,
  getUserCourses
} from "../controllers/courseController.js";
import {
  uploadMaterial,
  batchUploadMaterial,
  getMaterialsByCourse,
  getMaterialsByType,
  searchMaterials,
} from "../controllers/materialController.js";
import {
  createSuggestion,
  getPendingSuggestions,
  approveSuggestion,
  rejectSuggestion,
  getSuggestionStats,
} from "../controllers/suggestionController.js";
import {
  getFileById,
  getFileType,
  streamVideo,
  previewDocument,
} from "../controllers/fileController.js";
import rateLimit from "../middlewares/rateLimit.js";
import { verifyUser, verifyToken, requiredRole } from "../middlewares/auth.js";
import { setCurrentSession } from "../controllers/sessionController.js";
import { setCurrentSemester } from "../controllers/semesterController.js";
import upload from "../middlewares/multer.js";
const router = express.Router();

//Authentication
router.post("/auth/register-user", registerUser);
router.get("/auth/verify-account/:token", verifyEmail);
router.post(
  "/auth/resend-verification-email",
  rateLimit,
  resendVerificationEmail
);
router.post("/auth/login-student", loginStudent);
router.post("/auth/login-admin", loginAdmin);
router.post("/auth/login-super-admin", loginSuperAdmin);
router.put("/auth/change-password-user", verifyToken, changeUserPassword);
router.post("/auth/user-logout", userLogout);
router.post("/auth/request-reset", userRequestReset);
router.get("/auth/verify-reset-token", verifyUserResetToken);
router.post("/auth/update-user-password", userResetPassword);
router.post("/auth/refresh-token", refreshTokenHandler);

//user management
router.get("/get-user/:id", getUserById);
router.get("/get-user-by-email/:email", getUserByEmail);
router.post(
  "/upload-avatar/:id",
  verifyUser,
  upload.single("avatar"),
  uploadAvatar
);
router.put(
  "/update-user/:id",
  verifyUser,
  requiredRole("admin,super_admin"),
  upload.single("avatar"),
  updateUser
);
router.delete(
  "/admin/delete-user/:id",
  verifyUser,
  requiredRole("admin", "super_admin"),
  deleteUser
);

// Role management
router.post(
  "/super-admin/create-admin",
  verifyToken,
  requiredRole("admin", "super_admin"),
  assignAdmin
);
router.post(
  "/super-admin/revoke-admin",
  verifyToken,
  requiredRole("admin", "super_admin"),
  revokeAdmin
);

//course management
router.post(
  "/create-course",
  verifyUser,
  requiredRole("admin", "super_admin"),
  createCourse
);
router.get("/get-course", getCourses);
router.get("/get-course-details/:courseCode", getCourseDetails);
router.put(
  "/update-course/:id",
  verifyUser,
  requiredRole("admin", "super_admin"),
  updateCourse
);
router.delete(
  "/delete-course/:id",
  verifyUser,
  requiredRole("admin", "super_admin"),
  deleteCourse
);
router.put(
  "/courses/:courseCode/sync",
  verifyUser,
  requiredRole("admin", "super_admin"),
  syncCourse
);
router.get("/get-user-courses", verifyUser, getUserCourses);

//Course Upload route
router.post(
  "/upload-course-material/:id",
  verifyUser,
  requiredRole("admin", "super_admin"),
  upload.single("file"),
  uploadMaterial
);
router.get(
  "/get-material-by-course/:courseCode",
  verifyUser,
  getMaterialsByCourse
);
router.get("/get-material-by-type/:type", verifyUser, getMaterialsByType);
router.get("/search-material", verifyUser, searchMaterials);
router.post(
  "/upload-batch-course-material/:courseCode",
  verifyUser,
  requiredRole("admin", "super_admin"),
  upload.array("files"),
  batchUploadMaterial
);

router.post(
  "/create-suggestion",
  verifyUser,
  upload.single("file"),
  createSuggestion
);
router.get("/get-pending-suggestion", verifyUser, getPendingSuggestions);
router.put(
  "/approve-suggestion",
  verifyUser,
  requiredRole("admin", "super_admin"),
  approveSuggestion
);
router.put(
  "/reject-suggestion",
  verifyUser,
  requiredRole("admin", "super_admin"),
  rejectSuggestion
);
router.get("/get-suggestion-stats", verifyUser, getSuggestionStats);

//File retrieval and streaming
router.get("/get-file-by-id/:id", verifyUser, getFileById);
router.get("/get-material-type/:id", verifyUser, getFileType);
router.get("stream-video/:id", verifyUser, streamVideo);
router.get("/preview-document/:id", verifyUser, previewDocument);

//Set Session
router.post("/set-current-session", verifyUser, requiredRole("super_admin"), setCurrentSession);

//set semester
router.post("/set-current-semester", verifyUser, requiredRole("admin", "super_admin"), setCurrentSemester);
// module.exports = router
export default router;
