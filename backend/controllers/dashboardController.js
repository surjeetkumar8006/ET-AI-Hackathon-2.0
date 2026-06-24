const Sensor = require('../models/Sensor');
const Alert = require('../models/Alert');
const Permit = require('../models/Permit');
const aiEngine = require('../services/aiEngine');

exports.getDashboardData = async (req, res) => {
  try {
    // Read from the in-memory cache directly
    // This is instant and will never hang, even if Atlas is down or slow
    const alerts = aiEngine.getCachedAlerts();
    const permits = aiEngine.getCachedPermits();
    const agentLogs = aiEngine.getAgentLogs();
    
    const zones = ['Zone A (Coke Oven)', 'Zone B (Refinery)', 'Zone C (Storage)'];
    const currentSensors = [];
    const histories = {};

    for (const zone of zones) {
        const history = aiEngine.getSensorHistory(zone);
        histories[zone] = history;
        if (history.length > 0) {
            currentSensors.push(history[history.length - 1]);
        }
    }

    res.json({ 
      sensors: currentSensors, 
      alerts, 
      permits, 
      agentLogs,
      histories
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAlerts = async (req, res) => {
    try {
        res.json(aiEngine.getCachedAlerts());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Mock RAG Compliance Assistant Endpoint
exports.queryCompliance = async (req, res) => {
    const { question } = req.body;
    if (!question) {
        return res.status(400).json({ error: "Question is required." });
    }

    const q = question.toLowerCase();
    let response = "";
    let citation = "";

    if (q.includes("hot work") || q.includes("welding")) {
        response = "According to OISD Standard 137, Hot Work permits are strictly prohibited in zones containing flammable gas mixtures exceeding 10% LEL. Operations must halt immediately, and the atmosphere must be ventilated below 1% LEL before hot work can resume.";
        citation = "OISD-STD-137: Section 6.2 (Permit to Work Systems - Hot Work Regulations)";
    } else if (q.includes("confined space") || q.includes("tank")) {
        response = "The Factory Act, 1948 (Section 36) states that no person shall enter any confined space unless it is tested for oxygen deficiency (must be > 19.5% O2) and toxic gases. A standby operator with breathing apparatus must be present at the entry point.";
        citation = "The Factory Act, 1948: Section 36 (Precautions against dangerous fumes)";
    } else if (q.includes("coke oven") || q.includes("oven")) {
        response = "DGFASLI Safety Guidelines mandate continuous gas detection monitoring and pressure-release valve tests every 6 months for coke oven batteries. Emergency shutoffs must be linked to automated SCADA systems.";
        citation = "DGFASLI Guidelines (2024): Part IV - Coke Oven Safety Control Systems";
    } else {
        response = "To perform this operation, ensure a valid Permit-To-Work (PTW) is active, personal gas monitors are calibrated, and the area compliance checklist has been signed by the shift supervisor.";
        citation = "General Factory Act Guidelines - Section 41 (Safety Officers & Auditing)";
    }

    // Simulate small RAG thinking delay
    setTimeout(() => {
        res.json({
            answer: response,
            citation: citation,
            timestamp: new Date()
        });
    }, 800);
};
