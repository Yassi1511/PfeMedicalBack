const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const {
  ajouterRendezVous,
  listerRendezVous,
  modifierRendezVous,
  annulerRendezVous,
  consulterRendezVous,
  supprimerRendezVous,
  verifierDisponibilite,
  getRendezVousDuJour,
  listerRendezVousPatient,
  annulerRendezVousPatient,
  ajouterCommentaireRendezVous,
  getRdvById, // Added new endpoint
} = require('../controllers/RendezVousController');

// Toutes les routes passent d’abord par le JWT
router.use(authMiddleware);

// Routes réservées à la Secrétaire
router.get('/:id', roleMiddleware('Secretaire'), getRdvById); // New route for getting rendez-vous by ID
router.put('/consulter/:id', roleMiddleware('Secretaire', 'Medecin'), consulterRendezVous);
router.post('/', roleMiddleware('Secretaire'), ajouterRendezVous);
router.get('/', roleMiddleware('Secretaire'), listerRendezVous);
router.put('/annuler/:id', roleMiddleware('Secretaire'), annulerRendezVous);
router.delete('/:id', roleMiddleware('Secretaire'), supprimerRendezVous);
router.get('/disponibilite/test/main', roleMiddleware('Secretaire'), verifierDisponibilite);
router.put('/modifier/:id', roleMiddleware('Secretaire'), modifierRendezVous);

// Routes Médecin et/ou Secrétaire
router.get('/aujourdhui', roleMiddleware('Medecin', 'Secretaire'), getRendezVousDuJour);

// Routes Patient
router.get('/patient/me', roleMiddleware('Patient'), listerRendezVousPatient);
router.put('/patient/:id/annuler', roleMiddleware('Patient'), annulerRendezVousPatient);
router.put('/patient/:id/commentaire', roleMiddleware('Patient'), ajouterCommentaireRendezVous);

module.exports = router;