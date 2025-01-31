// src/components/ActionNode.jsx
import React, { useContext } from 'react';
import { Handle } from 'reactflow';
import { ExecutingNodeContext } from '../FlowchartComponent';

const ActionNode = ({ id, data }) => {
  const executingNodeId = useContext(ExecutingNodeContext);
  const isExecuting = executingNodeId === id;
  return (
    <div style={{ padding: '10px', background: isExecuting ? '#87CEFA' : '#add8e6', borderRadius: '5px', border: '1px solid #333' }}>
      <strong>{data.label}</strong>
      <Handle type="source" position="bottom" />
      <Handle type="target" position="top" />
    </div>
  );
};

export default ActionNode;