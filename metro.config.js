const { getDefaultConfig } = require("@expo/metro-config");

const config = getDefaultConfig(__dirname);

// Ustaw port Metro na 19002 (unikaj 8081)
config.server = {
  port: 19002,
};

// Konfiguracja dla web build - wyklucz native moduły
config.resolver = {
  ...config.resolver,
  alias: {
    ...config.resolver?.alias,
    // Przekieruj react-native-maps na pusty moduł dla web
    'react-native-maps': false,
  },
  blockList: [
    // Blokuj native moduły dla web build
    /react-native-maps/,
  ],
};

module.exports = config;
