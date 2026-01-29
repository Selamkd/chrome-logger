/**
 * Defines all message types that can be sent between extension contexts.
 * 
 */

export type IMessageType = "PING" | "GET_TAB_INFO" | "CONTENT_LOADED";

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
