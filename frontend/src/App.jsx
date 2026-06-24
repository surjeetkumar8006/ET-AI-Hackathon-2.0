import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  ShieldAlert, Activity, HardHat, AlertTriangle, 
  Terminal, ShieldCheck, Flame, Send, HelpCircle, Eye,
  ClipboardList, AlertOctagon, FileText, CheckCircle, XCircle, Users, BookOpen
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('command');
  const [data, setData] = useState({ sensors: [], alerts: [], permits: [], agentLogs: [], histories: {} });
  const [selectedZone, setSelectedZone] = useState('Zone A (Coke Oven)');
  
  // RAG Chat State
  const [query, setQuery] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'bot', text: 'Hello! I am your AI compliance assistant. Ask me questions about OISD protocols or Factory Act safety standards.', citation: '' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // RAG Regulatory Corpus Browser State
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);

  // Workers Simulation State
  const [workers, setWorkers] = useState([
    { id: 1, name: 'Surjeet K. (Welder)', zone: 'Zone A (Coke Oven)', x: 120, y: 110, origX: 120, origY: 110, evacuated: false },
    { id: 2, name: 'Aman Y. (Operator)', zone: 'Zone A (Coke Oven)', x: 150, y: 130, origX: 150, origY: 130, evacuated: false },
    { id: 3, name: 'Rajesh S. (Supervisor)', zone: 'Zone B (Refinery)', x: 420, y: 220, origX: 420, origY: 220, evacuated: false },
    { id: 4, name: 'Vikram M. (Technician)', zone: 'Zone C (Storage)', x: 670, y: 120, origX: 670, origY: 120, evacuated: false }
  ]);

  // Permit Form State
  const [newPermit, setNewPermit] = useState({
    permitId: '',
    permitType: 'Hot Work',
    zone: 'Zone A (Coke Oven)',
    issuedTo: 'Operator Surjeet',
    validUntil: new Date(Date.now() + 86400000)
  });

  // Emergency Incident Report State
  const [showReport, setShowReport] = useState(false);

  const terminalEndRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/dashboard');
        setData(response.data);
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom of agent logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [data.agentLogs]);

  const hasCriticalAlert = (zoneName) => {
    return data.alerts.some(a => a.zone === zoneName && a.severity === 'High');
  };

  const getZoneSensors = (zoneName) => {
    return data.sensors.find(s => s.zone === zoneName) || { value: 0, status: 'Normal', unit: 'LEL%', sensorType: 'Gas (Methane)' };
  };

  const getChartData = () => {
    const history = data.histories[selectedZone] || [];
    return history.map(h => ({
      time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      value: h.value
    }));
  };

  const handleCreatePermit = async (e) => {
    e.preventDefault();
    if (!newPermit.permitId.trim()) return;

    try {
      await axios.post('http://localhost:5000/api/permits', newPermit);
      setNewPermit({
        permitId: '',
        permitType: 'Hot Work',
        zone: selectedZone,
        issuedTo: 'Operator Surjeet',
        validUntil: new Date(Date.now() + 86400000)
      });
      const response = await axios.get('http://localhost:5000/api/dashboard');
      setData(response.data);
    } catch (error) {
      console.error("Error creating permit", error);
    }
  };

  const handleSendQuery = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    executeRAGQuery(query);
  };

  const executeRAGQuery = async (queryText) => {
    setChatMessages(prev => [...prev, { role: 'user', text: queryText }]);
    setQuery('');
    setIsTyping(true);

    try {
      const res = await axios.post('http://localhost:5000/api/query-compliance', { question: queryText });
      setChatMessages(prev => [...prev, { role: 'bot', text: res.data.answer, citation: res.data.citation }]);
    } catch (error) {
      console.error("Error checking compliance database", error);
      setChatMessages(prev => [...prev, { role: 'bot', text: "Unable to reach compliance engine. Check server status." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const currentZoneData = getZoneSensors(selectedZone);
  const activeZonePermits = data.permits.filter(p => p.zone === selectedZone);

  // Mock Compliance Audit Logs
  const auditChecks = [
    { ruleId: 'OISD-STD-137', name: 'Hot Work Permit Gas Clearance', status: hasCriticalAlert('Zone A (Coke Oven)') || hasCriticalAlert('Zone B (Refinery)') ? 'Non-Compliant' : 'Compliant', zone: 'Zone A & B', description: 'Hot Work banned when flammable gas > 10% LEL.' },
    { ruleId: 'Factory Act Sec 36', name: 'Confined Space Oxygen Verification', status: hasCriticalAlert('Zone C (Storage)') ? 'Non-Compliant' : 'Compliant', zone: 'Zone C', description: 'Oxygen levels must remain > 19.5% for active entry.' },
    { ruleId: 'DGMS circular 04', name: 'SCADA Interlocks & Alarms', status: 'Compliant', zone: 'Plant-wide', description: 'Emergency alarm relays must trigger under 100ms.' },
    { ruleId: 'Factory Act Sec 41-A', name: 'Site Supervisor Certification', status: 'Compliant', zone: 'Shift-wide', description: 'Licensed supervisors must sign off on shift handovers.' }
  ];

  const correctiveActions = [
    { id: 'CA-104', ruleId: 'OISD-STD-137', zone: 'Zone A (Coke Oven)', task: 'Ventilate Coke Oven chamber to reduce Methane concentration below 10% LEL.', assignedTo: 'Ventilation Crew A', status: 'Pending Alert Clear' },
    { id: 'CA-105', ruleId: 'Factory Act Sec 36', zone: 'Zone C (Storage)', task: 'Activate emergency oxygen injector valves for Storage Tank C.', assignedTo: 'Storage Ops Team', status: 'In Progress' }
  ];

  const regulatoryDocs = [
    {
      title: 'OISD-STD-137 (Permit to Work Systems)',
      code: 'OISD-137',
      sections: [
        { id: 'Sec 6.1', title: 'Scope of Hot Work', text: 'Hot work covers any activity involving welding, grinding, gas cutting, or open flame that can ignite flammable vapours.' },
        { id: 'Sec 6.2', title: 'Gas Testing Thresholds', text: 'No hot work shall be permitted in any area where the concentration of flammable gas is greater than 10% LEL.' },
        { id: 'Sec 8.4', title: 'Isolation Requirements', text: 'All feed lines containing flammable or toxic chemicals must be physically isolated (blinded or locked) prior to work.' }
      ]
    },
    {
      title: 'Factories Act 1948 (Safety Rules)',
      code: 'Factories Act',
      sections: [
        { id: 'Section 36', title: 'Confined Space Precautions', text: 'No person shall enter any chamber, tank, or confined space in which gas, fume, or dust is present to such extent as to cause risk of safety, unless the space is ventilated and verified safe.' },
        { id: 'Section 36(2)', title: 'Oxygen Concentration', text: 'The atmosphere inside any confined space must be tested and certified to contain at least 19.5% Oxygen before worker entry.' },
        { id: 'Section 41-A', title: 'Site Hazards Appraisal', text: 'Occupiers of hazardous factories must maintain appraisal systems to identify, prevent, and report compound process deviations.' }
      ]
    }
  ];

  // Workers Evacuation Logic Loop
  useEffect(() => {
    const workerInterval = setInterval(() => {
      setWorkers(prev => prev.map(w => {
        const zoneAlarm = hasCriticalAlert(w.zone);
        if (zoneAlarm) {
          // Move towards assembly point (x=380, y=300)
          const dx = 380 - w.x;
          const dy = 300 - w.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist > 8) {
            return {
              ...w,
              x: Math.round(w.x + (dx / dist) * 12),
              y: Math.round(w.y + (dy / dist) * 12),
              evacuated: true
            };
          } else {
            return { ...w, x: 380, y: 300, evacuated: true };
          }
        } else {
          // If alert is cleared and worker was evacuated, move them back to their original zone coordinates
          if (w.evacuated) {
            const dx = w.origX - w.x;
            const dy = w.origY - w.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist > 8) {
              return {
                ...w,
                x: Math.round(w.x + (dx / dist) * 12),
                y: Math.round(w.y + (dy / dist) * 12)
              };
            } else {
              return { ...w, x: w.origX, y: w.origY, evacuated: false };
            }
          }
          // Small random walking inside their respective zone boundaries
          let minX = w.origX - 30;
          let maxX = w.origX + 30;
          let minY = w.origY - 20;
          let maxY = w.origY + 20;
          
          return {
            ...w,
            x: Math.max(minX, Math.min(maxX, w.x + Math.round((Math.random() - 0.5) * 8))),
            y: Math.max(minY, Math.min(maxY, w.y + Math.round((Math.random() - 0.5) * 8)))
          };
        }
      }));
    }, 800);
    return () => clearInterval(workerInterval);
  }, [data.alerts]);

  return (
    <div>
      {/* Upper Command Header */}
      <div className="header">
        <div className="header-title">
          <h1>AI-Powered Industrial Safety Intelligence</h1>
          <p>
            <Activity size={16} style={{ color: '#1d4ed8' }} /> Multi-Agent Sensor & Permit Fusion System | Zero-Harm Operations Command Center
          </p>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {/* Shift changeover & logs details */}
          <div className="glass-panel" style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '2px', border: '1px solid rgba(0,0,0,0.06)' }}>
            <span style={{ color: '#64748b', fontSize: '0.65rem' }}>ACTIVE OPERATIONS SHIFT</span>
            <span style={{ fontWeight: 'bold', color: '#1d4ed8' }}>SHIFT B (14:00 - 22:00)</span>
          </div>
          <div className="header-status">
            <div className="status-dot"></div>
            <span>SIMULATION: ONLINE</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navbar">
        <button className={`tab-btn ${activeTab === 'command' ? 'active' : ''}`} onClick={() => setActiveTab('command')}>
          <Activity size={16} /> Live Safety Command Center
        </button>
        <button className={`tab-btn ${activeTab === 'permits' ? 'active' : ''}`} onClick={() => setActiveTab('permits')}>
          <HardHat size={16} /> Permit to Work Manager
        </button>
        <button className={`tab-btn ${activeTab === 'compliance' ? 'active' : ''}`} onClick={() => setActiveTab('compliance')}>
          <ClipboardList size={16} /> Compliance Audit Ledger
        </button>
        <button className={`tab-btn ${activeTab === 'emergency' ? 'active' : ''}`} onClick={() => setActiveTab('emergency')}>
          <AlertOctagon size={16} /> Emergency Control Room
        </button>
        <button className={`tab-btn ${activeTab === 'rag' ? 'active' : ''}`} onClick={() => setActiveTab('rag')}>
          <HelpCircle size={16} /> AI Compliance Copilot (RAG)
        </button>
      </div>

      {/* Main Grid Layout */}
      <div className="dashboard-grid">
        
        {/* Left Hand Section (Dynamic content depending on Active Tab) */}
        <div className="main-section">
          
          {/* Tab 1: Live Safety Command Center */}
          {activeTab === 'command' && (
            <>
              {/* Geospatial Blueprint Canvas Map */}
              <div className="glass-panel">
                <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={18} style={{ color: '#1d4ed8' }} /> Geospatial Safety Heatmap (Interactive Blueprint)
                </h3>
                <div className="map-canvas-container">
                  <div className="map-bg-grid"></div>
                  
                  <svg className="svg-layout" viewBox="0 0 800 340">
                    {/* SVG PIPELINES WITH FLOW ANIMATION */}
                    <path d="M 230 110 L 450 110 L 450 170" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="8" />
                    <path 
                      d="M 230 110 L 450 110 L 450 170" 
                      fill="none" 
                      stroke={hasCriticalAlert('Zone A (Coke Oven)') ? '#ef4444' : '#1d4ed8'} 
                      strokeWidth="2" 
                      className={hasCriticalAlert('Zone A (Coke Oven)') ? 'pipe-flow-hazard' : 'pipe-flow'} 
                    />

                    <path d="M 450 250 L 450 290 L 650 290 L 650 220" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="8" />
                    <path 
                      d="M 450 250 L 450 290 L 650 290 L 650 220" 
                      fill="none" 
                      stroke={hasCriticalAlert('Zone B (Refinery)') ? '#ef4444' : '#1d4ed8'} 
                      strokeWidth="2" 
                      className={hasCriticalAlert('Zone B (Refinery)') ? 'pipe-flow-hazard' : 'pipe-flow'} 
                    />

                    {/* ZONE A: COKE OVEN BATTERY */}
                    <g 
                      className={`map-interactive-group node-a ${selectedZone === 'Zone A (Coke Oven)' ? 'selected' : ''} ${hasCriticalAlert('Zone A (Coke Oven)') ? 'active-risk' : ''}`}
                      onClick={() => setSelectedZone('Zone A (Coke Oven)')}
                    >
                      <rect x="40" y="50" width="190" height="110" rx="10" fill="#f8fafc" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
                      <text x="55" y="80" fill="#1e293b" fontWeight="bold" fontSize="13">Zone A: Coke Oven Battery</text>
                      <text x="55" y="105" fill="#64748b" fontSize="11">{getZoneSensors('Zone A (Coke Oven)').sensorType}: {getZoneSensors('Zone A (Coke Oven)').value} {getZoneSensors('Zone A (Coke Oven)').unit}</text>
                      <text x="55" y="125" fill="#64748b" fontSize="11">Active Permits: {data.permits.filter(p => p.zone === 'Zone A (Coke Oven)').length}</text>
                      <circle cx="210" cy="75" r="5" fill={hasCriticalAlert('Zone A (Coke Oven)') ? '#ef4444' : '#16a34a'} />
                    </g>

                    {/* ZONE B: REFINERY COLUMN */}
                    <g 
                      className={`map-interactive-group node-b ${selectedZone === 'Zone B (Refinery)' ? 'selected' : ''} ${hasCriticalAlert('Zone B (Refinery)') ? 'active-risk' : ''}`}
                      onClick={() => setSelectedZone('Zone B (Refinery)')}
                    >
                      <rect x="340" y="170" width="210" height="110" rx="10" fill="#f8fafc" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
                      <text x="355" y="200" fill="#1e293b" fontWeight="bold" fontSize="13">Zone B: Hydrocracker Column</text>
                      <text x="355" y="225" fill="#64748b" fontSize="11">{getZoneSensors('Zone B (Refinery)').sensorType}: {getZoneSensors('Zone B (Refinery)').value} {getZoneSensors('Zone B (Refinery)').unit}</text>
                      <text x="355" y="245" fill="#64748b" fontSize="11">Active Permits: {data.permits.filter(p => p.zone === 'Zone B (Refinery)').length}</text>
                      <circle cx="530" cy="195" r="5" fill={hasCriticalAlert('Zone B (Refinery)') ? '#ef4444' : '#16a34a'} />
                    </g>

                    {/* ZONE C: STORAGE TANKS */}
                    <g 
                      className={`map-interactive-group node-c ${selectedZone === 'Zone C (Storage)' ? 'selected' : ''} ${hasCriticalAlert('Zone C (Storage)') ? 'active-risk' : ''}`}
                      onClick={() => setSelectedZone('Zone C (Storage)')}
                    >
                      <rect x="580" y="70" width="180" height="110" rx="10" fill="#f8fafc" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
                      <text x="595" y="100" fill="#1e293b" fontWeight="bold" fontSize="13">Zone C: Tank Storage</text>
                      <text x="595" y="125" fill="#64748b" fontSize="11">{getZoneSensors('Zone C (Storage)').sensorType}: {getZoneSensors('Zone C (Storage)').value}{getZoneSensors('Zone C (Storage)').unit}</text>
                      <text x="595" y="145" fill="#64748b" fontSize="11">Active Permits: {data.permits.filter(p => p.zone === 'Zone C (Storage)').length}</text>
                      <circle cx="740" cy="95" r="5" fill={hasCriticalAlert('Zone C (Storage)') ? '#ef4444' : '#16a34a'} />
                    </g>

                    {/* SAFE ASSEMBLY POINT */}
                    <g className="assembly-point">
                      <rect x="300" y="295" width="160" height="36" rx="6" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                      <text x="380" y="312" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="bold">🚨 SAFE ASSEMBLY POINT</text>
                      <text x="380" y="324" textAnchor="middle" fill="#94a3b8" fontSize="8">
                        Evacuated: {workers.filter(w => hasCriticalAlert(w.zone)).length} workers
                      </text>
                    </g>

                    {/* DYNAMIC WORKER ICONS */}
                    {workers.map(w => (
                      <g key={w.id} style={{ transition: 'all 0.8s linear' }}>
                        <circle cx={w.x} cy={w.y} r="5.5" fill={hasCriticalAlert(w.zone) ? '#ef4444' : '#1d4ed8'} stroke="#ffffff" strokeWidth="1.5" />
                        <circle cx={w.x} cy={w.y} r="9.5" fill="none" stroke={hasCriticalAlert(w.zone) ? '#ef4444' : '#1d4ed8'} strokeWidth="1.2" opacity="0.35" className={hasCriticalAlert(w.zone) ? 'worker-panic' : ''} />
                        <text x={w.x + 8} y={w.y + 3} fill="#1e293b" fontSize="8" fontWeight="600" style={{ background: '#ffffff', padding: '1px' }}>{w.name}</text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>

              {/* Charts + CCTV Grid */}
              <div className="row-grid">
                
                {/* Real-time Telemetry Graph */}
                <div className="glass-panel">
                  <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={18} style={{ color: '#1d4ed8' }} /> Live Telemetry Graph ({selectedZone})
                  </h3>
                  <div style={{ height: '220px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getChartData()}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={hasCriticalAlert(selectedZone) ? "#ef4444" : (selectedZone === 'Zone C (Storage)' ? "#16a34a" : "#1d4ed8")} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={hasCriticalAlert(selectedZone) ? "#ef4444" : (selectedZone === 'Zone C (Storage)' ? "#16a34a" : "#1d4ed8")} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="time" stroke="#64748b" fontSize={9} tickLine={false} />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={9} 
                          tickLine={false} 
                          domain={selectedZone === 'Zone C (Storage)' ? [15, 24] : [0, 60]} 
                        />
                        <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '6px', fontSize: '0.8rem', color: '#1e293b' }} itemStyle={{ color: '#1e293b' }} />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke={hasCriticalAlert(selectedZone) ? "#ef4444" : (selectedZone === 'Zone C (Storage)' ? "#16a34a" : "#1d4ed8")} 
                          strokeWidth={2} 
                          fillOpacity={1} 
                          fill="url(#colorValue)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* CCTV Camera Stream */}
                <div className="glass-panel">
                  <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Eye size={18} style={{ color: '#16a34a' }} /> Live AI Camera Simulation ({selectedZone})
                  </h3>
                  <div className={`cctv-wrapper ${hasCriticalAlert(selectedZone) ? 'hazard' : ''}`}>
                    <div className="cctv-overlay-header">
                      <div>CAM_04 // FEED_LIVE // {selectedZone.toUpperCase()}</div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span className="cctv-rec-dot"></span>REC
                      </div>
                    </div>
                    <div className="cctv-feed-sim">
                      <div className="cctv-noise"></div>
                      <div className="cctv-scanline"></div>
                      <div className="cctv-crosshair"></div>
                      <div className="cctv-bounding-box">
                        <span className="cctv-label">
                          {hasCriticalAlert(selectedZone) ? 'CRITICAL: HAZARD VIOLATION' : 'WORKER: SAFETY_OK'}
                        </span>
                      </div>
                      <div className="cctv-glitch-panel">
                        DETECTION ENGINE: ACTIVE<br/>
                        FPS: 30.00 // HD_FEED<br/>
                        HAZARDS: {hasCriticalAlert(selectedZone) ? '1 FOUND' : '0 FOUND'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Tab 2: Permit to Work Manager */}
          {activeTab === 'permits' && (
            <div className="glass-panel">
              <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HardHat size={18} style={{ color: '#d97706' }} /> Permit to Work (PTW) Control Center
              </h3>
              
              <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#64748b' }}>Active Operational Permits ({selectedZone}):</h4>
                  {activeZonePermits.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', margin: 0, color: '#64748b' }}>No permits currently active in this zone.</p>
                  ) : (
                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                      {activeZonePermits.map((p, i) => (
                        <div key={i} className={`permit-card ${p.permitType === 'Hot Work' ? 'hot-work' : ''}`}>
                          <div className="permit-card-header">
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e293b' }}>{p.permitId}</span>
                            <span className={`badge ${p.permitType === 'Hot Work' ? 'critical' : 'warning'}`}>{p.permitType.toUpperCase()}</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            Holder: {p.issuedTo}<br/>
                            Valid: 24 Hours
                          </div>
                          <div className="permit-barcode"></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <form onSubmit={handleCreatePermit} style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '15px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#1e293b' }}>Authorize New Shift Permit:</h4>
                  
                  {/* SIMOPS Safety Conflict Warnings */}
                  {newPermit.permitType === 'Hot Work' && currentZoneData.sensorType === 'Gas (Methane)' && currentZoneData.value > 10 && (
                    <div style={{ background: '#fffbeb', border: '1px solid #fef08a', borderRadius: '8px', padding: '12px', marginBottom: '15px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <AlertTriangle size={16} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ fontSize: '0.78rem', color: '#713f12', lineHeight: '1.45' }}>
                        <strong>OISD-STD-137 Safety Violation Risk:</strong> Live Methane readings in <strong>{selectedZone}</strong> are currently at <strong>{currentZoneData.value} LEL%</strong> (limit &lt; 10%). Authorizing a Hot Work permit now triggers a critical ignition threat.
                      </div>
                    </div>
                  )}

                  {newPermit.permitType === 'Confined Space Entry' && selectedZone === 'Zone C (Storage)' && currentZoneData.value < 19.5 && (
                    <div style={{ background: '#fffbeb', border: '1px solid #fef08a', borderRadius: '8px', padding: '12px', marginBottom: '15px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <AlertTriangle size={16} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ fontSize: '0.78rem', color: '#713f12', lineHeight: '1.45' }}>
                        <strong>Factories Act Sec 36 Violation Risk:</strong> Live Oxygen levels inside <strong>Zone C (Storage)</strong> are at <strong>{currentZoneData.value}%</strong> (minimum req: 19.5%). Asphyxiation hazard active. Worker entry is prohibited.
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input 
                        type="text" 
                        placeholder="Permit ID (e.g. PTW-HW-204)" 
                        value={newPermit.permitId}
                        onChange={(e) => setNewPermit({...newPermit, permitId: e.target.value})}
                        style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', color: '#1e293b', flex: 1, outline: 'none' }}
                        required
                      />
                      <select 
                        value={newPermit.permitType}
                        onChange={(e) => setNewPermit({...newPermit, permitType: e.target.value})}
                        style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', color: '#1e293b', flex: 1, outline: 'none' }}
                      >
                        <option value="Hot Work">Hot Work</option>
                        <option value="Confined Space Entry">Confined Space Entry</option>
                        <option value="Electrical Isolation">Electrical Isolation</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <select 
                        value={newPermit.zone}
                        onChange={(e) => setNewPermit({...newPermit, zone: e.target.value})}
                        style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', color: '#1e293b', flex: 1, outline: 'none' }}
                      >
                        <option value="Zone A (Coke Oven)">Zone A (Coke Oven)</option>
                        <option value="Zone B (Refinery)">Zone B (Refinery)</option>
                        <option value="Zone C (Storage)">Zone C (Storage)</option>
                      </select>
                      <button type="submit" className="primary-btn" style={{ flex: 1 }}>Authorize PTW Certification</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Tab 3: Compliance Audit Ledger */}
          {activeTab === 'compliance' && (
            <div className="glass-panel">
              <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClipboardList size={18} style={{ color: '#16a34a' }} /> Quality & Compliance Audit Ledger
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Automated continuous auditing of onsite telemetry and work permit states against statutory regulations (OISD, Factory Act, DGMS).
              </p>

              {/* Audit Checklist Table */}
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Rule Reference</th>
                    <th>Safety Audit Area</th>
                    <th>Zone</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {auditChecks.map((check, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: 'bold' }}>{check.ruleId}</td>
                      <td>
                        <div>{check.name}</div>
                        <small style={{ color: '#64748b' }}>{check.description}</small>
                      </td>
                      <td>{check.zone}</td>
                      <td style={{ color: check.status === 'Compliant' ? '#16a34a' : '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {check.status === 'Compliant' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        {check.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Automated Corrective Action Workflows */}
              <div style={{ marginTop: '25px', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>AI-Generated Corrective Action Workflows:</h4>
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Reference Rule</th>
                      <th>Location</th>
                      <th>Mandated Corrective Action</th>
                      <th>Assigned Crew</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {correctiveActions.map((action, i) => (
                      <tr key={i}>
                        <td style={{ color: '#b45309' }}>{action.id}</td>
                        <td>{action.ruleId}</td>
                        <td>{action.zone}</td>
                        <td>{action.task}</td>
                        <td>{action.assignedTo}</td>
                        <td>
                          <span className="badge warning">{action.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 4: Emergency Control Room */}
          {activeTab === 'emergency' && (
            <div className="glass-panel">
              <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                <AlertOctagon size={18} /> Emergency Response & Orchestration Room
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px', marginTop: '15px' }}>
                
                {/* Emergency dispatch metrics */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div className="glass-panel" style={{ background: 'rgba(239,68,68,0.03)', borderColor: 'rgba(239,68,68,0.12)' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#b91c1c' }}>Evacuation Status:</h4>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <li>Broadcast Evacuation Siren: <strong style={{ color: hasCriticalAlert(selectedZone) ? '#ef4444' : '#64748b' }}>{hasCriticalAlert(selectedZone) ? 'ENGAGED' : 'STANDBY'}</strong></li>
                      <li>Ventilation Blowers Override: <strong style={{ color: hasCriticalAlert(selectedZone) ? '#ef4444' : '#64748b' }}>{hasCriticalAlert(selectedZone) ? '100% MAXIMUM' : 'AUTO'}</strong></li>
                      <li>Main Gas Line Solenoid: <strong style={{ color: hasCriticalAlert(selectedZone) ? '#ef4444' : '#64748b' }}>{hasCriticalAlert(selectedZone) ? 'SHUTDOWN_CLOSED' : 'OPEN'}</strong></li>
                    </ul>
                  </div>

                  <div className="glass-panel">
                    <h4 style={{ margin: '0 0 10px 0' }}>Emergency Dispatch:</h4>
                    <p style={{ fontSize: '0.8rem', margin: '0 0 12px 0', color: '#64748b' }}>Broadcast emergency alert directly to onsite response channels:</p>
                    <button className="primary-btn" style={{ background: '#ef4444' }} onClick={() => alert("🚨 Onsite Rescue Squad notified via SMS, WhatsApp & PA System channels.")}>
                      Dispatch Rescue Squad
                    </button>
                  </div>
                </div>

                {/* Regulatory Incident Report Generator (Factories Act Form 18 Style) */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={18} style={{ color: '#1d4ed8' }} /> Statutory Incident Report
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 15px 0' }}>
                      On alert trigger, the platform locks telemetry logs and generates a regulatory incident report under Factories Act 1948 Section 88.
                    </p>
                  </div>

                  {showReport ? (
                    <div style={{ background: '#ffffff', border: '1.5px solid #1e293b', borderRadius: '8px', padding: '16px', fontFamily: 'serif', color: '#1e293b', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                      <div style={{ textAlign: 'center', borderBottom: '1.5px double #1e293b', paddingBottom: '6px', marginBottom: '10px' }}>
                        <strong style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Form 18 - Accident Report</strong><br/>
                        <span style={{ fontSize: '0.6rem', fontStyle: 'italic' }}>[Prescribed under Factories Act 1948 Section 88]</span>
                      </div>
                      <table style={{ width: '100%', fontSize: '0.68rem', borderCollapse: 'collapse', lineHeight: '1.4' }}>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Facility Location:</td>
                            <td style={{ padding: '4px 0' }}>{selectedZone}</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Incident Nature:</td>
                            <td style={{ padding: '4px 0', color: '#ef4444', fontWeight: 'bold' }}>
                              {selectedZone === 'Zone C (Storage)' ? 'Confined Space Asphyxiation Alert' : 'Explosion Hazard Alert'}
                            </td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '4px 0', fontWeight: 'bold' }}>SCADA Value Logged:</td>
                            <td style={{ padding: '4px 0' }}>{currentZoneData.sensorType} = {currentZoneData.value} {currentZoneData.unit}</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Active Permit ID:</td>
                            <td style={{ padding: '4px 0' }}>{activeZonePermits.length > 0 ? activeZonePermits[0].permitId : 'PTW-HW-101'}</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Evacuation Status:</td>
                            <td style={{ padding: '4px 0' }}>Evacuated {workers.filter(w => hasCriticalAlert(w.zone)).length} workers to Safe Zone.</td>
                          </tr>
                        </tbody>
                      </table>
                      <div style={{ marginTop: '10px', textAlign: 'right' }}>
                        <button className="primary-btn" style={{ fontSize: '0.6rem', padding: '2px 8px' }} onClick={() => window.print()}>Print Form</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem 0', color: '#64748b', border: '1px dashed #cbd5e1', borderRadius: '6px' }}>
                      No report generated. Lock event to populate.
                    </div>
                  )}

                  <button className="primary-btn" style={{ marginTop: '10px' }} onClick={() => setShowReport(prev => !prev)}>
                    {showReport ? "Close Report Preview" : "Generate Form 18 Incident Report"}
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* Tab 5: AI Compliance Copilot (RAG) */}
          {activeTab === 'rag' && (
            <div className="glass-panel">
              <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={18} style={{ color: '#1d4ed8' }} /> AI Compliance Copilot (RAG Search)
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>
                Cross-reference near-misses and query regulatory directives (OISD, Factory Act, DGMS circulars) to get compliance answers.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                {/* Chat window */}
                <div className="chat-container" style={{ height: '380px' }}>
                  <div className="chat-messages">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`chat-bubble ${msg.role}`}>
                        <div>{msg.text}</div>
                        {msg.citation && (
                          <div className="chat-citation">
                            {msg.citation}
                          </div>
                        )}
                      </div>
                    ))}
                    {isTyping && <div className="chat-bubble bot" style={{ opacity: 0.6 }}>Assistant is reading Factory Act databases...</div>}
                  </div>
                  
                  {/* RAG Suggestions Chips */}
                  <div className="rag-suggestions-list">
                    <span className="rag-chip" onClick={() => executeRAGQuery('OISD Hot Work Regulations')}>🔥 Hot Work Rules</span>
                    <span className="rag-chip" onClick={() => executeRAGQuery('Factory Act Section 36 confined space')}>☣️ Confined Spaces</span>
                  </div>

                  <form onSubmit={handleSendQuery} className="chat-input-area">
                    <input 
                      type="text" 
                      placeholder="Ask about Hot Work limits or Factory Act Section 36..." 
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    <button type="submit">
                      <Send size={14} />
                    </button>
                  </form>
                </div>

                {/* Regulatory Document Corpus Browser */}
                <div className="glass-panel" style={{ height: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', padding: '15px', background: '#f8fafc', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#1e293b' }}>
                    <BookOpen size={16} style={{ color: '#1d4ed8' }} /> Regulation Corpus Browser
                  </h4>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {regulatoryDocs.map((doc, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => setSelectedDocIndex(idx)}
                        style={{
                          fontSize: '0.72rem',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid',
                          borderColor: selectedDocIndex === idx ? '#1d4ed8' : '#cbd5e1',
                          background: selectedDocIndex === idx ? 'rgba(37,99,235,0.08)' : '#ffffff',
                          color: selectedDocIndex === idx ? '#1d4ed8' : '#64748b',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        {doc.code}
                      </button>
                    ))}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.75rem' }}>
                    <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{regulatoryDocs[selectedDocIndex].title}:</span>
                    {regulatoryDocs[selectedDocIndex].sections.map((sec, sidx) => (
                      <div key={sidx} style={{ background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
                        <div style={{ fontWeight: 'bold', color: '#1d4ed8', marginBottom: '3px' }}>{sec.id}: {sec.title}</div>
                        <div style={{ color: '#334155', lineHeight: '1.4' }}>{sec.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Right Hand Section: Always visible Alerts & Scrolling Terminal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Site Health & Compliance Gauge */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>Plant Safety Health Index</span>
            <div style={{ position: 'relative', width: '120px', height: '80px', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
              <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background Arc */}
                <circle cx="60" cy="60" r="45" fill="none" stroke="#e2e8f0" strokeWidth="10" strokeDasharray="141" strokeDashoffset="0" />
                {/* Foreground Arc */}
                <circle 
                  cx="60" cy="60" r="45" 
                  fill="none" 
                  stroke={data.alerts.length > 0 ? (data.alerts.some(a => a.severity === 'High') ? '#ef4444' : '#d97706') : '#16a34a'} 
                  strokeWidth="10" 
                  strokeDasharray="141" 
                  strokeDashoffset={141 - (141 * (data.alerts.length > 0 ? (data.alerts.some(a => a.severity === 'High') ? 45 : 75) : 100)) / 100}
                  style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.6s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', bottom: '2px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: data.alerts.length > 0 ? (data.alerts.some(a => a.severity === 'High') ? '#ef4444' : '#d97706') : '#16a34a' }}>
                  {data.alerts.length > 0 ? (data.alerts.some(a => a.severity === 'High') ? '45%' : '75%') : '100%'}
                </span>
                <span style={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 'bold', textAlign: 'center', lineHeight: '1' }}>
                  {data.alerts.length > 0 ? (data.alerts.some(a => a.severity === 'High') ? 'HAZARD ACTIVE' : 'WARNING DEVIATION') : 'FULLY COMPLIANT'}
                </span>
              </div>
            </div>
          </div>

          {/* AI Alerts Box */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c' }}>
              <ShieldAlert size={18} /> Active Alarms
            </h3>
            <div className="alerts-list">
              {data.alerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
                  <ShieldCheck size={40} style={{ marginBottom: '8px', color: '#16a34a' }} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>All Clear. Plant compliance verified.</p>
                </div>
              ) : (
                data.alerts.map((alert, index) => (
                  <div key={index} className={`alert-item ${alert.severity}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#b91c1c', fontSize: '0.85rem' }}>
                      <AlertTriangle size={16} />
                      <span>{alert.title}</span>
                    </div>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: '#334155', lineHeight: 1.4 }}>
                      {alert.description}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* scrolling Agent Logs Terminal */}
          <div className="glass-panel" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={18} style={{ color: '#1d4ed8' }} /> AI Agent Reasoning Log
            </h3>
            <div className="terminal-container">
              {data.agentLogs.map((log) => (
                <div key={log.id} className="terminal-line">
                  <span className="terminal-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className={`terminal-agent ${log.agentName}`}>[{log.agentName}]</span>
                  <span className={`terminal-msg ${log.level}`}>{log.message}</span>
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default App;
