const Permit = require('../models/Permit');
const aiEngine = require('../services/aiEngine');

exports.getPermits = async (req, res) => {
    try {
        // Return instantly from cache
        res.json(aiEngine.getCachedPermits());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createPermit = async (req, res) => {
    try {
        const permitData = {
            ...req.body,
            timestamp: new Date()
        };

        // Instantly write to the in-memory cache
        aiEngine.addPermitToCache(permitData);

        // Fire-and-forget database write in the background
        Permit.create(permitData).catch(() => {});

        res.status(201).json(permitData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
