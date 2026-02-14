require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoMapboxNavigation'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = 'Bäckerherz'
  s.homepage       = 'https://github.com/baeckerherz/expo-mapbox-navigation'
  s.platforms      = { ios: '15.0' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.{h,m,mm,swift}'
  s.exclude_files = 'Tests/'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
  }

  # Mapbox Navigation SDK v3 binary xcframeworks must be linked by the app
  # target (static pods can't link dynamic frameworks).
  s.user_target_xcconfig = {
    'OTHER_LDFLAGS' => '$(inherited) -framework "MapboxNavigationNative" -framework "MapboxCommon" -framework "MapboxCoreMaps"',
  }
end
