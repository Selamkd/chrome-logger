import { IConsoleLog, INetworkRequest } from "@/shared/const"

export function formatTime (ms: number): string {
    if (ms < 1000) return `${Math.round(ms)}ms`
    if (ms < 10000) return `${(ms / 1000).toFixed(1)}s`
    return `${Math.round(ms / 1000)}s`
  }

  export function formatTimestamp  (date: Date) {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  export function getStatusClass (status: number | null) {
    if (!status) return 'lp-s-pending'
    if (status >= 200 && status < 300) return 'lp-s-ok'
    if (status >= 300 && status < 400) return 'lp-s-redir'
    return 'lp-s-err'
  }

  export function getRowClass (req: INetworkRequest) {
    if (!req.status) return 'pending-row'
    if (req.status >= 400) return 'error-row'
    return ''
  }

  export function getTimeClass (ms: number) {
    if (ms > 3000) return 'lp-time-very-slow'
    if (ms > 1000) return 'lp-time-slow'
    return ''
  }

  export function parseUrl (url: string): { host: string; path: string } {
    try {
      const u = new URL(url)
      return { host: u.hostname, path: u.pathname + u.search }
    } catch {
      return { host: '', path: url }
    }
  }

  export function getConsolePrefix  (type: IConsoleLog['type']){
    switch (type) {
      case 'warn':  return 'warn'
      case 'error': return 'err!'
      case 'info':  return 'info'
      default:      return ' log'
    }
  }

  export function formatSize (bytes?: number): string {
    if (!bytes) return '\u2014'
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`
    return `${(bytes / (1024 * 1024)).toFixed(1)}M`
  }