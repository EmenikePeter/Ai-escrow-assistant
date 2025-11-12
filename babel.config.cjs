// Babel config in CommonJS to avoid ESM interop issues when package.json has type: module
/** @type {import('@babel/core').ConfigFunction} */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      "babel-preset-expo",
      "nativewind/babel",           // NativeWind preset injects CSS interop plugins
    ],
    plugins: [
      [
        "module:react-native-dotenv",
        {
          moduleName: "@env",
          path: ".env",
          safe: false,
          allowUndefined: false,
        },
      ],
      "react-native-reanimated/plugin", // must remain last
    ],
  };
};