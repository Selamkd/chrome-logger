if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
  document.addEventListener("DOMContentLoaded", () => {
    const logContainer = document.getElementById("log-container");
    const clearButton = document.getElementById("clear-logs");

    function displayLogs(logs) {
      logContainer.innerHTML = "";
      logs.forEach((log) => {
        const logDiv = document.createElement("div");
        logDiv.className = `log ${log.level}`;
        logDiv.innerHTML = `<strong>[${log.level.toUpperCase()}]</strong> ${log.text} <em>(${log.time})</em>`;
        logContainer.appendChild(logDiv);
      });
    }

    chrome.storage.local.get("logs", (data) => {
      if (data.logs) {
        displayLogs(data.logs);
      }
    });

    if (clearButton) {
      clearButton.addEventListener("click", () => {
        chrome.storage.local.set({ logs: [] }, () => {
          displayLogs([]);
        });
      });
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "update_logs") {
      chrome.storage.local.get("logs", (data) => {
        if (data.logs) {
          displayLogs(data.logs);
        }
      });
    }
  });
} else {
  console.error(
    "chrome.storage is not available. Make sure the script is running in a Chrome extension.",
  );
}
