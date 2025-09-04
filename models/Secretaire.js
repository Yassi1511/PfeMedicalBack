const mongoose = require('mongoose');
const User = require('./User');

const secretaireSchema = new mongoose.Schema({
  bureau: String,
  dateEmbauche: Date,
  Medecins: [{ type: mongoose.Schema.Types.ObjectId, ref: "Medecin" }],
// liste des médecins
});

module.exports = User.discriminator('Secretaire', secretaireSchema);
