#!/usr/bin/env node
/**
 * Pre-release checks for expo-mapbox-navigation.
 * Catches regressions in native route-refresh behaviour (single provider on iOS, clear+callback on Android).
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

let failed = false;

function fail(msg) {
  console.error("❌", msg);
  failed = true;
}

function ok(msg) {
  console.log("✓", msg);
}

// --- iOS: single MapboxNavigationProvider (avoid "two simultaneous active navigation cores") ---
const iosPath = join(root, "ios", "ExpoMapboxNavigationView.swift");
const iosSrc = readFileSync(iosPath, "utf8");

const providerAllocations = iosSrc.match(/MapboxNavigationProvider\s*\(/g);
if (!providerAllocations || providerAllocations.length !== 1) {
  fail(
    `iOS: expected exactly one MapboxNavigationProvider( allocation, found ${providerAllocations?.length ?? 0}. Must reuse one provider to avoid "two simultaneous active navigation cores".`
  );
} else {
  ok("iOS: single MapboxNavigationProvider allocation");
}

if (!iosSrc.includes("navigationProvider == nil")) {
  fail('iOS: allocation of MapboxNavigationProvider must be guarded by "if navigationProvider == nil"');
} else {
  ok('iOS: provider allocation guarded by nil check');
}

if (!iosSrc.includes("private var navigationProvider")) {
  fail("iOS: must have stored property 'navigationProvider' to reuse the provider");
} else {
  ok("iOS: navigationProvider property present");
}

// --- Android: clear routes with empty list + callback before starting new route ---
const androidPath = join(root, "android", "src", "main", "java", "expo", "modules", "mapboxnavigation", "ExpoMapboxNavigationView.kt");
const androidSrc = readFileSync(androidPath, "utf8");

if (!androidSrc.includes("setNavigationRoutes(emptyList()")) {
  fail("Android: must call setNavigationRoutes(emptyList(), ...) when clearing routes");
} else {
  ok("Android: routes cleared with emptyList()");
}

if (!androidSrc.includes("RoutesSetCallback")) {
  fail("Android: must use RoutesSetCallback when clearing (async); start new route only in callback");
} else {
  ok("Android: RoutesSetCallback used for clear");
}

if (failed) {
  process.exit(1);
}
console.log("\nAll release checks passed.");
