import { withXcodeProject, ConfigPlugin } from "@expo/config-plugins";

interface SPMConfig {
  navigationSdkVersion: string;
}

/**
 * Injects Mapbox Navigation SDK v3 as a Swift Package Manager dependency
 * into the Xcode project's .pbxproj. This avoids vendoring .xcframework files.
 *
 * Adds XCRemoteSwiftPackageReference, XCSwiftPackageProductDependency,
 * and links MapboxNavigationUIKit + MapboxNavigationCore to the main target.
 */
export const withMapboxNavSPM: ConfigPlugin<SPMConfig> = (
  config,
  { navigationSdkVersion }
) => {
  return withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;

    const repoName = "mapbox-navigation-ios";
    const repoUrl = "https://github.com/mapbox/mapbox-navigation-ios.git";
    const products = ["MapboxNavigationUIKit", "MapboxNavigationCore"];

    if (!xcodeProject.hash.project.objects["XCRemoteSwiftPackageReference"]) {
      xcodeProject.hash.project.objects["XCRemoteSwiftPackageReference"] = {};
    }
    if (
      !xcodeProject.hash.project.objects["XCSwiftPackageProductDependency"]
    ) {
      xcodeProject.hash.project.objects["XCSwiftPackageProductDependency"] =
        {};
    }

    // Idempotent: skip if already added
    const existingRefs = Object.values(
      xcodeProject.hash.project.objects["XCRemoteSwiftPackageReference"]
    );
    const alreadyAdded = existingRefs.some(
      (ref: any) =>
        typeof ref === "object" && ref.repositoryURL === repoUrl
    );
    if (alreadyAdded) return config;

    // XCRemoteSwiftPackageReference
    const packageRefUuid = xcodeProject.generateUuid();
    xcodeProject.hash.project.objects["XCRemoteSwiftPackageReference"][
      packageRefUuid
    ] = {
      isa: "XCRemoteSwiftPackageReference",
      repositoryURL: repoUrl,
      requirement: { kind: "exactVersion", version: navigationSdkVersion },
    };
    xcodeProject.hash.project.objects["XCRemoteSwiftPackageReference"][
      `${packageRefUuid}_comment`
    ] = `XCRemoteSwiftPackageReference "${repoName}"`;

    // Add to PBXProject packageReferences
    const projectKey = Object.keys(
      xcodeProject.hash.project.objects["PBXProject"]
    ).find((key) => !key.includes("_comment"));

    if (projectKey) {
      const project =
        xcodeProject.hash.project.objects["PBXProject"][projectKey];
      if (!project.packageReferences) project.packageReferences = [];
      project.packageReferences.push(packageRefUuid);
    }

    // For each product: add dependency, build file, and link
    for (const productName of products) {
      const productDepUuid = xcodeProject.generateUuid();
      xcodeProject.hash.project.objects["XCSwiftPackageProductDependency"][
        productDepUuid
      ] = {
        isa: "XCSwiftPackageProductDependency",
        package: packageRefUuid,
        productName,
      };
      xcodeProject.hash.project.objects["XCSwiftPackageProductDependency"][
        `${productDepUuid}_comment`
      ] = productName;

      const buildFileUuid = xcodeProject.generateUuid();
      xcodeProject.hash.project.objects["PBXBuildFile"][buildFileUuid] = {
        isa: "PBXBuildFile",
        productRef: productDepUuid,
        productRef_comment: productName,
      };
      xcodeProject.hash.project.objects["PBXBuildFile"][
        `${buildFileUuid}_comment`
      ] = `${productName} in Frameworks`;

      const frameworkPhaseKey = Object.keys(
        xcodeProject.hash.project.objects["PBXFrameworksBuildPhase"]
      ).find((key) => !key.includes("_comment"));

      if (frameworkPhaseKey) {
        const phase =
          xcodeProject.hash.project.objects["PBXFrameworksBuildPhase"][
            frameworkPhaseKey
          ];
        if (!phase.files) phase.files = [];
        phase.files.push(buildFileUuid);
      }

      const nativeTargetKey = Object.keys(
        xcodeProject.hash.project.objects["PBXNativeTarget"]
      ).find((key) => !key.includes("_comment"));

      if (nativeTargetKey) {
        const target =
          xcodeProject.hash.project.objects["PBXNativeTarget"][
            nativeTargetKey
          ];
        if (!target.packageProductDependencies)
          target.packageProductDependencies = [];
        target.packageProductDependencies.push(productDepUuid);
      }
    }

    return config;
  });
};
