const RendezVous = require("../models/RendezVous");
const { isMedecinDisponible } = require("../services/disponibiliteService");
const Medecin = require("../models/Medecin");
const Notification = require("../models/Notification");

// ✅ Ajouter un rendez-vous
exports.ajouterRendezVous = async (req, res) => {
  try {
    const { medecinId, patientId, date, heure } = req.body;

    if (!medecinId || !patientId || !date || !heure) {
      return res.status(400).json({ message: "Champs requis manquants (medecinId, patientId, date, heure)." });
    }

    const disponible = await isMedecinDisponible(medecinId, date, heure);

    if (!disponible) {
      return res.status(400).json({
        message: "Le médecin a déjà un rendez-vous en attente à ce créneau.",
      });
    }

    const nouveau = new RendezVous({
      medecinId,
      patientId,
      date,
      heure,
      statut: 'en_attente',
    });
    await nouveau.save();

    // Fetch doctor's details for notification (optional)
    const medecin = await Medecin.findById(medecinId).select('nom prenom');
    const medecinNom = medecin ? `${medecin.prenom} ${medecin.nom}` : 'Médecin';

    // Create notification for the patient
    const notification = new Notification({
      contenu: `🩺 Nouveau rendez-vous avec ${medecinNom} le ${date} à ${heure}`,
      type: 'rendezvous',
      lu: false,
      dateEnvoi: new Date(),
      patient: patientId,
      // Optionally add rendezVous reference if you want to link it
      rendezVous: nouveau._id, // Add this field to Notification schema if needed
    });
    await notification.save();

    console.log(`Notification créée pour le patient ${patientId}:`, notification);
    res.status(201).json({
      message: 'Rendez-vous créé avec succès',
      rendezVous: nouveau,
      notification,
    });
  } catch (err) {
    console.error('Erreur lors de la création du rendez-vous:', err);
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

// 🔍 Vérifier disponibilité
exports.verifierDisponibilite = async (req, res) => {
  const { medecinId, date, heure } = req.query;

  if (!medecinId || !date || !heure) {
    return res.status(400).json({ message: "Champs requis manquants." });
  }

  try {
    const disponible = await isMedecinDisponible(medecinId, date, heure);
    res.json({ disponible });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ✅ Lister les rendez-vous (filtrés ou tous)
exports.listerRendezVous = async (req, res) => {
  try {
    const criteres = {};
    if (req.query.medecinId) criteres.medecinId = req.query.medecinId;
    if (req.query.patientId) criteres.patientId = req.query.patientId;
    if (req.query.date) criteres.date = req.query.date;

    const liste = await RendezVous.find(criteres).populate(
      "patientId medecinId"
    );
    res.json(liste);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Modifier
exports.modifierRendezVous = async (req, res) => {
  try {
    const { medecinId, date, heure } = req.body;

    // Check if rendez-vous exists
    const rdv = await RendezVous.findById(req.params.id);
    if (!rdv) {
      return res.status(404).json({ message: "Rendez-vous non trouvé." });
    }

    // If medecinId, date, or heure is updated, check doctor availability
    if ((medecinId && medecinId !== rdv.medecinId.toString()) || 
        (date && date !== rdv.date) || 
        (heure && heure !== rdv.heure)) {
      const disponible = await isMedecinDisponible(medecinId || rdv.medecinId, date || rdv.date, heure || rdv.heure);
      if (!disponible) {
        return res.status(400).json({
          message: "Le médecin a déjà un rendez-vous en attente à ce créneau.",
        });
      }
    }

    const updated = await RendezVous.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate("patientId medecinId");

    if (!updated) {
      return res.status(404).json({ message: "Rendez-vous non trouvé." });
    }

    console.log("Patient notifié de la modification !");
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur: " + err.message });
  }
};

// ✅ Annuler (le médecin redevient dispo à ce créneau)
exports.annulerRendezVous = async (req, res) => {
  try {
    const { note } = req.body;
    const rdv = await RendezVous.findByIdAndUpdate(
      req.params.id,
      {
        statut: "annulé",
        noteAnnulation: note,
      },
      { new: true }
    );
    console.log("Patient notifié de l'annulation !");
    res.json(rdv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Consulter
exports.consulterRendezVous = async (req, res) => {
  try {
    const rdv = await RendezVous.findByIdAndUpdate(
      req.params.id,
      {
        statut: "consulte",
      },
      { new: true }
    );
    res.json(rdv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Supprimer
exports.supprimerRendezVous = async (req, res) => {
  try {
    const rdv = await RendezVous.findById(req.params.id);
    if (!rdv) {
      return res.status(404).json({ message: "Rendez-vous non trouvé." });
    }

    await RendezVous.findByIdAndDelete(req.params.id);
    res.json({ id: req.params.id, message: "Rendez-vous supprimé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur: " + err.message });
  }
};

// ✅ Get rendez-vous by ID (new endpoint)
exports.getRdvById = async (req, res) => {
  try {
    const rdv = await RendezVous.findById(req.params.id).populate("patientId medecinId");
    if (!rdv) {
      return res.status(404).json({ message: "Rendez-vous non trouvé." });
    }
    res.json(rdv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur: " + err.message });
  }
};

// ✅ RendezVous d'aujourd'hui
exports.getRendezVousDuJour = async (req, res) => {
  try {
    // Get doctor ID from request
    const medecinId = req.user?.id || req.params.medecinId;
    if (!medecinId) {
      return res.status(400).json({ message: "Doctor ID is required" });
    }

    // Define today's date as a string in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0]; // e.g., "2025-09-02"

    console.log("Querying appointments for doctor:", medecinId);
    console.log("Date:", today);

    // Query appointments for the doctor on the current day
    const rendezVous = await RendezVous.find({
      medecinId: medecinId,
      date: today,
    })
      .populate("patientId")
      .populate("medecinId");

    console.log("Found appointments:", rendezVous);

    if (!rendezVous.length) {
      return res.status(200).json({
        message: "No appointments found for the doctor today",
        data: [],
      });
    }

    res.status(200).json(rendezVous);
  } catch (error) {
    console.error("Error fetching appointments:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Lister les rendez-vous du patient connecté
exports.listerRendezVousPatient = async (req, res) => {
  try {
    const patientId = req.user.id;
    const rendezVous = await RendezVous.find({ patientId })
      .populate("patientId")
      .populate("medecinId");
    
    if (!rendezVous.length) {
      return res.status(200).json({
        message: "Aucun rendez-vous trouvé pour ce patient",
        data: [],
      });
    }

    res.status(200).json(rendezVous);
  } catch (error) {
    console.error("Erreur lors de la récupération des rendez-vous:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Annuler un rendez-vous pour le patient
exports.annulerRendezVousPatient = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { id } = req.params;
    const { note } = req.body;

    const rdv = await RendezVous.findOne({ _id: id, patientId });
    if (!rdv) {
      return res.status(404).json({ message: "Rendez-vous non trouvé ou non autorisé" });
    }

    if (rdv.statut === "annulé") {
      return res.status(400).json({ message: "Ce rendez-vous est déjà annulé" });
    }

    const updatedRdv = await RendezVous.findByIdAndUpdate(
      id,
      {
        statut: "annulé",
        noteAnnulation: note,
      },
      { new: true }
    );

    console.log("Patient notifié de l'annulation !");
    res.json(updatedRdv);
  } catch (error) {
    console.error("Erreur lors de l'annulation:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Ajouter un commentaire à un rendez-vous pour le patient
exports.ajouterCommentaireRendezVous = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { id } = req.params;
    const { commentaire } = req.body;

    if (!commentaire) {
      return res.status(400).json({ message: "Le commentaire est requis" });
    }

    const rdv = await RendezVous.findOne({ _id: id, patientId });
    if (!rdv) {
      return res.status(404).json({ message: "Rendez-vous non trouvé ou non autorisé" });
    }

    const updatedRdv = await RendezVous.findByIdAndUpdate(
      id,
      { commentaire },
      { new: true }
    );

    console.log("Commentaire ajouté au rendez-vous !");
    res.json(updatedRdv);
  } catch (error) {
    console.error("Erreur lors de l'ajout du commentaire:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};