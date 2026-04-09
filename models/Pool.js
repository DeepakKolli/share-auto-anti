const mongoose = require('mongoose');

const poolSchema = new mongoose.Schema({
  routeId: {
    type: String,
    required: true,
    index: true
  },
  departureTime: {
    type: Date,
    required: true,
    index: true
  },
  totalSeats: {
    type: Number,
    required: true,
    default: 3
  },
  availableSeats: {
    type: Number,
    required: true,
    default: 3
  },
  status: {
    type: String,
    enum: ["waiting", "partially_full", "full", "assigned", "completed", "cancelled"],
    default: "waiting",
    index: true
  },
  passengers: [{
    userId: { type: String, required: true },
    seats: { type: Number, required: true },
    joinedAt: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Pool', poolSchema);
