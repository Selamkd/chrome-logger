import { formatSize, formatTime, formatTimestamp, getConsolePrefix, getRowClass, getStatusClass, hasDetail, parseUrl } from '@/utils/logger.util'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { IEnhancedLog, INetExpanded, INode } from '../shared/const'
import './loggerpanel-styles.css'

const NETWORK_FILTERS = ['all', 'xhr', 'fetch', 'js', 'css', 'img', 'doc'] as const
const CONSOLE_FILTERS = ['all', 'log', 'warn', 'error', 'info'] as const

type INetworkFilter = typeof NETWORK_FILTERS[number]
type IConsoleFilter = typeof CONSOLE_FILTERS[number]
type ITab = 'network' | 'console'

function LoggerPanel() {
  const [requests, setRequests] = useState<INetExpanded[]>([])
  const [logs, setLogs] = useState<IEnhancedLog[]>([])
  const [tab, setTab] = useState<ITab>('console')
  const [visible, setVisible] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [filter, setFilter] = useState('')
  const [networkFilter, setNetworkFilter] = useState<INetworkFilter>('all')
  const [conFilter, setConFilter] = useState<IConsoleFilter>('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const [preserve, setPreserve] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chrome.storage.local.get(['loggerEnabled', 'activeTab'], (defaultSettings) => {
      if (defaultSettings.loggerEnabled !== undefined) setVisible(defaultSettings.loggerEnabled)
      if (defaultSettings.activeTab) setTab(defaultSettings.activeTab)
    })
  }, [])

  useEffect(() => {
    const onWindowLoad = (e: MessageEvent) => {
      if (e.data?.source !== 'chrome-logger-extension') return
      if (e.data.type === 'CONSOLE_LOG') {
        const p = e.data.payload
        setLogs(prev => [...prev, { ...p, timestamp: new Date(p.timestamp), _expanded: false }])
      }
    }
    const onChrome = (msg: any) => {
      if (msg.type === 'NETWORK_REQUEST' && msg.payload) setRequests(prev => [...prev, msg.payload])
      if (msg.type === 'TOGGLE_LOGGER') setVisible(msg.enabled ?? true)
      if (msg.type === 'SWITCH_TAB' && msg.tab) setTab(msg.tab)
      if (msg.type === 'CLEAR_LOGS' && !preserve) { setRequests([]); setLogs([]) }
    }
    window.addEventListener('message', onWindowLoad)
    chrome.runtime.onMessage.addListener(onChrome)
    return () => { window.removeEventListener('message', onWindowLoad); chrome.runtime.onMessage.removeListener(onChrome) }
  }, [preserve])




  const clear = useCallback(() => { setRequests([]); setLogs([]) }, [])

  const toggleRequestDetails = useCallback((id: string) => {
    setRequests(prev => prev.map(request => request.id === id ? { ...request, _expanded: !request._expanded } : request))
  }, [])

  const toggleLogDetails = useCallback((id: string) => {
    setLogs(prev => prev.map(log => log.id === id ? { ...log, _expanded: !log._expanded } : log))
  }, [])

  const filteredRequests = requests.filter(request => {
    if (networkFilter !== 'all' && request.type !== networkFilter) return false
    if (filter && !request.url.toLowerCase().includes(filter.toLowerCase())) return false
    return true
  })
  const filteredLogs = logs.filter(log => {
    if (conFilter !== 'all' && log.type !== conFilter) return false
    if (filter && !log.message.toLowerCase().includes(filter.toLowerCase())) return false
    return true
  })

  const errorLogsCount = logs.filter(l => l.type === 'error').length
  const warnLogsCount = logs.filter(l => l.type === 'warn').length
  const failedRequestsCount = requests.filter(r => r.status && r.status >= 400).length

 const itemIsExpanded = useMemo(() => {
  const items = [...filteredRequests, ...filteredLogs];

  return items.some((item) => item._expanded === true);
}, [filteredRequests, filteredLogs]);



  useEffect(() => {
    if (autoScroll && scrollRef.current && !itemIsExpanded) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [logs, requests, autoScroll])


  if (!visible) return null

  return (
    <>
      <button
        className={`lp-side-toggle ${collapsed ? 'panel-closed' : ''}`}
        onClick={() => setCollapsed(c => !c)}
        title={collapsed ? 'Open logger' : 'Close logger'}
      >
        {collapsed ? '\u25C2' : '\u25B8'}
      </button>

      <div className={`lp ${collapsed ? 'collapsed' : ''}`}>

        <div className="lp-toolbar">
          <span className="lp-toolbar-title">Logger</span>
          <button className={`lp-toolbar-btn ${autoScroll ? 'active' : ''}`} onClick={() => setAutoScroll(a => !a)} title="Auto-scroll">↓ scroll</button>
          <button className={`lp-toolbar-btn ${preserve ? 'active' : ''}`} onClick={() => setPreserve(p => !p)} title="Preserve log">preserve</button>
          <div className="lp-toolbar-sep" />
          <button className="lp-toolbar-btn" onClick={clear}>clear</button>
        </div>

        <div className="lp-tabs">
          <button className={`lp-tab ${tab === 'console' ? 'active' : ''}`} onClick={() => setTab('console')}>
            Console <span className={`lp-badge ${errorLogsCount > 0 ? 'has-errors' : ''}`}>{logs.length}</span>
          </button>
          <button className={`lp-tab ${tab === 'network' ? 'active' : ''}`} onClick={() => setTab('network')}>
            Network <span className={`lp-badge ${failedRequestsCount > 0 ? 'has-errors' : ''}`}>{requests.length}</span>
          </button>
        </div>


        <div className="lp-filters">
          <span className="lp-search-icon">/</span>
          <input
            className="lp-filter-input"
            placeholder={tab === 'network' ? 'Filter by URL...' : 'Filter messages...'}
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
          <div className="lp-filter-sep" />
          <div className="lp-filter-pills">
            {(tab === 'network' ? NETWORK_FILTERS : CONSOLE_FILTERS).map(f => (
              <button
                key={f}
                className={`lp-pill ${(tab === 'network' ? networkFilter : conFilter) === f ? 'active' : ''}`}
                onClick={() => tab === 'network' ? setNetworkFilter(f as INetworkFilter) : setConFilter(f as IConsoleFilter)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="lp-content" ref={scrollRef}>

   
          {tab === 'network' ? (
            <>
              <div className="lp-net-header">
                <span>Status</span><span>Method</span><span>Name</span><span>Type</span><span>Time</span><span>Size</span>
              </div>
              {filteredRequests.length === 0 ? (
                <div className="lp-empty"><div className="lp-empty-icon">&mdash;</div><div className="lp-empty-text">No network activity</div></div>
              ) : filteredRequests.map(req => {
                const { host, path } = parseUrl(req.url)
                return (
                  <div key={req.id}>
                    <div className={`lp-net-row ${getRowClass(req)}`} onClick={() => toggleRequestDetails(req.id)} title={req.url}>
                      <span className={`lp-status ${getStatusClass(req.status)}`}>{req.status || '\u00B7\u00B7\u00B7'}</span>
                      <span className={`lp-method lp-m-${req.method.toLowerCase()}`}>{req.method}</span>
                      <span className="lp-url"><span className="lp-url-host">{host}</span><span className="lp-url-path">{path}</span></span>
                      <span className="lp-cell-right">{req.type}</span>
                      <span className={`lp-cell-right ${formatTime(req.time)}`}>{formatTime(req.time)}</span>
                      <span className="lp-cell-right">{formatSize((req as any).size)}</span>
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
                            <span className="lp-detail-key">method</span><span className="lp-detail-val">{req.method}</span>
                            <span className="lp-detail-key">status</span><span className="lp-detail-val">{req.status ?? 'pending'} {(req as any).statusText || ''}</span>
                            <span className="lp-detail-key">type</span><span className="lp-detail-val">{req.type}</span>
                            <span className="lp-detail-key">time</span><span className="lp-detail-val">{formatTime(req.time)}</span>
                            {(req as any).size > 0 && <><span className="lp-detail-key">size</span><span className="lp-detail-val">{formatSize((req as any).size)}</span></>}
                          </div>
                        </div>
                        {(req as any).responseHeaders && Object.keys((req as any).responseHeaders).length > 0 && (
                          <div className="lp-detail-section">
                            <div className="lp-detail-label">Response headers</div>
                            <div className="lp-detail-kv">
                              {Object.entries((req as any).responseHeaders).map(([k, v]) => (
                                <span key={k}>
                                  <span className="lp-detail-key">{k}</span>
                                  <span className="lp-detail-val">{String(v)}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </>

          ) : (
        
            <>
              {filteredLogs.length === 0 ? (
                <div className="lp-empty"><div className="lp-empty-icon">&gt;_</div><div className="lp-empty-text">Waiting for console output</div></div>
              ) : filteredLogs.map((log, idx) => {
                const expandable = hasDetail(log)
                return (
                  <div key={log.id} className={`lp-con-entry lp-con-${log.type}`}>
                    <div
                      className={`lp-con-row ${expandable ? 'expandable' : ''}`}
                      onClick={expandable ? () => toggleLogDetails(log.id) : undefined}
                    >
                      <div className="lp-con-gutter">
                        {expandable
                          ? <span className={`lp-con-arrow ${log._expanded ? 'open' : ''}`}>&#x25B6;</span>
                          : idx + 1}
                      </div>
                      <div className={`lp-con-level lp-lvl-${log.type}`} />
                      <span className={`lp-con-msg lp-con-msg-${log.type}`}>
                        <span className="lp-con-prefix">{getConsolePrefix(log.type)}</span>
                        {log.message}
                      </span>
                      {log.caller && (
                        <span className="lp-con-source" title={`${log.caller.fileFull}:${log.caller.line}`}>
                          {log.caller.file}:{log.caller.line}
                        </span>
                      )}
                      <span className="lp-con-ts">{formatTimestamp(log.timestamp)}</span>
                    </div>

                    {log._expanded && (
                      <div className="lp-con-detail">
                        {log.caller && (
                          <div className="lp-con-detail-source">
                            <span className="lp-detail-key">source</span>
                            <span className="lp-con-source-full">
                              {log.caller.fn && <span className="lp-con-fn">{log.caller.fn} </span>}
                              {log.caller.fileFull}:{log.caller.line}:{log.caller.col}
                            </span>
                          </div>
                        )}
                        {log.args && log.args.length > 0 && (
                          <div className="lp-con-args">
                            {log.args.map((arg, i) => {
                           
                              if (arg.type === 'str' || arg.type === 'num' || arg.type === 'bool' || arg.type === 'null' || arg.type === 'undef') return null
                              return <ObjectNode key={i} node={arg} depth={0} />
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </div>

       
        <div className="lp-statusbar">
          {errorLogsCount > 0 && <div className="lp-stat"><div className="lp-stat-dot red" />{errorLogsCount} error{errorLogsCount !== 1 ? 's' : ''}</div>}
          {warnLogsCount > 0 && <div className="lp-stat"><div className="lp-stat-dot yellow" />{warnLogsCount} warn{warnLogsCount !== 1 ? 's' : ''}</div>}
          {failedRequestsCount > 0 && <div className="lp-stat"><div className="lp-stat-dot red" />{failedRequestsCount} failed</div>}
          <div className="lp-stat" style={{ marginLeft: 'auto' }}><div className="lp-stat-dot green" />{requests.length} req</div>
          <div className="lp-stat"><div className="lp-stat-dot blue" />{logs.length} log{logs.length !== 1 ? 's' : ''}</div>
        </div>
      </div>
    </>
  )
}

function ObjectNode({ node, depth = 0, label }: { node: INode; depth?: number; label?: string }) {
  const [open, setOpen] = useState(depth < 1)
  if (!node) return null

  const expandable =
    (node.type === 'obj' && node.objEntries && node.objEntries.length > 0) ||
    (node.type === 'arr' && node.children && node.children.length > 0) ||
    (node.type === 'err' && node.stack)

  const keyEl = label !== undefined ? (
    <span className="vn-key">{label}<span className="vn-sep">: </span></span>
  ) : null

  if (!expandable) {
    return (
      <div className="vn-leaf" style={{ paddingLeft: depth * 14 }}>
        {keyEl}
        <span className={`vn-val vn-${node.type}`}>{fmtVal(node)}</span>
      </div>
    )
  }

  return (
    <div className="vn-node">
      <div className="vn-row" style={{ paddingLeft: depth * 14 }} onClick={() => setOpen(!open)}>
        <span className={`vn-arrow ${open ? 'open' : ''}`}>&#x25B6;</span>
        {keyEl}
        <span className="vn-preview">{node.preview}</span>
      </div>
      {open && (
        <div className="vn-children">
          {node.type === 'err' && node.stack && (
            <div className="vn-stack" style={{ paddingLeft: (depth + 1) * 14 }}>
              {node.stack.split('\n').slice(1, 8).map((l, i) => (
                <div key={i} className="vn-stack-line">{l.trim()}</div>
              ))}
            </div>
          )}
          {node.objEntries&& node.objEntries.map((entry, i) => (
            <ObjectNode key={i} node={entry.v} depth={depth + 1} label={entry.k} />
          ))}
          {node.children && node.children.map((child, i) => (
            <ObjectNode key={i} node={child} depth={depth + 1} label={String(i)} />
          ))}
          {node.truncated && (
            <div className="vn-trunc" style={{ paddingLeft: (depth + 1) * 14 }}>…</div>
          )}
        </div>
      )}
    </div>
  )
}

function fmtVal(n: INode): string {
  if (n.type === 'str') return '"' + n.preview + '"'
  return n.preview
}


export default LoggerPanel