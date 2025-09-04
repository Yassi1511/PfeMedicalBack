const mongoose = require('mongoose');

const rendezVousSchema = new mongoose.Schema({
  medecinId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Format : YYYY-MM-DD
  heure: { type: String, required: true }, // Format : HH:mm
  statut: {
    type: String,
    enum: ['en_attente', 'consulte', 'annule'],
    default: 'en_attente'
  },
  commentaire: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('RendezVous', rendezVousSchema);
