// controllers/userController.js
const User = require('../models/User');
const Medecin = require('../models/Medecin');
const Patient = require('../models/Patient');
const Secretaire = require('../models/Secretaire');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: process.env.MAILTRAP_PORT,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

const roleModelMap = {
  Patient,
  Medecin,
  Secretaire,
};

const userController = {
  async register(req, res) {
    try {
      // Explicitly destructure adresse
      const {
        nom,
        prenom,
        email,
        numero,
        adresse,
        motDePasse,
        role,
        patients,
        medecins,
        dateNaissance,
        sexe,
        groupeSanguin,
        ...extraData // Other fields like allergies
      } = req.body;

      // Validate role
      if (!roleModelMap[role]) {
        return res.status(400).json({ message: 'Rôle invalide.' });
      }

      // Check for duplicate email or numero
      const dup = await User.findOne({ $or: [{ email }, { numero }] });
      if (dup) {
        return res.status(400).json({ message: 'Email ou numéro déjà utilisé.' });
      }

      // Hash password
      const hash = await bcrypt.hash(motDePasse, 10);

      // Create user based on role
      let user;
      if (role === 'Patient') {
        user = new Patient({
          nom,
          prenom,
          email,
          numero,
          adresse,
          motDePasse: hash,
          role,
          dateNaissance,
          sexe,
          groupeSanguin,
          medecins,
          ...extraData,
        });
      } else if (role === 'Medecin') {
        user = new Medecin({
          nom,
          prenom,
          email,
          numero,
          adresse,
          motDePasse: hash,
          role,
          patients,
          ...extraData,
        });
      } else if (role === 'Secretaire') {
        user = new Secretaire({
          nom,
          prenom,
          email,
          numero,
          adresse,
          motDePasse: hash,
          role,
          medecins,
          ...extraData,
        });
      }

      const savedUser = await user.save();

      // Update inverse relationships
      if (role === 'Medecin' && patients?.length) {
        await Patient.updateMany(
          { _id: { $in: patients } },
          { $addToSet: { medecins: savedUser._id } }
        );
      } else if (role === 'Patient' && medecins?.length) {
        await Medecin.updateMany(
          { _id: { $in: medecins } },
          { $addToSet: { patients: savedUser._id } }
        );
      } else if (role === 'Secretaire' && medecins?.length) {
        await Medecin.updateMany(
          { _id: { $in: medecins } },
          { $addToSet: { secretaires: savedUser._id } }
        );
      }

      // Return response with all relevant fields
      res.status(201).json({
        message: 'Utilisateur créé',
        user: {
          id: savedUser._id,
          nom: savedUser.nom,
          prenom: savedUser.prenom,
          email: savedUser.email,
          numero: savedUser.numero,
          adresse: savedUser.adresse,
          role: savedUser.role,
          ...(role === 'Patient' && {
            dateNaissance: savedUser.dateNaissance,
            sexe: savedUser.sexe,
            groupeSanguin: savedUser.groupeSanguin,
            medecins: savedUser.medecins,
          }),
        },
      });
    } catch (err) {
      console.error('Erreur lors de l’inscription :', err);
      res.status(500).json({ error: err.message });
    }
  },

  async login(req, res) {
    try {
      const { email, motDePasse } = req.body;
      const user = await User.findOne({ email });
      if (!user || !(await bcrypt.compare(motDePasse, user.motDePasse))) {
        return res.status(401).json({ message: "Email ou mot de passe invalide" });
      }

      const token = jwt.sign(
        { _id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "3h" }
      );

      res.status(200).json({
        token,
        role: user.role,
        prenom: user.prenom,
        nbrPatients: user.patients?.length || 0, // Fixed: lowercase 'patients', fallback to 0
        _id: user._id // Added: user ID
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async forgetPassword(req, res) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user)
        return res.status(404).json({ message: "Utilisateur non trouvé" });

      const resetToken = crypto.randomBytes(32).toString("hex");
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000;
      await user.save();

      const resetLink = `http://localhost:5173/reset-password/${resetToken}`;
      const mailOptions = {
        from: "no-reply@medapp.com",
        to: user.email,
        subject: "Réinitialisation de mot de passe",
        html: `<p>Clique ici : <a href="${resetLink}">${resetLink}</a></p>`,
      };

      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: "Email de réinitialisation envoyé" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async resetPassword(req, res) {
    try {
      const { resetToken, newPassword } = req.body;
      const user = await User.findOne({
        resetPasswordToken: resetToken,
        resetPasswordExpires: { $gt: Date.now() },
      });
      if (!user)
        return res.status(400).json({ message: "Token invalide ou expiré" });

      user.motDePasse = await bcrypt.hash(newPassword, 10);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res
        .status(200)
        .json({ message: "Mot de passe réinitialisé avec succès" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user._id).select("-motDePasse");
      if (!user)
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      res.status(200).json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateProfile(req, res) {
    try {
      const model = roleModelMap[req.user.role] || User;
      let user = await model.findById(req.user._id).select("-motDePasse");
      if (!user)
        return res.status(404).json({ message: "Utilisateur non trouvé" });

      Object.assign(user, req.body);
      await user.save();

      const { Patients, Medecins } = req.body;
      if (req.user.role === "Medecin" && Patients?.length) {
        await Patient.updateMany(
          { _id: { $in: Patients } },
          { $addToSet: { Medecins: user._id } }
        );
      } else if (req.user.role === "Patient" && Medecins?.length) {
        await Medecin.updateMany(
          { _id: { $in: Medecins } },
          { $addToSet: { Patients: user._id } }
        );
      } else if (req.user.role === "Secretaire" && Medecins?.length) {
        await Medecin.updateMany(
          { _id: { $in: Medecins } },
          { $addToSet: { Secretaires: user._id } }
        );
      }

      res.status(200).json({ message: "Profil mis à jour", user });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async deleteProfile(req, res) {
    try {
      const deleted = await User.findByIdAndDelete(req.user._id);
      if (!deleted)
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      res.status(200).json({ message: "Compte supprimé" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = userController;
