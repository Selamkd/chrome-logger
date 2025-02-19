const defaultConsole = console.log;
console.log = function (...args) {
  defaultConsole.apply(console, args);

  chrome.runtime.sendMessage({
    type: "LOG",
    content: args
      .map((arg) => {
        try {
          return typeof arg === "object" ? JSON.stringify(arg) : String(arg);
        } catch (e) {
          return "[Unable to stringify]";
        }
      })
      .join(" "),
  });
};
