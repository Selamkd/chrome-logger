
(function() {
  const originalConsole = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    info: console.info.bind(console),
  }

  const sendLog = (type, args) => {
    window.postMessage({
      source: 'chrome-logger-extension',
      type: 'CONSOLE_LOG',
      payload: {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        message: args.map(arg => {
          if (typeof arg === 'object') {
            try { return JSON.stringify(arg, null, 2) } 
            catch { return String(arg) }
          }
          return String(arg)
        }).join(' '),
        timestamp: new Date().toISOString(),
      }
    }, '*')
  }

  console.log = (...args) => { sendLog('log', args); originalConsole.log(...args) }
  console.warn = (...args) => { sendLog('warn', args); originalConsole.warn(...args) }
  console.error = (...args) => { sendLog('error', args); originalConsole.error(...args) }
  console.info = (...args) => { sendLog('info', args); originalConsole.info(...args) }
})()