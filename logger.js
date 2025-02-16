(function () {
  const loggerLog = console.log;
  const loggerWarn = console.warn;
  const loggerError = console.error;

  function sendLog(level, text) {
    chrome.runtime.sendMessage({ type: "log", level, text });
  }

  console.log = function (...params) {
    loggerLog.apply(console, params);
    sendLog("log", params.join(" "));
  };

  console.warn = function (...params) {
    loggerWarn.apply(console, params);
    sendLog("warn", params.join(" "));
  };
  console.error = function (...params) {
    loggerError.apply(console, params);
    sendLog("error", params.join(" "));
  };
})();
