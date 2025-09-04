const express = require("express");
const { ajouterMedicament, getMedicaments ,updateMedicament ,deleteMedicament,getMedicamentsParPatient,ajouterMedicamentParMedecin} = require("../controllers/medicamentController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");
const router = express.Router();

// 📌 Routes sécurisées par le token du patient
router.post("/", authMiddleware,authorizeRoles("Patient"), ajouterMedicament);
// 📌 Obtenir les médicaments du patient connecté (pas besoin d'ID dans l'URL)
router.get("/", authMiddleware,authorizeRoles("Patient"), getMedicaments);
// Ajouter un médicament pour un patient spécifique (par un médecin)
router.post("/par-medecin/:id",authMiddleware,authorizeRoles("Medecin"),ajouterMedicamentParMedecin);
// 📌 Obtenir les médicaments ParPatient
router.get('/patient/:id', authMiddleware, authorizeRoles("Medecin"), getMedicamentsParPatient);
// ✅ Mettre à jour un médicament (PATCH ou PUT selon ton choix)
router.put('/:id', authMiddleware,authorizeRoles("Medecin"),updateMedicament);
// ✅ Supprimer un médicament
router.delete('/:id', authMiddleware,authorizeRoles("Medecin"), deleteMedicament);
module.exports = router;