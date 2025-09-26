// Composant React pour intégration dans moverz.fr
// À copier dans votre projet React/Next.js

import React from 'react';

const InventaireIA = ({ className = "", style = {} }) => {
  return (
    <div 
      className={`inventaire-ia-container ${className}`}
      style={{
        width: '100%',
        height: '80vh',
        minHeight: '600px',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        ...style
      }}
    >
      <iframe
        src="https://moverz-v3.vercel.app/"
        allow="camera; microphone; fullscreen"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
        title="Inventaire IA - Analyse automatique des objets"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block'
        }}
      />
    </div>
  );
};

// Version avec header personnalisé
const InventaireIAPage = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#f7fafc' }}>
      <div style={{ 
        background: 'white', 
        padding: '2rem', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: '700', 
          color: '#2d3748',
          marginBottom: '0.5rem'
        }}>
          Inventaire IA
        </h1>
        <p style={{ 
          color: '#718096', 
          fontSize: '1.1rem' 
        }}>
          Analyse automatique de vos objets pour un déménagement optimisé
        </p>
      </div>
      
      <div style={{ padding: '2rem' }}>
        <InventaireIA />
      </div>
    </div>
  );
};

// Version mobile optimisée
const InventaireIAMobile = () => {
  return (
    <div style={{ 
      height: '100vh', 
      background: 'white',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ 
        padding: '1rem', 
        background: '#667eea', 
        color: 'white',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Inventaire IA</h1>
      </div>
      
      <div style={{ flex: 1, height: 'calc(100vh - 80px)' }}>
        <iframe
          src="https://moverz-v3.vercel.app/"
          allow="camera; microphone; fullscreen"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
          title="Inventaire IA"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block'
          }}
        />
      </div>
    </div>
  );
};

export { InventaireIA, InventaireIAPage, InventaireIAMobile };
export default InventaireIA;
