import React, { useState } from "react";
import type {
  IPingMessage,
  ITabInfoMessage,
  IMessageResponse,
  IPingResponse,
  ITabInfoResponse,
} from "../shared/const";

export function App(): React.ReactElement {
  const [status, setStatus] = useState<string>("Ready");
  const [tabInfo, setTabInfo] = useState<{ url: string; title: string } | null>(
    null
  );

  async function pingBackground(): Promise<void> {
    setStatus("Pinging...");

    const message: IPingMessage = { type: "PING" };

    try {
      const response = (await chrome.runtime.sendMessage(
        message
      )) as IMessageResponse;

      if (response.success) {
        const pingResponse = response as IPingResponse;
        setStatus(`✓ ${pingResponse.message}`);
      } else {
        setStatus(`✗ Error: ${response.error}`);
      }
    } catch (error) {
      setStatus(`✗ Failed: ${(error as Error).message}`);
    }
  }

  async function getTabInfo(): Promise<void> {
    setStatus("Getting tab info...");

    const message: ITabInfoMessage = { type: "GET_TAB_INFO" };

    try {
      const response = (await chrome.runtime.sendMessage(
        message
      )) as IMessageResponse;

      if (response.success) {
        const infoResponse = response as ITabInfoResponse;
        setTabInfo({ url: infoResponse.url, title: infoResponse.title });
        setStatus("✓ Tab info retrieved");
      } else {
        setStatus(`✗ Error: ${response.error}`);
      }
    } catch (error) {
      setStatus(`✗ Failed: ${(error as Error).message}`);
    }
  }

  async function messageContentScript(): Promise<void> {
    setStatus("Messaging content script...");

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab.id) {
        setStatus("✗ No active tab");
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        type: "HELLO_CONTENT",
        from: "popup",
      });

      setStatus(`✓ Content responded: ${JSON.stringify(response)}`);
    } catch (error) {
      setStatus(`✗ Content script error: ${(error as Error).message}`);
    }
  }

  return (
    <div className="w-80 p-4 bg-gray-50">
      <h1 className="text-lg font-semibold text-gray-800 mb-4">
        Extension Template
      </h1>

      <div className="space-y-2 mb-4">
        <button
          onClick={pingBackground}
          className="w-full px-4 py-2 bg-brown-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Ping Background
        </button>

        <button
          onClick={getTabInfo}
          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Get Tab Info
        </button>

        <button
          onClick={messageContentScript}
          className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
        >
          Message Content Script
        </button>
      </div>

      <div className="p-3 bg-white rounded border border-gray-200">
        <p className="text-sm text-gray-600 mb-1">Status:</p>
        <p className="text-sm font-mono text-gray-800 break-words">{status}</p>
      </div>

      {tabInfo && (
        <div className="mt-3 p-3 bg-white rounded border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Current Tab:</p>
          <p className="text-sm font-mono text-gray-800 truncate">
            {tabInfo.title}
          </p>
          <p className="text-xs font-mono text-gray-500 truncate">
            {tabInfo.url}
          </p>
        </div>
      )}
    </div>
  );
}
