const mongoose = require('mongoose');

const sensorSchema = mongoose.Schema({
  zone: { type: String, required: true },
  sensorType: { type: String, required: true }, // e.g., 'Gas', 'Temperature', 'Pressure'
  value: { type: Number, required: true },
  unit: { type: String, required: true },
  status: { type: String, default: 'Normal' }, // Normal, Warning, Critical
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Sensor', sensorSchema);
