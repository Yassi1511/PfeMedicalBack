const express = require("express");
const router = express.Router();
const ordonnanceController = require("../controllers/ordonnanceController");
const auth = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const upload = require("../middlewares/upload");
router.post("/", auth, roleMiddleware("Medecin"),upload.single("signatureElectronique"),ordonnanceController.ajouterOrdonnance);
router.get("/medecin", auth, roleMiddleware("Medecin"), ordonnanceController.getOrdonnancesByMedecin);
router.get("/patient", auth, roleMiddleware("Patient"), ordonnanceController.getOrdonnancesForPatient);
// Route pour obtenir une ordonnance spécifique pour un médecin
router.get("/medecin/:id",auth,roleMiddleware("Medecin"),ordonnanceController.getOrdonnancesByMedecinByIdOrdonnance);

// Route pour obtenir une ordonnance spécifique pour un patient
router.get("/patient/:id",auth,roleMiddleware("Patient"),ordonnanceController.getOrdonnancesForPatientByIdOrdonnance);

module.exports = router;
