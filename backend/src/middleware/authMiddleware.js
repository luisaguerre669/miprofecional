const { verificarToken } = require("../config/jwt");

function authMiddleware(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ msg: "Sin token" });
  }

  try {
    const decoded = verificarToken(token.replace("Bearer ", ""));
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Token inválido" });
  }
}

module.exports = authMiddleware;
