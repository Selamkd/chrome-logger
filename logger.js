if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
  document.addEventListener("DOMContentLoaded", () => {
    const logContainer = document.getElementById("log-container");
    const clearButton = document.getElementById("clear-logs");

    function loadLogs() {
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.get({ logs: [] }, (data) => {
          logContainer.innerHTML = "";
          if (data.logs && Array.isArray(data.logs)) {
            data.logs.forEach((log) => {
              const logEntry = document.createElement("div");
              logEntry.className = `log ${log.level}`;
              logEntry.textContent = `[${log.time}] ${log.level.toUpperCase()}: ${log.text}`;
              logContainer.appendChild(logEntry);
            });
          }
        });
      }
    }

    if (clearButton) {
      clearButton.addEventListener("click", () => {
        if (chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ logs: [] }, loadLogs);
        }
      });
    }

    loadLogs();
    setInterval(loadLogs, 1000);
  });
} else {
  console.error(
    "chrome.storage is not available. Make sure the script is running in a Chrome extension.",
  );
}
