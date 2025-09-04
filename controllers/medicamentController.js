const Medicament = require("../models/Medicament");

// 📌 Ajouter un médicament pour le patient connecté
exports.ajouterMedicament = async (req, res) => {
  try {
    const {
      dateDebut,
      dateFin,
      dosage,
      frequence,
      nomCommercial,
      voieAdministration,
      horaires,
    } = req.body;

    // 🔹 Vérification de la cohérence entre fréquence et horaires
    if (
      !horaires ||
      !Array.isArray(horaires) ||
      horaires.length !== frequence
    ) {
      return res.status(400).json({
        message: `Vous devez fournir exactement ${frequence} horaires.`,
      });
    }

    // 🔹 Création du médicament avec association au patient connecté
    const medicament = new Medicament({
      patient: req.user._id,
      dateDebut,
      dateFin,
      dosage,
      frequence,
      nomCommercial,
      voieAdministration,
      horaires,
    });

    await medicament.save();

    res.status(201).json({
      message: "Médicament ajouté avec succès.",
      medicament,
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout du médicament:", error);
    res.status(500).json({ message: error.message });
  }
};
// 📌 Obtenir les médicaments du patient connecté
exports.getMedicaments = async (req, res) => {
  try {
    const patientId = req.user._id;
    console.log("🔍 ID du patient connecté :", patientId);

    const medicaments = await Medicament.find({ patient: patientId });

    console.log("📦 Médicaments trouvés :", medicaments);

    if (!medicaments.length) {
      return res.status(404).json({
        message: "Aucun médicament trouvé.",
      });
    }

    res.status(200).json(medicaments);
  } catch (error) {
    console.error("Erreur lors de la récupération des médicaments:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des médicaments",
      error: error.message,
    });
  }
};

// Ajouter un médicament pour un patient spécifique (par un médecin)
exports.ajouterMedicamentParMedecin = async (req, res) => {
  try {
    const {
      dateDebut,
      dateFin,
      dosage,
      frequence,
      nomCommercial,
      voieAdministration,
      horaires,
    } = req.body;

    const patientId = req.params.id; // Lire l'ID du patient depuis l'URL

    // 🔹 Vérification de la cohérence entre fréquence et horaires
    if (
      !horaires ||
      !Array.isArray(horaires) ||
      horaires.length !== frequence
    ) {
      return res.status(400).json({
        message: `Vous devez fournir exactement ${frequence} horaires.`,
      });
    }

    // 🔹 Création du médicament pour le patient spécifié
    const medicament = new Medicament({
      patient: patientId, // Associer le médicament au patient spécifié
      dateDebut,
      dateFin,
      dosage,
      frequence,
      nomCommercial,
      voieAdministration,
      horaires,
    });

    await medicament.save();

    res.status(201).json({
      message: "Médicament ajouté avec succès pour le patient.",
      medicament,
    });
  } catch (error) {
    console.error(
      "Erreur lors de l'ajout du médicament par le médecin:",
      error
    );
    res.status(500).json({ message: error.message });
  }
};
//getMedicamentsParPatient
exports.getMedicamentsParPatient = async (req, res) => {
  try {
    const patientId = req.params.id;
    const medicaments = await Medicament.find({ patient: patientId });
    res.status(200).json(medicaments);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};
// Mettre à jour un médicament
exports.updateMedicament = async (req, res) => {
  try {
    const medicament = await Medicament.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!medicament) {
      return res.status(404).send();
    }
    res.status(200).send(medicament);
  } catch (error) {
    res.status(400).send(error);
  }
};
// ✅ Supprimer un médicament
exports.deleteMedicament = async (req, res) => {
  try {
    // Tente de supprimer par ID
    const medicament = await Medicament.findByIdAndDelete(req.params.id);

    // S'il n'existe pas ➜ 404
    if (!medicament) {
      return res.status(404).json({ message: "Médicament introuvable" });
    }

    // Succès ➜ 200 + message + (optionnel) le doc supprimé
    res.status(200).json({
      message: "Médicament supprimé avec succès",
      medicament, // ← enlève cette ligne si tu ne veux pas renvoyer l'objet
    });
  } catch (error) {
    console.error("Erreur lors de la suppression :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
