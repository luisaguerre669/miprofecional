const express = require("express");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Professional = require("../models/Professional");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Socket.IO instance will be set by the server
let io = null;

const setSocketIO = (socketIO) => {
  io = socketIO;
};

const getSocketIO = () => io;

router.use(requireAuth);

function parseBookingDate(dateValue, timeValue) {
  if (!dateValue || !timeValue) return null;

  const dateString = `${String(dateValue).trim()}T${String(timeValue).trim()}`;
  const parsedDate = new Date(dateString);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function validateBookingPayload({ professionalId, date, time }) {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

  if (!professionalId) {
    return "professionalId es obligatorio";
  }
  if (!mongoose.Types.ObjectId.isValid(professionalId)) {
    return "professionalId debe ser un ObjectId valido";
  }
  if (!date) {
    return "date es obligatorio";
  }
  if (!datePattern.test(String(date))) {
    return "date debe tener formato YYYY-MM-DD";
  }
  if (!time) {
    return "time es obligatorio";
  }
  if (!timePattern.test(String(time))) {
    return "time debe tener formato HH:mm";
  }
  return null;
}

router.post("/", async (req, res) => {
  try {
    const {
      professionalId,
      service = "General",
      date,
      time,
      price,
      notes
    } = req.body;

    const validationError = validateBookingPayload({ professionalId, date, time });
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const bookingDate = parseBookingDate(date, time);
    if (!bookingDate) {
      return res.status(400).json({ message: "Fecha y hora invalidas" });
    }

    if (bookingDate <= new Date()) {
      return res.status(400).json({ message: "La reserva debe ser futura" });
    }

    const professionalExists = await Professional.findById(professionalId);
    if (!professionalExists || !professionalExists.isActive) {
      return res.status(404).json({ message: "Profesional no disponible" });
    }

    const windowStart = new Date(bookingDate.getTime() - 30 * 60 * 1000);
    const windowEnd = new Date(bookingDate.getTime() + 30 * 60 * 1000);
    const conflict = await Booking.findOne({
      professional: professionalId,
      date: { $gte: windowStart, $lte: windowEnd },
      status: { $in: ["pending", "confirmed"] }
    });

    if (conflict) {
      return res.status(409).json({ message: "El profesional ya tiene una reserva en ese horario" });
    }

    const booking = await Booking.create({
      user: req.userId,
      professional: professionalId,
      service,
      date: bookingDate,
      status: "pending",
      price,
      notes
    });

    await booking.populate("professional");
    await booking.populate("user", "name email");

    // Emit Socket.IO notification to professional
    const socketIO = getSocketIO();
    if (socketIO) {
      socketIO.to(`professional-${professionalId}`).emit('booking-received', {
        type: 'new_booking',
        booking: booking,
        message: `Nueva reserva de ${booking.user.name} para ${service}`,
        timestamp: new Date()
      });
    }

    res.status(201).json({ message: "Reserva creada correctamente", booking });
  } catch (error) {
    console.error('Booking creation error:', {
      message: error.message,
      name: error.name,
      code: error.code,
      errors: error.errors,
      stack: error.stack
    });
    res.status(500).json({
      message: "Error creando reserva",
      error: {
        message: error.message,
        name: error.name,
        code: error.code,
        errors: error.errors,
        stack: error.stack
      }
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const query = req.user.role === "admin" ? {} : { user: req.userId };
    if (req.query.status) query.status = req.query.status;

    const bookings = await Booking.find(query)
      .populate("professional")
      .populate("user", "name email phone")
      .sort({ date: 1 });

    res.json({ data: bookings, count: bookings.length });
  } catch (error) {
    res.status(500).json({ message: "Error listando reservas", error });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const allowed = ["status", "date", "price", "notes", "service"];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    if (update.date) update.date = new Date(update.date);

    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      update,
      { new: true }
    ).populate("professional").populate("user", "name email");

    if (!booking) {
      return res.status(404).json({ message: "Reserva no encontrada" });
    }

    // Emit Socket.IO notification for status change
    const socketIO = getSocketIO();
    if (socketIO && update.status) {
      // Notify user about status change
      socketIO.to(`user-${booking.user._id}`).emit('booking-status-changed', {
        type: 'status_change',
        booking: booking,
        message: getStatusMessage(update.status),
        timestamp: new Date()
      });

      // Notify professional if they're not the one who made the change
      if (req.user.role !== 'professional') {
        socketIO.to(`professional-${booking.professional._id}`).emit('booking-status-changed', {
          type: 'status_change',
          booking: booking,
          message: getStatusMessage(update.status),
          timestamp: new Date()
        });
      }
    }

    res.json({ message: "Reserva actualizada correctamente", booking });
  } catch (error) {
    res.status(500).json({ message: "Error actualizando reserva", error });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const booking = await Booking.findOneAndDelete({ _id: req.params.id, user: req.userId });

    if (!booking) {
      return res.status(404).json({ message: "Reserva no encontrada" });
    }

    res.json({ message: "Reserva eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error eliminando reserva", error });
  }
});

function getStatusMessage(status) {
  switch (status) {
    case 'confirmed':
      return '¡Tu reserva ha sido confirmada!';
    case 'cancelled':
      return 'Tu reserva ha sido cancelada';
    case 'completed':
      return 'Tu reserva ha sido completada';
    case 'pending':
      return 'Tu reserva está pendiente de confirmación';
    default:
      return 'El estado de tu reserva ha cambiado';
  }
}

module.exports = { router, setSocketIO };
