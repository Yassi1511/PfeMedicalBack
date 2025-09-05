const logger = require('../utils/logger');

module.exports = (...roles) => {
  return (req, res, next) => {
    logger.debug(`User in request: ${JSON.stringify(req.user)}`);
    logger.debug(`Allowed roles: ${roles.join(', ')}`);

    if (!req.user || !roles.map(r => r.toLowerCase()).includes(req.user.role?.toLowerCase())) {
      logger.warn(`Access denied for role: ${req.user?.role}`);
      return res
        .status(403)
        .json({ message: "Accès refusé : rôle non autorisé" });
    }

    next();
  };
};
