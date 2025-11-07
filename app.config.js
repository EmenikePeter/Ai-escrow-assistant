module.exports = ({ config, ...props }) => {
  const isWeb = props?.platform === "web";

  return {
    expo: {
      name: "Ai-escrow ASssistant",
      slug: "ai-escrow-assistant",
      owner: "emenike14",
      version: "1.1.0",
      orientation: "portrait",
      icon: "./assets/images/escrowassistant_logo_512x512.png",
      scheme: "aiescrowassistant",
      userInterfaceStyle: "automatic",
      newArchEnabled: true,

      ios: { supportsTablet: true },

      android: {
        package: "com.escroassistant.app",
        versionCode: 1,
        icon: "./assets/images/escrowassistant_logo_512x512.png",
        adaptiveIcon: {
          foregroundImage: "./assets/images/escrowassistant_logo_512x512.png",
          backgroundColor: "#FFFFFF"
        },
        permissions: [
          "CAMERA",
          "READ_CONTACTS",
          "WRITE_CONTACTS",
          "RECORD_AUDIO" // needed for voice notes
        ],
        edgeToEdgeEnabled: true
      },

      web: {
        bundler: "metro",
        output: "static",
        favicon: "./assets/images/favicon.png"
      },

      plugins: [
        [
          "expo-splash-screen",
          {
            image: "./assets/images/escrowassistant_logo_1024x1024.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
          }
        ],

        // ✅ expo-video plugin config
        [
          "expo-video",
          {
            supportsBackgroundPlayback: true,
            supportsPictureInPicture: true
          }
        ],

        // ✅ expo-audio plugin config
        [
          "expo-audio",
          {
            microphonePermission: "Allow Escrow Assistant to record voice notes.",
            recordAudioAndroid: true
          }
        ],

        [
          "expo-build-properties",
          {
            android: {
              enableProguardInReleaseBuilds: true
            }
          }
        ]
      ],

      experiments: { typedRoutes: true },

      splash: {
        image: "./assets/images/escrowassistant_logo_1024x1024.png",
        resizeMode: "contain",
        backgroundColor: "#FFFFFF"
      },

      extra: {
        router: {},
        eas: { projectId: "401ee476-9a36-4688-9932-8038d29a3867" }
      }
    }
  };
};