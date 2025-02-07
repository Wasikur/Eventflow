import React, { useState, useEffect } from "react";

const PropertiesPanel = ({
  selectedNode,
  selectedEdge,
  onRemoveNode,
  onRemoveEdge,
  onPropertyChange,
  isActionConnectedToConnector,
}) => {
  // Static connectors for selection
  const connectors = [
    { id: "weather", name: "Weather" },
    { id: "jira", name: "Jira" },
    { id: "slack", name: "Slack" },
  ];

  // Local state for Connector nodes.
  const [selectedConnector, setSelectedConnector] = useState("");
  const [weatherDetails, setWeatherDetails] = useState({ apiKey: "" });
  const [jiraDetails, setJiraDetails] = useState({
    baseUrl: "",
    username: "",
    apiKey: "",
  });
  const [slackDetails, setSlackDetails] = useState({ apiKey: "" });

  // For Action nodes, available actions depend on the connected connector.
  const actionOptions = {
    Weather: ["Get Weather"],
    Jira: ["Fetch Issues"],
    Slack: ["Send Message"],
  };

  // Update local state when a new node is selected.
  useEffect(() => {
    if (selectedNode && selectedNode.type === "Connector") {
      // Load existing values from node data or default to empty values.
      setSelectedConnector(selectedNode.data.connectorType || "");
      setWeatherDetails({ apiKey: selectedNode.data.apiKey || "" });
      setJiraDetails({
        baseUrl: selectedNode.data.baseUrl || "",
        username: selectedNode.data.username || "",
        apiKey: selectedNode.data.apiKey || "",
      });
      setSlackDetails({ apiKey: selectedNode.data.apiKey || "" });
    }
  }, [selectedNode]);

  // For action nodes, determine available actions based on the connected connector.
  let availableActions = [];
  if (selectedNode && selectedNode.type === "Action") {
    if (selectedNode.data.connectorType) {
      availableActions = actionOptions[selectedNode.data.connectorType] || [];
    }
  }

  // Called when a property is changed; passes the value up to update the node’s data.
  const handleDropdownChange = (key, value) => {
    if (key === "connectorType") {
      setSelectedConnector(value);
    }
    onPropertyChange(key, value);
  };

  const handleWeatherDetailChange = (e) => {
    const { name, value } = e.target;
    setWeatherDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleJiraDetailChange = (e) => {
    const { name, value } = e.target;
    setJiraDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSlackDetailChange = (e) => {
    const { name, value } = e.target;
    setSlackDetails((prev) => ({ ...prev, [name]: value }));
  };

  // For action nodes, update the node’s data directly.
  const handleActionChange = (key, value) => {
    onPropertyChange(key, value);
  };

  // When Done is clicked on a Connector node, push up the entered fields into the node's data.
  const handleDoneClick = () => {
    if (selectedNode && selectedNode.type === "Connector") {
      onPropertyChange("connectorType", selectedConnector);
      if (selectedConnector === "Weather") {
        onPropertyChange("apiKey", weatherDetails.apiKey);
      } else if (selectedConnector === "Jira") {
        onPropertyChange("baseUrl", jiraDetails.baseUrl);
        onPropertyChange("username", jiraDetails.username);
        onPropertyChange("apiKey", jiraDetails.apiKey);
      } else if (selectedConnector === "Slack") {
        onPropertyChange("apiKey", slackDetails.apiKey);
      }
      console.log("Connector details saved for node", selectedNode.id, {
        connectorType: selectedConnector,
        weatherDetails,
        jiraDetails,
        slackDetails,
      });
    }
  };

  return (
    <div
      style={{
        width: "300px",
        padding: "20px",
        borderLeft: "1px solid #ccc",
        overflow: "auto",
      }}
    >
      {selectedNode ? (
        <div>
          <h3>Node Properties</h3>
          <p>
            <strong>ID:</strong> {selectedNode.id}
          </p>
          <p>
            <strong>Component:</strong> {selectedNode.data.label}
          </p>

          {/* --- For Connector Nodes --- */}
          {selectedNode.type === "Connector" && (
            <div>
              <label>Connector Type:</label>
              <select
                value={selectedConnector}
                onChange={(e) =>
                  handleDropdownChange("connectorType", e.target.value)
                }
              >
                <option value="">Select</option>
                {connectors.map((connector) => (
                  <option key={connector.id} value={connector.name}>
                    {connector.name}
                  </option>
                ))}
              </select>

              {selectedConnector === "Weather" && (
                <div style={{ marginTop: "20px" }}>
                  <label>API Key:</label>
                  <input
                    type="text"
                    name="apiKey"
                    value={weatherDetails.apiKey}
                    onChange={handleWeatherDetailChange}
                    placeholder="Enter Weather API Key"
                  />
                </div>
              )}

              {selectedConnector === "Jira" && (
                <div style={{ marginTop: "20px" }}>
                  <label>Base URL:</label>
                  <input
                    type="text"
                    name="baseUrl"
                    value={jiraDetails.baseUrl}
                    onChange={handleJiraDetailChange}
                    placeholder="Enter Jira Base URL"
                  />
                  <br />
                  <label>Username:</label>
                  <input
                    type="text"
                    name="username"
                    value={jiraDetails.username}
                    onChange={handleJiraDetailChange}
                    placeholder="Enter Jira Username"
                  />
                  <br />
                  <label>API Key:</label>
                  <input
                    type="text"
                    name="apiKey"
                    value={jiraDetails.apiKey}
                    onChange={handleJiraDetailChange}
                    placeholder="Enter Jira API Key"
                  />
                </div>
              )}

              {selectedConnector === "Slack" && (
                <div style={{ marginTop: "20px" }}>
                  <label>API Key:</label>
                  <input
                    type="text"
                    name="apiKey"
                    value={slackDetails.apiKey}
                    onChange={handleSlackDetailChange}
                    placeholder="Enter Slack API Key"
                  />
                </div>
              )}
              
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button onClick={handleDoneClick} style={buttonStyle}>
                  Done
                </button>
                <button onClick={onRemoveNode} style={buttonStyle}>
                  Remove Node
                </button>
              </div>

            </div>
          )}

          {/* --- For Action Nodes --- */}
          {selectedNode.type === "Action" && (
            <div>
              <label>Action Type:</label>
              <select
                value={selectedNode.data.actionType || ""}
                onChange={(e) =>
                  handleActionChange("actionType", e.target.value)
                }
                disabled={
                  !isActionConnectedToConnector ||
                  !selectedNode.data.connectorType
                }
              >
                <option value="">Select</option>
                {availableActions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>

              {/* If the action is Get Weather, ask for a City */}
              {selectedNode.data.actionType === "Get Weather" && (
                <div style={{ marginTop: "20px" }}>
                  <label>City:</label>
                  <input
                    type="text"
                    name="city"
                    value={selectedNode.data.city || ""}
                    onChange={(e) =>
                      handleActionChange("city", e.target.value)
                    }
                    placeholder="Enter City"
                  />
                </div>
              )}

              {/* If the action is Send Message, ask for a Channel name */}
              {selectedNode.data.actionType === "Send Message" && (
                <div style={{ marginTop: "20px" }}>
                  <label>Channel:</label>
                  <input
                    type="text"
                    name="channel"
                    value={selectedNode.data.channel || ""}
                    onChange={(e) =>
                      handleActionChange("channel", e.target.value)
                    }
                    placeholder="Enter Channel Name"
                  />
                </div>
              )}

              {(!isActionConnectedToConnector || !selectedNode.data.connectorType) && (
                <p style={{ color: "red" }}>
                  Please connect a Connector node to enable this option.
                </p>
              )}

              <button onClick={onRemoveNode} style={buttonStyle}>
                Remove Node
              </button>
            </div>
          )}
        </div>
      ) : selectedEdge ? (
        <div>
          <h3>Edge Properties</h3>
          <p>
            <strong>ID:</strong> {selectedEdge.id}
          </p>
          <p>
            <strong>Source:</strong> {selectedEdge.source}
          </p>
          <p>
            <strong>Target:</strong> {selectedEdge.target}
          </p>
          <button onClick={onRemoveEdge} style={buttonStyle}>
            Remove Edge
          </button>
        </div>
      ) : (
        <p>Select a node or edge to see its properties</p>
      )}
    </div>
  );
};

const buttonStyle = {
  marginTop: "10px",
  padding: "10px 15px",
  backgroundColor: "#FF0000",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

export default PropertiesPanel;
