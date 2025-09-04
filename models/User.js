// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nom: { type: String, required: true, trim: true },
  prenom: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide'],
  },
  numero: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/^\+?\d{1,4}?[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,9}$/, 'Numéro invalide'],
  },
  adresse: { // Add adresse field
    type: String,
    trim: true,
    default: '',
  },
  motDePasse: { type: String, required: true, minlength: 8 },
  role: { type: String, enum: ['Patient', 'Medecin', 'Secretaire'], required: true },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
}, {
  discriminatorKey: 'role',
  timestamps: true,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
module.exports = User;