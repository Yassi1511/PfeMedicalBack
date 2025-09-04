const RendezVous = require("../models/RendezVous");

const isMedecinDisponible = async (medecinId, date, heure) => {
  const existe = await RendezVous.findOne({
    medecinId,
    date,
    heure,
    statut: "en_attente",
  });

  return !existe; // ✅ true si dispo
};

module.exports = { isMedecinDisponible };
