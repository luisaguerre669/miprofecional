const express = require("express");
const Verification = require("../models/Verification");
const Professional = require("../models/Professional");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.post("/", async (req, res) => {
  try {
    const { professional, type, data } = req.body;
    let professionalDoc = null;

    if (professional) {
      professionalDoc = await Professional.findById(professional);
      if (!professionalDoc) {
        return res.status(404).json({ message: "Profesional no encontrado" });
      }
    }

    const verification = await Verification.create({
      user: req.userId,
      professional,
      type: type || "identity",
      data
    });

    if (professionalDoc) {
      professionalDoc.verification.status = "pending";
      professionalDoc.verification.isVerified = false;
      await professionalDoc.save();
    }

    res.status(201).json({
      message: "Solicitud de verificacion enviada",
      verification
    });
  } catch (error) {
    res.status(500).json({ message: "Error enviando verificacion", error });
  }
});

router.get("/status", async (req, res) => {
  try {
    const query = { user: req.userId };
    if (req.query.professional) query.professional = req.query.professional;

    const verifications = await Verification.find(query).sort({ createdAt: -1 });
    res.json({
      data: verifications,
      latestStatus: verifications[0]?.status || "not_submitted"
    });
  } catch (error) {
    res.status(500).json({ message: "Error consultando verificacion", error });
  }
});

module.exports = router;
