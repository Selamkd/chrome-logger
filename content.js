(function () {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("inject.js");
  script.onload = function () {
    this.remove();
  };
  document.documentElement.appendChild(script);
})();

window.addEventListener("message", (event) => {
  if (event.source !== window || event.data.type !== "console_log") return;

  chrome.runtime.sendMessage({
    type: "log",
    level: event.data.level,
    message: event.data.message,
  });
});
