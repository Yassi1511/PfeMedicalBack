const Traitement = require('../models/Traitement');
const Medicament = require('../models/Medicament');
const { encrypt, decrypt } = require('../utils/encryption');
const mongoose = require('mongoose');

// Helper to create medicaments
const createMedicaments = async (medicamentsData, patientId) => {
  const medicamentIds = [];
  for (const med of medicamentsData) {
    const medicament = await Medicament.create({
      ...med,
      patient: patientId || null,
      dateDebut: new Date(med.dateDebut),
      dateFin: new Date(med.dateFin),
      horaires: med.horaires || [],
    });
    medicamentIds.push(medicament._id);
  }
  return medicamentIds;
};

// Ajouter un traitement
exports.ajouterTraitement = async (req, res) => {
  try {
    const medecinId = req.user._id;
    const { nom, observations, medicaments } = req.body;

    if (!Array.isArray(medicaments) || medicaments.length === 0) {
      return res.status(400).json({ error: 'Medicaments must be a non-empty array' });
    }

    const encryptedObservation = encrypt(observations || '');

    const medicamentsList = await createMedicaments(medicaments, null); // No patient

    const traitement = new Traitement({
      nom,
      observations: encryptedObservation,
      patient: null, // Explicitly set to null
      medicaments: medicamentsList,
      medecin: medecinId,
    });

    await traitement.save();
    const populatedTraitement = await Traitement.findById(traitement._id)
      .populate('medicaments')
      .populate('patient')
      .populate('medecin');
    const dechiffre = populatedTraitement.toObject();
    dechiffre.observations = dechiffre.observations ? decrypt(dechiffre.observations) : null;
    res.status(201).json(dechiffre);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Récupérer les traitements par médecin
exports.getTraitementsByMedecin = async (req, res) => {
  try {
    const medecinId = req.user._id;
    const traitements = await Traitement.find({ medecin: medecinId })
      .populate("medicaments")
      .populate("patient", "prenom nom")
      .populate("medecin", "prenom nom specialite");

    const traitementsDechiffres = traitements.map((tr) => {
      const t = tr.toObject();
      t.observations = t.observations ? decrypt(t.observations) : null;
      return t;
    });

    res.status(200).json({ traitements: traitementsDechiffres });
  } catch (err) {
    console.error('Error fetching traitements by medecin:', err);
    res.status(400).json({ error: err.message });
  }
};

// Récupérer tous les traitements
exports.getAllTraitements = async (req, res) => {
  try {
    const medecinId = req.user._id;
    const traitements = await Traitement.find({ medecin: medecinId })
      .populate("medicaments")
      .populate("patient")
      .populate("medecin");

    const traitementsDechiffres = traitements.map((tr) => {
      const t = tr.toObject();
      t.observations = t.observations ? decrypt(t.observations) : null;
      return t;
    });

    res.status(200).json(traitementsDechiffres);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Ajouter un traitement pour un patient spécifique
exports.ajouterTraitementsByPatient = async (req, res) => {
  try {
    const medecinId = req.user._id;
    const patientId = req.params.patientId;
    const { nom, observations, medicaments } = req.body;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ error: 'Invalid patient ID' });
    }

    const encryptedObservation = encrypt(observations || '');

    const medicamentsList = await createMedicaments(medicaments, patientId);

    const traitement = new Traitement({
      nom,
      observations: encryptedObservation,
      patient: patientId,
      medicaments: medicamentsList,
      medecin: medecinId,
    });

    await traitement.save();
    const populatedTraitement = await Traitement.findById(traitement._id)
      .populate('medicaments')
      .populate('patient')
      .populate('medecin');
    const dechiffre = populatedTraitement.toObject();
    dechiffre.observations = dechiffre.observations ? decrypt(dechiffre.observations) : null;
    res.status(201).json(dechiffre);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Récupérer les traitements d’un patient spécifique
exports.getTraitementsByPatient = async (req, res) => {
  try {
    const medecinId = req.user._id;
    const patientId = req.params.patientId;
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ error: 'Invalid patient ID' });
    }
    const traitements = await Traitement.find({
      patient: patientId,
      medecin: medecinId,
    })
      .populate("medicaments")
      .populate("patient")
      .populate("medecin");

    const traitementsDechiffres = traitements.map((tr) => {
      const t = tr.toObject();
      t.observations = t.observations ? decrypt(t.observations) : null;
      return t;
    });

    res.status(200).json(traitementsDechiffres);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Modifier un traitement
exports.modifierTraitement = async (req, res) => {
  try {
    const traitementId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(traitementId)) {
      return res.status(400).json({ message: 'Invalid traitement ID' });
    }

    const traitement = await Traitement.findById(traitementId);
    if (!traitement) {
      return res.status(404).json({ message: 'Traitement non trouvé' });
    }

    const { nom, observations, medicaments, patient, medecin } = req.body;

    // Use existing values if not provided
    const updatePatient = patient !== undefined ? patient : traitement.patient;
    const updateMedecin = medecin || traitement.medecin;
    const updateNom = nom || traitement.nom;

    // Validate patient ID if provided
    if (patient && !mongoose.Types.ObjectId.isValid(patient)) {
      return res.status(400).json({ error: 'Invalid patient ID' });
    }

    // Validate if updating medicaments
    let updateMedicaments = traitement.medicaments;
    if (medicaments) {
      if (!Array.isArray(medicaments) || medicaments.length === 0) {
        return res.status(400).json({ message: 'Medicaments must be a non-empty array' });
      }
      for (const med of medicaments) {
        if (!med.nomCommercial || !med.dosage || !med.frequence || !med.voieAdministration || !med.dateDebut || !med.dateFin) {
          return res.status(400).json({ message: 'Invalid medicament data' });
        }
        if (isNaN(Date.parse(med.dateDebut)) || isNaN(Date.parse(med.dateFin))) {
          return res.status(400).json({ message: 'Invalid date format in medicaments' });
        }
      }
      // Delete old medicaments
      await Medicament.deleteMany({ _id: { $in: traitement.medicaments } });
      // Create new ones
      updateMedicaments = await createMedicaments(medicaments, updatePatient);
    }

    // Prepare update data
    const updateData = {
      nom: updateNom,
      patient: updatePatient || null,
      medicaments: updateMedicaments,
      medecin: updateMedecin,
    };
    if (observations !== undefined) {
      updateData.observations = encrypt(observations);
    }

    // Update
    const updatedTraitement = await Traitement.findByIdAndUpdate(
      traitementId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('medicaments')
      .populate('patient')
      .populate('medecin');

    const dechiffre = updatedTraitement.toObject();
    dechiffre.observations = dechiffre.observations ? decrypt(dechiffre.observations) : null;

    res.status(200).json({ message: 'Traitement modifié avec succès', traitement: dechiffre });
  } catch (error) {
    console.error('Erreur lors de la modification :', error);
    const errorMessage = process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur';
    res.status(500).json({ message: errorMessage });
  }
};

// Supprimer un traitement
exports.supprimerTraitement = async (req, res) => {
  try {
    const traitementId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(traitementId)) {
      return res.status(400).json({ message: 'Invalid traitement ID' });
    }

    const traitement = await Traitement.findById(traitementId);
    if (!traitement) {
      return res.status(404).json({ message: "Traitement non trouvé" });
    }

    // Delete associated medicaments
    await Medicament.deleteMany({ _id: { $in: traitement.medicaments } });
    await Traitement.deleteOne({ _id: traitementId });

    res.status(200).json({ message: "Traitement et médicaments supprimés avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};