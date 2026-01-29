import React from 'react'
import ReactDOM from 'react-dom/client'
import LoggerPanel from '../view/LoggerPanel'
import './styles.css'

console.log('Content script loaded!')

const script = document.createElement('script')
script.src = chrome.runtime.getURL('content/inject.js')
script.onload = () => console.log('inject.js script tag loaded!')
script.onerror = (e) => console.error('Failed to load inject.js:', e)

;(document.head || document.documentElement).appendChild(script)

if (!document.getElementById('chrome-logger-root')) {

// In content/index.ts - update the styles

const styleSheet = document.createElement('style')
styleSheet.id = 'chrome-logger-styles'
styleSheet.textContent = `
  #chrome-logger-root {
    position: fixed !important;
    top: 0 !important;
    right: 0 !important;
    height: 100vh !important;
    z-index: 2147483647 !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    line-height: 1.4;
    pointer-events: none;
    overflow: visible !important;
  }
  
  #chrome-logger-root * {
    box-sizing: border-box;
  }
  
  #chrome-logger-root ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  #chrome-logger-root ::-webkit-scrollbar-track {
    background: #1e1e1e;
  }
  
  #chrome-logger-root ::-webkit-scrollbar-thumb {
    background: #4a4a4a;
    border-radius: 3px;
  }
  
  .logger-panel {
    position: fixed;
    top: 0;
    right: 0;
    width: 400px;
    height: 100vh;
    background: #1e1e1e;
    border-left: 1px solid #3c3c3c;
    display: flex;
    flex-direction: column;
    color: #d4d4d4;
    transition: right 0.3s ease;
    pointer-events: auto;
  }
  
  .logger-panel.collapsed {
    right: -400px;
  }
  
  .logger-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #2d2d2d;
    border-bottom: 1px solid #3c3c3c;
  }
  
  .logger-header h1 {
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    margin: 0;
  }
  
  .header-controls {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  
  .btn {
    padding: 4px 8px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
    background: #4a4a4a;
    color: #fff;
    transition: background 0.2s;
  }
  
  .btn:hover {
    background: #5a5a5a;
  }
  
  .btn-toggle {
    position: fixed;
    top: 50%;
    right: 400px;
    transform: translateY(-50%);
    width: 32px;
    height: 64px;
    background: #2d2d2d;
    border: 1px solid #3c3c3c;
    border-right: none;
    border-radius: 4px 0 0 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #d4d4d4;
    font-size: 16px;
    pointer-events: auto;
    transition: right 0.3s ease;
  }
  
  .logger-panel.collapsed .btn-toggle {
    right: 0;
  }
  
  .btn-toggle:hover {
    background: #3c3c3c;
  }
  
  .tabs {
    display: flex;
    background: #252526;
    border-bottom: 1px solid #3c3c3c;
  }
  
  .tab {
    padding: 8px 16px;
    background: none;
    border: none;
    color: #969696;
    cursor: pointer;
    font-size: 12px;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }
  
  .tab:hover {
    color: #d4d4d4;
  }
  
  .tab.active {
    color: #fff;
    border-bottom-color: #BB633C;
  }
  
  .badge {
    background: #4a4a4a;
    padding: 1px 6px;
    border-radius: 10px;
    font-size: 10px;
    margin-left: 4px;
  }
  
  .filters {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    background: #252526;
    border-bottom: 1px solid #3c3c3c;
    flex-wrap: wrap;
  }
  
  .filter-input {
    padding: 4px 8px;
    background: #3c3c3c;
    border: 1px solid #4a4a4a;
    border-radius: 4px;
    color: #d4d4d4;
    font-size: 11px;
    flex: 1;
    min-width: 100px;
  }
  
  .filter-input:focus {
    outline: none;
    border-color: #BB633C;
  }
  
  .filter-buttons {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  
  .filter-btn {
    padding: 2px 6px;
    background: none;
    border: 1px solid #4a4a4a;
    border-radius: 3px;
    color: #969696;
    cursor: pointer;
    font-size: 10px;
    transition: all 0.2s;
  }
  
  .filter-btn:hover {
    border-color: #666;
    color: #d4d4d4;
  }
  
  .filter-btn.active {
    background: #BB633C;
    border-color: #BB633C;
    color: #fff;
  }
  
  .content {
    flex: 1;
    overflow: auto;
  }
  
  .request-list {
    width: 100%;
  }
  
  .request-item {
    display: grid;
    grid-template-columns: 50px 50px 1fr 50px 60px;
    gap: 8px;
    padding: 6px 8px;
    border-bottom: 1px solid #2d2d2d;
    cursor: pointer;
    align-items: center;
    font-size: 11px;
  }
  
  .request-item:hover {
    background: #2a2d2e;
  }
  
  .status {
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: 500;
    text-align: center;
  }
  
  .status-success { background: #2e4a2e; color: #6ccf6c; }
  .status-redirect { background: #4a4a2e; color: #cfcf6c; }
  .status-error { background: #4a2e2e; color: #cf6c6c; }
  .status-pending { background: #3c3c3c; color: #969696; }
  
  .method { font-weight: 600; font-size: 10px; }
  .method-get { color: #6ccf6c; }
  .method-post { color: #cfcf6c; }
  .method-put { color: #6cc0cf; }
  .method-delete { color: #cf6c6c; }
  .method-patch { color: #cf9f6c; }
  
  .url {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #d4d4d4;
  }
  
  .type {
    color: #969696;
    font-size: 10px;
  }
  
  .time {
    color: #969696;
    text-align: right;
    font-size: 10px;
  }
  
  .console-item {
    display: flex;
    align-items: flex-start;
    padding: 4px 8px;
    border-bottom: 1px solid #2d2d2d;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 11px;
  }
  
  .console-item:hover {
    background: #2a2d2e;
  }
  
  .console-icon {
    width: 16px;
    margin-right: 8px;
    flex-shrink: 0;
  }
  
  .console-log .console-icon { color: #d4d4d4; }
  .console-warn { background: rgba(255, 193, 7, 0.1); }
  .console-warn .console-icon { color: #ffc107; }
  .console-error { background: rgba(244, 67, 54, 0.1); }
  .console-error .console-icon { color: #f44336; }
  .console-info .console-icon { color: #2196f3; }
  
  .console-message {
    flex: 1;
    word-break: break-word;
    white-space: pre-wrap;
  }
  
  .console-time {
    color: #666;
    margin-left: 8px;
    flex-shrink: 0;
    font-size: 10px;
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: #666;
  }
`
document.head.appendChild(styleSheet)

  const container = document.createElement('div')
  container.id = 'chrome-logger-root'
  document.body.appendChild(container)

  const root = ReactDOM.createRoot(container)
  root.render(
    React.createElement(
      React.StrictMode,
      null,
      React.createElement(LoggerPanel, null)
    )
  )
}