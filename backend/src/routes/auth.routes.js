const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Professional = require("../models/Professional");
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
    location: user.location,
    verificationStatus: user.verificationStatus,
    isVerified: user.isVerified
  };
}

function normalizeCategory(category) {
  return String(category || "otros").trim().toLowerCase();
}

function splitLocation(location) {
  const parts = String(location || "").split(",").map((part) => part.trim()).filter(Boolean);
  return {
    address: String(location || "Sin direccion"),
    city: parts[0] || "Sin ciudad",
    state: parts[1] || parts[0] || "Sin provincia",
    country: parts[2] || "Argentina",
    coordinates: { type: "Point", coordinates: [0, 0] },
    serviceRadius: 50
  };
}

async function createPendingProfessionalProfile(user, body) {
  const category = normalizeCategory(body.category || body.profession);
  const companyType = body.companyType === "empresa" ? "empresa" : "independiente";

  return Professional.create({
    userId: user._id,
    category,
    businessName: body.businessName || body.commercialName || user.name,
    profession: body.profession || category,
    specialties: body.specialties || [],
    description: body.description || `Perfil profesional de ${user.name}`,
    contact: {
      phone: user.phone,
      email: user.email,
      whatsapp: user.phone
    },
    location: splitLocation(user.location),
    services: [
      {
        name: body.serviceName || body.profession || category,
        description: body.serviceDescription || "Servicio profesional",
        duration: "60 min",
        price: Number(body.price || body.hourlyRate || 0),
        isActive: true
      }
    ],
    pricing: {
      hourlyRate: Number(body.price || body.hourlyRate || 0),
      currency: "ARS",
      paymentMethods: ["cash", "transfer"]
    },
    verification: {
      isVerified: false,
      verificationStatus: "pending",
      businessRegistration: {
        isVerified: false,
        taxId: body.cuit || undefined,
        legalForm: companyType
      },
      professionalLicense: {
        isVerified: false,
        licenseNumber: body.matricula || undefined
      },
      reviewProcess: {
        manualReviewRequired: true,
        priority: "normal"
      }
    },
    isActive: false,
    isFeatured: false
  });
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, role, location } = req.body;
    const normalizedRole = role === "professional" ? "professional" : "client";

    if (!name || !email || !password || !phone || !location) {
      return res.status(400).json({ message: "Nombre, email, password, telefono y ubicacion son requeridos" });
    }

    if (normalizedRole === "professional" && !req.body.category) {
      return res.status(400).json({ message: "La categoria es requerida para profesionales" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "El usuario ya existe" });
    }

    const newUser = new User({
      name,
      email,
      password,
      phone,
      role: normalizedRole,
      location,
      verificationStatus: normalizedRole === "professional" ? "pending" : "unverified",
      isVerified: false
    });

    await newUser.save();

    let professional = null;
    if (normalizedRole === "professional") {
      professional = await createPendingProfessionalProfile(newUser, req.body);
    }

    const accessToken = signAccessToken(newUser);
    const refreshToken = signRefreshToken(newUser);
    newUser.refreshToken = refreshToken;
    await newUser.save();

    res.status(201).json({
      message: "Usuario creado correctamente",
      user: publicUser(newUser),
      professional,
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
    const user = await User.findOne({ email }).select("+password +refreshToken");

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
    const user = await User.findById(decoded.userId).select("+refreshToken");

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

    req.user.password = newPassword;
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
