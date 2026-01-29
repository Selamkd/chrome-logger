import { useState, useEffect, useCallback } from 'react'
import type { INetworkRequest, IConsoleLog } from '../shared/const'


const NETWORK_FILTERS = ['all', 'xhr', 'fetch', 'js', 'css', 'img', 'doc'] as const
const CONSOLE_FILTERS = ['all', 'log', 'warn', 'error', 'info'] as const

type INetworkFilter = typeof NETWORK_FILTERS[number]
type IConsoleFilter = typeof CONSOLE_FILTERS[number]
type ITab = 'network' | 'console'

function LoggerPanel() {

  const [networkRequests, setNetworkRequests] = useState<INetworkRequest[]>([])
  const [consoleLogs, setConsoleLogs] = useState<IConsoleLog[]>([])

  const [activeTab, setActiveTab] = useState<ITab>('network')
  const [collapsed, setCollapsed] = useState(false)
  const [textFilter, setTextFilter] = useState('')
  const [networkFilter, setNetworkFilter] = useState<INetworkFilter>('all')
  const [consoleFilter, setConsoleFilter] = useState<IConsoleFilter>('all')


useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    if (event.data?.source !== 'chrome-logger-extension') return
    
    const message = event.data
    if (message.type === 'NETWORK_REQUEST') {
      setNetworkRequests(prev => [...prev, message.payload as INetworkRequest])
    }
    if (message.type === 'CONSOLE_LOG') {
      setConsoleLogs(prev => [...prev, {
        ...message.payload,
        timestamp: new Date(message.payload.timestamp)
      } as IConsoleLog])
    }
  }

  window.addEventListener('message', handleMessage)
  return () => window.removeEventListener('message', handleMessage)
}, [])






  const clearLogs = useCallback(() => {
    setNetworkRequests([])
    setConsoleLogs([])
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

  
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

 
  const getStatusClass = (status: number | null): string => {
    if (!status) return 'status-pending'
    if (status >= 200 && status < 300) return 'status-success'
    if (status >= 300 && status < 400) return 'status-redirect'
    return 'status-error'
  }

 
  const getFileName = (url: string): string => {
    try {
      const urlObj = new URL(url)
      const path = urlObj.pathname
      return path.split('/').pop() || urlObj.hostname
    } catch {
      return url
    }
  }


  const getConsoleIcon = (type: IConsoleLog['type']): string => {
    switch (type) {
      case 'warn': return '⚠'
      case 'error': return '✕'
      case 'info': return 'ℹ'
      default: return '›'
    }
  }

  return (
    <div className={`logger-panel ${collapsed ? 'collapsed' : ''}`}>
 
      <button 
        className="btn-toggle"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Expand panel' : 'Collapse panel'}
      >
        {collapsed ? '◀' : '▶'}
      </button>

 
      <div className="logger-header">
        <h1>Chrome Logger</h1>
        <div className="header-controls">
          <button className="btn" onClick={clearLogs}>
            Clear
          </button>
        </div>
      </div>


      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'network' ? 'active' : ''}`}
          onClick={() => setActiveTab('network')}
        >
          Network
          <span className="badge">{networkRequests.length}</span>
        </button>
        <button 
          className={`tab ${activeTab === 'console' ? 'active' : ''}`}
          onClick={() => setActiveTab('console')}
        >
          Console
          <span className="badge">{consoleLogs.length}</span>
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          className="filter-input"
          placeholder="Filter..."
          value={textFilter}
          onChange={(e) => setTextFilter(e.target.value)}
        />
        
        {activeTab === 'network' ? (
          <div className="filter-buttons">
            {NETWORK_FILTERS.map(filter => (
              <button
                key={filter}
                className={`filter-btn ${networkFilter === filter ? 'active' : ''}`}
                onClick={() => setNetworkFilter(filter)}
              >
                {filter.toUpperCase()}
              </button>
            ))}
          </div>
        ) : (
          <div className="filter-buttons">
            {CONSOLE_FILTERS.map(filter => (
              <button
                key={filter}
                className={`filter-btn ${consoleFilter === filter ? 'active' : ''}`}
                onClick={() => setConsoleFilter(filter)}
              >
                {filter.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>


      <div className="content">
        {activeTab === 'network' ? (
          <div className="request-list">
            {filteredNetworkRequests.length === 0 ? (
              <div className="empty-state">
                <div>No network requests captured</div>
              </div>
            ) : (
              filteredNetworkRequests.map(req => (
                <div key={req.id} className="request-item">
                  <span className={`status ${getStatusClass(req.status)}`}>
                    {req.status || '...'}
                  </span>
                  <span className={`method method-${req.method.toLowerCase()}`}>
                    {req.method}
                  </span>
                  <span className="url" title={req.url}>
                    {getFileName(req.url)}
                  </span>
                  <span className="type">{req.type}</span>
                  <span className="time">{formatTime(req.time)}</span>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="console-list">
            {filteredConsoleLogs.length === 0 ? (
              <div className="empty-state">
                <div>No console messages captured</div>
              </div>
            ) : (
              filteredConsoleLogs.map(log => (
                <div key={log.id} className={`console-item console-${log.type}`}>
                  <span className="console-icon">{getConsoleIcon(log.type)}</span>
                  <span className="console-message">{log.message}</span>
                  <span className="console-time">{formatTimestamp(log.timestamp)}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default LoggerPanel