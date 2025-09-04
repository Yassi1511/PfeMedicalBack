   // controllers/notificationController.js
const Notification = require("../models/Notification");
const Medicament = require("../models/Medicament");

exports.genererNotification = async (req, res) => {
    try {
        const medicament = await Medicament.findById(req.params.id);

        if (!medicament) {
            return res.status(404).json({ message: "Médicament introuvable" });
        }

        const notifications = [];

        for (const horaire of medicament.horaires) {
            if (!isValidHoraire(horaire)) {
                console.error(`Horaire invalide : ${horaire}`);
                continue;
            }

            const notification = new Notification({
                contenu: `💊 Rappel : prenez ${medicament.nomCommercial} (${medicament.dosage})`,
                type: "rappel",
                horaire: horaire,
                patient: req.user._id, // Patient connecté
                medicament: medicament._id,
                dateEnvoi: new Date() // optionnel
            });

            const savedNotification = await notification.save();

            medicament.notifications.push(savedNotification._id);
            notifications.push(savedNotification);
        }

        await medicament.save();

        res.status(201).json({
            message: "✅ Notifications créées avec succès",
            medicament: medicament._id,
            patient: req.user._id,
            notifications: notifications
        });

    } catch (error) {
        console.error("Erreur lors de la génération des notifications:", error);
        res.status(500).json({ message: error.message });
    }
};

function isValidHoraire(horaire) {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(horaire);
}

// 📌 Obtenir les notifications du patient connecté
exports.getNotifications = async (req, res) => {
    try {
        const patientId = req.user._id;
        //console.log("🔍 ID du patient connecté :", patientId);

        const notifications = await Notification.find({ patient: patientId })
            .populate("medicament", "nomCommercial dosage") // Associe le médicament à la notification
            .sort({ dateEnvoi: -1 }); // Trie par date d'envoi, du plus récent au plus ancien

       // console.log("📦 Notifications trouvées :", notifications);

        if (!notifications.length) {
            return res.status(404).json({
                message: "Aucune notification trouvée."
            });
        }

        res.status(200).json(notifications);
    } catch (error) {
        console.error("Erreur lors de la récupération des notifications:", error);
        res.status(500).json({
            message: "Erreur lors de la récupération des notifications",
            error: error.message
        });
    }
};
// 📌 Marquer une notification comme lue
exports.marquerCommeLu = async (req, res) => {
    try {
        const patientId = req.user._id;  // Récupère l'ID du patient connecté à partir de req.user
        const notificationId = req.params.id; // ID de la notification passée dans l'URL
        console.log(patientId)
        console.log(notificationId)
        // Recherche de la notification
        const notification = await Notification.findOne({
            _id: notificationId,
            patient: patientId // Assure-toi que la notification appartient au patient connecté
        });

        // Si la notification n'est pas trouvée
        if (!notification) {
            return res.status(404).json({ message: "Notification introuvable" });
        }

        // Marque la notification comme lue
        notification.lu = true; // Modifie le statut de la notification
        await notification.save(); // Sauvegarde la notification modifiée

        // Réponse de succès
        res.status(200).json({ message: "Notification marquée comme lue" });
    } catch (error) {
        // Si une erreur se produit, on la gère ici
        res.status(500).json({ message: "Erreur lors de la mise à jour de la notification", error: error.message });
    }
};