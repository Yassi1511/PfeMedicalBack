// 📁 4. ROUTES - userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/forget-password", userController.forgetPassword);
router.post("/reset-password", userController.resetPassword);

router.get("/profile", authMiddleware, userController.getProfile);
router.put("/profile", authMiddleware, userController.updateProfile);
router.delete("/profile", authMiddleware, userController.deleteProfile);

module.exports = router;