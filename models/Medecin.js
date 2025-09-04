const mongoose = require('mongoose');
const User = require('./User');

const medecinSchema = new mongoose.Schema({
  specialite: String,
  numeroLicence: { type: String, unique: true },
  adresseCabinet: String,
  Patients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }],
  Secretaires: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Secretaire' }], // liste des secrétaires
});

module.exports = User.discriminator('Medecin', medecinSchema);
