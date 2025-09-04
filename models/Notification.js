const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    contenu: { type: String, required: true },
    type: { type: String, required: true }, // ex: "rappel"
    horaire: { type: String }, // Ex: "08:00"
    lu: { type: Boolean, default: false },
    dateEnvoi: { type: Date, default: Date.now },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    medicament: { type: mongoose.Schema.Types.ObjectId, ref: "Medicament" }
});

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
