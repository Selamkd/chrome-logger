import type {
  IExtensionMessage,
  IMessageResponse,
  IPingResponse,
  ITabInfoResponse,
  IContentLoadedResponse,
} from "../shared/messages";

/**
 * Background Service Worker
 *
 * runs in an isolated context(has no DOM access)
 * acts as the central message hub between the view(popup,panel), content scripts,
 * and can respond to browser events (tabs, alarms, etc.).
 *
 * Manifest V3 quirk: Service workers are non-persistent.
 * They can be terminated when idle(avoid storing state in variables)
 * Use chrome.storage for any data that needs to persist.
 */

console.log("[Background] Service worker init...");

chrome.runtime.onInstalled.addListener((details) => {
  console.log("[Background Service] Extension installed:", details.reason);
});

/**
 * Central message handler.
 * All messages from popup and content scripts arrive here.
 */
chrome.runtime.onMessage.addListener(
  (
    message: IExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: IMessageResponse) => void
  ): boolean => {
    console.log("[Background] Received message:", message.type, "from:", sender);

    handleMessage(message, sender)
      .then(sendResponse)
      .catch((error) => {
        console.error("[Background] Error handling message:", error);
        sendResponse({ success: false, error: error.message });
      });

    /**
     * Returning true signals that sendResponse will be called asynchronously.
     * Without this, the message channel closes immediately.
     */
    return true;
  }
);

async function handleMessage(
  message: IExtensionMessage,
  sender: chrome.runtime.MessageSender
): Promise<IMessageResponse> {
  switch (message.type) {
    case "PING": {
      const response: IPingResponse = {
        success: true,
        message: "Background service worker is listening!",
        timestamp: Date.now(),
      };
      return response;
    }

    case "GET_TAB_INFO": {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const tab = tabs[0];

      const response: ITabInfoResponse = {
        success: true,
        url: tab?.url ?? "Unknown",
        title: tab?.title ?? "Unknown",
      };
      return response;
    }

    case "CONTENT_LOADED": {
      console.log(
        "[Background] Content script loaded on:",
        message.payload.url
      );

      const response: IContentLoadedResponse = {
        success: true,
        received: true,
      };
      return response;
    }

    default: {
    
      throw new Error(`Unhandled message type`);
    }
  }
}

console.log("[Background] Service worker listening for messages.");
