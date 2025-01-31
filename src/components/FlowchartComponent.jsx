// This is the main component
import React, { useState, useCallback, createContext, useContext } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  MiniMap,
  Controls,
  useNodesState,
  useEdgesState,
  Background,
  MarkerType,
} from 'reactflow';
import nodeProperties from './NodeProperties';
import Toolbar from './Toolbar';
import PropertiesPanel from './PropertiesPanel';
// import EdgeArrowHead from './EdgeArrowHead';
import ConnectorNode from './Nodes/ConnectorNode';
import ActionNode from './Nodes/ActionNode';

const nodeTypes = {
  Connector: ConnectorNode,
  Action: ActionNode,
};

export const ExecutingNodeContext = createContext(null);

const FlowchartComponent = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [executingNodeId, setExecutingNodeId] = useState(null);

  const onDrop = useCallback((event) => {
    const reactFlowBounds = event.target.getBoundingClientRect();
    const type = event.dataTransfer.getData('node-type');
    const position = {
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    };

    const newNode = {
      id: `${nodes.length + 1}`,
      type,
      position,
      data: {
        label: nodeProperties[type]?.label || type,
        ...nodeProperties[type],
      },
      style: { background: '#ffffff', color: '#000', border: '2px solid #333' },
    };

    setNodes((nds) => nds.concat(newNode));
  }, [nodes, setNodes]);

  const onConnect = useCallback((params) => {
    setEdges((eds) =>
      addEdge(
        {
          ...params,
          type: "default",
          style: { stroke: '#000', cursor: "grab", strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#000' },
        },
        eds
      )
    );
  }, [setEdges]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  const onEdgeClick = useCallback((event, edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const onDragOver = (event) => {
    event.preventDefault();
  };

  const onNodeDragStop = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const removeSelectedNode = () => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id)
      );
      setSelectedNode(null);
    }
  };

  const removeSelectedEdge = () => {
    if (selectedEdge) {
      setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdge.id));
      setSelectedEdge(null);
    }
  };

  const onPropertyChange = (key, value) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id ? { ...node, data: { ...node.data, [key]: value } } : node
      )
    );
    setSelectedNode((prev) => ({ ...prev, data: { ...prev.data, [key]: value } }));
  };

  const isActionConnectedToConnector = (actionNodeId) => {
    return edges.some(edge => edge.target === actionNodeId && nodes.find(node => node.id === edge.source && node.type === 'Connector'));
  };

  const getTopologicalOrder = useCallback(() => {
    const inDegrees = {};
    const adjacencyList = {};

    nodes.forEach(node => {
      inDegrees[node.id] = 0;
      adjacencyList[node.id] = [];
    });

    edges.forEach(edge => {
      inDegrees[edge.target]++;
      adjacencyList[edge.source].push(edge.target);
    });

    const queue = nodes.filter(node => inDegrees[node.id] === 0).map(node => node.id);
    const order = [];

    while (queue.length > 0) {
      const nodeId = queue.shift();
      order.push(nodeId);
      adjacencyList[nodeId].forEach(targetId => {
        inDegrees[targetId]--;
        if (inDegrees[targetId] === 0) {
          queue.push(targetId);
        }
      });
    }

    return order;
  }, [nodes, edges]);

  const executeNode = useCallback((nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node.type === 'Connector') {
      console.log(`Connecting to ${node.data.connectorType}`);
      // Add actual API call here
    } else if (node.type === 'Action') {
      const connectorEdge = edges.find(edge => 
        edge.target === nodeId && nodes.some(n => n.id === edge.source && n.type === 'Connector')
      );
      if (connectorEdge) {
        const connector = nodes.find(n => n.id === connectorEdge.source);
        console.log(`Performing ${node.data.actionType} on ${connector.data.connectorType}`);
        // Add actual API call here
      }
    }
  }, [nodes, edges]);

  const runFlow = useCallback(async () => {
    // Check for unconnected action nodes
    const invalidActions = nodes.filter(node => 
      node.type === 'Action' && 
      !isActionConnectedToConnector(node.id)
    );
  
    if (invalidActions.length > 0) {
      alert(`These actions need a connector connection:\n${
        invalidActions.map(a => `- ${a.data.label}`).join('\n')
      }`);
      return; // Stop execution
    }
  
    // Proceed if all actions are connected
    const order = getTopologicalOrder();
    for (const nodeId of order) {
      setExecutingNodeId(nodeId);
      executeNode(nodeId);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setExecutingNodeId(null);
  }, [getTopologicalOrder, executeNode, nodes, isActionConnectedToConnector]);


  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Toolbar onDragStart={(e, type) => e.dataTransfer.setData('node-type', type)} onRunFlow={runFlow} />
      <div
        style={{
          flexGrow: 1,
          border: '1px solid #ccc',
          overflow: 'auto',
          height: '100%',
          position: 'relative',
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <ExecutingNodeContext.Provider value={executingNodeId}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onNodeDragStop={onNodeDragStop}
            nodeTypes={nodeTypes} // Register custom node types here
            style={{ width: '100%', height: '100%' }}
          >
            {/* <EdgeArrowHead /> */}
            <MiniMap />
            <Controls />
            <Background variant="lines" gap={20} size={0.5} color="#ddd" />
          </ReactFlow>
        </ReactFlowProvider>
        </ExecutingNodeContext.Provider>
      </div>
      <PropertiesPanel
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        onRemoveNode={removeSelectedNode}
        onRemoveEdge={removeSelectedEdge}
        onPropertyChange={onPropertyChange}
        isActionConnectedToConnector={selectedNode && selectedNode.type === 'Action' ? isActionConnectedToConnector(selectedNode.id) : false}
      />
    </div>
  );
};

export default FlowchartComponent;