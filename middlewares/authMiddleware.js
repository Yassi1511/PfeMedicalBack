// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentification requise' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id).select('-motDePasse');
    if (!user) return res.status(401).json({ message: 'Utilisateur non trouvé' });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalide' });
  }
};