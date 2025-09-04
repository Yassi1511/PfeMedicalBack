// controllers/patientController.js
const Patient = require('../models/Patient');
const Medecin = require('../models/Medecin');
const Secretaire = require('../models/Secretaire');

exports.ajouterPatientParSecretaire = async (req, res) => {
  try {
    const secretaireId = req.user._id;
    const { nom, prenom, email, numero, adresse, dateNaissance, sexe, groupeSanguin, Medecins } = req.body;

    // Verify secretary is linked to a doctor
    const secretaire = await Secretaire.findById(secretaireId);
    if (!secretaire || !secretaire.medecin) {
      return res.status(403).json({ message: 'Aucun médecin associé à cette secrétaire' });
    }

    const medecinId = secretaire.medecin;

    // Create patient
    const nouveauPatient = new Patient({
      nom,
      prenom,
      email,
      numero, // Use numero to match User schema
      adresse, // Include adresse
      dateNaissance,
      sexe,
      groupeSanguin,
      Medecins: Medecins && Medecins.length ? Medecins : [medecinId],
      createdBy: secretaireId,
    });

    await nouveauPatient.save();

    // Link patient to doctor(s)
    const medecinsToUpdate = Medecins && Medecins.length ? Medecins : [medecinId];
    for (const medId of medecinsToUpdate) {
      const medecin = await Medecin.findById(medId);
      if (medecin && !medecin.Patients.includes(nouveauPatient._id)) {
        medecin.Patients.push(nouveauPatient._id);
        await medecin.save();
      }
    }

    res.status(201).json({
      message: '✅ Patient ajouté et lié au(x) médecin(s) avec succès',
      patient: {
        id: nouveauPatient._id,
        nom: nouveauPatient.nom,
        prenom: nouveauPatient.prenom,
        email: nouveauPatient.email,
        numero: nouveauPatient.numero,
        adresse: nouveauPatient.adresse,
        dateNaissance: nouveauPatient.dateNaissance,
        sexe: nouveauPatient.sexe,
        groupeSanguin: nouveauPatient.groupeSanguin,
        Medecins: nouveauPatient.Medecins,
      },
    });
  } catch (error) {
    console.error('❌ Erreur lors de l’ajout du patient :', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};
// Get patient by ID
exports.getPatientById = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Fetch patient
    const patient = await Patient.findById(patientId).select(
      'nom prenom email numero dateNaissance adresse sexe groupeSanguin Medecins'
    );
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    res.status(200).json({
      id: patient._id,
      nom: patient.nom,
      prenom: patient.prenom,
      email: patient.email,
      numero: patient.numero,
      dateNaissance: patient.dateNaissance,
      adresse: patient.adresse,
      sexe: patient.sexe,
      groupeSanguin: patient.groupeSanguin,
      Medecins: patient.Medecins,
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du patient :', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// Update patient
exports.updatePatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { nom, prenom, email, telephone, dateNaissance, adresse, sexe, groupeSanguin, Medecins } = req.body;

    // Fetch patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    // Update patient fields
    patient.nom = nom || patient.nom;
    patient.prenom = prenom || patient.prenom;
    patient.email = email || patient.email;
    patient.telephone = telephone || patient.telephone;
    patient.dateNaissance = dateNaissance || patient.dateNaissance;
    patient.adresse = adresse || patient.adresse;
    patient.sexe = sexe || patient.sexe;
    patient.groupeSanguin = groupeSanguin || patient.groupeSanguin;
    patient.Medecins = Medecins && Medecins.length ? Medecins : patient.Medecins;

    await patient.save();

    // Update doctor-patient relationships
    // Remove patient from doctors not in the new Medecins list
    const currentDoctors = await Medecin.find({ Patients: patientId });
    for (const doctor of currentDoctors) {
      if (!Medecins || !Medecins.includes(doctor._id.toString())) {
        doctor.Patients = doctor.Patients.filter((p) => p.toString() !== patientId);
        await doctor.save();
      }
    }

    // Add patient to new doctors
    if (Medecins && Medecins.length) {
      for (const medId of Medecins) {
        const doctor = await Medecin.findById(medId);
        if (doctor && !doctor.Patients.includes(patientId)) {
          doctor.Patients.push(patientId);
          await doctor.save();
        }
      }
    }

    res.status(200).json({
      message: '✅ Patient mis à jour avec succès',
      patient: {
        id: patient._id,
        nom: patient.nom,
        prenom: patient.prenom,
        email: patient.email,
        telephone: patient.telephone,
        dateNaissance: patient.dateNaissance,
        adresse: patient.adresse,
        sexe: patient.sexe,
        groupeSanguin: patient.groupeSanguin,
        Medecins: patient.Medecins,
      },
    });
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du patient :', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
}