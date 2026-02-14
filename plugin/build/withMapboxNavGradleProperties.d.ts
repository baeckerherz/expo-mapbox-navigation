import { ConfigPlugin } from "@expo/config-plugins";
/**
 * Injects MAPBOX_DOWNLOADS_TOKEN into android/gradle.properties so the
 * Mapbox Maven repository can authenticate when resolving Navigation SDK.
 */
export declare const withMapboxNavGradleProperties: ConfigPlugin<{
    mapboxSecretToken?: string;
}>;
