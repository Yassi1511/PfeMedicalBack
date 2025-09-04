const mongoose = require("mongoose");
const Patient = require("../models/Patient");
const Medecin = require("../models/Medecin");
const RendezVous = require("../models/RendezVous");
const Secretaire = require("../models/Secretaire");

// ✅ Lire tous les médecins
const getAllMedecins = async (req, res) => {
  try {
    const medecins = await Medecin.find();
    res.status(200).json(medecins);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des médecins", error });
  }
};

// ✅ Lire un médecin par son ID
const getMedecinById = async (req, res) => {
  try {
    const userId = req.user.id; // Adjust based on your token's payload
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'ID invalide' });
    }
    const medecin = await Medecin.findById(userId);
    if (!medecin) {
      return res.status(404).json({ message: 'Médecin non trouvé' });
    }
    res.status(200).json(medecin);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du médecin', error });
  }
};

// ✅ Lire un médecin par nom
const getMedecinByName = async (req, res) => {
  try {
    const medecins = await Medecin.find({
      nom: { $regex: new RegExp(req.params.nom, "i") },
    });
    if (medecins.length === 0) {
      return res.status(404).json({ message: "Aucun médecin trouvé avec ce nom" });
    }
    res.status(200).json(medecins);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la recherche du médecin", error });
  }
};

// ✅ Lire les médecins par spécialité
const getMedecinsBySpecialite = async (req, res) => {
  try {
    const { specialite } = req.params;
    const medecins = await Medecin.find({
      specialite: { $regex: new RegExp(specialite, "i") },
    });
    if (medecins.length === 0) {
      return res.status(404).json({ message: "Aucun médecin trouvé avec cette spécialité" });
    }
    res.status(200).json(medecins);
  } catch (error) {
    console.error("Erreur dans getMedecinsBySpecialite:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des médecins par spécialité",
      error,
    });
  }
};

// ✅ Lier une secrétaire existante au médecin connecté (many-to-many)
const lierSecretaireExistanteAuMedecin = async (req, res) => {
  try {
    const medecinId = req.user._id;
    const { email } = req.body;
    const medecin = await Medecin.findById(medecinId);
    if (!medecin) {
      return res.status(404).json({ message: "Médecin non trouvé" });
    }
    const secretaire = await Secretaire.findOne({ email });
    if (!secretaire) {
      return res.status(404).json({ message: "Aucune secrétaire trouvée avec cet email" });
    }
    if (secretaire.Medecins && secretaire.Medecins.includes(medecinId)) {
      return res.status(400).json({ message: "Cette secrétaire est déjà liée à vous" });
    }
    if (!secretaire.Medecins) secretaire.Medecins = [];
    secretaire.Medecins.push(medecinId);
    await secretaire.save();
    if (!medecin.Secretaires.includes(secretaire._id)) {
      medecin.Secretaires.push(secretaire._id);
      await medecin.save();
    }
    const secretaireNettoyee = secretaire.toObject();
    delete secretaireNettoyee.medecins;
    res.status(200).json({ message: "Secrétaire liée avec succès", secretaire: secretaireNettoyee });
  } catch (error) {
    console.error("Erreur dans lierSecretaireExistanteAuMedecin:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Voir la liste des secrétaires d’un médecin
const getSecretairesByMedecin = async (req, res) => {
  try {
    const medecinId = req.user._id;
    const medecin = await Medecin.findById(medecinId).populate('Secretaires');
    if (!medecin) return res.status(404).json({ message: 'Médecin non trouvé' });
    res.status(200).json({ secretaires: medecin.Secretaires });
  } catch (error) {
    console.error('Erreur dans getSecretairesByMedecin:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// ✅ Voir la liste des médecins d’une secrétaire
const getMedecinsBySecretaire = async (req, res) => {
  try {
    const secretaireId = req.user._id;
    const secretaire = await Secretaire.findById(secretaireId).populate('Medecins');
    if (!secretaire) {
      return res.status(404).json({ message: 'Secrétaire non trouvée' });
    }
    res.status(200).json({ medecins: secretaire.Medecins });
  } catch (error) {
    console.error('Erreur dans getMedecinsBySecretaire:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// ✅ Délier une secrétaire sans supprimer son compte
const removeSecretaire = async (req, res) => {
  try {
    const medecinId = req.user._id;
    const { secretaireId } = req.params;
    const medecin = await Medecin.findById(medecinId);
    if (!medecin) {
      return res.status(404).json({ message: "Médecin non trouvé" });
    }
    medecin.Secretaires = medecin.Secretaires.filter(
      (id) => id.toString() !== secretaireId
    );
    await medecin.save();
    const secretaire = await Secretaire.findById(secretaireId);
    if (secretaire) {
      secretaire.Medecins = secretaire.Medecins.filter(
        (id) => id.toString() !== medecinId
      );
      await secretaire.save();
    }
    res.status(200).json({ message: "Secrétaire déliée avec succès" });
  } catch (error) {
    console.error("Erreur dans removeSecretaire:", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// ✅ Mettre à jour un secrétaire
const updateSecretaire = async (req, res) => {
  try {
    const { secretaireId } = req.params;
    const updatedData = req.body;
    const secretaire = await Secretaire.findByIdAndUpdate(
      secretaireId,
      updatedData,
      { new: true }
    );
    if (!secretaire) {
      return res.status(404).json({ message: "Secrétaire non trouvé" });
    }
    res.status(200).json({ message: "Secrétaire mis à jour", secretaire });
  } catch (error) {
    console.error("Erreur dans updateSecretaire:", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// ✅ Ajouter un patient à un médecin par une secrétaire
const ajouterPatientParSecretaire = async (req, res) => {
  try {
    const secretaireId = req.user._id;
    const { medecinId, patientId } = req.body;
    const medecin = await Medecin.findById(medecinId);
    const patient = await Patient.findById(patientId);
    if (!medecin || !patient) {
      return res.status(404).json({ message: "Médecin ou patient non trouvé" });
    }
    if (!medecin.Patients.includes(patientId)) {
      medecin.Patients.push(patientId);
      await medecin.save();
    }
    if (!patient.Medecins.includes(medecinId)) {
      patient.Medecins.push(medecinId);
      await patient.save();
    }
    res.status(200).json({ message: "Patient lié avec succès", medecin });
  } catch (error) {
    console.error("Erreur dans ajouterPatientParSecretaire:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Récupérer les patients d’un médecin par son ID
const getPatientsByMedecinId = async (req, res) => {
  try {
    const { medecinId } = req.params;
    // Validate medecinId
    if (!mongoose.Types.ObjectId.isValid(medecinId)) {
      return res.status(400).json({ message: 'ID de médecin invalide' });
    }
    // Check if the requester is authorized (medecin or their secretaire)
    const requesterId = req.user.id;
    const requesterRole = req.user.role;
    const medecin = await Medecin.findById(medecinId);
    if (!medecin) {
      return res.status(404).json({ message: 'Médecin non trouvé' });
    }
    // Authorization: Requester must be the medecin or one of their secretaires
    if (requesterRole === 'Medecin' && requesterId !== medecinId) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    if (requesterRole === 'Secretaire') {
      const secretaire = await Secretaire.findById(requesterId);
      if (!secretaire || !secretaire.Medecins.includes(medecinId)) {
        return res.status(403).json({ message: 'Accès non autorisé' });
      }
    }
    // Fetch patients with populated fields
    const patients = await Medecin.findById(medecinId).populate('Patients', 'nom prenom email numero');
    if (!patients || patients.Patients.length === 0) {
      return res.status(200).json({ patients: [], message: 'Aucun patient trouvé pour ce médecin' });
    }
    res.status(200).json({ patients: patients.Patients });
  } catch (error) {
    console.error('Erreur dans getPatientsByMedecinId:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// ✅ Récupérer les rendez-vous par ID de secrétaire
const getRendezVousBySecretaire = async (req, res) => {
  try {
    const secretaireId = req.user._id;
    // Vérifier si la secrétaire existe
    const secretaire = await Secretaire.findById(secretaireId);
    if (!secretaire) {
      return res.status(404).json({ message: 'Secrétaire non trouvée' });
    }
    // Récupérer les médecins associés à cette secrétaire
    const medecins = await Medecin.find({ Secretaires: secretaireId }).select('_id');
    const medecinIds = medecins.map(medecin => medecin._id);
    // Récupérer tous les rendez-vous pour ces médecins
    const rendezVous = await RendezVous.find({ medecinId: { $in: medecinIds } })
      .populate('medecinId', 'nom prenom specialite')
      .populate('patientId', 'nom prenom');
    if (!rendezVous || rendezVous.length === 0) {
      return res.status(200).json({ rendezVous: [], message: 'Aucun rendez-vous trouvé' });
    }
    // Map the response to match the expected frontend format
    const formattedRendezVous = rendezVous.map(rdv => {
      // Ensure date is in YYYY-MM-DD format
      const date = new Date(rdv.date).toISOString().split('T')[0]; // Convert to YYYY-MM-DD
      return {
        id: rdv._id.toString(),
        patientNom: rdv.patientId?.nom || 'Inconnu',
        patientPrenom: rdv.patientId?.prenom || 'Inconnu',
        patientId: rdv.patientId?._id.toString() || '',
        medecinId: rdv.medecinId?._id.toString() || '',
        medecin: `${rdv.medecinId?.nom || ''} ${rdv.medecinId?.prenom || ''}`.trim() || 'Inconnu',
        date, // Use standardized date
        heure: rdv.heure,
        type: rdv.commentaire || 'Consultation',
        statut: rdv.statut,
        commentaire: rdv.commentaire,
      };
    });
    res.status(200).json({ rendezVous: formattedRendezVous });
  } catch (error) {
    console.error('Erreur dans getRendezVousBySecretaire:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// controllers/medecinController.js (add this function)
const getPatientsBySecretaire = async (req, res) => {
  try {
    const secretaireId = req.user._id;
    // Vérifier si la secrétaire existe
    const secretaire = await Secretaire.findById(secretaireId);
    if (!secretaire) {
      return res.status(404).json({ message: 'Secrétaire non trouvée' });
    }
    // Récupérer les médecins associés à cette secrétaire
    const medecins = await Medecin.find({ Secretaires: secretaireId }).select('_id');
    const medecinIds = medecins.map(medecin => medecin._id);
    if (medecinIds.length === 0) {
      return res.status(200).json({ patients: [], message: 'Aucun médecin associé' });
    }
    // Récupérer tous les patients pour ces médecins
    const patients = await Patient.find({ Medecins: { $in: medecinIds } })
      .select('nom prenom email numero dateNaissance adresse dateInscription');
    if (!patients || patients.length === 0) {
      return res.status(200).json({ patients: [], message: 'Aucun patient trouvé' });
    }
    // Format the response to match the PatientInfo interface
    const formattedPatients = patients.map(patient => ({
      id: patient._id.toString(),
      nom: patient.nom,
      prenom: patient.prenom,
      email: patient.email,
      numero: patient.numero || 'N/A', // Fallback for numero
      dateNaissance: patient.dateNaissance && patient.dateNaissance instanceof Date
        ? patient.dateNaissance.toISOString().split('T')[0]
        : 'N/A', // Fallback if undefined or invalid
      adresse: patient.adresse || 'N/A', // Fallback for adresse too
      dateInscription: patient.dateInscription && patient.dateInscription instanceof Date
        ? patient.dateInscription.toISOString().split('T')[0]
        : 'N/A', // Fallback if undefined or invalid
    }));
    res.status(200).json({ patients: formattedPatients });
  } catch (error) {
    console.error('Erreur dans getPatientsBySecretaire:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Exportation des fonctions
module.exports = {
  getAllMedecins,
  getMedecinById,
  getMedecinByName,
  getMedecinsBySpecialite,
  lierSecretaireExistanteAuMedecin,
  getSecretairesByMedecin,
  removeSecretaire,
  updateSecretaire,
  getMedecinsBySecretaire,
  ajouterPatientParSecretaire,
  getPatientsByMedecinId,
  getRendezVousBySecretaire,
  getPatientsBySecretaire,
};