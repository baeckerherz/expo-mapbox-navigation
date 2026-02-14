import { withXcodeProject, ConfigPlugin } from "@expo/config-plugins";

const SCRIPT_NAME = "StripXCFrameworkSignatures";

/**
 * Adds a Run Script build phase to the app target that removes xcframework
 * .signature files from the build directory before the archive step.
 *
 * Xcode 17 has a bug where SPM binary xcframeworks that appear in multiple
 * transitive dependency paths (e.g. MapboxCommon, used by both
 * MapboxNavigationNative and MapboxCoreMaps) cause duplicate .signature
 * file copies during archive creation, failing with "item already exists".
 *
 * These .signature files are package integrity checks (not code signing)
 * and are not required for App Store distribution.
 */
export const withMapboxArchiveFix: ConfigPlugin = (config) => {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;

    const nativeTargetKey = Object.keys(
      project.hash.project.objects["PBXNativeTarget"]
    ).find((key) => !key.includes("_comment"));

    if (!nativeTargetKey) return config;

    const target =
      project.hash.project.objects["PBXNativeTarget"][nativeTargetKey];

    const alreadyAdded = (target.buildPhases || []).some((phase: any) => {
      const phaseUuid = typeof phase === "object" ? phase.value : phase;
      const comment =
        project.hash.project.objects["PBXShellScriptBuildPhase"]?.[
          `${phaseUuid}_comment`
        ];
      return comment === SCRIPT_NAME;
    });
    if (alreadyAdded) return config;

    if (!project.hash.project.objects["PBXShellScriptBuildPhase"]) {
      project.hash.project.objects["PBXShellScriptBuildPhase"] = {};
    }

    const uuid = project.generateUuid();
    project.hash.project.objects["PBXShellScriptBuildPhase"][uuid] = {
      isa: "PBXShellScriptBuildPhase",
      buildActionMask: 2147483647,
      files: [],
      inputPaths: [],
      name: SCRIPT_NAME,
      outputPaths: [],
      runOnlyForDeploymentPostprocessing: 0,
      shellPath: "/bin/sh",
      shellScript:
        'DERIVED_ROOT=$(echo "$BUILD_DIR" | sed "s|.Build.*||")\\nfind "$DERIVED_ROOT" -name "*.xcframework-*.signature" -delete 2>/dev/null\\nexit 0\\n',
    };
    project.hash.project.objects["PBXShellScriptBuildPhase"][
      `${uuid}_comment`
    ] = SCRIPT_NAME;

    if (!target.buildPhases) target.buildPhases = [];
    target.buildPhases.push(uuid);

    return config;
  });
};
