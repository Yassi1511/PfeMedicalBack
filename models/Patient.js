// models/Patient.js
const mongoose = require("mongoose");
const User = require("./User");

const patientSchema = new mongoose.Schema({
  dateNaissance: { type: Date, required: true },
  sexe: { type: String, enum: ["Homme", "Femme"] },
  groupeSanguin: { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], required: true },
  allergies: { type: String, default: "Aucune" },
  Medecins: [{ type: mongoose.Schema.Types.ObjectId, ref: "Medecin" }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Secretaire" },
});

module.exports = User.discriminator("Patient", patientSchema);
