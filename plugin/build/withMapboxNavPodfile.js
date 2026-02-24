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
const PLUGIN_MARKER = "# @baeckerherz/expo-mapbox-navigation:";
/**
 * Injects a post_install hook that:
 *  1. Adds Mapbox Navigation SDK as an SPM dependency in the Pods project,
 *     linking only MapboxNavigationUIKit to ExpoMapboxNavigation. Using a
 *     single top-level product avoids duplicate xcframework signature copies
 *     during archiving (MapboxCommon appears in multiple transitive chains).
 *  2. Sets FRAMEWORK_SEARCH_PATHS / SWIFT_INCLUDE_PATHS so the pod can find
 *     all SPM-built modules (including transitive deps like MapboxDirections).
 *  3. Enables BUILD_LIBRARY_FOR_DISTRIBUTION on Mapbox/Turf targets.
 */
const withMapboxNavPodfile = (config, { navigationSdkVersion }) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        "ios",
        async (config) => {
            const podfilePath = path.join(config.modRequest.platformProjectRoot, "Podfile");
            let contents = fs.readFileSync(podfilePath, "utf8");
            const versionEscaped = navigationSdkVersion.replace(/'/g, "\\\\'");
            const hook = `
    ${PLUGIN_MARKER} SPM in Pods + search paths + BUILD_LIBRARY_FOR_DISTRIBUTION
    mapbox_nav_version = '${versionEscaped}'
    installer.pods_project.targets.each do |target|
      if target.name.start_with?('Mapbox') || target.name == 'Turf'
        target.build_configurations.each do |cfg|
          cfg.build_settings['BUILD_LIBRARY_FOR_DISTRIBUTION'] = 'YES'
        end
      end
      if target.name == 'ExpoMapboxNavigation'
        target.build_configurations.each do |cfg|
          paths = ['$(inherited)', '$(BUILT_PRODUCTS_DIR)/PackageFrameworks', '$(BUILT_PRODUCTS_DIR)/..', '$(BUILT_PRODUCTS_DIR)/$(CONFIGURATION)$(EFFECTIVE_PLATFORM_NAME)']
          cfg.build_settings['FRAMEWORK_SEARCH_PATHS'] = paths
          cfg.build_settings['SWIFT_INCLUDE_PATHS'] = paths
        end
      end
    end
    emn_target = installer.pods_project.targets.find { |t| t.name == 'ExpoMapboxNavigation' }
    if emn_target
      project = installer.pods_project
      root = project.root_object
      pkg_ref = root.package_references&.find { |r| r.respond_to?(:repositoryURL) && r.repositoryURL == '${MAPBOX_NAV_URL}' }
      unless pkg_ref
        pkg_ref = project.new(Xcodeproj::Project::Object::XCRemoteSwiftPackageReference)
        pkg_ref.repositoryURL = '${MAPBOX_NAV_URL}'
        pkg_ref.requirement = { 'kind' => 'exactVersion', 'version' => mapbox_nav_version }
        root.package_references << pkg_ref
      end
      unless emn_target.package_product_dependencies.any? { |d| d.product_name == 'MapboxNavigationUIKit' }
        dep = project.new(Xcodeproj::Project::Object::XCSwiftPackageProductDependency)
        dep.package = pkg_ref
        dep.product_name = 'MapboxNavigationUIKit'
        emn_target.package_product_dependencies << dep
        if emn_target.frameworks_build_phases
          bf = project.new(Xcodeproj::Project::Object::PBXBuildFile)
          bf.product_ref = dep
          emn_target.frameworks_build_phases.files << bf
        end
      end
    end
    # SPM binary xcframeworks are linked via OTHER_LDFLAGS but not embedded
    # because the SPM product deps are on the pod target (static lib), not
    # the app target. We add script phases to embed them and strip duplicate
    # signatures (Xcode 17 bug).
    user_proj = installer.aggregate_targets.first&.user_project
    if user_proj
      app_target = user_proj.targets.first
      d = '$'
      mapbox_fws = %w[MapboxCommon MapboxCoreMaps MapboxNavigationNative]

      embed_name = 'EmbedMapboxFrameworks'
      unless app_target.shell_script_build_phases.any? { |p| p.name == embed_name }
        phase = app_target.new_shell_script_build_phase(embed_name)
        phase.shell_script = "FRAMEWORKS_DIR=\\"#{d}{BUILT_PRODUCTS_DIR}/#{d}{FRAMEWORKS_FOLDER_PATH}\\"\\nmkdir -p \\"#{d}{FRAMEWORKS_DIR}\\"\\nfor fw in #{mapbox_fws.join(' ')}; do\\n  SRC=\\"#{d}{BUILT_PRODUCTS_DIR}/#{d}{fw}.framework\\"\\n  if [ -d \\"#{d}{SRC}\\" ]; then\\n    cp -R \\"#{d}{SRC}\\" \\"#{d}{FRAMEWORKS_DIR}/\\"\\n    codesign --force --sign \\"#{d}{EXPANDED_CODE_SIGN_IDENTITY}\\" \\"#{d}{FRAMEWORKS_DIR}/#{d}{fw}.framework\\"\\n  fi\\ndone\\n"
      end

      strip_name = 'StripXCFrameworkSignatures'
      unless app_target.shell_script_build_phases.any? { |p| p.name == strip_name }
        phase = app_target.new_shell_script_build_phase(strip_name)
        phase.shell_script = "DERIVED_ROOT=\\"#{d}{BUILD_DIR%/Build/*}\\"\\nfind \\"#{d}{DERIVED_ROOT}\\" -name \\"*.xcframework-*.signature\\" -delete 2>/dev/null\\nexit 0\\n"
      end

      user_proj.save
    end`;
            const escapedMarker = PLUGIN_MARKER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            // Remove any previously injected hook (handles upgrades from older plugin versions)
            if (contents.includes(PLUGIN_MARKER)) {
                contents = contents.replace(new RegExp(`\\n    ${escapedMarker}[\\s\\S]*?(?=\\n  end\\nend)`), "");
            }
            // Inject after react_native_post_install, before the post_install block closes
            if (!contents.includes(PLUGIN_MARKER)) {
                const insertion = /(ccache_enabled\?\(podfile_properties\),\n\s*\))\s*\n(  end\nend)/;
                if (insertion.test(contents)) {
                    contents = contents.replace(insertion, (_match, p1, p2) => `${p1}\n${hook}\n${p2}`);
                }
            }
            fs.writeFileSync(podfilePath, contents);
            return config;
        },
    ]);
};
exports.withMapboxNavPodfile = withMapboxNavPodfile;
