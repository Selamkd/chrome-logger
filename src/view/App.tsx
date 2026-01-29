import React, { useState, useEffect } from "react";

export function App(): React.ReactElement {
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'network' | 'console'>('network');


  useEffect(() => {
    chrome.storage.local.get(['loggerEnabled', 'activeTab'], (result) => {
      if (result.loggerEnabled !== undefined) {
        setIsEnabled(result.loggerEnabled);
      }
      if (result.activeTab) {
        setActiveTab(result.activeTab);
      }
    });
  }, []);

  async function toggleLogger(): Promise<void> {
    const newState = !isEnabled;
    setIsEnabled(newState);
   
    chrome.storage.local.set({ loggerEnabled: newState });
 
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { 
          type: 'TOGGLE_LOGGER', 
          enabled: newState 
        });
      }
    } catch (error) {
      console.error('Failed to toggle logger:', error);
    }
  }

  async function switchTab(tab: 'network' | 'console'): Promise<void> {
    setActiveTab(tab);
    chrome.storage.local.set({ activeTab: tab });
    
    try {
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (currentTab.id) {
        chrome.tabs.sendMessage(currentTab.id, { 
          type: 'SWITCH_TAB', 
          tab 
        });
      }
    } catch (error) {
      console.error('Failed to switch tab:', error);
    }
  }

  async function clearLogs(): Promise<void> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'CLEAR_LOGS' });
      }
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }

  return (
    <div className="popup-container">
      <div className="popup-header">
        <h1>Chrome Logger</h1>
        <div className="toggle-container">
          <button 
            className={`toggle-btn ${isEnabled ? 'active' : ''}`}
            onClick={toggleLogger}
          >
            {isEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className="popup-tabs">
        <button 
          className={`popup-tab ${activeTab === 'network' ? 'active' : ''}`}
          onClick={() => switchTab('network')}
        >
          Network
        </button>
        <button 
          className={`popup-tab ${activeTab === 'console' ? 'active' : ''}`}
          onClick={() => switchTab('console')}
        >
          Console
        </button>
      </div>

      <div className="popup-actions">
        <button className="action-btn" onClick={clearLogs}>
          Clear Logs
        </button>
      </div>

      <div className="popup-footer">
        <p>Toggle sidebar visibility or switch tabs</p>
      </div>
    </div>
  );
}