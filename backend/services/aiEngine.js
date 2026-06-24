const Sensor = require('../models/Sensor');
const Permit = require('../models/Permit');
const Alert = require('../models/Alert');

const ZONES = ['Zone A (Coke Oven)', 'Zone B (Refinery)', 'Zone C (Storage)'];

let simulationInterval;
let permitSyncInterval;

// IN-MEMORY CACHE - Primary state for real-time reactivity
let cachedSensors = {}; 
let cachedAlerts = [];
let cachedPermits = [];
let agentLogs = [];

// Initialize sensor history with baseline values (Gas, Temp, Pressure, Oxygen)
ZONES.forEach(zone => {
    cachedSensors[zone] = [];
    for (let i = 10; i >= 0; i--) {
        cachedSensors[zone].push({
            zone,
            sensorType: zone === 'Zone C (Storage)' ? 'Oxygen (O2)' : 'Gas (Methane)',
            value: zone === 'Zone C (Storage)' ? 20.9 : Math.floor(Math.random() * 8) + 2, // 20.9% for O2, low LEL for others
            unit: zone === 'Zone C (Storage)' ? '%' : 'LEL%',
            status: 'Normal',
            timestamp: new Date(Date.now() - i * 5000)
        });
    }
});

const addAgentLog = (agentName, message, level = 'info') => {
    agentLogs.push({
        id: Math.random().toString(),
        timestamp: new Date(),
        agentName,
        message,
        level // 'info', 'warning', 'success', 'error'
    });
    if (agentLogs.length > 55) agentLogs.shift();
};

// Background sync to fetch permits from MongoDB Atlas
const syncPermitsFromDB = () => {
    Permit.find()
        .then(permits => {
            if (permits.length > 0) {
                // Merge database permits with seeded permits
                const merged = [...permits];
                cachedPermits.forEach(cp => {
                    if (!merged.some(p => p.permitId === cp.permitId)) {
                        merged.push(cp);
                    }
                });
                cachedPermits = merged;
            }
        })
        .catch(err => {
            // Fallback: keep current cache
        });
};

const generateMockData = () => {
    try {
        const randomZone = ZONES[Math.floor(Math.random() * ZONES.length)];
        
        let sensorType = 'Gas (Methane)';
        let value = Math.floor(Math.random() * 45); // Methane LEL% (0-45)
        let unit = 'LEL%';
        let temp = Math.floor(Math.random() * 25) + 40; // 40-65 C
        let pressure = Math.floor(Math.random() * 15) + 95; // 95-110 psi

        if (randomZone === 'Zone C (Storage)') {
            sensorType = 'Oxygen (O2)';
            value = parseFloat((Math.random() * 5 + 17).toFixed(1)); // O2% (17.0% - 22.0%)
            unit = '%';
        }

        let status = 'Normal';
        if (randomZone === 'Zone C (Storage)') {
            if (value < 19.5 || value > 22.0) status = 'Warning';
            if (value < 18.0) status = 'Critical';
        } else {
            if (value > 20) status = 'Warning';
            if (value > 35) status = 'Critical';
        }

        const newSensorData = {
            zone: randomZone,
            sensorType,
            value,
            unit,
            status,
            timestamp: new Date()
        };

        // Update cache
        cachedSensors[randomZone].push(newSensorData);
        if (cachedSensors[randomZone].length > 15) cachedSensors[randomZone].shift();

        // Async fire-and-forget save
        Sensor.create(newSensorData).catch(() => {});

        // --- MULTI-AGENT COLLABORATIVE SAFETY ANALYSIS ---
        
        // 1. DigitalPermitAgent verifies active permit states
        const activeZonePermits = cachedPermits.filter(p => p.zone === randomZone && p.status === 'Active');
        addAgentLog('DigitalPermitAgent', `Monitoring shift permits for ${randomZone}. Status: ${activeZonePermits.length} Authorized Work Permits.`, 'info');

        // 2. ComplianceAuditAgent checks sensor metrics against Regulatory codes (OISD, Factory Act Section 36)
        if (randomZone === 'Zone C (Storage)') {
            addAgentLog('ComplianceAuditAgent', `Verifying Factory Act Sec 36 (Atmosphere Limits) in ${randomZone}. O2 Level = ${value}% (Min Req: 19.5%)`, value < 19.5 ? 'warning' : 'success');
        } else {
            addAgentLog('ComplianceAuditAgent', `Verifying OISD-137 compliance in ${randomZone}. Methane LEL = ${value}% (Max Limit: 10%)`, value > 10 ? 'warning' : 'success');
        }

        // 3. CCTV_Agent scans thermal cameras for operator violations
        const hasHotWork = activeZonePermits.some(p => p.permitType === 'Hot Work');
        const hasConfinedSpace = activeZonePermits.some(p => p.permitType === 'Confined Space Entry');

        if (hasHotWork) {
            addAgentLog('CCTV_Agent', `Thermal feed CAM_02 shows welding activity active in ${randomZone}. Bounding boxes: Operator Safety Gear verified.`, 'info');
        } else if (hasConfinedSpace) {
            addAgentLog('CCTV_Agent', `CAM_04 standby feed shows entry hatch open at ${randomZone}. Safety ropes and respirator line visible.`, 'info');
        }

        // 4. RiskFusionAgent executes Compound Risk Rules
        if (hasHotWork && randomZone !== 'Zone C (Storage)' && value > 15) {
            // Compound Risk 1: Hot Work + Elevated Methane (Visakhapatnam Steel Prevention Rule)
            addAgentLog('RiskFusionAgent', `[CRITICAL ANOMALY] Co-occurrence of active Hot Work and hazardous Methane gas (${value} LEL%) in ${randomZone}!`, 'error');
            
            const alertData = {
                title: 'CRITICAL COMPOUND RISK: Explosion Hazard',
                description: `Violation of OISD Standard 137. Methane levels at ${value} LEL% while active Hot Work welding permit is authorized. Potential Visakhapatnam style explosion risk.`,
                severity: 'High',
                zone: randomZone,
                timestamp: new Date()
            };

            cachedAlerts.unshift(alertData);
            if (cachedAlerts.length > 10) cachedAlerts.pop();

            Alert.create(alertData).catch(() => {});

            // 5. EmergencyOrchestrator initiates response
            addAgentLog('EmergencyOrchestrator', `[ALARM ENGAGED] Initiating automated evacuation protocols for ${randomZone}. Broadcast siren active. Alerting onsite emergency squad.`, 'error');
        } 
        else if (hasConfinedSpace && randomZone === 'Zone C (Storage)' && value < 19.5) {
            // Compound Risk 2: Confined Space Entry + Deficient Oxygen (Factory Act Section 36 Rule)
            addAgentLog('RiskFusionAgent', `[CRITICAL ANOMALY] Confined space entry active in ${randomZone} with toxic/deficient Oxygen levels (${value}% O2)!`, 'error');
            
            const alertData = {
                title: 'CRITICAL COMPOUND RISK: Confined Space Hazard',
                description: `Violation of Factory Act 1948 Section 36. Worker entered storage tank with Oxygen level at ${value}% (below safe limit 19.5%). Asphyxiation warning!`,
                severity: 'High',
                zone: randomZone,
                timestamp: new Date()
            };

            cachedAlerts.unshift(alertData);
            if (cachedAlerts.length > 10) cachedAlerts.pop();

            Alert.create(alertData).catch(() => {});

            // Emergency response
            addAgentLog('EmergencyOrchestrator', `[STANDBY EMERGENCY] Evacuation winch activated. Alerts pushed to Standby Rescue Operator at hatch point.`, 'error');
        }

    } catch (error) {
        console.error("Simulation error:", error);
    }
};

const seedDefaultPermits = () => {
    const defaultPermits = [
        {
            permitId: 'PTW-HW-101',
            permitType: 'Hot Work',
            zone: 'Zone A (Coke Oven)',
            status: 'Active',
            issuedTo: 'Surjeet Kumar',
            validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
            timestamp: new Date()
        },
        {
            permitId: 'PTW-CS-302',
            permitType: 'Confined Space Entry',
            zone: 'Zone C (Storage)',
            status: 'Active',
            issuedTo: 'Aman Yadav',
            validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
            timestamp: new Date()
        }
    ];

    cachedPermits = defaultPermits;

    // Seed database asynchronously
    Permit.countDocuments()
        .then(count => {
            if (count === 0) {
                Permit.insertMany(defaultPermits)
                    .then(() => {
                        console.log('🌱 Seeded default permits to MongoDB Atlas');
                        addAgentLog('System', 'Seeded initial Hot Work and Confined Space permits to cloud database', 'success');
                    })
                    .catch(() => {});
            } else {
                syncPermitsFromDB();
            }
        })
        .catch(() => {
            console.log('⚠️ MongoDB not ready. Running with local in-memory permits.');
            addAgentLog('System', 'Running with local in-memory permit cache (DB Offline)', 'warning');
        });
};

exports.startSimulation = () => {
    console.log("Starting AI Safety Simulation Engine...");
    addAgentLog('System', 'Zero-Harm Safety Intelligence Engine starting...', 'info');
    
    // Seed defaults
    seedDefaultPermits();

    // Start intervals
    simulationInterval = setInterval(generateMockData, 3000); 
    permitSyncInterval = setInterval(syncPermitsFromDB, 10000); 
};

exports.stopSimulation = () => {
    clearInterval(simulationInterval);
    clearInterval(permitSyncInterval);
};

exports.getAgentLogs = () => agentLogs;
exports.getSensorHistory = (zone) => cachedSensors[zone] || [];
exports.getCachedPermits = () => cachedPermits;
exports.getCachedAlerts = () => cachedAlerts;
exports.addPermitToCache = (permit) => {
    cachedPermits.push(permit);
};
