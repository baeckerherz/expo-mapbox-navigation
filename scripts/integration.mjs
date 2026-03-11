#!/usr/bin/env node
/**
 * Full integration: build plugin, static checks, link local package in example,
 * prebuild, build Android + iOS, optionally run Maestro E2E.
 * Run from repo root: yarn test:integration [--ios] [--android] [--e2e-only]
 * With no flags, builds both platforms then E2E. --ios/--android build only that platform.
 * --e2e-only: skip build; run only Maestro E2E (assumes app already built/installed on simulator).
 * Requires: MAPBOX_PUBLIC_TOKEN (and MAPBOX_SECRET_TOKEN for Android) in env for prebuild.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { spawnSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const exampleDir = join(root, "example");
const examplePkgPath = join(exampleDir, "package.json");

function run(cmd, args, opts = {}) {
  const cwd = opts.cwd || root;
  const env = { ...process.env, ...opts.env };
  console.log(`\n▶ ${cmd} ${args.join(" ")} (cwd: ${cwd})\n`);
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd, env });
  if (r.status !== 0 && !opts.optional) {
    process.exit(r.status ?? 1);
  }
  return r;
}

function getMaestroPath() {
  const home = process.env.HOME || process.env.USERPROFILE;
  if (home) {
    const p = join(home, ".maestro", "bin", "maestro");
    if (existsSync(p)) return p;
  }
  return null;
}

function hasMaestro() {
  if (getMaestroPath()) return true;
  const r = spawnSync("maestro", ["--version"], { stdio: "pipe" });
  return r.status === 0;
}

function installMaestro() {
  console.log("\n▶ Installing Maestro for E2E...\n");
  const r = spawnSync("bash", ["-c", "curl -Ls 'https://get.maestro.mobile.dev' | bash"], {
    stdio: "inherit",
    env: { ...process.env, PATH: process.env.PATH },
  });
  if (r.status !== 0) {
    console.warn("Maestro install failed (network?). E2E will be skipped.");
    return false;
  }
  return !!getMaestroPath() || spawnSync("maestro", ["--version"], { stdio: "pipe" }).status === 0;
}

function isJdk(javaHome) {
  if (!javaHome || typeof javaHome !== "string") return false;
  if (javaHome.includes("JavaAppletPlugin") || javaHome.includes("Internet Plug-Ins")) return false;
  return existsSync(join(javaHome, "bin", "javac"));
}

function getJavaHomeForGradle() {
  const candidates = [];
  if (process.env.JAVA_HOME) candidates.push(process.env.JAVA_HOME);
  if (process.platform === "darwin") {
    for (const ver of [17, 21, 18, 19, 20]) {
      const r = spawnSync("/usr/libexec/java_home", ["-v", String(ver)], {
        stdio: "pipe",
        encoding: "utf8",
      });
      if (r.status === 0 && r.stdout?.trim()) candidates.push(r.stdout.trim());
    }
  }
  for (const home of candidates) {
    if (getJavaVersion(home) >= 17 && isJdk(home)) return home;
  }
  return null;
}

function getJavaVersion(javaHome) {
  const java = join(javaHome, "bin", "java");
  const r = spawnSync(java, ["-version"], { stdio: "pipe", encoding: "utf8" });
  const out = (r.stderr || r.stdout || "").trim();
  const match = out.match(/version "(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function ensureJava17ForMaestro() {
  let javaHome = getJavaHomeForGradle();
  if (javaHome) return javaHome;
  if (process.platform !== "darwin") return null;
  const hasBrew = spawnSync("which", ["brew"], { stdio: "pipe" }).status === 0;
  if (!hasBrew) return null;
  console.log("\n▶ Maestro requires Java 17+. Installing OpenJDK 17 via Homebrew...\n");
  const r = spawnSync("brew", ["install", "openjdk@17"], { stdio: "inherit" });
  if (r.status !== 0) return null;
  javaHome = getJavaHomeForGradle();
  if (javaHome) return javaHome;
  const brewPrefix = spawnSync("brew", ["--prefix", "openjdk@17"], { stdio: "pipe", encoding: "utf8" });
  const prefix = brewPrefix.stdout?.trim();
  if (prefix) {
    const candidate = join(prefix, "libexec", "openjdk.jdk", "Contents", "Home");
    if (existsSync(join(candidate, "bin", "java")) && getJavaVersion(candidate) >= 17) return candidate;
  }
  return null;
}

const EXAMPLE_BUNDLE_ID = "com.example.mapboxnav";
const EXAMPLE_IOS_APP_NAME = "MapboxNavExample";

function getBootedSimulatorUdid() {
  const r = spawnSync("xcrun", ["simctl", "list", "devices", "available", "--json"], {
    stdio: "pipe",
    encoding: "utf8",
  });
  if (r.status !== 0 || !r.stdout) return null;
  let list;
  try {
    list = JSON.parse(r.stdout);
  } catch {
    return null;
  }
  const runtimes = list.devices || {};
  for (const runtime of Object.keys(runtimes).sort().reverse()) {
    if (!runtime.includes("iOS")) continue;
    const devices = runtimes[runtime] || [];
    const booted = devices.find((d) => d.state === "Booted");
    if (booted) return booted.udid;
  }
  return null;
}

function bootSimulatorAndReturnUdid() {
  const r = spawnSync("xcrun", ["simctl", "list", "devices", "available", "--json"], {
    stdio: "pipe",
    encoding: "utf8",
  });
  if (r.status !== 0 || !r.stdout) return null;
  let list;
  try {
    list = JSON.parse(r.stdout);
  } catch {
    return null;
  }
  const runtimes = list.devices || {};
  for (const runtime of Object.keys(runtimes).sort().reverse()) {
    if (!runtime.includes("iOS")) continue;
    const devices = runtimes[runtime] || [];
    const device = devices.find((d) => d.name && d.name.startsWith("iPhone"));
    if (device) {
      spawnSync("xcrun", ["simctl", "boot", device.udid], { stdio: "pipe" });
      return device.udid;
    }
  }
  return null;
}

function ensureSimulatorRunning() {
  let udid = getBootedSimulatorUdid();
  if (udid) return udid;
  console.log("\n▶ Booting iOS Simulator...\n");
  udid = bootSimulatorAndReturnUdid();
  if (udid) {
    console.log("Waiting 5s for simulator to be ready...\n");
    spawnSync("sleep", ["5"], { stdio: "pipe" });
  }
  return udid;
}

function installAndLaunchAppOnSimulator(udid, appPath, bundleId) {
  if (appPath && existsSync(appPath)) {
    console.log("\n▶ Installing app on simulator...\n");
    const install = spawnSync("xcrun", ["simctl", "install", udid, appPath], { stdio: "inherit" });
    if (install.status !== 0) return false;
  }
  console.log("\n▶ Launching app on simulator...\n");
  const launch = spawnSync("xcrun", ["simctl", "launch", udid, bundleId], { stdio: "inherit" });
  if (launch.status !== 0) return false;
  console.log("Waiting 4s for app to be ready...\n");
  spawnSync("sleep", ["4"], { stdio: "pipe" });
  return true;
}

const args = process.argv.slice(2);
const e2eOnly = args.includes("--e2e-only");
const onlyIos = args.includes("--ios");
const onlyAndroid = args.includes("--android");
const buildAndroid = !e2eOnly && (onlyAndroid || !onlyIos);
const buildIos = !e2eOnly && (onlyIos || !onlyAndroid);

let restored = null;
function restorePackageJson() {
  if (restored != null) writeFileSync(examplePkgPath, JSON.stringify(restored, null, 2) + "\n");
}

if (!e2eOnly) {
  const pkg = JSON.parse(readFileSync(examplePkgPath, "utf8"));
  const originalDep = pkg.dependencies["@baeckerherz/expo-mapbox-navigation"];
  if (!originalDep) {
    console.error("Example package.json has no @baeckerherz/expo-mapbox-navigation dependency.");
    process.exit(1);
  }
  restored = { ...pkg };
  pkg.dependencies["@baeckerherz/expo-mapbox-navigation"] = "file:..";
  writeFileSync(examplePkgPath, JSON.stringify(pkg, null, 2) + "\n");
}

try {
  if (!e2eOnly) {
  // 1) Release checks (plugin build + native static checks)
  run("yarn", ["check"]);

  // 2) Install in example with local package
  run("yarn", ["install"], { cwd: exampleDir });

  // 3) Prebuild (generates ios/ and android/)
  if (!process.env.MAPBOX_PUBLIC_TOKEN) {
    console.warn("MAPBOX_PUBLIC_TOKEN not set; prebuild may fail. Set it for full integration.");
  }
  run("npx", ["expo", "prebuild", "--clean"], { cwd: exampleDir });

  if (buildAndroid) {
    // 5) Build Android (Gradle requires JVM 17+)
    const androidDir = join(exampleDir, "android");
    const javaHome = getJavaHomeForGradle();
    if (!javaHome) {
      console.error(
        "Android build requires a JDK 17+ (not a JRE). Set JAVA_HOME to a full JDK installation.\n" +
          "  macOS: brew install openjdk@17 && export JAVA_HOME=$(/usr/libexec/java_home -v 17)\n" +
          "  (Rejecting JRE/Applet Plugin; Gradle needs a JDK with javac.)"
      );
      process.exit(1);
    }
    console.log(`\n▶ Using JAVA_HOME=${javaHome} for Gradle (JVM 17+)\n`);
    run("./gradlew", ["assembleDebug"], {
      cwd: androidDir,
      env: { ...process.env, JAVA_HOME: javaHome },
    });
  } else {
    console.log("\n⊘ Skipping Android build (--ios only)\n");
  }

  if (buildIos) {
    // 6) Build iOS (Simulator destination so no code signing required)
    const iosDir = join(exampleDir, "ios");
    const workspace = "MapboxNavExample.xcworkspace";
    run(
      "xcodebuild",
      [
        "-workspace", workspace,
        "-scheme", "MapboxNavExample",
        "-destination", "generic/platform=iOS Simulator",
        "-configuration", "Debug",
        "-derivedDataPath", "build",
        "build",
      ],
      { cwd: iosDir }
    );
  } else {
    console.log("\n⊘ Skipping iOS build (--android only)\n");
  }
  }

  // Maestro E2E: ensure Java 17+ (install if needed), install Maestro if missing, then run
  let ranMaestro = false;
  if (!hasMaestro()) {
    installMaestro();
  }
  const maestroPath = getMaestroPath();
  const maestroBin = maestroPath || "maestro";
  const canRunMaestro = maestroPath || hasMaestro();
  if (canRunMaestro) {
    let javaHome = getJavaHomeForGradle();
    if (!javaHome) {
      javaHome = ensureJava17ForMaestro();
    }
    if (!javaHome) {
      console.log("\n⊘ Maestro needs Java 17+. Install with: brew install openjdk@17 && export JAVA_HOME=$(/usr/libexec/java_home -v 17). Skip E2E.\n");
    } else if (process.platform !== "darwin") {
      console.log("\n⊘ Maestro E2E (iOS simulator) is only supported on macOS. Skip E2E.\n");
    } else {
      const udid = ensureSimulatorRunning();
      if (!udid) {
        console.log("\n⊘ No iOS simulator available. Skip E2E.\n");
      } else {
        const appPath = join(
          exampleDir,
          "ios",
          "build",
          "Build",
          "Products",
          "Debug-iphonesimulator",
          `${EXAMPLE_IOS_APP_NAME}.app`
        );
        const launched = installAndLaunchAppOnSimulator(udid, appPath, EXAMPLE_BUNDLE_ID);
        if (!launched) {
          const hint = !appPath || !existsSync(appPath)
            ? " Run a full integration (or yarn test:integration --ios) first so the app is built and installed."
            : "";
          console.log("\n⊘ Could not install/launch app on simulator. Skip E2E." + hint + "\n");
        } else {
          console.log("\n▶ Running Maestro E2E (navigation + route refresh)...\n");
          const baseEnv = maestroPath
            ? { ...process.env, PATH: `${join(process.env.HOME || process.env.USERPROFILE || "", ".maestro", "bin")}:${process.env.PATH || ""}` }
            : process.env;
          const env = { ...baseEnv, JAVA_HOME: javaHome };
          const r = spawnSync(maestroBin, ["test", ".maestro"], {
            stdio: "inherit",
            cwd: exampleDir,
            env,
          });
          ranMaestro = r.status === 0;
        }
      }
    }
  } else {
    console.log("\n⊘ Maestro not available; skip E2E (install requires network).");
  }

  const parts = e2eOnly
    ? (ranMaestro ? ["Maestro E2E"] : [])
    : ["checks"].concat(
        buildAndroid ? ["Android build"] : [],
        buildIos ? ["iOS build"] : [],
        ranMaestro ? ["Maestro"] : []
      );
  const msg = parts.length ? "Integration passed: " + parts.join(", ") : "E2E skipped (Maestro not available).";
  console.log("\n✅ " + msg + "\n");
} finally {
  restorePackageJson();
}
