import React, { useState, useEffect, useRef } from 'react';
import { 
  Calculator, Brain, FileText, TrendingUp, Users, Zap, 
  Upload, Download, BarChart3, PieChart, MessageSquare,
  CheckCircle, AlertCircle, Info, Star, Sparkles, Target
} from 'lucide-react';

// Simulation IA (en production, ce serait GPT-4)
const simulateAIResponse = async (query) => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const responses = {
    analyse: "Basé sur l'analyse de 2,847 cas similaires dans la région de Montréal, voici mes recommandations:\n\n" +
             "📊 Probabilité d'acceptation: 89%\n" +
             "✅ Points forts: Revenus bien documentés, garde partagée équilibrée\n" +
             "⚠️ Point d'attention: Frais particuliers légèrement élevés (95e percentile)\n\n" +
             "Suggestion: Réduire frais parascolaires de 15% pour atteindre 96% probabilité",
    
    conseil: "Pour maximiser vos chances:\n\n" +
             "1. Joignez 3 reçus de garderie (renforce crédibilité)\n" +
             "2. Citez l'arrêt Droit de la famille — 19234 (similaire)\n" +
             "3. Proposez clause d'indexation annuelle (2%)\n" +
             "4. Incluez plan de garde détaillé (calendrier)",
    
    jurisprudence: "J'ai trouvé 12 décisions pertinentes:\n\n" +
                  "⭐ Droit de la famille — 23156 (2023)\n" +
                  "   Garde 60/40, revenus similaires, acceptée\n\n" +
                  "⭐ Droit de la famille — 22789 (2022)\n" +
                  "   Frais médicaux spéciaux, accordé à 85%\n\n" +
                  "Voulez-vous voir les 10 autres décisions?"
  };
  
  return responses[Math.random() > 0.5 ? 'analyse' : 'conseil'];
};

export default function SafeProAdvanced() {
  const [aiMessages, setAiMessages] = useState([
    { type: 'ai', text: "👋 Bonjour! Je suis l'assistant IA de SAFE Pro. Comment puis-je vous aider aujourd'hui?" }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  
  const [extractedData, setExtractedData] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  
  const [scenarios, setScenarios] = useState([
    { id: 1, name: 'Garde exclusive', garde: 'exclusive', pension: 18450 },
    { id: 2, name: 'Garde 50/50', garde: 'partagee', percentage: 50, pension: 8920 },
    { id: 3, name: 'Garde 60/40', garde: 'partagee', percentage: 40, pension: 12360 },
  ]);
  
  const [selectedTab, setSelectedTab] = useState('ai'); // ai, extract, scenarios, analytics

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const handleAISubmit = async () => {
    if (!aiInput.trim()) return;
    
    const userMessage = aiInput;
    setAiMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setAiInput('');
    setAiLoading(true);
    
    try {
      const response = await simulateAIResponse(userMessage);
      setAiMessages(prev => [...prev, { type: 'ai', text: response }]);
    } catch (error) {
      setAiMessages(prev => [...prev, { 
        type: 'ai', 
        text: "Désolé, une erreur s'est produite. Réessayez." 
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setUploadedFile(file);
    
    // Simulation extraction OCR/IA
    setTimeout(() => {
      setExtractedData({
        type: file.name.includes('T4') ? 'T4' : file.name.includes('RL') ? 'RL-1' : 'Relevé bancaire',
        data: {
          revenuBrutMere: '65,000',
          revenuBrutPere: '82,500',
          autresRevenusMere: '5,200',
          deductionsMere: '3,800',
          deductionsPere: '4,200',
          confidence: 94
        }
      });
    }, 2000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #7c3aed 50%, #ec4899 100%)',
      fontFamily: '"Inter", system-ui, sans-serif',
      padding: '1.5rem'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        * { box-sizing: border-box; }
        
        .glass {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        
        .tab {
          padding: 1rem 1.5rem;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 600;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
        }
        
        .tab:hover {
          color: white;
          background: rgba(255, 255, 255, 0.1);
        }
        
        .tab.active {
          color: white;
          border-bottom-color: white;
        }
        
        .message-user {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1rem 1.25rem;
          border-radius: 18px 18px 4px 18px;
          max-width: 70%;
          margin-left: auto;
          margin-bottom: 1rem;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        
        .message-ai {
          background: #f3f4f6;
          color: #1f2937;
          padding: 1rem 1.25rem;
          border-radius: 18px 18px 18px 4px;
          max-width: 80%;
          margin-right: auto;
          margin-bottom: 1rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          white-space: pre-wrap;
        }
        
        .scenario-card {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: all 0.2s;
          cursor: pointer;
          border: 2px solid transparent;
        }
        
        .scenario-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          border-color: #667eea;
        }
        
        .pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1.5rem;
          border-radius: 16px;
          text-align: center;
        }
        
        .extraction-box {
          background: #ecfdf5;
          border: 2px dashed #10b981;
          padding: 2rem;
          border-radius: 16px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .extraction-box:hover {
          background: #d1fae5;
          border-color: #059669;
        }
        
        .input-modern {
          width: 100%;
          padding: 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.2s;
        }
        
        .input-modern:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        }
        
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '2rem', 
          color: 'white'
        }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            marginBottom: '0.5rem'
          }}>
            <Sparkles size={42} />
            <h1 style={{ margin: 0, fontSize: '3rem', fontWeight: '800' }}>
              SAFE PRO
            </h1>
            <Sparkles size={42} />
          </div>
          <p style={{ fontSize: '1.25rem', opacity: 0.95, margin: '0.5rem 0 0 0' }}>
            L'intelligence artificielle au service du droit familial
          </p>
          <div style={{ 
            display: 'inline-flex', 
            gap: '1rem', 
            marginTop: '1rem',
            fontSize: '0.875rem'
          }}>
            <span style={{ 
              background: 'rgba(255, 255, 255, 0.2)', 
              padding: '0.5rem 1rem', 
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Brain size={16} /> IA Conversationnelle
            </span>
            <span style={{ 
              background: 'rgba(255, 255, 255, 0.2)', 
              padding: '0.5rem 1rem', 
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Zap size={16} /> Extraction Auto
            </span>
            <span style={{ 
              background: 'rgba(255, 255, 255, 0.2)', 
              padding: '0.5rem 1rem', 
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Target size={16} /> Analyse Prédictive
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ 
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '16px 16px 0 0',
          display: 'flex',
          overflow: 'hidden'
        }}>
          <button 
            className={`tab ${selectedTab === 'ai' ? 'active' : ''}`}
            onClick={() => setSelectedTab('ai')}
          >
            <Brain size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Assistant IA
          </button>
          <button 
            className={`tab ${selectedTab === 'extract' ? 'active' : ''}`}
            onClick={() => setSelectedTab('extract')}
          >
            <Upload size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Extraction Documents
          </button>
          <button 
            className={`tab ${selectedTab === 'scenarios' ? 'active' : ''}`}
            onClick={() => setSelectedTab('scenarios')}
          >
            <TrendingUp size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Simulations
          </button>
          <button 
            className={`tab ${selectedTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setSelectedTab('analytics')}
          >
            <BarChart3 size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Analytics
          </button>
        </div>

        {/* Content */}
        <div className="glass" style={{ 
          borderRadius: '0 0 16px 16px', 
          padding: '2rem',
          minHeight: '600px'
        }}>
          
          {/* TAB 1: Assistant IA */}
          {selectedTab === 'ai' && (
            <div>
              <div style={{ 
                background: '#eff6ff', 
                border: '2px solid #3b82f6',
                padding: '1rem 1.25rem',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'start',
                gap: '0.75rem'
              }}>
                <Info size={24} style={{ flexShrink: 0, color: '#3b82f6' }} />
                <div>
                  <strong style={{ color: '#1e40af' }}>Assistant IA alimenté par GPT-4</strong>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#1e40af', fontSize: '0.875rem' }}>
                    Posez n'importe quelle question sur votre dossier. L'IA analyse 10,000+ jugements 
                    et vous conseille en temps réel.
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div style={{ 
                height: '400px', 
                overflowY: 'auto', 
                marginBottom: '1.5rem',
                padding: '1rem',
                background: '#fafafa',
                borderRadius: '12px'
              }}>
                {aiMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={msg.type === 'user' ? 'message-user' : 'message-ai'}
                  >
                    {msg.type === 'ai' && <Brain size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />}
                    {msg.text}
                  </div>
                ))}
                {aiLoading && (
                  <div className="message-ai">
                    <div className="pulse">🤔 L'IA analyse votre question...</div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input
                  type="text"
                  className="input-modern"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAISubmit()}
                  placeholder="Ex: Analyser ce cas de garde partagée avec revenus variables..."
                  disabled={aiLoading}
                />
                <button 
                  className="btn-primary"
                  onClick={handleAISubmit}
                  disabled={aiLoading || !aiInput.trim()}
                >
                  {aiLoading ? 'Analyse...' : 'Envoyer'}
                  <MessageSquare size={20} />
                </button>
              </div>

              {/* Suggestions rapides */}
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Suggestions rapides:</span>
                {[
                  "Analyser mes chances au tribunal",
                  "Trouver jurisprudence similaire", 
                  "Optimiser frais particuliers"
                ].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => setAiInput(suggestion)}
                    style={{
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      padding: '0.5rem 1rem',
                      borderRadius: '999px',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#667eea';
                      e.target.style.color = 'white';
                      e.target.style.borderColor = '#667eea';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'white';
                      e.target.style.color = 'black';
                      e.target.style.borderColor = '#e5e7eb';
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Extraction Documents */}
          {selectedTab === 'extract' && (
            <div>
              <h2 style={{ marginTop: 0, color: '#1f2937' }}>
                <Upload size={28} style={{ display: 'inline', marginRight: '0.5rem' }} />
                Extraction Automatique de Documents
              </h2>

              {!uploadedFile ? (
                <label className="extraction-box">
                  <input 
                    type="file" 
                    onChange={handleFileUpload}
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                  />
                  <Upload size={48} style={{ color: '#10b981', marginBottom: '1rem' }} />
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#065f46' }}>
                    Glissez un document ou cliquez pour uploader
                  </h3>
                  <p style={{ margin: 0, color: '#047857', fontSize: '0.875rem' }}>
                    T4, RL-1, relevés bancaires, jugements - tous formats acceptés
                  </p>
                </label>
              ) : !extractedData ? (
                <div className="extraction-box" style={{ background: '#fef3c7', borderColor: '#f59e0b' }}>
                  <div className="pulse">
                    <Zap size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>
                      Extraction en cours...
                    </h3>
                    <p style={{ margin: 0, color: '#92400e', fontSize: '0.875rem' }}>
                      L'IA analyse "{uploadedFile.name}"
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{
                    background: '#d1fae5',
                    border: '2px solid #10b981',
                    padding: '1.5rem',
                    borderRadius: '16px',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <CheckCircle size={28} style={{ color: '#065f46' }} />
                      <div>
                        <h3 style={{ margin: 0, color: '#065f46' }}>
                          Extraction réussie!
                        </h3>
                        <p style={{ margin: '0.25rem 0 0 0', color: '#047857', fontSize: '0.875rem' }}>
                          Document: {extractedData.type} • Confiance: {extractedData.confidence}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <h3 style={{ color: '#1f2937', marginBottom: '1rem' }}>
                    📊 Données extraites automatiquement:
                  </h3>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1rem'
                  }}>
                    {Object.entries(extractedData.data).filter(([key]) => key !== 'confidence').map(([key, value]) => (
                      <div key={key} style={{
                        background: 'white',
                        padding: '1.25rem',
                        borderRadius: '12px',
                        border: '2px solid #e5e7eb'
                      }}>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#667eea' }}>
                          {value} $
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                    <button className="btn-primary">
                      <CheckCircle size={20} />
                      Utiliser ces données
                    </button>
                    <button 
                      className="btn-primary"
                      style={{ background: '#6b7280' }}
                      onClick={() => {
                        setUploadedFile(null);
                        setExtractedData(null);
                      }}
                    >
                      Nouveau document
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Simulations */}
          {selectedTab === 'scenarios' && (
            <div>
              <h2 style={{ marginTop: 0, color: '#1f2937' }}>
                <TrendingUp size={28} style={{ display: 'inline', marginRight: '0.5rem' }} />
                Comparaison de Scénarios
              </h2>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem',
                marginTop: '1.5rem'
              }}>
                {scenarios.map(scenario => (
                  <div key={scenario.id} className="scenario-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <h3 style={{ margin: 0, color: '#1f2937' }}>{scenario.name}</h3>
                      <Star size={20} style={{ color: '#fbbf24' }} />
                    </div>
                    
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                      Type: {scenario.garde === 'exclusive' ? 'Garde exclusive' : `Garde partagée ${scenario.percentage}%`}
                    </div>
                    
                    <div style={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Pension annuelle</div>
                      <div style={{ fontSize: '2rem', fontWeight: '700', margin: '0.5rem 0' }}>
                        {scenario.pension.toLocaleString('fr-CA')} $
                      </div>
                      <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                        {(scenario.pension / 12).toLocaleString('fr-CA', { minimumFractionDigits: 2 })} $/mois
                      </div>
                    </div>

                    <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.875rem', color: '#1f2937', marginBottom: '0.5rem', fontWeight: '600' }}>
                        Probabilité d'acceptation
                      </div>
                      <div style={{ background: '#e5e7eb', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                        <div style={{ 
                          background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                          width: `${85 + Math.random() * 10}%`,
                          height: '100%'
                        }} />
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                        {Math.floor(85 + Math.random() * 10)}% basé sur 2,847 cas similaires
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <button className="btn-primary">
                  + Ajouter un nouveau scénario
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Analytics */}
          {selectedTab === 'analytics' && (
            <div>
              <h2 style={{ marginTop: 0, color: '#1f2937' }}>
                <BarChart3 size={28} style={{ display: 'inline', marginRight: '0.5rem' }} />
                Analytics et Business Intelligence
              </h2>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem',
                marginTop: '1.5rem'
              }}>
                <div className="stat-card">
                  <Calculator size={32} style={{ marginBottom: '0.5rem' }} />
                  <div style={{ fontSize: '3rem', fontWeight: '800', margin: '0.5rem 0' }}>247</div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Dossiers traités ce mois</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.5rem' }}>
                    +23% vs mois dernier
                  </div>
                </div>

                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                  <TrendingUp size={32} style={{ marginBottom: '0.5rem' }} />
                  <div style={{ fontSize: '3rem', fontWeight: '800', margin: '0.5rem 0' }}>92%</div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.9' }}>Taux d'acceptation tribunal</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.5rem' }}>
                    Au-dessus moyenne (87%)
                  </div>
                </div>

                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                  <Users size={32} style={{ marginBottom: '0.5rem' }} />
                  <div style={{ fontSize: '3rem', fontWeight: '800', margin: '0.5rem 0' }}>156</div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.9' }}>Clients actifs</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.5rem' }}>
                    +18 nouveaux ce mois
                  </div>
                </div>

                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' }}>
                  <Zap size={32} style={{ marginBottom: '0.5rem' }} />
                  <div style={{ fontSize: '3rem', fontWeight: '800', margin: '0.5rem 0' }}>4.2m</div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.9' }}>Temps économisé (min)</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.5rem' }}>
                    vs saisie manuelle
                  </div>
                </div>
              </div>

              <div style={{ 
                marginTop: '2rem',
                background: 'white',
                padding: '2rem',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{ margin: '0 0 1.5rem 0', color: '#1f2937' }}>
                  📊 Performance vs Benchmark Régional (Montréal)
                </h3>

                {[
                  { label: 'Vitesse traitement dossier', you: 87, avg: 72 },
                  { label: 'Précision calculs', you: 98, avg: 94 },
                  { label: 'Satisfaction clients', you: 94, avg: 88 },
                  { label: 'Taux acceptation tribunal', you: 92, avg: 87 }
                ].map(stat => (
                  <div key={stat.label} style={{ marginBottom: '1.5rem' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem'
                    }}>
                      <span style={{ fontWeight: '600', color: '#1f2937' }}>{stat.label}</span>
                      <span style={{ color: '#667eea', fontWeight: '700' }}>
                        {stat.you}% <span style={{ color: '#6b7280', fontWeight: '400' }}>vs {stat.avg}%</span>
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div style={{ flex: 1, background: '#e5e7eb', borderRadius: '999px', height: '8px', overflow: 'hidden', position: 'relative' }}>
                        <div style={{ 
                          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                          width: `${stat.you}%`,
                          height: '100%'
                        }} />
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: `${stat.avg}%`,
                          width: '2px',
                          height: '100%',
                          background: '#f59e0b'
                        }} />
                      </div>
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #10b981' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={20} style={{ color: '#059669' }} />
                    <span style={{ fontWeight: '600', color: '#065f46' }}>
                      Vous êtes dans le top 10% des cabinets de votre région! 🎉
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          marginTop: '2rem', 
          textAlign: 'center', 
          color: 'white',
          fontSize: '0.875rem',
          opacity: 0.9
        }}>
          <p style={{ margin: 0 }}>
            SAFE PRO © 2026 • Intelligence artificielle au service du droit familial
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', opacity: 0.8 }}>
            Version Bêta • Données de démonstration • Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
}
