const mongoose = require("mongoose");

const ordonnanceSchema = new mongoose.Schema({
    dateEmission: { type: Date, default: Date.now },
    destination: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // المريض
    medecin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    signatureElectronique: { type: String },
    traitement: { type: mongoose.Schema.Types.ObjectId, ref: "Traitement", required: true }
});

module.exports = mongoose.model("Ordonnance", ordonnanceSchema);
