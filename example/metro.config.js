const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Prevent Metro from walking up into sibling projects
config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = [
  require("path").resolve(__dirname, "node_modules"),
];

module.exports = config;
