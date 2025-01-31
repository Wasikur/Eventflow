// This is the left tooolbar
import React from 'react';

const Toolbar = ({ onDragStart, onRunFlow }) => (
  <div style={{ width: '200px', background: '#f1f1f1', padding: '20px' }}>

    {/* Nodes */}
    <div
      draggable
      onDragStart={(e) => onDragStart(e, 'Connector')}
      style={nodeStyle('Connector')}
    >
      Connector Node
    </div>
    <div
      draggable
      onDragStart={(e) => onDragStart(e, 'Action')}
      style={nodeStyle('Action')}
    >
      Action Node
    </div>

    {/* Connectors */}
    <button 
        onClick={onRunFlow} 
        style={{ 
          marginTop: '10px', 
          padding: '10px 15px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Run Flow
      </button>
  </div>
);

const nodeStyle = (type) => ({
  padding: '10px',
  background: type === 'Connector' ? '#ffb6c1' : '#add8e6',
  marginBottom: '10px',
  cursor: 'move',
  borderRadius: '5px',
  border: '2px dashed #333',
});

export default Toolbar;