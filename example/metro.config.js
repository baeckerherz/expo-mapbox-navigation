const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Only resolve modules from this project and the parent module (expo-mapbox-nav-prototype)
// Prevents Metro from picking up dependencies from sibling projects in the workspace
const projectRoot = __dirname;
const moduleRoot = path.resolve(__dirname, "..");

config.watchFolders = [moduleRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(moduleRoot, "node_modules"),
];

// Block resolution from going further up the tree
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
