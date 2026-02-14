import { ConfigPlugin } from "@expo/config-plugins";
interface PluginConfig {
    /** Mapbox public access token (pk.xxx). Required for the native SDK. */
    mapboxAccessToken: string;
    /** Mapbox secret/download token (sk.xxx). Required for SPM and Maven auth. */
    mapboxSecretToken?: string;
    /** Mapbox Navigation SDK version. Default: "3.5.0" */
    navigationSdkVersion?: string;
}
declare const _default: ConfigPlugin<PluginConfig>;
export default _default;
