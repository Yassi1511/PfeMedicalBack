const cron = require("node-cron");
const Medicament = require("./models/Medicament");
const Notification = require("./models/Notification");

function convertHoraireToCron(horaire) {
    const [heure, minute] = horaire.split(":");
    return `${minute} ${heure} * * *`; // chaque jour à cette heure
}

function planifierNotifications() {
    Medicament.find().populate("patient").then(medicaments => {
        medicaments.forEach(medicament => {
            medicament.horaires.forEach(horaire => {
                if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(horaire)) {
                    console.warn(`❌ Horaire invalide ignoré: ${horaire}`);
                    return;
                }

                const cronExpression = convertHoraireToCron(horaire);

                cron.schedule(cronExpression, async () => {
                    const now = new Date();

                    if (now >= medicament.dateDebut && now <= medicament.dateFin) {
                        const notification = new Notification({
                            contenu: `💊 Rappel : prenez ${medicament.nomCommercial} (${medicament.dosage})`,
                            type: "rappel",
                            horaire: horaire,
                            patient: medicament.patient,
                            medicament: medicament._id
                        });

                        await notification.save();

                        medicament.notifications.push(notification._id);
                        await medicament.save();

                        console.log(`✅ Notification planifiée à ${horaire} pour ${medicament.nomCommercial}`);
                    } else {
                        console.log(`⏸️ Hors période pour ${medicament.nomCommercial} à ${horaire}`);
                    }
                });
            });
        });
    }).catch(err => {
        console.error("❌ Erreur lors de la planification des notifications:", err);
    });
}

module.exports = planifierNotifications;
