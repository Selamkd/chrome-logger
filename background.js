chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message);

  if (message.type === "log") {
    chrome.storage.local.get({ logs: [] }, (data) => {
      const logs = data.logs;
      logs.push({
        level: message.level,
        text: message.text,
        time: new Date().toLocaleTimeString(),
      });

      chrome.storage.local.set({ logs });
    });
  }
});
