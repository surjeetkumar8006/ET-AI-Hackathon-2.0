const mongoose = require('mongoose');

const permitSchema = mongoose.Schema({
  permitId: { type: String, required: true },
  permitType: { type: String, required: true }, // e.g., 'Hot Work', 'Confined Space'
  zone: { type: String, required: true },
  status: { type: String, default: 'Active' }, // Active, Closed
  issuedTo: { type: String, required: true },
  validUntil: { type: Date, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Permit', permitSchema);
