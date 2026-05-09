const express = require("express");
const Professional = require("../models/Professional");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatProfessional(professional, origin) {
  const data = professional.toObject ? professional.toObject() : professional;

  if (origin && data.location?.coordinates?.coordinates?.length === 2) {
    const [lng, lat] = data.location.coordinates.coordinates;
    data.distanceMeters = Math.round(calculateDistance(origin.lat, origin.lng, lat, lng));
    data.distanceKm = Number((data.distanceMeters / 1000).toFixed(1));
  }

  return data;
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const earthRadius = 6371000;
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

router.get("/nearby", async (req, res) => {
  try {
    const lat = toNumber(req.query.lat, null);
    const lng = toNumber(req.query.lng, null);
    const maxDistance = Math.min(toNumber(req.query.maxDistance || req.query.radius, 5000), 50000);

    if (lat === null || lng === null) {
      return res.status(400).json({ message: "lat y lng son requeridos" });
    }

    const query = {
      isActive: true,
      "location.coordinates": {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: maxDistance
        }
      }
    };

    if (req.query.category) query.category = req.query.category;
    if (req.query.verified === "true") query["verification.isVerified"] = true;

    const professionals = await Professional.find(query).limit(toNumber(req.query.limit, 20));
    res.json({
      data: professionals.map((professional) => formatProfessional(professional, { lat, lng })),
      count: professionals.length
    });
  } catch (error) {
    res.status(500).json({ message: "Error buscando profesionales cercanos", error });
  }
});

router.get("/search", async (req, res) => {
  try {
    const q = req.query.q || req.query.search || "";
    const query = { isActive: true };

    if (q) query.$text = { $search: q };
    if (req.query.category) query.category = req.query.category;
    if (req.query.verified === "true") query["verification.isVerified"] = true;

    const professionals = await Professional.find(query)
      .sort(q ? { score: { $meta: "textScore" } } : { createdAt: -1 })
      .limit(toNumber(req.query.limit, 20));

    res.json({ data: professionals, count: professionals.length });
  } catch (error) {
    res.status(500).json({ message: "Error buscando profesionales", error });
  }
});

router.get("/featured", async (req, res) => {
  const professionals = await Professional.find({ isActive: true, isFeatured: true })
    .sort({ "stats.rating": -1 })
    .limit(toNumber(req.query.limit, 10));
  res.json({ data: professionals, count: professionals.length });
});

router.get("/verified", async (req, res) => {
  const professionals = await Professional.find({ isActive: true, "verification.isVerified": true })
    .sort({ "stats.rating": -1 })
    .limit(toNumber(req.query.limit, 20));
  res.json({ data: professionals, count: professionals.length });
});

router.get("/top-rated", async (req, res) => {
  const professionals = await Professional.find({ isActive: true })
    .sort({ "stats.rating": -1, "stats.reviewCount": -1 })
    .limit(toNumber(req.query.limit, 10));
  res.json({ data: professionals, count: professionals.length });
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const professional = await Professional.create({
      ...req.body,
      user: req.userId,
      email: req.body.email || req.user.email,
      phone: req.body.phone || req.user.phone
    });

    if (req.user.role !== "professional") {
      req.user.role = "professional";
      await req.user.save();
    }

    res.status(201).json({ message: "Profesional creado correctamente", professional });
  } catch (error) {
    res.status(500).json({ message: "Error creando profesional", error });
  }
});

module.exports = router;
