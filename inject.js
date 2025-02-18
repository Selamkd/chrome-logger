(function () {
  const consoleInfo = console.log;
  const consoleWarn = console.warn;
  const orginalError = console.error;

  function sendMessage(level, args) {
    window.postMessage({ type: "console_log", level, message: args }, "*");
  }

  console.log = function (...args) {
    sendMessage("log", args);
    originalLog.apply(console, args);
  };

  console.warn = function (...args) {
    sendMessage("warn", args);
    originalWarn.apply(console, args);
  };

  console.error = function (...args) {
    sendMessage("error", args);
    originalError.apply(console, args);
  };
});
