require('dotenv').config();

const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const morgan   = require('morgan');

const app = express();

// ─────── Middlewares globaux ───────────────
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// ─────── Importation des routes ─────────────
const userRoutes         = require('./routes/userRoutes');
const rendezVousRoutes   = require('./routes/rendezVousRoutes');
const patientRoutes      = require('./routes/patientRoutes');
const medecinRoutes      = require('./routes/medecinRoutes');
const medicamentRoutes   = require('./routes/medicamentRoutes');
const traitementRoutes   = require('./routes/traitementRoutes');
const ordonnanceRoutes   = require('./routes/ordonnanceRoutes');
const notificationRoutes = require('./routes/notificationRoutes'); // ✅ Notifications

// ─────── Utilisation des routes ─────────────
app.use('/api/users', userRoutes);
app.use('/api/rdv', rendezVousRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/medicaments', medicamentRoutes);
app.use('/api/traitements', traitementRoutes);
app.use('/api/ordonnances', ordonnanceRoutes);
app.use('/api/notifications', notificationRoutes); // ✅
app.use('/api', medecinRoutes);

// app.use('/api/secretaires', secretaireRoutes); // à activer si besoin

// ─────── Middleware gestion des erreurs ─────
app.use((err, req, res, next) => {
  console.error('Erreur détectée :', err.stack);
  res.status(500).json({ message: 'Erreur serveur' });
});

// ─────── Connexion à MongoDB + Démarrage ────
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ Erreur : MONGO_URI non défini dans .env');
  process.exit(1);
}

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ Connecté à MongoDB');

    // 🕐 Planification des notifications automatiques
    // const planifierNotifications = require("./cronNotification");
    // planifierNotifications();

    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Erreur de connexion à MongoDB :', err.message);
  });
