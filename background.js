let logs = [];
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message);

  if (message.type === "log") {
    logs.push({
      level: message.level,
      text: message.message.join(" "),
      time: new Date().toLocaleTimeString(),
      url: sender.tab ? sender.tab.url : "??",
    });

    chrome.storage.local.set({ logs });
    chrome.runtime.sendMessage({ type: "update_logs", logs });
  }
});
