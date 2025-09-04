const mongoose = require('mongoose');

const traitementSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  observations: { type: String },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: false },
  medicaments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Medicament' }],
  medecin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('Traitement', traitementSchema);