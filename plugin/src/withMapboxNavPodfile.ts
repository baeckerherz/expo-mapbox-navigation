import { withDangerousMod, ConfigPlugin } from "@expo/config-plugins";
import * as fs from "fs";
import * as path from "path";

const MAPBOX_NAV_URL = "https://github.com/mapbox/mapbox-navigation-ios.git";

const PLUGIN_MARKER = "# @baeckerherz/expo-mapbox-navigation:";

interface PodfileOptions {
  navigationSdkVersion: string;
}

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
export const withMapboxNavPodfile: ConfigPlugin<PodfileOptions> = (
  config,
  { navigationSdkVersion }
) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );
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
    # Xcode 17 bug: SPM binary xcframeworks sharing transitive deps cause
    # duplicate .signature file copies during archive creation. Strip them.
    user_proj = installer.aggregate_targets.first&.user_project
    if user_proj
      app_target = user_proj.targets.first
      phase_name = 'StripXCFrameworkSignatures'
      unless app_target.shell_script_build_phases.any? { |p| p.name == phase_name }
        phase = app_target.new_shell_script_build_phase(phase_name)
        d = '$'
        phase.shell_script = "DERIVED_ROOT=\\"#{d}{BUILD_DIR%/Build/*}\\"\\nfind \\"#{d}{DERIVED_ROOT}\\" -name \\"*.xcframework-*.signature\\" -delete 2>/dev/null\\nexit 0\\n"
      end
      user_proj.save
    end`;

      const escapedMarker = PLUGIN_MARKER.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      // Remove any previously injected hook (handles upgrades from older plugin versions)
      if (contents.includes(PLUGIN_MARKER)) {
        contents = contents.replace(
          new RegExp(
            `\\n    ${escapedMarker}[\\s\\S]*?(?=\\n  end\\nend)`
          ),
          ""
        );
      }

      // Inject after react_native_post_install, before the post_install block closes
      if (!contents.includes(PLUGIN_MARKER)) {
        const insertion =
          /(ccache_enabled\?\(podfile_properties\),\n\s*\))\s*\n(  end\nend)/;
        if (insertion.test(contents)) {
          contents = contents.replace(insertion, (_match, p1, p2) => `${p1}\n${hook}\n${p2}`);
        }
      }

      fs.writeFileSync(podfilePath, contents);
      return config;
    },
  ]);
};
