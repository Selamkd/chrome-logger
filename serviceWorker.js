chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "log") {
    chrome.storage.local.get({ logs: [] }, (data) => {
      const logs = data.logs;
      logs.push({
        level: message.level,
        text: message.text,
        time: new Date().toLocalTimeString(),
      });

      chrome.storage.locals.set({ logs }, () => {
        sendResponse({ status: "saved" });
      });
    });

    return true;
  }
});
