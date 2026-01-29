/**
 * Defines all message types that can be sent between extension contexts.
 * 
 */


interface IBaseMessage {
  type: IMessageType;
}

export interface IPingMessage extends IBaseMessage {
  type: "PING";
}

export interface ITabInfoMessage extends IBaseMessage {
  type: "GET_TAB_INFO";
}

export interface IContentLoadedMessage extends IBaseMessage {
  type: "CONTENT_LOADED";
  payload: {
    url: string;
    title: string;
  };
}

export type IExtensionMessage =
  | IPingMessage
  | ITabInfoMessage
  | IContentLoadedMessage;

/**
 * Response types corresponding to each message.
 */
export interface IPingResponse {
  success: true;
  message: string;
  timestamp: number;
}

export interface ITabInfoResponse {
  success: true;
  url: string;
  title: string;
}

export interface IContentLoadedResponse {
  success: true;
  received: boolean;
}

export type IMessageResponse =
  | IPingResponse
  | ITabInfoResponse
  | IContentLoadedResponse
  | { success: false; error: string };


  
export interface INetworkRequest {
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


export interface IConsoleLog {
  id: string
  type: 'log' | 'warn' | 'error' | 'info'
  message: string
  timestamp: Date
  stack?: string
}


export type IMessageType = 
 "PING" | "GET_TAB_INFO" | "CONTENT_LOADED" |
   { type: 'NETWORK_REQUEST'; payload: INetworkRequest }
  | { type: 'CONSOLE_LOG'; payload: IConsoleLog }
  | { type: 'CLEAR_LOGS' }