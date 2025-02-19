let logs = [];
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message);
  console.log("Sent response-----", sendResponse);
  if (message.type === "LOG") {
    logs.push({
      timestamp: new Date().toISOString(),
      message: message.content,
      url: sender.tab.url,
    });
  } else if (message.type === "GET_LOGS") {
    sendResponse(logs);
  }

  return true;
});
