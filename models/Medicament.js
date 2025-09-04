const mongoose = require("mongoose");

const medicamentSchema = new mongoose.Schema({
  dateDebut: { type: Date, required: true },
  dateFin: { type: Date, required: true },
  dosage: { type: String, required: true },
  frequence: { type: Number, required: true },
  nomCommercial: { type: String, required: true },
  voieAdministration: { type: String, required: true },
  horaires: { type: [String], default: [] },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: false,
  },
  notifications: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Notification" }],
    default: [],
  },
});

const Medicament = mongoose.model("Medicament", medicamentSchema);
module.exports = Medicament;
