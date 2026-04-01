import { formatSize, formatTime, formatTimestamp, getConsolePrefix, getRowClass, getStatusClass, hasDetail, parseUrl } from '@/utils/logger.util'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { IEnhancedLog, INavigationEvent, INetExpanded, INode } from '../shared/const'
import './styles.css'

const NETWORK_FILTERS = ['all', 'xhr', 'fetch', 'js', 'css', 'img', 'doc'] as const
const CONSOLE_FILTERS = ['all', 'log', 'warn', 'error', 'info'] as const

type INetworkFilter = typeof NETWORK_FILTERS[number]
type IConsoleFilter = typeof CONSOLE_FILTERS[number]
type ITab = 'network' | 'console' | 'nav'

function LoggerPanel() {
  const [requests, setRequests] = useState<INetExpanded[]>([])
  const [logs, setLogs] = useState<IEnhancedLog[]>([])
  const [tab, setTab] = useState<ITab>('console')
  const [visible, setVisible] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [filter, setFilter] = useState('')
  const [networkFilter, setNetworkFilter] = useState<INetworkFilter>('all')
  const [conFilter, setConFilter] = useState<IConsoleFilter>('all')
  const [navigationEvent, setNavigation] = useState<INavigationEvent[]>([]);
  const [autoScroll, setAutoScroll] = useState(true)

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
      if (msg.type === 'NAVIGATION' && msg.payload) setNavigation(msg.payload)
      if (msg.type === 'CLEAR_LOGS' ) { setRequests([]); setLogs([]); setNavigation([]) }
    }
    window.addEventListener('message', onWindowLoad)
    chrome.runtime.onMessage.addListener(onChrome)
    return () => { window.removeEventListener('message', onWindowLoad); chrome.runtime.onMessage.removeListener(onChrome) }
  }, [])

  const clear = useCallback(() => { setRequests([]); setLogs([]) }, [])

  const toggleRequestDetails = useCallback((id: string) => {
    setRequests(prev => prev.map(request => request.id === id ? { ...request, _expanded: !request._expanded } : request))
  }, [])

  const toggleLogDetails = useCallback((id: string) => {
    setLogs(prev => prev.map(log => log.id === id ? { ...log, _expanded: !log._expanded } : log))
  }, [])

  const toggleNavExpanded = (id: string) => {
    setNavigation((prev) =>
      prev.map((navigate) =>
        navigate.id === id ? { ...navigate, _expanded: !navigate._expanded } : navigate
      )
    )
  }

  function addNavigation(event: INavigationEvent) {
    setNavigation(prev => [event, ...prev]);
  }

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
        className={`fixed top-1/2 w-6 h-14 bg-od-bg-darker border border-od-border-subtle rounded-l-[5px] cursor-pointer flex items-center justify-center text-od-text-dim font-mono text-[10px] select-none transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:text-od-accent-bright hover:bg-od-bg-hover ${
          collapsed ? 'right-0 border-r-od-border-subtle' : ''
        } -translate-y-1/2`}
        style={{ 
          zIndex: 2147483647,
          right: collapsed ? '0' : '420px',
          borderRightColor: collapsed ? '#3b3936' : '#232220'
        }}
        onClick={() => setCollapsed(c => !c)}
        title={collapsed ? 'Open logger' : 'Close logger'}
      >
        {collapsed ? '\u25C2' : '\u25B8'}
      </button>

      <div 
        className={`font-mono text-[11.5px] max-w-[420px] leading-[1.55] bg-od-bg text-od-text flex flex-col h-screen fixed top-0 right-0 overflow-hidden border-l border-od-border pointer-events-auto transition-transform duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
          collapsed ? 'translate-x-full' : 'translate-x-0'
        }`}
        style={{ 
          width: '420px',
          zIndex: 2147483646
        }}
      >


        <div className="flex items-center px-3.5 h-[38px] bg-od-bg-darker border-b border-od-border flex-shrink-0 gap-1.5">
          <span className="text-[11px] font-semibold text-od-text-dim tracking-wider mr-auto select-none">Logger</span>
          <button 
            className={`bg-transparent border-none text-od-text-dim px-2 py-0.5 cursor-pointer font-mono text-[10px] font-medium rounded-od transition-all duration-od flex items-center gap-1 whitespace-nowrap pointer-events-auto hover:text-od-text hover:bg-od-bg-hover ${
              autoScroll ? 'text-od-accent bg-od-accent-bg' : ''
            }`}
            onClick={() => setAutoScroll(a => !a)} 
            title="Auto-scroll"
          >
            ↓ scroll
          </button>
          <div className="w-px h-4 bg-od-border-subtle flex-shrink-0" />
          <button 
            className="bg-transparent border-none text-od-text-dim px-2 py-0.5 cursor-pointer font-mono text-[10px] font-medium rounded-od transition-all duration-od flex items-center gap-1 whitespace-nowrap pointer-events-auto hover:text-od-text hover:bg-od-bg-hover"
            onClick={clear}
          >
            clear
          </button>
        </div>

     
        <div className="flex bg-od-bg-darker flex-shrink-0 h-[30px] border-b border-od-border px-2">
          <button 
            className={`bg-transparent border-none text-od-text-dim px-3 cursor-pointer font-mono text-[10.5px] font-medium flex items-center gap-1.5 relative transition-colors duration-od border-b-2 border-transparent -mb-px hover:text-od-text ${
              tab === 'console' ? 'text-od-text-bright border-b-od-accent bg-od-bg' : ''
            }`}
            onClick={() => setTab('console')}
          >
            Console <span className={`text-[9px] font-semibold min-w-[14px] text-center font-variant-numeric-tabular px-[5px] py-0.5 rounded-lg ${
              tab === 'console' ? 'text-od-accent bg-od-accent-bg' : 'text-od-text-muted bg-od-bg-raised'
            } ${errorLogsCount > 0 ? 'text-od-red bg-od-red-bg' : ''}`}>
              {logs.length}
            </span>
          </button>
          <button 
            className={`bg-transparent border-none text-od-text-dim px-3 cursor-pointer font-mono text-[10.5px] font-medium flex items-center gap-1.5 relative transition-colors duration-od border-b-2 border-transparent -mb-px hover:text-od-text ${
              tab === 'network' ? 'text-od-text-bright border-b-od-accent bg-od-bg' : ''
            }`}
            onClick={() => setTab('network')}
          >
            Network <span className={`text-[9px] font-semibold min-w-[14px] text-center font-variant-numeric-tabular px-[5px] py-0.5 rounded-lg ${
              tab === 'network' ? 'text-od-accent bg-od-accent-bg' : 'text-od-text-muted bg-od-bg-raised'
            } ${failedRequestsCount > 0 ? 'text-od-red bg-od-red-bg' : ''}`}>
              {requests.length}
            </span>
          </button>
          <button
            className={`bg-transparent border-none text-od-text-dim px-3 cursor-pointer font-mono text-[10.5px] font-medium flex items-center gap-1.5 relative transition-colors duration-od border-b-2 border-transparent -mb-px hover:text-od-text ${
              tab === 'nav' ? 'text-od-text-bright border-b-od-accent bg-od-bg' : ''
            }`}
            onClick={() => setTab('nav')}
          >
            NAV
            <span className={`text-[9px] font-semibold min-w-[14px] text-center font-variant-numeric-tabular px-[5px] py-0.5 rounded-lg ${
              tab === 'nav' ? 'text-od-accent bg-od-accent-bg' : 'text-od-text-muted bg-od-bg-raised'
            }`}>
              {navigationEvent.length}
            </span>
          </button>
        </div>

       
        <div className="p-1.5 px-2 bg-od-bg border-b border-od-border flex items-center gap-1.5 flex-shrink-0">
          <span className="text-od-text-muted text-[11px] flex-shrink-0 select-none">/</span>
          <input
            className="bg-od-bg-input border border-od-border-subtle text-od-text px-2 py-1 font-mono text-[10.5px] rounded-od outline-none flex-1 min-w-0 pointer-events-auto transition-all duration-od placeholder:text-od-text-muted focus:border-od-accent focus:shadow-[0_0_0_1px_rgba(163,177,138,0.2)]"
            placeholder={tab === 'network' ? 'Filter by URL...' : 'Filter messages...'}
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
          <div className="w-px h-[18px] bg-od-border-subtle flex-shrink-0" />
          <div className="flex gap-px flex-shrink-0">
            {(tab === 'network' ? NETWORK_FILTERS : CONSOLE_FILTERS).map(f => (
              <button
                key={f}
                className={`bg-transparent border-none text-od-text-muted px-[7px] py-0.5 cursor-pointer font-mono text-[9.5px] font-medium rounded-od transition-all duration-od pointer-events-auto hover:text-od-text-dim hover:bg-od-bg-hover ${
                  (tab === 'network' ? networkFilter : conFilter) === f ? 'text-od-text-bright bg-od-bg-active' : ''
                }`}
                onClick={() => tab === 'network' ? setNetworkFilter(f as INetworkFilter) : setConFilter(f as IConsoleFilter)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

    
        <div 
          className="flex-1 overflow-y-auto overflow-x-hidden pointer-events-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-od-bg-active hover:scrollbar-thumb-od-border-subtle" 
          ref={scrollRef}
        >
          {tab === 'network' ? (
            <>
              <div className="grid grid-cols-[40px_42px_1fr_50px_54px_46px] px-2.5 h-6 items-center bg-od-bg-darker border-b border-od-border sticky top-0 z-[5]">
                <span className="text-[9.5px] font-semibold text-od-text-muted uppercase tracking-wider select-none">Status</span>
                <span className="text-[9.5px] font-semibold text-od-text-muted uppercase tracking-wider select-none">Method</span>
                <span className="text-[9.5px] font-semibold text-od-text-muted uppercase tracking-wider select-none">Name</span>
                <span className="text-[9.5px] font-semibold text-od-text-muted uppercase tracking-wider select-none text-right">Type</span>
                <span className="text-[9.5px] font-semibold text-od-text-muted uppercase tracking-wider select-none text-right">Time</span>
                <span className="text-[9.5px] font-semibold text-od-text-muted uppercase tracking-wider select-none text-right">Size</span>
              </div>
              {filteredRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[140px] gap-1.5 select-none">
                  <div className="text-lg text-od-text-muted opacity-40 font-mono">&mdash;</div>
                  <div className="text-od-text-muted text-[10.5px] opacity-60">No network activity</div>
                </div>
              ) : filteredRequests.map(req => {
                const { host, path } = parseUrl(req.url)
                const rowClass = getRowClass(req)
                return (
                  <div key={req.id}>
                    <div 
                      className={`grid grid-cols-[40px_42px_1fr_50px_54px_46px] px-2.5 min-h-[26px] items-center border-b border-od-border cursor-pointer transition-all duration-[80ms] ease-in-out hover:bg-od-bg-hover ${
                        rowClass === 'error-row' ? 'bg-[rgba(212,144,138,0.04)] hover:bg-[rgba(212,144,138,0.08)]' : ''
                      } ${rowClass === 'pending-row' ? 'opacity-50' : ''}`}
                      onClick={() => toggleRequestDetails(req.id)} 
                      title={req.url}
                    >
                      <span className={`text-[10.5px] font-semibold font-variant-numeric-tabular text-center ${getStatusClass(req.status)}`}>
                        {req.status || '\u00B7\u00B7\u00B7'}
                      </span>
                      <span className={`text-[9.5px] font-bold tracking-[0.02em] ${
                        req.method.toLowerCase() === 'get' ? 'text-od-green' :
                        req.method.toLowerCase() === 'post' ? 'text-od-blue' :
                        req.method.toLowerCase() === 'put' ? 'text-od-yellow' :
                        req.method.toLowerCase() === 'patch' ? 'text-od-orange' :
                        req.method.toLowerCase() === 'delete' ? 'text-od-red' : ''
                      }`}>
                        {req.method}
                      </span>
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap text-od-text pr-2">
                        <span className="text-od-text-muted">{host}</span>
                        <span className="text-od-text">{path}</span>
                      </span>
                      <span className="text-right text-[10px] text-od-text-dim font-variant-numeric-tabular">{req.type}</span>
                      <span className={`text-right text-[10px] text-od-text-dim font-variant-numeric-tabular ${
                        req.time > 1000 ? 'text-od-red' : req.time > 500 ? 'text-od-yellow' : ''
                      }`}>
                        {formatTime(req.time)}
                      </span>
                      <span className="text-right text-[10px] text-od-text-dim font-variant-numeric-tabular">{formatSize((req as any).size)}</span>
                    </div>
                    {req._expanded && (
                      <div className="bg-od-bg-darkest border-b border-od-border p-2 px-3 text-[10.5px]">
                        <div className="mb-2">
                          <div className="text-[9.5px] font-semibold text-od-text-muted uppercase tracking-wider mb-1">Request URL</div>
                          <div className="text-od-cyan break-all leading-[1.5]">{req.url}</div>
                        </div>
                        <div className="mb-2">
                          <div className="text-[9.5px] font-semibold text-od-text-muted uppercase tracking-wider mb-1">General</div>
                          <div className="grid gap-1 gap-x-1.5">
                            <span className="text-od-purple">method</span><span className="text-od-text">{req.method}</span>
                            <span className="text-od-purple">status</span><span className="text-od-text">{req.status ?? 'pending'} {(req as any).statusText || ''}</span>
                            <span className="text-od-purple">type</span><span className="text-od-text">{req.type}</span>
                            <span className="text-od-purple">time</span><span className="text-od-text">{formatTime(req.time)}</span>
                            {(req as any).size > 0 && <><span className="text-od-purple">size</span><span className="text-od-text">{formatSize((req as any).size)}</span></>}
                          </div>
                        </div>
                        {(req as any).responseHeaders && Object.keys((req as any).responseHeaders).length > 0 && (
                          <div className="mb-0">
                            <div className="text-[9.5px] font-semibold text-od-text-muted uppercase tracking-wider mb-1">Response headers</div>
                            <div className="grid gap-1 gap-x-1.5">
                              {Object.entries((req as any).responseHeaders).map(([k, v]) => (
                                <span key={k}>
                                  <span className="text-od-purple">{k}</span>
                                  <span className="text-od-text">{String(v)}</span>
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
          ) : tab === 'console' ? (
            <>
              {filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[140px] gap-1.5 select-none">
                  <div className="text-lg text-od-text-muted opacity-40 font-mono">&gt;_</div>
                  <div className="text-od-text-muted text-[10.5px] opacity-60">Waiting for console output</div>
                </div>
              ) : filteredLogs.map((log, idx) => {
                const expandable = hasDetail(log)
                return (
                  <div 
                    key={log.id} 
                    className={`border-b border-od-border ${
                      log.type === 'log' ? 'bg-[rgba(138,175,196,0.01)] hover:bg-od-bg-hover' :
                      log.type === 'info' ? 'bg-[rgba(138,175,196,0.05)] hover:bg-[rgba(138,175,196,0.09)]' :
                      log.type === 'warn' ? 'bg-[rgba(212,193,150,0.06)] hover:bg-[rgba(212,193,150,0.1)]' :
                      log.type === 'error' ? 'bg-[rgba(212,144,138,0.07)] hover:bg-[rgba(212,144,138,0.12)]' : ''
                    }`}
                  >
                    <div
                      className={`flex items-start py-0.5 px-2.5 pr-0 min-h-6 transition-all duration-[80ms] ease-in-out text-[11.5px] ${
                        expandable ? 'cursor-pointer' : ''
                      }`}
                      onClick={expandable ? () => toggleLogDetails(log.id) : undefined}
                    >
                      <div className={`w-10 flex-shrink-0 text-center text-[9.5px] leading-[1.55] pt-0.5 select-none font-variant-numeric-tabular ${
                        log.type === 'log' ? 'text-od-text-muted' :
                        log.type === 'info' ? 'text-od-blue-dim' :
                        log.type === 'warn' ? 'text-od-yellow-dim' :
                        log.type === 'error' ? 'text-od-red-dim' : ''
                      }`}>
                        {expandable
                          ? <span className={`inline-block text-[8px] transition-transform duration-150 ease-in-out text-od-text-dim ${log._expanded ? 'rotate-90' : ''}`}>&#x25B6;</span>
                          : idx + 1}
                      </div>
                      <div className={`w-[3px] flex-shrink-0 self-stretch rounded-[1px] mr-2 ${
                        log.type === 'log' ? 'bg-od-text-muted opacity-25' :
                        log.type === 'info' ? 'bg-od-blue opacity-70' :
                        log.type === 'warn' ? 'bg-od-yellow opacity-70' :
                        log.type === 'error' ? 'bg-od-red opacity-85' : ''
                      }`} />
                      <span className={`flex-1 break-words whitespace-pre-wrap leading-[1.55] pt-0.5 min-w-0 ${
                        log.type === 'log' ? 'text-od-text' :
                        log.type === 'info' ? 'text-od-blue' :
                        log.type === 'warn' ? 'text-od-yellow' :
                        log.type === 'error' ? 'text-od-red' : ''
                      }`}>
                        <span className={`mr-1.5 ${
                          log.type === 'log' ? 'text-od-text-muted' :
                          log.type === 'info' ? 'text-od-blue-dim' :
                          log.type === 'warn' ? 'text-od-yellow-dim' :
                          log.type === 'error' ? 'text-od-red-dim' : ''
                        }`}>
                          {getConsolePrefix(log.type)}
                        </span>
                        {log.message}
                      </span>
                      {log.caller && (
                        <span 
                          className="text-od-text-muted text-[9.5px] flex-shrink-0 pl-2 leading-[1.55] pt-0.5 max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap cursor-default hover:text-od-cyan-dim"
                          title={`${log.caller.fileFull}:${log.caller.line}`}
                        >
                          {log.caller.file}:{log.caller.line}
                        </span>
                      )}
                      <span className="text-od-text-muted text-[9.5px] flex-shrink-0 font-variant-numeric-tabular pl-2 leading-[1.55] pt-0.5">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>

                    {log._expanded && (
                      <div className="bg-od-bg-darkest p-1.5 px-2.5 pb-2 pl-10 text-[10.5px] border-t border-od-border">
                        {log.caller && (
                          <div className="flex gap-2 mb-1.5 items-baseline">
                            <span className="text-od-purple">source</span>
                            <span className="text-od-cyan break-all text-[10.5px]">
                              {log.caller.fn && <span className="text-od-purple mr-1">{log.caller.fn} </span>}
                              {log.caller.fileFull}:{log.caller.line}:{log.caller.col}
                            </span>
                          </div>
                        )}
                        {log.args && log.args.length > 0 && (
                          <div className="mt-1">
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
          ) : tab === 'nav' ? (
            <NavigationList items={navigationEvent} setItems={setNavigation}/>
          ) : null}
        </div>

 
        <div className="flex items-center px-2.5 h-[22px] bg-od-bg-darker border-t border-od-border flex-shrink-0 gap-3 text-[9.5px] text-od-text-muted select-none">
          {errorLogsCount > 0 && (
            <div className="flex items-center gap-1 font-variant-numeric-tabular">
              <div className="w-[5px] h-[5px] rounded-full flex-shrink-0 bg-od-red opacity-70" />
              {errorLogsCount} error{errorLogsCount !== 1 ? 's' : ''}
            </div>
          )}
          {warnLogsCount > 0 && (
            <div className="flex items-center gap-1 font-variant-numeric-tabular">
              <div className="w-[5px] h-[5px] rounded-full flex-shrink-0 bg-od-yellow opacity-70" />
              {warnLogsCount} warn{warnLogsCount !== 1 ? 's' : ''}
            </div>
          )}
          {failedRequestsCount > 0 && (
            <div className="flex items-center gap-1 font-variant-numeric-tabular">
              <div className="w-[5px] h-[5px] rounded-full flex-shrink-0 bg-od-red opacity-70" />
              {failedRequestsCount} failed
            </div>
          )}
          <div className="flex items-center gap-1 font-variant-numeric-tabular ml-auto">
            <div className="w-[5px] h-[5px] rounded-full flex-shrink-0 bg-od-accent opacity-80" />
            {requests.length} req
          </div>
          <div className="flex items-center gap-1 font-variant-numeric-tabular">
            <div className="w-[5px] h-[5px] rounded-full flex-shrink-0 bg-od-blue opacity-70" />
            {logs.length} log{logs.length !== 1 ? 's' : ''}
          </div>
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
    <span className="text-od-purple">{label}<span className="text-od-text-muted">: </span></span>
  ) : null

  if (!expandable) {
    return (
      <div className="py-px text-[10.5px] leading-[1.6]" style={{ paddingLeft: depth * 14 }}>
        {keyEl}
        <span className={`${
          node.type === 'str' ? 'text-od-accent' :
          node.type === 'num' ? 'text-od-blue' :
          node.type === 'bool' ? 'text-od-blue' :
          node.type === 'null' ? 'text-od-text-muted italic' :
          node.type === 'undef' ? 'text-od-text-muted italic' :
          node.type === 'fn' ? 'text-od-cyan italic' :
          node.type === 'date' ? 'text-od-yellow' :
          node.type === 'regex' ? 'text-od-red' :
          node.type === 'el' ? 'text-od-orange' :
          node.type === 'sym' ? 'text-od-purple-dim' :
          node.type === 'err' ? 'text-od-red' : ''
        }`}>
          {fmtVal(node)}
        </span>
      </div>
    )
  }

  return (
    <div className="text-[10.5px] leading-[1.6]">
      <div 
        className="py-px cursor-pointer flex items-baseline gap-0 hover:bg-[rgba(163,177,138,0.04)]" 
        style={{ paddingLeft: depth * 14 }} 
        onClick={() => setOpen(!open)}
      >
        <span className={`inline-block text-[7px] w-3 flex-shrink-0 text-od-text-dim transition-transform duration-[120ms] ease-in-out text-center ${open ? 'rotate-90' : ''}`}>
          &#x25B6;
        </span>
        {keyEl}
        <span className="text-od-text-dim italic">{node.preview}</span>
      </div>
      {open && (
        <div>
          {node.type === 'err' && node.stack && (
            <div style={{ paddingLeft: (depth + 1) * 14 }} className="mt-0.5">
              {node.stack.split('\n').slice(1, 8).map((l, i) => (
                <div key={i} className="text-od-text-dim text-[9.5px] leading-[1.5] hover:text-od-cyan-dim">{l.trim()}</div>
              ))}
            </div>
          )}
          {node.objEntries && node.objEntries.map((entry, i) => (
            <ObjectNode key={i} node={entry.v} depth={depth + 1} label={entry.k} />
          ))}
          {node.children && node.children.map((child, i) => (
            <ObjectNode key={i} node={child} depth={depth + 1} label={String(i)} />
          ))}
          {node.truncated && (
            <div className="text-od-text-muted italic py-px" style={{ paddingLeft: (depth + 1) * 14 }}>…</div>
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

function NavigationList({ items, setItems }: {
  items: INavigationEvent[];
  setItems: (fn: (prev: INavigationEvent[]) => INavigationEvent[]) => void;
}) {
  const toggle = (id: string) => {
    setItems(prev =>
      prev.map(i =>
        i.id === id ? { ...i, _expanded: !i._expanded } : i
      )
    );
  };

  return (
    <>
      <div className="grid grid-cols-[60px_1fr_70px] px-2.5 h-6 items-center bg-od-bg-darker border-b border-od-border sticky top-0 z-[5]">
        <span className="text-[9.5px] font-semibold text-od-text-muted uppercase tracking-wider select-none">Type</span>
        <span className="text-[9.5px] font-semibold text-od-text-muted uppercase tracking-wider select-none">URL</span>
        <span className="text-[9.5px] font-semibold text-od-text-muted uppercase tracking-wider select-none text-right">Time</span>
      </div>

      {items.map((item, i) => {
        const { host, path } = parseUrl(item.url);

        return (
          <div key={item.id}>
            <div
              className="grid grid-cols-[60px_1fr_70px] px-2.5 min-h-[26px] items-center border-b border-od-border cursor-pointer transition-all duration-[80ms] ease-in-out hover:bg-od-bg-hover"
              onClick={() => toggle(item.id)}
            >
              <div className={`text-[9.5px] font-semibold uppercase tracking-[0.04em] ${
                item.type === 'load' ? 'text-od-blue' :
                item.type === 'pushState' ? 'text-od-green' :
                item.type === 'replaceState' ? 'text-od-yellow' :
                item.type === 'popstate' ? 'text-od-purple' : ''
              }`}>
                {item.type}
              </div>

              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-od-text pr-2">
                <span className="text-od-text-muted mr-1.5">{host}</span>
                <span className="text-od-text-bright">{path}</span>
              </div>

              <div className="text-right text-[10px] text-od-text-dim font-variant-numeric-tabular">
                {formatTime(parseInt(item.timestamp))}
              </div>
            </div>

            {item._expanded && (
              <div className="bg-od-bg-darkest border-b border-od-border p-2 px-3 text-[10.5px]">
                <div className="flex gap-2 mb-1">
                  <span className="text-od-text-muted text-[9.5px] uppercase tracking-wider min-w-[70px]">Full URL</span>
                  <span className="text-od-text break-all">{item.url}</span>
                </div>

                <div className="flex gap-2 mb-1">
                  <span className="text-od-text-muted text-[9.5px] uppercase tracking-wider min-w-[70px]">Type</span>
                  <span className="text-od-text break-all">{item.type}</span>
                </div>

                <div className="flex gap-2 mb-0">
                  <span className="text-od-text-muted text-[9.5px] uppercase tracking-wider min-w-[70px]">Timestamp</span>
                  <span className="text-od-text break-all">
                    {new Date(item.timestamp).toString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

export default LoggerPanel