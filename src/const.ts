export interface IRequest {
  id: string
  url: string
  method: string
  status: number | null
  statusText: string
  type: string
  size: number
  time: number
  timestamp: Date
  requestHeaders?: Record<string, string>
  responseHeaders?: Record<string, string>
  requestBody?: string
  responseBody?: string
}

export interface ILog {
  id: string
  type: 'log' | 'warn' | 'error' | 'info'
  message: string
  timestamp: Date
  stack?: string
}


// Messages sent between content script and background script
export type IMessageTab = 
  | { type: 'NETWORK_REQUEST'; payload: IRequest }
  | { type: 'CONSOLE_LOG'; payload: ILog }
  | { type: 'CLEAR_LOGS' }