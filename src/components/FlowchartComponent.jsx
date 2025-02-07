// FlowchartComponent.jsx
import React, { useState, useEffect, useCallback, createContext } from 'react';
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
import ConnectorNode from './Nodes/ConnectorNode';
import ActionNode from './Nodes/ActionNode';

const nodeTypes = {
  Connector: ConnectorNode,
  Action: ActionNode,
};

export const ExecutingNodeContext = createContext(null);

// OutputPanel Component
const OutputPanel = ({ messages }) => (
  <div
    style={{
      marginTop: '10px',
      padding: '10px',
      borderTop: '1px solid #ccc',
      backgroundColor: '#f5f5f5',
      height: '150px',
      overflowY: 'auto',
    }}
  >
    <h4>Output</h4>
    {messages.length === 0 ? <p>No output yet.</p> : messages.map((msg, index) => <div key={index}>{msg}</div>)}
  </div>
);

const FlowchartComponent = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [executingNodeId, setExecutingNodeId] = useState(null);
  const [outputMessages, setOutputMessages] = useState([]);
  const [actionOutputs, setActionOutputs] = useState({});
  // New state for connectors and functions loaded from the backend
  const [connectorsList, setConnectorsList] = useState([]);
  const [functionsList, setFunctionsList] = useState([]);

  // Fetch connectors and functions when the component mounts
  useEffect(() => {
    async function fetchAPIData() {
      try {
        const connRes = await fetch('http://127.0.0.1:8000/connectors');
        const connectorsData = await connRes.json();
        setConnectorsList(connectorsData);

        const funcRes = await fetch('http://127.0.0.1:8000/functions');
        const functionsData = await funcRes.json();
        setFunctionsList(functionsData);
      } catch (error) {
        console.error('Error fetching API data:', error);
      }
    }
    fetchAPIData();
  }, []);

  // Helper function to add output messages
  const addOutputMessage = (msg) => {
    setOutputMessages((prev) => [...prev, msg]);
  };

  // When a new node is dropped onto the canvas, create a new node.
  const onDrop = useCallback(
    (event) => {
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
          // Pre-populate default properties (if any) here.
          ...nodeProperties[type],
        },
        style: { background: '#ffffff', color: '#000', border: '2px solid #333' },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [nodes, setNodes]
  );

  // When an edge is drawn between nodes.
  const onConnect = useCallback(
    (params) => {
      const sourceNode = nodes.find((n) => n.id === params.source);
      if (sourceNode && sourceNode.type === 'Connector') {
        setNodes((nds) =>
          nds.map((node) =>
            node.id === params.target
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    connectorType: sourceNode.data.connectorType || sourceNode.data.label,
                  },
                }
              : node
          )
        );
      }
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'default',
            style: { stroke: '#000', cursor: 'grab', strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#000' },
          },
          eds
        )
      );
    },
    [nodes, setNodes, setEdges]
  );

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

  // Called when a property changes; update the node data.
  const onPropertyChange = (key, value) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id ? { ...node, data: { ...node.data, [key]: value } } : node
      )
    );
    setSelectedNode((prev) => ({ ...prev, data: { ...prev.data, [key]: value } }));
  };

  // Check if an action node is connected to a connector node.
  const isActionConnectedToConnector = (actionNodeId) => {
    return edges.some(
      (edge) =>
        edge.target === actionNodeId &&
        nodes.find((node) => node.id === edge.source && node.type === 'Connector')
    );
  };

  // Topologically sort nodes (based on in-degrees).
  const getTopologicalOrder = useCallback(() => {
    const inDegrees = {};
    const adjacencyList = {};

    nodes.forEach((node) => {
      inDegrees[node.id] = 0;
      adjacencyList[node.id] = [];
    });

    edges.forEach((edge) => {
      inDegrees[edge.target]++;
      adjacencyList[edge.source].push(edge.target);
    });

    const queue = nodes.filter((node) => inDegrees[node.id] === 0).map((node) => node.id);
    const order = [];

    while (queue.length > 0) {
      const nodeId = queue.shift();
      order.push(nodeId);
      adjacencyList[nodeId].forEach((targetId) => {
        inDegrees[targetId]--;
        if (inDegrees[targetId] === 0) {
          queue.push(targetId);
        }
      });
    }
    return order;
  }, [nodes, edges]);

  // -------------------------------------------------------------------
  // API Functions: Call your backend endpoints.
  // -------------------------------------------------------------------

  async function getWeather(connectorData, actionData) {
    const payload = {
      api_key: connectorData.apiKey,
      city: actionData.city,
    };

    const response = await fetch('http://127.0.0.1:8000/weather', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return `Location: ${data.location}. Temperature: ${data.temperature_c}°C, Condition: ${data.condition}`;
  }

  async function getJiraIssues(connectorData, actionData) {
    const payload = {
      base_url: connectorData.baseUrl,
      username: connectorData.username,
      api_key: connectorData.apiKey,
      jql_query: actionData.filter || '',
    };

    const response = await fetch('http://127.0.0.1:8000/jira', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.issues.join('\n');
  }

  async function sendSlackMessage(connectorData, actionData, message) {
    const payload = {
      api_key: connectorData.apiKey,
      channel: connectorData.channel || actionData.channel,
      message,
    };

    const response = await fetch('http://127.0.0.1:8000/slack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Slack API error: ${errorData.detail}`);
    }
    const data = await response.json();
    return data.detail;
  }

  // -------------------------------------------------------------------
  // executeNode: Executes a node based on its type.
  // -------------------------------------------------------------------
  const executeNode = useCallback(
    async (nodeId) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      if (node.type === 'Connector') {
        addOutputMessage(`Executing Connector node: ${node.data.connectorType}`);
      } else if (node.type === 'Action') {
        if (node.data.actionType === 'Get Weather') {
          const connectorEdge = edges.find(
            (edge) =>
              edge.target === nodeId &&
              nodes.find((n) => n.id === edge.source && n.type === 'Connector')
          );
          if (!connectorEdge) {
            addOutputMessage('Action node requires a connector connection.');
            return;
          }
          const connector = nodes.find((n) => n.id === connectorEdge.source);
          if (connector.data.connectorType !== 'Weather') {
            addOutputMessage('Connected connector is not of type Weather for Get Weather action.');
            return;
          }
          try {
            const weather = await getWeather(connector.data, node.data);
            addOutputMessage(`Weather: ${weather}`);
            setActionOutputs((prev) => ({ ...prev, [node.id]: weather }));
          } catch (error) {
            addOutputMessage(`Error getting weather: ${error.message}`);
          }
        } else if (node.data.actionType === 'Fetch Issues') {
          const connectorEdge = edges.find(
            (edge) =>
              edge.target === nodeId &&
              nodes.find((n) => n.id === edge.source && n.type === 'Connector')
          );
          if (!connectorEdge) {
            addOutputMessage('Action node requires a connector connection.');
            return;
          }
          const connector = nodes.find((n) => n.id === connectorEdge.source);
          if (connector.data.connectorType !== 'Jira') {
            addOutputMessage('Connected connector is not of type Jira for Fetch Issues action.');
            return;
          }
          try {
            const issues = await getJiraIssues(connector.data, node.data);
            addOutputMessage(`Jira Issues: ${issues}`);
            setActionOutputs((prev) => ({ ...prev, [node.id]: issues }));
          } catch (error) {
            addOutputMessage(`Error fetching Jira issues: ${error.message}`);
          }
        } else if (node.data.actionType === 'Send Message') {
          const connectorEdge = edges.find(
            (edge) =>
              edge.target === nodeId &&
              nodes.find((n) => n.id === edge.source && n.type === 'Connector')
          );
          if (!connectorEdge) {
            addOutputMessage('Action node requires a connector connection.');
            return;
          }
          const connector = nodes.find((n) => n.id === connectorEdge.source);
          if (connector.data.connectorType !== 'Slack') {
            addOutputMessage('Connected connector is not of type Slack for Send Message action.');
            return;
          }
          const incomingActionEdge = edges.find(
            (edge) =>
              edge.target === connector.id &&
              nodes.find((n) => n.id === edge.source && n.type === 'Action')
          );
          let messageToSend = 'This is a sample message generated by the flow execution.';
          if (incomingActionEdge) {
            const sourceActionNode = nodes.find((n) => n.id === incomingActionEdge.source);
            if (actionOutputs[sourceActionNode.id]) {
              messageToSend = actionOutputs[sourceActionNode.id];
            }
          }
          try {
            const slackResponse = await sendSlackMessage(connector.data, node.data, messageToSend);
            addOutputMessage(`Slack response: ${slackResponse}`);
          } catch (error) {
            addOutputMessage(`Error executing Send Message action: ${error.message}`);
          }
        } else {
          addOutputMessage(`Action ${node.data.actionType} is not supported.`);
        }
      }
    },
    [nodes, edges, actionOutputs]
  );

  // -------------------------------------------------------------------
  // runFlow: Execute nodes in topological order.
  // -------------------------------------------------------------------
  const runFlow = useCallback(
    async () => {
      const invalidActions = nodes.filter(
        (node) =>
          node.type === 'Action' &&
          node.data.actionType !== 'Get Weather' &&
          !isActionConnectedToConnector(node.id)
      );

      if (invalidActions.length > 0) {
        alert(
          `These actions need a connector connection:\n${invalidActions
            .map((a) => `- ${a.data.label}`)
            .join('\n')}`
        );
        return;
      }

      const order = getTopologicalOrder();
      for (const nodeId of order) {
        setExecutingNodeId(nodeId);
        await executeNode(nodeId);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setExecutingNodeId(null);
    },
    [getTopologicalOrder, executeNode, nodes, isActionConnectedToConnector]
  );

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
              nodeTypes={nodeTypes}
              style={{ width: '100%', height: '100%' }}
            >
              <MiniMap />
              <Controls />
              <Background variant="lines" gap={20} size={0.5} color="#ddd" />
            </ReactFlow>
          </ReactFlowProvider>
        </ExecutingNodeContext.Provider>
      </div>
      {/* Right sidebar: Pass the dynamically loaded lists to PropertiesPanel */}
      <div style={{ display: 'flex', flexDirection: 'column', width: '300px', borderLeft: '1px solid #ccc', overflow: 'auto' }}>
        <PropertiesPanel
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onRemoveNode={removeSelectedNode}
          onRemoveEdge={removeSelectedEdge}
          onPropertyChange={onPropertyChange}
          isActionConnectedToConnector={
            selectedNode && selectedNode.type === 'Action'
              ? isActionConnectedToConnector(selectedNode.id)
              : false
          }
          // Pass the connectors and functions lists so the panel can populate dropdowns dynamically
          connectorsList={connectorsList}
          functionsList={functionsList}
        />
        <OutputPanel messages={outputMessages} />
      </div>
    </div>
  );
};

export default FlowchartComponent;
