"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.withMapboxNavPodfile = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Patches the iOS Podfile to make SPM framework products visible
 * to the ExpoMapboxNavigation pod target, and sets BUILD_LIBRARY_FOR_DISTRIBUTION
 * for Mapbox-related pods.
 */
const withMapboxNavPodfile = (config) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        "ios",
        async (config) => {
            const podfilePath = path.join(config.modRequest.platformProjectRoot, "Podfile");
            let contents = fs.readFileSync(podfilePath, "utf8");
            const hook = `
    # @baeckerherz/expo-mapbox-navigation: Make SPM frameworks visible to the pod target
    installer.pods_project.targets.each do |target|
      if target.name == 'ExpoMapboxNavigation'
        target.build_configurations.each do |config|
          shared_products = '$(BUILT_PRODUCTS_DIR)/..'
          config.build_settings['FRAMEWORK_SEARCH_PATHS'] ||= ['$(inherited)']
          config.build_settings['FRAMEWORK_SEARCH_PATHS'] << shared_products
          config.build_settings['SWIFT_INCLUDE_PATHS'] ||= ['$(inherited)']
          config.build_settings['SWIFT_INCLUDE_PATHS'] << shared_products
        end
      end
      if target.name.start_with?('Mapbox') || target.name == 'Turf'
        target.build_configurations.each do |config|
          config.build_settings['BUILD_LIBRARY_FOR_DISTRIBUTION'] = 'YES'
        end
      end
    end`;
            if (!contents.includes("@baeckerherz/expo-mapbox-navigation: Make SPM frameworks")) {
                if (contents.includes("post_install do |installer|")) {
                    contents = contents.replace("post_install do |installer|", `post_install do |installer|${hook}`);
                }
            }
            fs.writeFileSync(podfilePath, contents);
            return config;
        },
    ]);
};
exports.withMapboxNavPodfile = withMapboxNavPodfile;
