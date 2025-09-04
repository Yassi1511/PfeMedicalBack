const express = require("express");
const traitementController = require("../controllers/traitementController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const router = express.Router();

// Ajouter un traitement
router.post("/", authMiddleware, roleMiddleware("Medecin"), traitementController.ajouterTraitement);

// Récupérer tous les traitements
router.get("/", authMiddleware, roleMiddleware("Medecin"), traitementController.getAllTraitements);

// Récupérer les traitements par médecin
router.get("/medecin", authMiddleware, roleMiddleware("Medecin"), traitementController.getTraitementsByMedecin);

// Ajouter un traitement pour un patient spécifique
router.post(
  "/patients/:patientId",
  authMiddleware,
  roleMiddleware("Medecin"),
  traitementController.ajouterTraitementsByPatient
);

// Récupérer les traitements d’un patient spécifique
router.get(
  "/patients/:patientId",
  authMiddleware,
  roleMiddleware("Medecin"),
  traitementController.getTraitementsByPatient
);

// Route de modification d’un traitement
router.put("/:id", authMiddleware, roleMiddleware("Medecin"), traitementController.modifierTraitement);


// suppression d’un traitement
router.delete("/:id", authMiddleware, roleMiddleware("Medecin"), traitementController.supprimerTraitement);



module.exports = router;