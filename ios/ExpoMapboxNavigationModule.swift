import ExpoModulesCore

public class ExpoMapboxNavigationModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoMapboxNavigation")

    View(ExpoMapboxNavigationView.self) {
      Events(
        "onRouteProgressChanged",
        "onCancelNavigation",
        "onWaypointArrival",
        "onFinalDestinationArrival",
        "onRouteChanged",
        "onUserOffRoute",
        "onError"
      )

      // Route
      Prop("coordinates") { (view, coordinates: [[String: Double]]) in
        view.setCoordinates(coordinates)
      }

      Prop("waypointIndices") { (view, indices: [Int]) in
        view.waypointIndices = indices
      }

      Prop("routeProfile") { (view, profile: String) in
        view.routeProfile = profile
      }

      // Localization
      Prop("locale") { (view, locale: String) in
        view.navigationLocale = locale
      }

      Prop("mute") { (view, mute: Bool) in
        view.isMuted = mute
      }

      // Appearance
      Prop("mapStyle") { (view, style: String) in
        view.mapStyleURL = style
      }

      Prop("themeMode") { (view, mode: String) in
        view.themeMode = mode
      }

      Prop("accentColor") { (view, color: String) in
        view.accentColorHex = color
      }

      Prop("routeColor") { (view, color: String) in
        view.routeColorHex = color
      }

      Prop("bannerBackgroundColor") { (view, color: String) in
        view.bannerBackgroundColorHex = color
      }

      Prop("bannerTextColor") { (view, color: String) in
        view.bannerTextColorHex = color
      }
    }
  }
}
