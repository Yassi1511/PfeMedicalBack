const Ordonnance = require("../models/Ordonnance");
const Traitement = require("../models/Traitement");

// 📌 Ajouter une ordonnance
exports.ajouterOrdonnance = async (req, res) => {
  try {
    console.log('Received request:', {
      body: req.body,
      file: req.file,
      headers: req.headers,
      contentType: req.get('Content-Type'),
    });
    const medecinId = req.user._id;
    const { destination, traitement } = req.body;

    if (!destination || !traitement) {
      console.error('Missing fields:', { destination, traitement });
      return res.status(400).json({ message: 'Destination and traitement are required' });
    }

    const traitementExiste = await Traitement.findById(traitement);
    if (!traitementExiste) {
      console.error('Traitement introuvable:', traitement);
      return res.status(404).json({ message: 'Traitement introuvable' });
    }

    const ordonnance = new Ordonnance({
      destination,
      medecin: medecinId,
      traitement,
      signatureElectronique: req.file ? req.file.filename : null,
    });

    await ordonnance.save();
    res.status(201).json({
      message: 'Ordonnance créée avec succès',
      ordonnance,
    });
  } catch (error) {
    console.error('Erreur lors de l’ajout de l’ordonnance:', error);
    res.status(500).json({ message: error.message });
  }
};


// 📌 Obtenir les ordonnances du médecin connecté (tous les détails visibles)
// 📌 Obtenir les ordonnances du médecin connecté (tous les détails visibles)
exports.getOrdonnancesByMedecin = async (req, res) => {
  try {
    const medecinId = req.user._id;

    const ordonnances = await Ordonnance.find({ medecin: medecinId })
      .populate({
        path: "traitement",
        populate: [
          {
            path: "patient",
            select: "-motDePasse",
          },
          {
            path: "medicaments", // Populate the medicaments array
            select: "nomCommercial dosage frequence voieAdministration",
          },
        ],
      })
      .populate({
        path: "destination",
        select: "-motDePasse",
      });

    res.status(200).json(ordonnances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ Obtenir les ordonnances envoyées au patient connecté (masquer les observations)
exports.getOrdonnancesForPatient = async (req, res) => {
    try {
        const patientId = req.user._id;

        const ordonnances = await Ordonnance.find({ destination: patientId })
            .populate({
                path: "medecin",
                select: "-motDePasse -numeroLicence"
            })
            .populate({
                path: "traitement",
                populate: [
                    {
                        path: "medecin patient",
                        select: "-motDePasse -numeroLicence"
                    },
                    {
                        path: "medicaments", // ✅ populate medicaments
                        select: "nomCommercial dosage frequence voieAdministration dateDebut dateFin horaires" 
                    }
                ]
            });

        // 🔒 Remove observations if user is Patient
        const ordonnancesFiltrees = ordonnances.map(ord => {
            const traitement = ord.traitement?.toObject();

            if (traitement && req.user.role === "Patient") {
                delete traitement.observations;
            }

            return {
                ...ord.toObject(),
                traitement
            };
        });

        res.status(200).json(ordonnancesFiltrees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 📌 Obtenir une ordonnance spécifique pour un médecin par ID
// 📌 Obtenir une ordonnance spécifique pour un médecin par ID avec les détails des médicaments
exports.getOrdonnancesByMedecinByIdOrdonnance = async (req, res) => {
    try {
        const medecinId = req.user._id; // ID du médecin connecté
        const { id } = req.params; // ID de l'ordonnance

        const ordonnance = await Ordonnance.findOne({ _id: id, medecin: medecinId })
            .populate({
                path: "traitement",
                populate: {
                    path: "medicaments", // Peupler les médicaments liés au traitement
                },
            })
            .populate("destination", "nom prenom") // Peupler les informations du patient
            .populate("medecin", "nom prenom specialite adresseCabinet"); // Peupler les informations du médecin

        if (!ordonnance) {
            return res.status(404).json({ message: "Ordonnance introuvable" });
        }

        res.status(200).json(ordonnance);
    } catch (error) {
        console.error("Erreur lors de la récupération de l'ordonnance :", error);
        res.status(500).json({ message: error.message });
    }
};

// 📌 Obtenir une ordonnance spécifique pour un patient par ID avec les détails des médicaments
exports.getOrdonnancesForPatientByIdOrdonnance = async (req, res) => {
    try {
        const patientId = req.user._id; // ID du patient connecté
        const { id } = req.params; // ID de l'ordonnance

        const ordonnance = await Ordonnance.findOne({ _id: id, destination: patientId })
            .populate({
                path: "traitement",
                populate: {
                    path: "medicaments", // Peupler les médicaments liés au traitement
                },
            })
            .populate("destination", "nom prenom") // Peupler les informations du patient
            .populate("medecin", "nom prenom specialite adresseCabinet"); // Peupler les informations du médecin

        if (!ordonnance) {
            return res.status(404).json({ message: "Ordonnance introuvable" });
        }

        // 🔒 Supprimer `observations` si c’est un patient
        const traitement = ordonnance.traitement?.toObject();
        if (traitement && req.user.role === "Patient") {
            delete traitement.observations;
        }

        res.status(200).json({
            ...ordonnance.toObject(),
            traitement,
        });
    } catch (error) {
        console.error("Erreur lors de la récupération de l'ordonnance :", error);
        res.status(500).json({ message: error.message });
    }
};
