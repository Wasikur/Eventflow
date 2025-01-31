// src/components/ConnectorNode.jsx
import React, { useContext } from 'react';
import { Handle } from 'reactflow';
import { ExecutingNodeContext } from '../FlowchartComponent';

const ConnectorNode = ({id, data }) => {
  const executingNodeId = useContext(ExecutingNodeContext);
  const isExecuting = executingNodeId === id;
  return (
    <div style={{ padding: '10px', background: isExecuting ? '#ff69b4' : '#ffb6c1', borderRadius: '5px', border: '1px solid #333' }}>
      <strong>{data.label}</strong>
      <Handle type="source" position="bottom" />
      <Handle type="target" position="top" />
    </div>
  );
};

export default ConnectorNode;