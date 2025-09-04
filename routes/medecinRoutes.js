// routes/medecinRoutes.js (update the router)
const express = require('express');
const medecinCtrl = require('../controllers/medecinController');
const authMiddleware = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');

const router = express.Router();

// Middlewares groupés par rôle
const authMedecin = [authMiddleware, authorizeRoles('Medecin')];
const authPatient = [authMiddleware, authorizeRoles('Patient')];
const authSecretaire = [authMiddleware, authorizeRoles('Secretaire')];

/* =========================================================================
   📌 Les routes sont montées sur /api/medecins dans server.js
   ========================================================================= */

/* ───── 📦 Accès Authentifié pour TOUS les rôles ───── */

// ✅ Ajouter un patient à un médecin par une secrétaire
router.post(
  '/ajouter-patient',
  ...authSecretaire,
  medecinCtrl.ajouterPatientParSecretaire
);

// ✅ Récupérer les rendez-vous par ID de secrétaire
router.get(
  '/rendez-vous',
  ...authSecretaire,
  medecinCtrl.getRendezVousBySecretaire
);

// ✅ Récupérer les patients par ID de secrétaire
router.get(
  '/patients-by-secretaire',
  ...authSecretaire,
  medecinCtrl.getPatientsBySecretaire
);

router.get('/:medecinId/patients', authMiddleware, medecinCtrl.getPatientsByMedecinId);

// ✅ Obtenir tous les médecins
router.get('/', authMiddleware, medecinCtrl.getAllMedecins);

// ✅ Rechercher par nom
router.get('/nom/:nom', authMiddleware, medecinCtrl.getMedecinByName);

// ✅ Rechercher par spécialité
router.get('/specialite/:specialite', authMiddleware, medecinCtrl.getMedecinsBySpecialite);

// ✅ 🧑‍💼 Accès Secrétaire : Voir ses Médecins
router.get('/medecins-by-secretaire', ...authSecretaire, medecinCtrl.getMedecinsBySecretaire);
router.get('/secretaires', ...authMedecin, medecinCtrl.getSecretairesByMedecin);

// ✅ Récupérer médecin par ID (⚠️ dynamique : toujours la dernière)
router.get('/:id', authMiddleware, medecinCtrl.getMedecinById);

/* ───── 👨‍⚕️ Accès Médecin uniquement ───── */
// ✅ Voir la liste de ses secrétaires
// ✅ Lier une secrétaire existante
router.post('/secretaires', ...authMedecin, medecinCtrl.lierSecretaireExistanteAuMedecin);

// ✅ Modifier une secrétaire
router.put('/secretaires/:secretaireId', ...authMedecin, medecinCtrl.updateSecretaire);

// ✅ Délier une secrétaire
router.delete('/secretaires/:secretaireId', ...authMedecin, medecinCtrl.removeSecretaire);

module.exports = router;