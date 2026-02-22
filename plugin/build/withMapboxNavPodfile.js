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
const MAPBOX_NAV_URL = "https://github.com/mapbox/mapbox-navigation-ios.git";
const MAPBOX_NAV_PRODUCTS = ["MapboxNavigationUIKit", "MapboxNavigationCore"];
/**
 * Patches the iOS Podfile to add Mapbox Navigation SPM to the Pods project
 * and link it to the ExpoMapboxNavigation pod target, so the pod compiles
 * with the modules available (works on EAS and locally). Also sets
 * BUILD_LIBRARY_FOR_DISTRIBUTION for Mapbox-related pods.
 */
const withMapboxNavPodfile = (config, { navigationSdkVersion }) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        "ios",
        async (config) => {
            const podfilePath = path.join(config.modRequest.platformProjectRoot, "Podfile");
            let contents = fs.readFileSync(podfilePath, "utf8");
            const versionEscaped = navigationSdkVersion.replace(/'/g, "\\\\'");
            const hook = `
    # @baeckerherz/expo-mapbox-navigation: Mapbox SPM in Pods + BUILD_LIBRARY_FOR_DISTRIBUTION
    mapbox_nav_version = '${versionEscaped}'
    installer.pods_project.targets.each do |target|
      if target.name.start_with?('Mapbox') || target.name == 'Turf'
        target.build_configurations.each do |cfg|
          cfg.build_settings['BUILD_LIBRARY_FOR_DISTRIBUTION'] = 'YES'
        end
      end
    end
    target = installer.pods_project.targets.find { |t| t.name == 'ExpoMapboxNavigation' }
    if target
      project = installer.pods_project
      root = project.root_object
      pkg_ref = root.package_references.find { |r| r.respond_to?(:repositoryURL) && r.repositoryURL == '${MAPBOX_NAV_URL}' }
      unless pkg_ref
        pkg_ref = project.new(Xcodeproj::Project::Object::XCRemoteSwiftPackageReference)
        pkg_ref.repositoryURL = '${MAPBOX_NAV_URL}'
        pkg_ref.requirement = { 'kind' => 'exactVersion', 'version' => mapbox_nav_version }
        root.package_references << pkg_ref
      end
      ${MAPBOX_NAV_PRODUCTS.map((name) => `
      unless target.package_product_dependencies.any? { |d| d.product_name == '${name}' }
        product_dep = project.new(Xcodeproj::Project::Object::XCSwiftPackageProductDependency)
        product_dep.package = pkg_ref
        product_dep.product_name = '${name}'
        target.package_product_dependencies << product_dep
        build_file = project.new(Xcodeproj::Project::Object::PBXBuildFile)
        build_file.product_ref = product_dep
        target.frameworks_build_phases.files << build_file
      end`).join("")}
      project.save
    end`;
            const marker = "@baeckerherz/expo-mapbox-navigation: Mapbox SPM in Pods";
            if (!contents.includes(marker)) {
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
