
(function () {
  initConsoleLogger();
  initNavigationTracker();
})();


function initConsoleLogger(){
  var originalConsole = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    info: console.info.bind(console),
  }

    function getCallerInfo() {
    var err = new Error()
    var stack = err.stack || ''
    var lines = stack.split('\n')

   
    for (var i = 3; i < lines.length; i++) {
      var line = lines[i] || ''
      if (line.indexOf('inject.js') !== -1) continue
      if (line.indexOf('chrome-extension://') !== -1) continue

      // "matches ->  functionName (file:line:col)"
      var functionLogLine = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/)
      if (functionLogLine) {
        return {
          fn: functionLogLine[1] === '<anonymous>' ? '' : functionLogLine[1],
          file: functionLogLine[2].split('/').pop() || functionLogLine[2],
          fileFull: functionLogLine[2],
          line: parseInt(functionLogLine[3], 10),
          col: parseInt(functionLogLine[4], 10),
        }
      }

      // "matches -> file:line:col"
      var fileLogLine = line.match(/at\s+(.+?):(\d+):(\d+)/)
      if (fileLogLine) {
        return {
          fn: '',
          file: fileLogLine[1].split('/').pop() || fileLogLine[1],
          fileFull: fileLogLine[1],
          line: parseInt(fileLogLine[2], 10),
          col: parseInt(fileLogLine[3], 10),
        }
      }
    }
    return null
  }

  function getTreeNodeFromValue(val, depth) {
    if (depth === undefined) depth = 0
    var MAX_DEPTH = 5
    var MAX_KEYS = 50
    var MAX_ARR = 100
    var MAX_STR = 500

    if (val === null) return { t: 'null', v: 'null' }
    if (val === undefined) return { t: 'undef', v: 'undefined' }

    var type = typeof val

    if (type === 'string') {
      return { t: 'str', v: val.length > MAX_STR ? val.slice(0, MAX_STR) + '…' : val }
    }
    if (type === 'number')  return { t: 'num', v: String(val) }
    if (type === 'boolean') return { t: 'bool', v: String(val) }
    if (type === 'symbol')  return { t: 'sym', v: val.toString() }
    if (type === 'bigint')  return { t: 'num', v: val.toString() + 'n' }
    if (type === 'function') return { t: 'fn', v: 'f ' + (val.name || 'anonymous') + '()' }

    if (val instanceof Error) {
      return { t: 'err', v: val.message, name: val.name, stack: val.stack || '' }
    }
    if (val instanceof Date) return { t: 'date', v: val.toISOString() }
    if (val instanceof RegExp) return { t: 'regex', v: val.toString() }

    if (val instanceof HTMLElement) {
      var tag = val.tagName.toLowerCase()
      var id = val.id ? '#' + val.id : ''
      var cls = val.className && typeof val.className === 'string'
        ? '.' + val.className.trim().split(/\s+/).join('.') : ''
      return { t: 'el', v: '<' + tag + id + cls + '>' }
    }

   
    if (Array.isArray(val)) {
      if (depth >= MAX_DEPTH) return { t: 'arr', v: '[' + val.length + ']', x: true }
      var items = []
      var len = Math.min(val.length, MAX_ARR)
      for (var i = 0; i < len; i++) items.push(serialize(val[i], depth + 1))
      return { t: 'arr', v: '[' + val.length + ']', c: items, x: val.length > MAX_ARR }
    }

  
    if (type === 'object') {
      if (depth >= MAX_DEPTH) return { t: 'obj', v: '{…}', x: true }
      var keys
      try { keys = Object.keys(val) } catch(e) { return { t: 'obj', v: '[Object]' } }
      var entries = []
      var klen = Math.min(keys.length, MAX_KEYS)
      for (var i = 0; i < klen; i++) {
        var k = keys[i]
        try { entries.push({ k: k, v: serialize(val[k], depth + 1) }) }
        catch(e) { entries.push({ k: k, v: { t: 'err', v: '[Access Error]' } }) }
      }
      return { t: 'obj', v: '{' + keys.length + '}', e: entries, x: keys.length > MAX_KEYS }
    }

    return { t: 'unknown', v: String(val) }
  }


  function flattenMsgForPreview(args) {
    return args.map(function(a) {
      if (typeof a === 'object' && a !== null) {
        if (a instanceof Error) return a.name + ': ' + a.message
        try { return JSON.stringify(a, null, 0) }
        catch(e) { return String(a) }
      }
      return String(a)
    }).join(' ')
  }

  // to content script ──---
  function sendLog(type, args) {
    var caller = getCallerInfo()
    var serialized = args.map(function(a) { return getTreeNodeFromValue(a) })

    window.postMessage({
      source: 'chrome-logger-extension',
      type: 'CONSOLE_LOG',
      payload: {
        id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        type: type,
        message: flattenMsgForPreview(args),
        args: serialized,
        caller: caller,
        timestamp: new Date().toISOString(),
      }
    }, '*')
  }






  console.log = function() {
    var a = Array.prototype.slice.call(arguments)
    sendLog('log', a); originalConsole.log.apply(console, a)
  }
  console.warn = function() {
    var a = Array.prototype.slice.call(arguments)
    sendLog('warn', a); originalConsole.warn.apply(console, a)
  }
  console.error = function() {
    var a = Array.prototype.slice.call(arguments)
    sendLog('error', a); originalConsole.error.apply(console, a)
  }
  console.info = function() {
    var a = Array.prototype.slice.call(arguments)
    sendLog('info', a); originalConsole.info.apply(console, a)
  }

  
}



function initNavigationTracker(){

function sendNavigation(type, url) {
    window.postMessage({
      source: "chrome-logger-extension",
      type: "NAVIGATION",
      payload: {
        url,
        type,
        timestamp: Date.now()
      }
    }, "*");
  }
 const originalPush = history.pushState;
  history.pushState = function (...args) {
    const result = originalPush.apply(this, args);
    // when a route gets added to the top of stack(on redirect)
    sendNavigation("pushState", location.href);
    return result;
  };


  const originalReplace = history.replaceState;
  history.replaceState = function (...args) {
    const result = originalReplace.apply(this, args);
   // when the current route gets replaced 
    sendNavigation("replaceState", location.href);
    return result;
  };
// when the active history changes while the user navigates 
  window.addEventListener("popstate", () => {
    sendNavigation("popstate", location.href);
  });


  sendNavigation("load", location.href);


}



