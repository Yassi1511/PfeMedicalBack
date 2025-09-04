const express = require("express");
const { getNotifications, marquerCommeLu, genererNotification  } = require("../controllers/notificationController"); // Ajout de l'import manquant
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();
// 📌 Générer une notification pour un médicament spécifique (ID = médicament)
router.post("/generer/:id", authMiddleware, genererNotification);

// 📌 Obtenir les notifications du patient connecté
router.get("/", authMiddleware, getNotifications);

// 📌 Marquer une notification comme "lue"
router.put("/:id/lire", authMiddleware, marquerCommeLu);

module.exports = router;
