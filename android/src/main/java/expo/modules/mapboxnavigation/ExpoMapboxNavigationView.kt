package expo.modules.mapboxnavigation

import android.content.Context
import android.widget.FrameLayout
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import com.mapbox.geojson.Point
import com.mapbox.navigation.base.route.NavigationRoute
import com.mapbox.navigation.core.MapboxNavigation
import com.mapbox.navigation.core.lifecycle.MapboxNavigationApp
import com.mapbox.navigation.core.trip.session.RouteProgressObserver
import com.mapbox.navigation.core.trip.session.OffRouteObserver
import com.mapbox.navigation.core.directions.session.RoutesObserver
import com.mapbox.navigation.dropin.NavigationView
import com.mapbox.api.directions.v5.DirectionsCriteria
import com.mapbox.api.directions.v5.models.RouteOptions

class ExpoMapboxNavigationView(
  context: Context,
  appContext: AppContext
) : ExpoView(context, appContext) {

  private val onRouteProgressChanged by EventDispatcher()
  private val onCancelNavigation by EventDispatcher()
  private val onWaypointArrival by EventDispatcher()
  private val onFinalDestinationArrival by EventDispatcher()
  private val onRouteChanged by EventDispatcher()
  private val onUserOffRoute by EventDispatcher()
  private val onError by EventDispatcher()

  private var coordinates: List<Point> = emptyList()
  var waypointIndices: List<Int>? = null
  var navigationLocale: String? = null
  var routeProfile: String? = null
  var isMuted: Boolean = false
  var mapStyleURL: String? = null
  var themeMode: String? = null
  var accentColorHex: String? = null
  var routeColorHex: String? = null
  var bannerBackgroundColorHex: String? = null
  var bannerTextColorHex: String? = null

  private var navigationView: NavigationView? = null
  private var hasStartedNavigation = false

  fun setCoordinates(raw: List<Map<String, Double>>) {
    coordinates = raw.mapNotNull { map ->
      val lat = map["latitude"] ?: return@mapNotNull null
      val lng = map["longitude"] ?: return@mapNotNull null
      Point.fromLngLat(lng, lat)
    }
    startNavigationIfReady()
  }

  private fun startNavigationIfReady() {
    if (coordinates.size < 2 || hasStartedNavigation) return
    hasStartedNavigation = true

    try {
      val navView = NavigationView(context)
      navView.layoutParams = FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.MATCH_PARENT,
        FrameLayout.LayoutParams.MATCH_PARENT
      )
      addView(navView)
      navigationView = navView

      val profile = routeProfile ?: DirectionsCriteria.PROFILE_DRIVING_TRAFFIC
      val routeOptions = RouteOptions.builder()
        .coordinatesList(coordinates)
        .profile(profile)
        .alternatives(true)
        .continueStraight(true)
        .overview(DirectionsCriteria.OVERVIEW_FULL)
        .steps(true)
        .voiceInstructions(true)
        .bannerInstructions(true)
        .apply {
          waypointIndices?.let { indices ->
            waypointIndices(indices.joinToString(separator = ";"))
          }
          navigationLocale?.let { locale ->
            language(locale)
          }
        }
        .build()

      MapboxNavigationApp.current()?.let { navigation ->
        registerObservers(navigation)

        navigation.requestRoutes(routeOptions, object :
          com.mapbox.navigation.core.directions.session.RoutesRequestCallback {
          override fun onRoutesReady(routes: List<NavigationRoute>) {
            if (routes.isNotEmpty()) {
              navigation.setNavigationRoutes(routes)
            } else {
              onError(mapOf("message" to "No routes found"))
            }
          }

          override fun onRoutesRequestFailure(
            throwable: Throwable,
            routeOptions: RouteOptions
          ) {
            onError(mapOf("message" to "Route request failed: ${throwable.message}"))
          }

          override fun onRoutesRequestCanceled(routeOptions: RouteOptions) {
            onError(mapOf("message" to "Route request cancelled"))
          }
        })
      } ?: run {
        onError(mapOf("message" to "MapboxNavigation not initialized"))
      }
    } catch (e: Exception) {
      onError(mapOf("message" to "Navigation setup failed: ${e.message}"))
    }
  }

  private fun registerObservers(navigation: MapboxNavigation) {
    navigation.registerRouteProgressObserver(RouteProgressObserver { routeProgress ->
      onRouteProgressChanged(mapOf(
        "distanceRemaining" to routeProgress.distanceRemaining,
        "durationRemaining" to routeProgress.durationRemaining,
        "distanceTraveled" to routeProgress.distanceTraveled,
        "fractionTraveled" to routeProgress.fractionTraveled
      ))

      val currentLegProgress = routeProgress.currentLegProgress
      if (currentLegProgress != null) {
        val distanceToEnd = currentLegProgress.distanceRemaining
        if (distanceToEnd <= 30.0) {
          val legIndex = routeProgress.currentLegProgress?.legIndex ?: 0
          val totalLegs = routeProgress.route.legs()?.size ?: 1

          if (legIndex == totalLegs - 1) {
            onFinalDestinationArrival(emptyMap<String, Any>())
          } else {
            onWaypointArrival(mapOf("waypointIndex" to legIndex))
          }
        }
      }
    })

    navigation.registerOffRouteObserver(OffRouteObserver { isOffRoute ->
      if (isOffRoute) {
        onUserOffRoute(emptyMap<String, Any>())
      }
    })

    navigation.registerRoutesObserver(RoutesObserver { result ->
      if (result.navigationRoutes.isNotEmpty()) {
        onRouteChanged(emptyMap<String, Any>())
      }
    })
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    navigationView?.let { removeView(it) }
    navigationView = null
  }
}
