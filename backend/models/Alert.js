const mongoose = require('mongoose');

const alertSchema = mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  severity: { type: String, required: true }, // High, Medium, Low
  zone: { type: String, required: true },
  relatedPermit: { type: mongoose.Schema.Types.ObjectId, ref: 'Permit' },
  relatedSensor: { type: mongoose.Schema.Types.ObjectId, ref: 'Sensor' },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, default: 'Active' } // Active, Resolved
});

module.exports = mongoose.model('Alert', alertSchema);
