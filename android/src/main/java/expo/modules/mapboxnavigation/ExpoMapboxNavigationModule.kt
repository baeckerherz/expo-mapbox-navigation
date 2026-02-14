package expo.modules.mapboxnavigation

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoMapboxNavigationModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoMapboxNavigation")

    View(ExpoMapboxNavigationView::class) {
      Events(
        "onRouteProgressChanged",
        "onCancelNavigation",
        "onWaypointArrival",
        "onFinalDestinationArrival",
        "onRouteChanged",
        "onUserOffRoute",
        "onError"
      )

      Prop("coordinates") { view: ExpoMapboxNavigationView, coordinates: List<Map<String, Double>> ->
        view.setCoordinates(coordinates)
      }

      Prop("waypointIndices") { view: ExpoMapboxNavigationView, indices: List<Int> ->
        view.waypointIndices = indices
      }

      Prop("locale") { view: ExpoMapboxNavigationView, locale: String ->
        view.navigationLocale = locale
      }

      Prop("routeProfile") { view: ExpoMapboxNavigationView, profile: String ->
        view.routeProfile = profile
      }

      Prop("mute") { view: ExpoMapboxNavigationView, mute: Boolean ->
        view.isMuted = mute
      }

      Prop("mapStyle") { view: ExpoMapboxNavigationView, style: String ->
        view.mapStyleURL = style
      }

      Prop("themeMode") { view: ExpoMapboxNavigationView, mode: String ->
        view.themeMode = mode
      }

      Prop("accentColor") { view: ExpoMapboxNavigationView, color: String ->
        view.accentColorHex = color
      }

      Prop("routeColor") { view: ExpoMapboxNavigationView, color: String ->
        view.routeColorHex = color
      }

      Prop("bannerBackgroundColor") { view: ExpoMapboxNavigationView, color: String ->
        view.bannerBackgroundColorHex = color
      }

      Prop("bannerTextColor") { view: ExpoMapboxNavigationView, color: String ->
        view.bannerTextColorHex = color
      }
    }
  }
}
