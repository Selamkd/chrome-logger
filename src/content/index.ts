import type { IContentLoadedMessage, IMessageResponse } from "../shared/messages";
import "./styles.css";

/**
 * Content Script
 *
 * This code is injected into every page matching the manifest's "matches" pattern.
 * It has full access to the page's DOM but runs in an isolated JavaScript context
 * (cannot access the page's JS variables directly).
 *
 * Limited Chrome API access - primarily uses chrome.runtime for messaging.
 */

console.log("[Content] Script injected into:", window.location.href);

async function notifyBackgroundOfLoad(): Promise<void> {
  const message: IContentLoadedMessage = {
    type: "CONTENT_LOADED",
    payload: {
      url: window.location.href,
      title: document.title,
    },
  };

  try {
    const response: IMessageResponse = await chrome.runtime.sendMessage(message);

    if (response.success) {
      console.log("[Content] Background page load");
    } else {
      console.error("[Content] Background error:", response.error);
    }
  } catch (error) {
    /**
     * This can happen if the background service worker is not yet ready
     * or has been terminated. It's generally safe to ignore.
     */
    console.warn("[Content] Could not reach background:", error);
  }
}

/**
 * Listen for messages from the popup or background.
 */
chrome.runtime.onMessage.addListener(
  (
    message: unknown,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void
  ): boolean => {
    console.log("[Content] Received message:", message);

    sendResponse({ received: true, from: "content" });

    return true;
  }
);

notifyBackgroundOfLoad();
