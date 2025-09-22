const { getDefaultConfig } = require("@expo/metro-config");

const config = getDefaultConfig(__dirname);

// Ustaw port Metro na 19002 (unikaj 8081)
config.server = {
  port: 19002,
};

module.exports = config;
