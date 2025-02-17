document.addEventListener("DOMContentLoaded", () => {
  const logContainer = document.getElementById("log-container");
  const clearButton = document.getElementById("clear-logs");

  function loadLogs() {
    chrome.storage.local.get({ logs: [] }, (data) => {
      logContainer.innerHTML = "";
      data.logs.forEach((log) => {
        const logEntry = document.createElement("div");
        logEntry.className = `log ${log.level}`;
        logEntry.textContent = `[${log.time}] ${log.level.toUpperCase()}: ${log.text}`;
        logContainer.appendChild(logEntry);
      });
    });
  }

  clearButton.addEventListener("click", () => {
    chrome.storage.local.set({ logs: [] }, loadLogs);
  });

  loadLogs();
});
