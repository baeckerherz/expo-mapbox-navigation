import { withDangerousMod, ConfigPlugin } from "@expo/config-plugins";
import * as fs from "fs";
import * as path from "path";

/**
 * Patches the iOS Podfile to make SPM framework products visible
 * to the ExpoMapboxNavigation pod target, and sets BUILD_LIBRARY_FOR_DISTRIBUTION
 * for Mapbox-related pods.
 */
export const withMapboxNavPodfile: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );
      let contents = fs.readFileSync(podfilePath, "utf8");

      const hook = `
    # @baeckerherz/expo-mapbox-navigation: Make SPM frameworks visible to the pod target
    installer.pods_project.targets.each do |target|
      if target.name == 'ExpoMapboxNavigation'
        target.build_configurations.each do |config|
          spm_frameworks = '$(BUILT_PRODUCTS_DIR)/PackageFrameworks'
          config.build_settings['FRAMEWORK_SEARCH_PATHS'] ||= ['$(inherited)']
          config.build_settings['FRAMEWORK_SEARCH_PATHS'] << spm_frameworks
          config.build_settings['SWIFT_INCLUDE_PATHS'] ||= ['$(inherited)']
          config.build_settings['SWIFT_INCLUDE_PATHS'] << spm_frameworks
          config.build_settings['OTHER_LDFLAGS'] ||= ['$(inherited)']
          config.build_settings['OTHER_LDFLAGS'] << '-Wl,-rpath,@loader_path/../Frameworks'
        end
      end
      if target.name.start_with?('Mapbox') || target.name == 'Turf'
        target.build_configurations.each do |config|
          config.build_settings['BUILD_LIBRARY_FOR_DISTRIBUTION'] = 'YES'
        end
      end
    end`;

      if (
        !contents.includes(
          "@baeckerherz/expo-mapbox-navigation: Make SPM frameworks"
        )
      ) {
        if (contents.includes("post_install do |installer|")) {
          contents = contents.replace(
            "post_install do |installer|",
            `post_install do |installer|${hook}`
          );
        }
      }

      fs.writeFileSync(podfilePath, contents);
      return config;
    },
  ]);
};
