import { ConfigPlugin } from "@expo/config-plugins";
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
export declare const withMapboxNavSPM: ConfigPlugin<SPMConfig>;
export {};
