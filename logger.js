document.addEventListener("DOMContentLoaded", () => {
  const logContainer = document.getElementById("log-container");
  const clearBtn = document.getElementById("clear-logs");

  function displayLogs(logs) {
    logContainer.innerHTML = "";
    logs.forEach((log) => {
      const logEntry = document.createElement("div");
      logEntry.className = "log-entry";
      logEntry.innerHTML = `
        <div class="timestamp">${new Date(log.timestamp).toLocaleTimeString()}</div>
        <div class="message">${log.message}</div>
        <div class="url">${log.url}</div>
      `;
      logContainer.appendChild(logEntry);
    });
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  chrome.runtime.sendMessage({ type: "GET_LOGS" }, (logs) => {
    displayLogs(logs || []);
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "NEW_LOG") {
      displayLogs(message.logs);
    }
  });

  clearBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "CLEAR_LOGS" });
    logContainer.innerHTML = "";
  });
});
