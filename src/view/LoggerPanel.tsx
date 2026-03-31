import { useState, useEffect, useCallback, useRef } from 'react'
import type { INetworkRequest, IConsoleLog } from '../shared/const'
import './loggerpanel-styles.css'
import { parseUrl, getRowClass, getStatusClass, getTimeClass, formatTime, formatSize, getConsolePrefix, formatTimestamp } from '@/utils/logger.util'

const NETWORK_FILTERS = ['all', 'xhr', 'fetch', 'js', 'css', 'img', 'doc'] as const
const CONSOLE_FILTERS = ['all', 'log', 'warn', 'error', 'info'] as const

type INetworkFilter = typeof NETWORK_FILTERS[number]
type IConsoleFilter = typeof CONSOLE_FILTERS[number]
type ITab = 'network' | 'console'

interface INetworkRequestWithExpanded extends INetworkRequest {
  _expanded?: boolean
}

function LoggerPanel() {
  const [networkRequests, setNetworkRequests] = useState<INetworkRequestWithExpanded[]>([])
  const [consoleLogs, setConsoleLogs] = useState<IConsoleLog[]>([])
  const [activeTab, setActiveTab] = useState<ITab>('console')
  const [isVisible, setIsVisible] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [textFilter, setTextFilter] = useState('')
  const [networkFilter, setNetworkFilter] = useState<INetworkFilter>('all')
  const [consoleFilter, setConsoleFilter] = useState<IConsoleFilter>('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const [preserveLog, setPreserveLog] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chrome.storage.local.get(['loggerEnabled', 'activeTab'], (result) => {
      if (result.loggerEnabled !== undefined) setIsVisible(result.loggerEnabled)
      if (result.activeTab) setActiveTab(result.activeTab)
    })
  }, [])

  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      if (event.data?.source !== 'chrome-logger-extension') return
      if (event.data.type === 'CONSOLE_LOG') {
        setConsoleLogs(prev => [...prev, {
          ...event.data.payload,
          timestamp: new Date(event.data.payload.timestamp)
        } as IConsoleLog])
      }
    }

    const handleChromeMessage = (message: { type: string; payload?: INetworkRequest; enabled?: boolean; tab?: ITab }) => {
      if (message.type === 'NETWORK_REQUEST' && message.payload) {
        setNetworkRequests(prev => [...prev, message.payload!])
      }
      if (message.type === 'TOGGLE_LOGGER') setIsVisible(message.enabled ?? true)
      if (message.type === 'SWITCH_TAB' && message.tab) setActiveTab(message.tab)
      if (message.type === 'CLEAR_LOGS') {
        if (!preserveLog) {
          setNetworkRequests([])
          setConsoleLogs([])
        }
      }
    }

    window.addEventListener('message', handleWindowMessage)
    chrome.runtime.onMessage.addListener(handleChromeMessage)
    return () => {
      window.removeEventListener('message', handleWindowMessage)
      chrome.runtime.onMessage.removeListener(handleChromeMessage)
    }
  }, [preserveLog])


  useEffect(() => {
    if (autoScroll && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }, [consoleLogs, networkRequests, autoScroll])

  const clearLogs = useCallback(() => {
    setNetworkRequests([])
    setConsoleLogs([])
  }, [])

  const toggleExpand = useCallback((id: string) => {
    setNetworkRequests(prev => prev.map(req =>
      req.id === id ? { ...req, _expanded: !req._expanded } : req
    ))
  }, [])

  const handleToggle = useCallback(() => {
    setCollapsed(prev => !prev)
  }, [])

  const filteredNetworkRequests = networkRequests.filter(req => {
    if (networkFilter !== 'all' && req.type !== networkFilter) return false
    if (textFilter && !req.url.toLowerCase().includes(textFilter.toLowerCase())) return false
    return true
  })

  const filteredConsoleLogs = consoleLogs.filter(log => {
    if (consoleFilter !== 'all' && log.type !== consoleFilter) return false
    if (textFilter && !log.message.toLowerCase().includes(textFilter.toLowerCase())) return false
    return true
  })

  const errorCount = consoleLogs.filter(l => l.type === 'error').length
  const warnCount = consoleLogs.filter(l => l.type === 'warn').length
  const failedRequests = networkRequests.filter(r => r.status && r.status >= 400).length

  
  

  

  

  if (!isVisible) return null

  return (
    <>
 
      <button
        className={`lp-side-toggle ${collapsed ? 'panel-closed' : ''}`}
        onClick={handleToggle}
        title={collapsed ? 'Open logger' : 'Close logger'}
      >
        {collapsed ? '\u25C2' : '\u25B8'}
      </button>

   
      <div className={`lp ${collapsed ? 'collapsed' : ''}`}>


        <div className="lp-toolbar">
          <span className="lp-toolbar-title">Chrome Logger</span>
          <button
            className={`lp-toolbar-btn ${autoScroll ? 'active' : ''}`}
            onClick={() => setAutoScroll(!autoScroll)}
            title="Auto-scroll to bottom"
          >
            ↓ auto scroll
          </button>
    
          <div className="lp-toolbar-sep" />
          <button
            className="lp-toolbar-btn"
            onClick={() => clearLogs()}
          >
            x clear 
          </button>
        </div>

 
        <div className="lp-tabs">
          <button
            className={`lp-tab ${activeTab === 'console' ? 'active' : ''}`}
            onClick={() => setActiveTab('console')}
          >
            Console
            <span className={`lp-badge ${errorCount > 0 ? 'has-errors' : ''}`}>
              {consoleLogs.length}
            </span>
          </button>
          <button
            className={`lp-tab ${activeTab === 'network' ? 'active' : ''}`}
            onClick={() => setActiveTab('network')}
          >
            Network
            <span className={`lp-badge ${failedRequests > 0 ? 'has-errors' : ''}`}>
              {networkRequests.length}
            </span>
          </button>
        </div>


        <div className="lp-filters">
          <span className="lp-search-icon">/</span>
          <input
            type="text"
            className="lp-filter-input"
            placeholder={activeTab === 'network' ? 'Filter by URL...' : 'Filter messages...'}
            value={textFilter}
            onChange={(e) => setTextFilter(e.target.value)}
          />
          <div className="lp-filter-sep" />
          <div className="lp-filter-pills">
            {(activeTab === 'network' ? NETWORK_FILTERS : CONSOLE_FILTERS).map(filter => (
              <button
                key={filter}
                className={`lp-pill ${
                  (activeTab === 'network' ? networkFilter : consoleFilter) === filter ? 'active' : ''
                }`}
                onClick={() => {
                  if (activeTab === 'network') setNetworkFilter(filter as INetworkFilter)
                  else setConsoleFilter(filter as IConsoleFilter)
                }}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="lp-content" ref={contentRef}>
          {activeTab === 'network' ? (
            <>
              <div className="lp-net-header">
                <span>Status</span>
                <span>Method</span>
                <span>Name</span>
                <span>Type</span>
                <span>Time</span>
                <span>Size</span>
              </div>
              {filteredNetworkRequests.length === 0 ? (
                <div className="lp-empty">
                  <div className="lp-empty-icon">&mdash;</div>
                  <div className="lp-empty-text">No network activity</div>
                </div>
              ) : (
                filteredNetworkRequests.map(req => {
                  const { host, path } = parseUrl(req.url)
                  return (
                    <div key={req.id}>
                      <div
                        className={`lp-net-row ${getRowClass(req)}`}
                        onClick={() => toggleExpand(req.id)}
                        title={req.url}
                      >
                        <span className={`lp-status ${getStatusClass(req.status)}`}>
                          {req.status || '\u00B7\u00B7\u00B7'}
                        </span>
                        <span className={`lp-method lp-m-${req.method.toLowerCase()}`}>
                          {req.method}
                        </span>
                        <span className="lp-url">
                          <span className="lp-url-host">{host}</span>
                          <span className="lp-url-path">{path}</span>
                        </span>
                        <span className="lp-cell-right">{req.type}</span>
                        <span className={`lp-cell-right ${getTimeClass(req.time)}`}>
                          {formatTime(req.time)}
                        </span>
                        <span className="lp-cell-right">
                          {formatSize((req as any).size)}
                        </span>
                      </div>
                      {req._expanded && (
                        <div className="lp-net-detail">
                          <div className="lp-detail-section">
                            <div className="lp-detail-label">Request URL</div>
                            <div className="lp-detail-url">{req.url}</div>
                          </div>
                          <div className="lp-detail-section">
                            <div className="lp-detail-label">General</div>
                            <div className="lp-detail-kv">
                              <span className="lp-detail-key">method</span>
                              <span className="lp-detail-val">{req.method}</span>
                              <span className="lp-detail-key">status</span>
                              <span className="lp-detail-val">{req.status || 'pending'}</span>
                              <span className="lp-detail-key">type</span>
                              <span className="lp-detail-val">{req.type}</span>
                              <span className="lp-detail-key">time</span>
                              <span className="lp-detail-val">{formatTime(req.time)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </>
          ) : (
            <>
              {filteredConsoleLogs.length === 0 ? (
                <div className="lp-empty">
                  <div className="lp-empty-icon">&gt;_</div>
                  <div className="lp-empty-text">Waiting for console output</div>
                </div>
              ) : (
                filteredConsoleLogs.map((log, idx) => (
                  <div
                    key={log.id}
                    className={`lp-con-row lp-con-${log.type}`}
                  >
                    <div className="lp-con-gutter">{idx + 1}</div>
                    <div className={`lp-con-level lp-lvl-${log.type}`} />
                    <span className={`lp-con-msg lp-con-msg-${log.type}`}>
                      <span className="lp-con-prefix">
                        {getConsolePrefix(log.type)}
                      </span>
                      {log.message}
                    </span>
                    <span className="lp-con-ts">{formatTimestamp(log.timestamp)}</span>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        <div className="lp-statusbar">
          {errorCount > 0 && (
            <div className="lp-stat">
              <div className="lp-stat-dot red" />
              {errorCount} error{errorCount !== 1 ? 's' : ''}
            </div>
          )}
          {warnCount > 0 && (
            <div className="lp-stat">
              <div className="lp-stat-dot yellow" />
              {warnCount} warn{warnCount !== 1 ? 's' : ''}
            </div>
          )}
          {failedRequests > 0 && (
            <div className="lp-stat">
              <div className="lp-stat-dot red" />
              {failedRequests} failed
            </div>
          )}
          <div className="lp-stat" style={{ marginLeft: 'auto' }}>
            <div className="lp-stat-dot green" />
            {networkRequests.length} req
          </div>
          <div className="lp-stat">
            <div className="lp-stat-dot blue" />
            {consoleLogs.length} log{consoleLogs.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </>
  )
}

export default LoggerPanel