import { ConfigPlugin } from "@expo/config-plugins";
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
export declare const withMapboxArchiveFix: ConfigPlugin;
