const codegenNativeCommands = (options = {}) => {
  const { supportedCommands = [] } = options;
  const commandMap = {};

  supportedCommands.forEach((command) => {
    commandMap[command] = () => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`codegenNativeCommands: '${command}' is not supported on web.`);
      }
    };
  });

  return commandMap;
};

module.exports = codegenNativeCommands;
module.exports.default = codegenNativeCommands;
