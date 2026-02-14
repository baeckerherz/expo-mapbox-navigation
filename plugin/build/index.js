"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

// withMapboxNavSPM: Inject SPM package references into .pbxproj
function withMapboxNavSPM(config, { navigationSdkVersion }) {
  return (0, config_plugins_1.withXcodeProject)(config, (config) => {
    const xcodeProject = config.modResults;
    const repoUrl = "https://github.com/mapbox/mapbox-navigation-ios.git";
    const repoName = "mapbox-navigation-ios";
    const products = ["MapboxNavigationUIKit", "MapboxNavigationCore"];

    if (!xcodeProject.hash.project.objects["XCRemoteSwiftPackageReference"])
      xcodeProject.hash.project.objects["XCRemoteSwiftPackageReference"] = {};
    if (!xcodeProject.hash.project.objects["XCSwiftPackageProductDependency"])
      xcodeProject.hash.project.objects["XCSwiftPackageProductDependency"] = {};

    const existingRefs = Object.values(xcodeProject.hash.project.objects["XCRemoteSwiftPackageReference"]);
    if (existingRefs.some((ref) => typeof ref === "object" && ref.repositoryURL === repoUrl))
      return config;

    const packageRefUuid = xcodeProject.generateUuid();
    xcodeProject.hash.project.objects["XCRemoteSwiftPackageReference"][packageRefUuid] = {
      isa: "XCRemoteSwiftPackageReference",
      repositoryURL: repoUrl,
      requirement: { kind: "exactVersion", version: navigationSdkVersion },
    };
    xcodeProject.hash.project.objects["XCRemoteSwiftPackageReference"][`${packageRefUuid}_comment`] =
      `XCRemoteSwiftPackageReference "${repoName}"`;

    const projectKey = Object.keys(xcodeProject.hash.project.objects["PBXProject"])
      .find((key) => !key.includes("_comment"));
    if (projectKey) {
      const project = xcodeProject.hash.project.objects["PBXProject"][projectKey];
      if (!project.packageReferences) project.packageReferences = [];
      project.packageReferences.push(packageRefUuid);
    }

    for (const productName of products) {
      const productDepUuid = xcodeProject.generateUuid();
      xcodeProject.hash.project.objects["XCSwiftPackageProductDependency"][productDepUuid] = {
        isa: "XCSwiftPackageProductDependency",
        package: packageRefUuid,
        productName,
      };
      xcodeProject.hash.project.objects["XCSwiftPackageProductDependency"][`${productDepUuid}_comment`] = productName;

      const buildFileUuid = xcodeProject.generateUuid();
      xcodeProject.hash.project.objects["PBXBuildFile"][buildFileUuid] = {
        isa: "PBXBuildFile",
        productRef: productDepUuid,
        productRef_comment: productName,
      };
      xcodeProject.hash.project.objects["PBXBuildFile"][`${buildFileUuid}_comment`] =
        `${productName} in Frameworks`;

      const frameworkPhaseKey = Object.keys(xcodeProject.hash.project.objects["PBXFrameworksBuildPhase"])
        .find((key) => !key.includes("_comment"));
      if (frameworkPhaseKey) {
        const phase = xcodeProject.hash.project.objects["PBXFrameworksBuildPhase"][frameworkPhaseKey];
        if (!phase.files) phase.files = [];
        phase.files.push(buildFileUuid);
      }

      const nativeTargetKey = Object.keys(xcodeProject.hash.project.objects["PBXNativeTarget"])
        .find((key) => !key.includes("_comment"));
      if (nativeTargetKey) {
        const target = xcodeProject.hash.project.objects["PBXNativeTarget"][nativeTargetKey];
        if (!target.packageProductDependencies) target.packageProductDependencies = [];
        target.packageProductDependencies.push(productDepUuid);
      }
    }
    return config;
  });
}

// withMapboxNavPodfile: Patch Podfile for SPM framework visibility
function withMapboxNavPodfile(config) {
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
}

// withMapboxNavGradle: Add Mapbox Maven repo to Android build.gradle
function withMapboxNavGradle(config) {
  return (0, config_plugins_1.withProjectBuildGradle)(config, (config) => {
    let contents = config.modResults.contents;
    if (!contents.includes("api.mapbox.com/downloads/v2/releases/maven")) {
      const mapboxMaven = `
        // @baeckerherz/expo-mapbox-navigation: Mapbox Navigation SDK Maven repository
        maven {
            url = uri("https://api.mapbox.com/downloads/v2/releases/maven")
            authentication {
                create<BasicAuthentication>("basic")
            }
            credentials {
                username = "mapbox"
                password = providers.gradleProperty("MAPBOX_DOWNLOADS_TOKEN").getOrElse("")
            }
        }`;
      contents = contents.replace(
        /allprojects\s*\{\s*repositories\s*\{/,
        `allprojects {\n    repositories {${mapboxMaven}`
      );
    }
    config.modResults.contents = contents;
    return config;
  });
}

// Main plugin: composes all three
function withMapboxNavigation(config, { mapboxAccessToken, mapboxSecretToken, navigationSdkVersion = "3.5.0" } = {}) {
  if (!mapboxAccessToken) {
    throw new Error("[@baeckerherz/expo-mapbox-navigation] mapboxAccessToken is required.");
  }

  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};
  config.ios.infoPlist.MBXAccessToken = mapboxAccessToken;
  config.ios.infoPlist.UIBackgroundModes = [
    ...(config.ios.infoPlist.UIBackgroundModes || []),
    "audio",
    "location",
  ];
  config.ios.infoPlist.NSLocationWhenInUseUsageDescription =
    config.ios.infoPlist.NSLocationWhenInUseUsageDescription ||
    "This app needs your location for turn-by-turn navigation.";
  config.ios.infoPlist.NSLocationAlwaysAndWhenInUseUsageDescription =
    config.ios.infoPlist.NSLocationAlwaysAndWhenInUseUsageDescription ||
    "This app needs your location for turn-by-turn navigation, including in the background.";

  config = withMapboxNavSPM(config, { navigationSdkVersion });
  config = withMapboxNavPodfile(config);
  config = withMapboxNavGradle(config);

  return config;
}

module.exports = (0, config_plugins_1.createRunOncePlugin)(
  withMapboxNavigation,
  "@baeckerherz/expo-mapbox-navigation",
  "0.1.0"
);
