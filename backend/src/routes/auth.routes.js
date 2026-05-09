const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

function signAccessToken(user) {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET || "dev_secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { userId: user._id, type: "refresh" },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "dev_refresh_secret",
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    location: user.location
  };
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, role, location } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "El usuario ya existe" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role: role || "client",
      location
    });

    await newUser.save();

    const accessToken = signAccessToken(newUser);
    const refreshToken = signRefreshToken(newUser);
    newUser.refreshToken = refreshToken;
    await newUser.save();

    res.status(201).json({
      message: "Usuario creado correctamente",
      user: publicUser(newUser),
      accessToken,
      refreshToken
    });

  } catch (error) {
    res.status(500).json({ message: "Error del servidor", error });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Credenciales invalidas" });
    }

    const passwordOk = await bcrypt.compare(password, user.password);
    if (!passwordOk) {
      return res.status(401).json({ message: "Credenciales invalidas" });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    res.json({
      message: "Login correcto",
      user: publicUser(user),
      accessToken,
      refreshToken
    });
  } catch (error) {
    res.status(500).json({ message: "Error del servidor", error });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token requerido" });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "dev_refresh_secret"
    );
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Refresh token invalido" });
    }

    const accessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(401).json({ message: "Refresh token invalido o expirado" });
  }
});

router.post("/logout", requireAuth, async (req, res) => {
  req.user.refreshToken = null;
  await req.user.save();
  res.json({ message: "Sesion cerrada correctamente" });
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ message: "Si el email existe, se genero un token de recuperacion" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    res.json({
      message: "Token de recuperacion generado",
      resetToken: process.env.NODE_ENV === "production" ? undefined : resetToken
    });
  } catch (error) {
    res.status(500).json({ message: "Error del servidor", error });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "Token y password son requeridos" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Token invalido o expirado" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.refreshToken = null;
    await user.save();

    res.json({ message: "Password actualizado correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error del servidor", error });
  }
});

router.put("/change-password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const passwordOk = await bcrypt.compare(currentPassword, req.user.password);

    if (!passwordOk) {
      return res.status(400).json({ message: "Password actual incorrecto" });
    }

    req.user.password = await bcrypt.hash(newPassword, 10);
    req.user.refreshToken = null;
    await req.user.save();

    res.json({ message: "Password cambiado correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error del servidor", error });
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

module.exports = router;
