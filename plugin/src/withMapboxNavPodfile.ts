import { withDangerousMod, ConfigPlugin } from "@expo/config-plugins";
import * as fs from "fs";
import * as path from "path";

const MAPBOX_NAV_URL = "https://github.com/mapbox/mapbox-navigation-ios.git";
const MAPBOX_NAV_PRODUCTS = ["MapboxNavigationUIKit", "MapboxNavigationCore"];

interface PodfileOptions {
  navigationSdkVersion: string;
}

/**
 * Patches the iOS Podfile to add Mapbox Navigation SPM to the Pods project
 * and link it to the ExpoMapboxNavigation pod target, so the pod compiles
 * with the modules available (works on EAS and locally). Also sets
 * BUILD_LIBRARY_FOR_DISTRIBUTION for Mapbox-related pods.
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
      ${MAPBOX_NAV_PRODUCTS.map(
        (name) => `
      unless target.package_product_dependencies.any? { |d| d.product_name == '${name}' }
        product_dep = project.new(Xcodeproj::Project::Object::XCSwiftPackageProductDependency)
        product_dep.package = pkg_ref
        product_dep.product_name = '${name}'
        target.package_product_dependencies << product_dep
        build_file = project.new(Xcodeproj::Project::Object::PBXBuildFile)
        build_file.product_ref = product_dep
        target.frameworks_build_phases.files << build_file
      end`
      ).join("")}
      project.save
    end`;

      const marker = "@baeckerherz/expo-mapbox-navigation: Mapbox SPM in Pods";
      if (!contents.includes(marker)) {
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
