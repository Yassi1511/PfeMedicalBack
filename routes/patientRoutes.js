// routes/patient.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');
const patientController = require('../controllers/patientController');

// All routes require authentication
router.use(auth);

// Routes for secretary
router.post(
  '/ajouter',
  authorize('Secretaire'),
  patientController.ajouterPatientParSecretaire
);

// Get patient by ID
router.get(
  '/patient/:patientId',
  authorize('Secretaire'),
  patientController.getPatientById
);

// Update patient
router.put(
  '/:patientId',
  authorize('Secretaire'),
  patientController.updatePatient
);

module.exports = router;