import React, { useState, useEffect } from "react";

const PropertiesPanel = ({
  selectedNode,
  selectedEdge,
  onRemoveNode,
  onRemoveEdge,
  onPropertyChange,
  isActionConnectedToConnector,
}) => {
  const [selectedConnector, setSelectedConnector] = useState("");
  const [connectors, setConnectors] = useState([]);
  const [apiFunctions, setApiFunctions] = useState([]); // State for storing API functions
  const [jiraDetails, setJiraDetails] = useState({
    username: "",
    apiKey: "",
    baseUrl: "",
  });
  const [slackDetails, setSlackDetails] = useState({
    channel: "",
    apiKey: "",
  });
  const [isJiraDetailsEdited, setIsJiraDetailsEdited] = useState(false);
  const [isSlackDetailsEdited, setIsSlackDetailsEdited] = useState(false);

  // Fetch connectors and API functions based on the selected connector
  useEffect(() => {
    fetch("http://127.0.0.1:5000/getconnectors")
      .then((response) => response.json())
      .then((data) => {
        if (data.connectors) {
          setConnectors(data.connectors);
          // Ensure "Select" is the default option
          setSelectedConnector("");
        }
      })
      .catch((error) => console.error("Error fetching connectors:", error));
  }, []);

  useEffect(() => {
    if (selectedConnector) {
      // Fetch the API functions when a connector is selected
      fetch(`http://127.0.0.1:5000/getapifunctionsbyconnector/${selectedConnector}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.api_functions) {
            setApiFunctions(data.api_functions); // Set the fetched API functions
          }
        })
        .catch((error) => console.error("Error fetching API functions:", error));
    }
  }, [selectedConnector]); // Run this effect whenever selectedConnector changes

  const handleDropdownChange = (key, value) => {
    if (key === "connectorType") {
      setSelectedConnector(value);
      // Reset fields if "Select" is chosen
      if (value === "") {
        setJiraDetails({ username: "", apiKey: "", baseUrl: "" });
        setSlackDetails({ channel: "", apiKey: "" });
        setIsJiraDetailsEdited(false);
        setIsSlackDetailsEdited(false);
      } else if (value === "Jira") {
        setSlackDetails({ channel: "", apiKey: "" });
        setIsSlackDetailsEdited(false);
      } else if (value === "Slack") {
        setJiraDetails({ username: "", apiKey: "", baseUrl: "" });
        setIsJiraDetailsEdited(false);
      }
    }
    onPropertyChange(key, value);
  };

  const handleJiraDetailChange = (e) => {
    const { name, value } = e.target;
    setJiraDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
    setIsJiraDetailsEdited(true);
  };

  const handleSlackDetailChange = (e) => {
    const { name, value } = e.target;
    setSlackDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
    setIsSlackDetailsEdited(true);
  };

  const handleDoneClick = () => {
    // Store details in state and reset edited flags
    console.log("Jira details saved:", jiraDetails);
    console.log("Slack details saved:", slackDetails);
    setIsJiraDetailsEdited(false);
    setIsSlackDetailsEdited(false);
  };

  const actionOptions = {
    Jira: ["Create Issue", "Update Issue"],
    Slack: ["Send Message", "Post Notification"],
  };

  const filteredActionOptions = selectedConnector
    ? apiFunctions.map((apiFunction) => apiFunction.function_name) // Use API function names for the dropdown
    : [];

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

          {/* Custom Dropdown for Connector Node */}
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
                  <option key={connector.id} value={connector.id}>
                    {connector.name}
                  </option>
                ))}
              </select>
              {/* Custom Fields for Jira (appears only when "Jira" is selected) */}
              {selectedConnector === "Jira" && (
                <div style={{ marginTop: "20px" }}>
                  <label>Username:</label>
                  <input
                    type="text"
                    name="username"
                    value={jiraDetails.username}
                    onChange={handleJiraDetailChange}
                    placeholder="Enter Jira username"
                  />
                  <br />
                  <label>API Key:</label>
                  <input
                    type="password"
                    name="apiKey"
                    value={jiraDetails.apiKey}
                    onChange={handleJiraDetailChange}
                    placeholder="Enter Jira API key"
                  />
                  <br />
                  <label>Base URL:</label>
                  <input
                    type="text"
                    name="baseUrl"
                    value={jiraDetails.baseUrl}
                    onChange={handleJiraDetailChange}
                    placeholder="Enter Jira base URL"
                  />
                  <br />
                  <button
                    onClick={handleDoneClick}
                    disabled={
                      !jiraDetails.username ||
                      !jiraDetails.apiKey ||
                      !jiraDetails.baseUrl ||
                      !isJiraDetailsEdited
                    }
                    style={buttonStyle}
                  >
                    Done
                  </button>
                </div>
              )}

              {/* Custom Fields for Slack (appears only when "Slack" is selected) */}
              {selectedConnector === "Slack" && (
                <div style={{ marginTop: "20px" }}>
                  <label>Channel:</label>
                  <input
                    type="text"
                    name="channel"
                    value={slackDetails.channel}
                    onChange={handleSlackDetailChange}
                    placeholder="Enter Slack channel"
                  />
                  <br />
                  <label>API Key:</label>
                  <input
                    type="password"
                    name="apiKey"
                    value={slackDetails.apiKey}
                    onChange={handleSlackDetailChange}
                    placeholder="Enter Slack API key"
                  />
                  <br />
                  <button
                    onClick={handleDoneClick}
                    disabled={
                      !slackDetails.channel ||
                      !slackDetails.apiKey ||
                      !isSlackDetailsEdited
                    }
                    style={buttonStyle}
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Custom Dropdown for Action Node */}
          {selectedNode.type === "Action" && (
            <div>
              <label>Action Type:</label>
              <select
                value={selectedNode.data.actionType || ""}
                onChange={(e) =>
                  handleDropdownChange("actionType", e.target.value)
                }
                disabled={!isActionConnectedToConnector}
              >
                <option value="">Select</option>
                {filteredActionOptions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
              {!isActionConnectedToConnector && (
                <p style={{ color: "red" }}>
                  Please connect a Connector node to enable this option.
                </p>
              )}
            </div>
          )}

          <button onClick={onRemoveNode} style={buttonStyle}>
            Remove Node
          </button>
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
