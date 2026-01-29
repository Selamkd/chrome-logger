import type {

  INetworkRequest,

} from "../shared/const";

// track requests per tab
const requestsPerTab: Map<number, Map<string, Partial<INetworkRequest>>> = new Map()

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function getResourceType(url: string, type?: string): string {
  if (type === 'xmlhttprequest') return 'xhr'
  if (type === 'fetch') return 'fetch'
  
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase()
  const typeMap: Record<string, string> = {
    'js': 'js',
    'css': 'css',
    'png': 'img',
    'jpg': 'img',
    'jpeg': 'img',
    'gif': 'img',
    'svg': 'img',
    'webp': 'img',
    'html': 'doc',
    'htm': 'doc',
    'json': 'json',
    'woff': 'font',
    'woff2': 'font',
    'ttf': 'font',
  }
  
  return typeMap[ext || ''] || type || 'other'
}


function initTab(tabId: number): Map<string, Partial<INetworkRequest>> {
  if (!requestsPerTab.has(tabId)) {
    requestsPerTab.set(tabId, new Map())
  }
  return requestsPerTab.get(tabId)!
}

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
   
    if (details.tabId < 0) return
    
    const tabRequests = initTab(details.tabId)
    const id = generateId()
    

    tabRequests.set(details.requestId, {
      id,
      url: details.url,
      method: details.method,
      type: getResourceType(details.url, details.type),
      timestamp: new Date(),
      status: null,
      statusText: '',
      size: 0,
      time: 0,
    })
  },
  { urls: ['<all_urls>'] }
)



chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.tabId < 0) return
    
    const tabRequests = requestsPerTab.get(details.tabId)
    const request = tabRequests?.get(details.requestId)
    
    if (request) {
      request.status = details.statusCode
      request.statusText = details.statusLine || ''
      
    
      if (details.responseHeaders) {
        request.responseHeaders = {}
        details.responseHeaders.forEach(header => {
          request.responseHeaders![header.name.toLowerCase()] = header.value || ''
        })
        
      
        const contentLength = details.responseHeaders.find(
          h => h.name.toLowerCase() === 'content-length'
        )
        if (contentLength?.value) {
          request.size = parseInt(contentLength.value, 10)
        }
      }
    }
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders'] 
)

chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (details.tabId < 0) return
    
    const tabRequests = requestsPerTab.get(details.tabId)
    const request = tabRequests?.get(details.requestId)
    
    if (request && request.timestamp) {
   
      request.time = Date.now() - request.timestamp.getTime()
      
    
      chrome.tabs.sendMessage(details.tabId, {
        type: 'NETWORK_REQUEST',
        payload: { ...request } as INetworkRequest
      }).catch(() => {
     
      })
      
  
      tabRequests?.delete(details.requestId)
    }
  },
  { urls: ['<all_urls>'] }
)

chrome.webRequest.onErrorOccurred.addListener(
  (details) => {
    if (details.tabId < 0) return
    
    const tabRequests = requestsPerTab.get(details.tabId)
    const request = tabRequests?.get(details.requestId)
    
    if (request && request.timestamp) {
      request.time = Date.now() - request.timestamp.getTime()
      request.status = 0 
      request.statusText = details.error
      
      chrome.tabs.sendMessage(details.tabId, {
        type: 'NETWORK_REQUEST',
        payload: { ...request } as INetworkRequest
      }).catch(() => {})
      
      tabRequests?.delete(details.requestId)
    }
  },
  { urls: ['<all_urls>'] }
)



chrome.tabs.onRemoved.addListener((tabId) => {
  requestsPerTab.delete(tabId)
})


chrome.webNavigation?.onBeforeNavigate?.addListener((details) => {
  if (details.frameId === 0) {
    requestsPerTab.delete(details.tabId)
  }
})

console.log('Chrome Logger background script loaded')