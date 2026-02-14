import ExpoModulesCore
import UIKit
import CoreLocation
import MapboxNavigationUIKit
import MapboxNavigationCore
import MapboxDirections
import MapboxMaps

// MARK: - Custom Style that applies React Native color overrides

class CustomDayStyle: StandardDayStyle {
  var customMapStyleURL: URL?
  var customAccentColor: UIColor?
  var customRouteColor: UIColor?
  var customBannerBackgroundColor: UIColor?
  var customBannerTextColor: UIColor?

  override func apply() {
    super.apply()

    if let url = customMapStyleURL {
      mapStyleURL = url
      previewMapStyleURL = url
    }

    let tc = UITraitCollection(userInterfaceIdiom: .phone)

    if let accent = customAccentColor {
      tintColor = accent
      FloatingButton.appearance(for: tc).tintColor = accent
    }

    if let bannerBg = customBannerBackgroundColor {
      TopBannerView.appearance(for: tc).backgroundColor = bannerBg
      InstructionsBannerView.appearance(for: tc).backgroundColor = bannerBg
    }

    if let bannerText = customBannerTextColor {
      PrimaryLabel.appearance(for: tc, whenContainedInInstancesOf: [InstructionsBannerView.self]).normalTextColor = bannerText
      SecondaryLabel.appearance(for: tc, whenContainedInInstancesOf: [InstructionsBannerView.self]).normalTextColor = bannerText
      DistanceLabel.appearance(for: tc, whenContainedInInstancesOf: [InstructionsBannerView.self]).valueTextColor = bannerText
      DistanceLabel.appearance(for: tc, whenContainedInInstancesOf: [InstructionsBannerView.self]).unitTextColor = bannerText.withAlphaComponent(0.7)
    }

    if let route = customRouteColor ?? customAccentColor {
      Task { @MainActor in
        NavigationMapView.appearance(for: tc).routeCasingColor = route.withAlphaComponent(0.8)
      }
    }
  }
}

class CustomNightStyle: StandardNightStyle {
  var customMapStyleURL: URL?
  var customAccentColor: UIColor?
  var customRouteColor: UIColor?
  var customBannerBackgroundColor: UIColor?
  var customBannerTextColor: UIColor?

  override func apply() {
    super.apply()

    if let url = customMapStyleURL {
      mapStyleURL = url
      previewMapStyleURL = url
    }

    let tc = UITraitCollection(userInterfaceIdiom: .phone)

    if let accent = customAccentColor {
      tintColor = accent
      FloatingButton.appearance(for: tc).tintColor = accent
    }

    if let bannerBg = customBannerBackgroundColor {
      TopBannerView.appearance(for: tc).backgroundColor = bannerBg
      InstructionsBannerView.appearance(for: tc).backgroundColor = bannerBg
    }

    if let bannerText = customBannerTextColor {
      PrimaryLabel.appearance(for: tc, whenContainedInInstancesOf: [InstructionsBannerView.self]).normalTextColor = bannerText
      SecondaryLabel.appearance(for: tc, whenContainedInInstancesOf: [InstructionsBannerView.self]).normalTextColor = bannerText
      DistanceLabel.appearance(for: tc, whenContainedInInstancesOf: [InstructionsBannerView.self]).valueTextColor = bannerText
      DistanceLabel.appearance(for: tc, whenContainedInInstancesOf: [InstructionsBannerView.self]).unitTextColor = bannerText.withAlphaComponent(0.7)
    }

    if let route = customRouteColor ?? customAccentColor {
      Task { @MainActor in
        NavigationMapView.appearance(for: tc).routeCasingColor = route.withAlphaComponent(0.8)
      }
    }
  }
}

// MARK: - Hex color parsing

extension UIColor {
  convenience init?(hex: String) {
    var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
    hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")
    guard hexSanitized.count == 6, let rgb = UInt64(hexSanitized, radix: 16) else {
      return nil
    }
    self.init(
      red: CGFloat((rgb >> 16) & 0xFF) / 255.0,
      green: CGFloat((rgb >> 8) & 0xFF) / 255.0,
      blue: CGFloat(rgb & 0xFF) / 255.0,
      alpha: 1.0
    )
  }
}

// MARK: - ExpoMapboxNavigationView

class ExpoMapboxNavigationView: ExpoView {

  // MARK: Event dispatchers

  let onRouteProgressChanged = EventDispatcher()
  let onCancelNavigation = EventDispatcher()
  let onWaypointArrival = EventDispatcher()
  let onFinalDestinationArrival = EventDispatcher()
  let onRouteChanged = EventDispatcher()
  let onUserOffRoute = EventDispatcher()
  let onError = EventDispatcher()

  // MARK: Route configuration

  private var coordinates: [CLLocationCoordinate2D] = []
  var waypointIndices: [Int]?
  var navigationLocale: String?
  var routeProfile: String?
  var isMuted: Bool = false

  // MARK: Appearance configuration

  var mapStyleURL: String?
  var themeMode: String?
  var accentColorHex: String?
  var routeColorHex: String?
  var bannerBackgroundColorHex: String?
  var bannerTextColorHex: String?

  // MARK: Navigation state

  private var navigationViewController: NavigationViewController?
  private var hasStartedNavigation = false

  // MARK: Init

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
  }

  // MARK: Props

  func setCoordinates(_ raw: [[String: Double]]) {
    coordinates = raw.compactMap { dict in
      guard let lat = dict["latitude"], let lng = dict["longitude"] else {
        return nil
      }
      return CLLocationCoordinate2D(latitude: lat, longitude: lng)
    }
    startNavigationIfReady()
  }

  // MARK: Layout

  override func layoutSubviews() {
    super.layoutSubviews()
    navigationViewController?.view.frame = bounds
  }

  // MARK: Style builder

  private func buildStyles() -> [Style] {
    let accentColor = accentColorHex.flatMap { UIColor(hex: $0) }
    let routeColor = routeColorHex.flatMap { UIColor(hex: $0) }
    let bannerBg = bannerBackgroundColorHex.flatMap { UIColor(hex: $0) }
    let bannerText = bannerTextColorHex.flatMap { UIColor(hex: $0) }
    let customURL = mapStyleURL.flatMap { URL(string: $0) }

    let dayStyle = CustomDayStyle()
    dayStyle.customMapStyleURL = customURL
    dayStyle.customAccentColor = accentColor
    dayStyle.customRouteColor = routeColor
    dayStyle.customBannerBackgroundColor = bannerBg
    dayStyle.customBannerTextColor = bannerText

    let nightStyle = CustomNightStyle()
    nightStyle.customMapStyleURL = customURL
    nightStyle.customAccentColor = accentColor
    nightStyle.customRouteColor = routeColor
    nightStyle.customBannerBackgroundColor = bannerBg
    nightStyle.customBannerTextColor = bannerText

    switch themeMode {
    case "night":
      return [nightStyle]
    case "day":
      return [dayStyle]
    default:
      // "auto" or nil -- provide both for automatic day/night switching
      return [dayStyle, nightStyle]
    }
  }

  // MARK: Navigation lifecycle

  private func startNavigationIfReady() {
    guard coordinates.count >= 2, !hasStartedNavigation else { return }
    guard bounds.width > 0 else {
      DispatchQueue.main.async { [weak self] in
        self?.setNeedsLayout()
        self?.layoutIfNeeded()
        self?.startNavigationIfReady()
      }
      return
    }

    hasStartedNavigation = true

    // Build waypoints
    let waypoints = coordinates.enumerated().map { index, coord -> Waypoint in
      var wp = Waypoint(coordinate: coord)
      if let indices = waypointIndices {
        wp.separatesLegs = indices.contains(index)
      }
      return wp
    }

    // Locale and measurement system
    let resolvedLocale: Locale = {
      if let code = navigationLocale {
        return Locale(identifier: code)
      }
      return Locale.current
    }()
    let useMetric = !resolvedLocale.identifier.hasPrefix("en_US")

    // Route options
    var routeOptions = NavigationRouteOptions(waypoints: waypoints)
    routeOptions.locale = resolvedLocale
    routeOptions.distanceMeasurementSystem = useMetric ? .metric : .imperial

    if let profile = routeProfile {
      routeOptions.profileIdentifier = MapboxDirections.ProfileIdentifier(rawValue: profile)
    }

    // Core config
    var coreConfig = CoreConfig()
    coreConfig.locale = resolvedLocale
    coreConfig.unitOfMeasurement = useMetric ? .metric : .imperial

    let provider = MapboxNavigationProvider(coreConfig: coreConfig)
    let mapboxNavigation = provider.mapboxNavigation

    Task { @MainActor in
      do {
        let result = try await mapboxNavigation.routingProvider().calculateRoutes(
          options: routeOptions
        ).value

        let navOptions = NavigationOptions(
          mapboxNavigation: mapboxNavigation,
          voiceController: provider.routeVoiceController,
          eventsManager: provider.eventsManager(),
          styles: self.buildStyles()
        )

        let navVC = NavigationViewController(
          navigationRoutes: result,
          navigationOptions: navOptions
        )
        navVC.delegate = self

        // Apply mute setting
        if self.isMuted {
          provider.routeVoiceController.speechSynthesizer.muted = true
        }

        // Embed navigation view
        navVC.view.frame = self.bounds
        navVC.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        self.addSubview(navVC.view)
        self.navigationViewController = navVC

        if let parentVC = self.findViewController() {
          parentVC.addChild(navVC)
          navVC.didMove(toParent: parentVC)
        }
      } catch {
        self.onError(["message": "Failed to calculate route: \(error.localizedDescription)"])
      }
    }
  }

  private func findViewController() -> UIViewController? {
    var responder: UIResponder? = self
    while let next = responder?.next {
      if let vc = next as? UIViewController { return vc }
      responder = next
    }
    return nil
  }

  // MARK: Cleanup

  deinit {
    navigationViewController?.willMove(toParent: nil)
    navigationViewController?.view.removeFromSuperview()
    navigationViewController?.removeFromParent()
  }
}

// MARK: - NavigationViewControllerDelegate

extension ExpoMapboxNavigationView: NavigationViewControllerDelegate {

  func navigationViewController(
    _ navigationViewController: NavigationViewController,
    didUpdate progress: RouteProgress,
    with location: CLLocation,
    rawLocation: CLLocation
  ) {
    onRouteProgressChanged([
      "distanceRemaining": progress.distanceRemaining,
      "durationRemaining": progress.durationRemaining,
      "distanceTraveled": progress.distanceTraveled,
      "fractionTraveled": progress.fractionTraveled,
    ])
  }

  func navigationViewControllerDidDismiss(
    _ navigationViewController: NavigationViewController,
    byCanceling canceled: Bool
  ) {
    if canceled {
      onCancelNavigation()
    } else {
      onFinalDestinationArrival()
    }
  }

  func navigationViewController(
    _ navigationViewController: NavigationViewController,
    didArriveAt waypoint: Waypoint
  ) -> Bool {
    let index = coordinates.firstIndex { coord in
      coord.latitude == waypoint.coordinate.latitude
        && coord.longitude == waypoint.coordinate.longitude
    } ?? -1

    if index == coordinates.count - 1 {
      onFinalDestinationArrival()
    } else {
      onWaypointArrival(["waypointIndex": index])
    }
    return true
  }

  func navigationViewController(
    _ navigationViewController: NavigationViewController,
    didRerouteAlong route: Route
  ) {
    onRouteChanged()
  }

  func navigationViewController(
    _ navigationViewController: NavigationViewController,
    shouldRerouteFrom location: CLLocation
  ) -> Bool {
    onUserOffRoute()
    return true
  }
}
