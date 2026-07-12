/**
 * Expo Config Plugin: withAndroidKotlinFix
 *
 * Fixes Android build/runtime issues caused by dependency conflicts between
 * React Native 0.81.x (Kotlin 2.1.20) and third-party native SDKs.
 *
 * Root cause: @clerk/expo v3.x ships clerk-android-ui (Kotlin 2.3.x compiled)
 * which is binary-incompatible with RN's Kotlin 2.1.x ecosystem. The native
 * module is excluded via autolinking in package.json; this plugin handles
 * remaining build-time fixes.
 *
 * What this plugin does:
 *   1. Fixes package declarations in generated Kotlin files (com.coupleai -> com.coupleai.app)
 *   2. Adds -Xskip-metadata-version-check to app kotlinOptions
 *      (handles any remaining Kotlin metadata mismatches at compile time)
 *   3. Excludes duplicate META-INF files (okhttp3 + jspecify conflict)
 *   4. Pins kotlin-stdlib to 2.1.20 in allprojects resolution
 *
 * The heavy lifting (excluding Clerk's native Android module) is done by
 * the autolinking exclusion in package.json:
 *   "expo": { "autolinking": { "android": { "exclude": ["@clerk/expo"] } } }
 */

const { withAppBuildGradle, withProjectBuildGradle, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Part 0: Ensure kotlinx-serialization is present at runtime for RevenueCat
// Global excludes of kotlinx-serialization (from older workarounds) cause
// NoClassDefFoundError in com.revenuecat.purchases.common.Backend.<clinit>.
// ---------------------------------------------------------------------------
const withKotlinxSerializationRuntime = (config) => {
  return withAppBuildGradle(config, (modConfig) => {
    let buildGradle = modConfig.modResults.contents;
    const marker = 'kotlinx-serialization-json:1.7.3';
    if (buildGradle.includes(marker)) {
      return modConfig;
    }
    if (!buildGradle.includes('dependencies {')) {
      return modConfig;
    }
    buildGradle = buildGradle.replace(
      /dependencies\s*\{/,
      `dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
    implementation("com.squareup.okhttp3:okhttp-urlconnection:4.12.0")`
    );
    modConfig.modResults.contents = buildGradle;
    return modConfig;
  });
};

// ---------------------------------------------------------------------------
// Part 0b: OkHttp JavaNetCookieJar (okhttp-urlconnection) for RN + Expo devtools
// Without this: NoClassDefFoundError okhttp3/internal/JavaNetCookieJar during
// ExpoNetworkInspectOkHttpAppInterceptor / ReactCookieJarContainer.
// ---------------------------------------------------------------------------
const withOkhttpUrlConnectionRuntime = (config) => {
  return withAppBuildGradle(config, (modConfig) => {
    let buildGradle = modConfig.modResults.contents;
    const marker = 'okhttp-urlconnection:4.12.0';
    if (buildGradle.includes(marker)) {
      return modConfig;
    }
    const dep =
      '    implementation("com.squareup.okhttp3:okhttp-urlconnection:4.12.0")';
    if (buildGradle.includes('kotlinx-serialization-json:1.7.3')) {
      buildGradle = buildGradle.replace(
        /implementation\("org\.jetbrains\.kotlinx:kotlinx-serialization-json:1\.7\.3"\)/,
        `implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
${dep}`
      );
    } else if (buildGradle.includes('dependencies {')) {
      buildGradle = buildGradle.replace(/dependencies\s*\{/, `dependencies {\n${dep}`);
    }
    modConfig.modResults.contents = buildGradle;
    return modConfig;
  });
};

// ---------------------------------------------------------------------------
// Part 1: Add -Xskip-metadata-version-check to the :app module
// ---------------------------------------------------------------------------
const withAppKotlinOptions = (config) => {
  return withAppBuildGradle(config, (modConfig) => {
    let buildGradle = modConfig.modResults.contents;

    if (buildGradle.includes('Xskip-metadata-version-check')) {
      return modConfig;
    }

    const kotlinOptionsBlock = `
    kotlinOptions {
        freeCompilerArgs += ['-Xskip-metadata-version-check']
    }`;

    if (buildGradle.includes('compileOptions {')) {
      buildGradle = buildGradle.replace(
        /(compileOptions\s*\{[^}]*\})/,
        `$1${kotlinOptionsBlock}`
      );
    } else if (buildGradle.includes('android {')) {
      const androidBlockMatch = buildGradle.match(/android\s*\{/);
      if (androidBlockMatch) {
        const androidStart = androidBlockMatch.index + androidBlockMatch[0].length;
        let depth = 1;
        let i = androidStart;
        while (i < buildGradle.length && depth > 0) {
          if (buildGradle[i] === '{') depth++;
          else if (buildGradle[i] === '}') depth--;
          i++;
        }
        const androidClose = i - 1;
        buildGradle =
          buildGradle.slice(0, androidClose) +
          kotlinOptionsBlock +
          '\n' +
          buildGradle.slice(androidClose);
      }
    }

    modConfig.modResults.contents = buildGradle;
    return modConfig;
  });
};

// ---------------------------------------------------------------------------
// Part 2: Exclude duplicate META-INF files from packaging
// ---------------------------------------------------------------------------
const withPackagingExcludes = (config) => {
  return withAppBuildGradle(config, (modConfig) => {
    let buildGradle = modConfig.modResults.contents;

    if (buildGradle.includes('META-INF/versions/9/OSGI-INF/MANIFEST.MF')) {
      return modConfig;
    }

    const packagingBlock = `
    packaging {
        resources {
            excludes += ['META-INF/versions/9/OSGI-INF/MANIFEST.MF']
        }
    }`;

    const androidBlockMatch = buildGradle.match(/android\s*\{/);
    if (androidBlockMatch) {
      const androidStart = androidBlockMatch.index + androidBlockMatch[0].length;
      let depth = 1;
      let i = androidStart;
      while (i < buildGradle.length && depth > 0) {
        if (buildGradle[i] === '{') depth++;
        else if (buildGradle[i] === '}') depth--;
        i++;
      }
      const androidClose = i - 1;
      buildGradle =
        buildGradle.slice(0, androidClose) +
        packagingBlock +
        '\n' +
        buildGradle.slice(androidClose);
    }

    modConfig.modResults.contents = buildGradle;
    return modConfig;
  });
};

// ---------------------------------------------------------------------------
// Part 3: Pin kotlin-stdlib in allprojects (root build.gradle)
// ---------------------------------------------------------------------------
const withRootGradleResolutionFix = (config) => {
  return withProjectBuildGradle(config, (modConfig) => {
    let buildGradle = modConfig.modResults.contents;

    if (buildGradle.includes('withAndroidKotlinFix')) {
      return modConfig;
    }

    const existingForceBlock = /configurations\.all\s*\{[\s\S]*?resolutionStrategy\s*\{[\s\S]*?force[\s\S]*?\}\s*\}/;

    const newResolutionBlock = `configurations.all {
    // withAndroidKotlinFix: Pin kotlin-stdlib to match RN 0.81.x compiler
    resolutionStrategy.eachDependency { details ->
      if (details.requested.group == 'org.jetbrains.kotlin') {
        if (details.requested.name in ['kotlin-stdlib', 'kotlin-stdlib-jdk7', 'kotlin-stdlib-jdk8', 'kotlin-stdlib-common']) {
          details.useVersion '2.1.20'
          details.because 'Match the Kotlin compiler used by React Native 0.81.x'
        }
      }
    }
  }`;

    if (existingForceBlock.test(buildGradle)) {
      buildGradle = buildGradle.replace(existingForceBlock, newResolutionBlock);
    } else if (buildGradle.includes('allprojects {')) {
      const allprojectsMatch = buildGradle.match(/allprojects\s*\{/);
      if (allprojectsMatch) {
        const allprojectsStart = allprojectsMatch.index + allprojectsMatch[0].length;
        let depth = 1;
        let i = allprojectsStart;
        while (i < buildGradle.length && depth > 0) {
          if (buildGradle[i] === '{') depth++;
          else if (buildGradle[i] === '}') depth--;
          i++;
        }
        const allprojectsClose = i - 1;
        buildGradle =
          buildGradle.slice(0, allprojectsClose) +
          '\n  ' + newResolutionBlock + '\n' +
          buildGradle.slice(allprojectsClose);
      }
    } else {
      const applyPluginIndex = buildGradle.indexOf('apply plugin:');
      if (applyPluginIndex !== -1) {
        buildGradle =
          buildGradle.slice(0, applyPluginIndex) +
          `\nallprojects {\n  ${newResolutionBlock}\n}\n\n` +
          buildGradle.slice(applyPluginIndex);
      }
    }

    modConfig.modResults.contents = buildGradle;
    return modConfig;
  });
};

// ---------------------------------------------------------------------------
// Part 4: Exclude Clerk's incompatible transitive deps from app build
// Autolinking exclusion (package.json) prevents native module registration,
// but Gradle still resolves the clerk-android-ui AAR and its transitive deps.
// We must globally exclude the offending artifacts.
// ---------------------------------------------------------------------------
const withClerkDepsExclusion = (config) => {
  return withAppBuildGradle(config, (modConfig) => {
    let buildGradle = modConfig.modResults.contents;

    if (buildGradle.includes('clerk-deps-exclusion')) {
      return modConfig;
    }

    const block = `
// clerk-deps-exclusion: Remove Clerk native SDK's incompatible transitive deps.
// clerk-android-ui:1.0.9 is compiled against Kotlin 2.3.x — binary-incompatible
// with RN 0.81.x's Kotlin 2.1.x ecosystem. We use JS-based ClerkProvider only.
// NOTE: Only exclude from Clerk — RevenueCat needs kotlinx-serialization at runtime.
configurations.all {
    resolutionStrategy.eachDependency { details ->
        // Pin kotlinx-serialization to a version compatible with Kotlin 2.1.20
        if (details.requested.group == 'org.jetbrains.kotlinx' &&
            details.requested.name.startsWith('kotlinx-serialization')) {
            details.useVersion '1.7.3'
            details.because 'Compatible with both Kotlin 2.1.x (RN) and RevenueCat SDK'
        }
        // Pin okhttp to 4.12.0 — RN 0.81.x uses okhttp 4.x internally.
        // Clerk/RevenueCat may pull in okhttp 5.x which removes okhttp3.internal.Util
        if (details.requested.group == 'com.squareup.okhttp3') {
            details.useVersion '4.12.0'
            details.because 'Match React Native 0.81.x okhttp version — 5.x breaks internal APIs'
        }
    }
}
`;
    buildGradle += '\n' + block;
    modConfig.modResults.contents = buildGradle;
    return modConfig;
  });
};

// ---------------------------------------------------------------------------
// Part 5: Fix package declarations in generated Kotlin source files
// Expo CNG derives package from slug (couple-ai -> com.coupleai) but the
// actual android.package is com.coupleai.app. This corrects the mismatch.
// ---------------------------------------------------------------------------
const withPackageFix = (config) => {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const wrongPackage = 'com.coupleai';
      const correctPackage = 'com.coupleai.app';
      // Hardcoded path within the android project — not derived from external input.
      // nosemgrep: path-join-resolve-traversal
      const srcDir = path.resolve(
        __dirname, '..', 'android', 'app', 'src', 'main', 'java',
        'com', 'coupleai', 'app'
      );

      for (const fileName of ['MainActivity.kt', 'MainApplication.kt']) {
        // nosemgrep: path-join-resolve-traversal
        const filePath = path.join(srcDir, fileName);
        if (fs.existsSync(filePath)) {
          let content = fs.readFileSync(filePath, 'utf8');
          if (content.includes(`package ${wrongPackage}`)) {
            content = content.replace(
              `package ${wrongPackage}`,
              `package ${correctPackage}`
            );
            fs.writeFileSync(filePath, content, 'utf8');
          }
        }
      }

      return modConfig;
    },
  ]);
};

// ---------------------------------------------------------------------------
// Part 6: Patch Clerk's native module for Android compilation
// - Delete Compose-dependent source files (ClerkAuth*, ClerkView*)
// - Add credential + clerk-api deps for Google Sign-In compilation
// - Rewrite dependencies block
// ---------------------------------------------------------------------------
// Files that depend on Compose or clerk-android-api — replaced with no-op stubs
const CLERK_NATIVE_STUBS = {
  'ClerkExpoModule.kt': `package expo.modules.clerk
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableNativeMap
// No-op stub: we use JS-based ClerkProvider, not native Clerk SDK.
// This avoids pulling in clerk-android-api which has kotlinx-serialization
// binary incompatibility with RN 0.81.x (Kotlin 2.1.x vs 2.3.x).
class ClerkExpoModule(reactContext: ReactApplicationContext) :
    NativeClerkModuleSpec(reactContext) {
  override fun getName() = "ClerkExpo"
  @ReactMethod override fun configure(pubKey: String, bearerToken: String?, promise: Promise) {
    promise.resolve(null)
  }
  @ReactMethod override fun presentAuth(options: ReadableMap, promise: Promise) {
    promise.reject("E_NOT_SUPPORTED", "Native Clerk UI not available on Android")
  }
  @ReactMethod override fun presentUserProfile(options: ReadableMap, promise: Promise) {
    promise.reject("E_NOT_SUPPORTED", "Native Clerk UI not available on Android")
  }
  @ReactMethod override fun getSession(promise: Promise) {
    promise.resolve(WritableNativeMap())
  }
  @ReactMethod override fun getClientToken(promise: Promise) {
    promise.resolve(null)
  }
  @ReactMethod override fun signOut(promise: Promise) {
    promise.resolve(null)
  }
}
`,
  'ClerkAuthActivity.kt': `package expo.modules.clerk
import android.app.Activity
class ClerkAuthActivity : Activity()
`,
  'ClerkAuthExpoView.kt': `package expo.modules.clerk
`,
  'ClerkAuthViewManager.kt': `package expo.modules.clerk
import android.view.View
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
class ClerkAuthViewManager : SimpleViewManager<View>() {
  override fun getName() = "ClerkAuthView"
  override fun createViewInstance(context: ThemedReactContext) = View(context)
}
`,
  'ClerkUserProfileActivity.kt': `package expo.modules.clerk
import android.app.Activity
class ClerkUserProfileActivity : Activity()
`,
  'ClerkUserProfileExpoView.kt': `package expo.modules.clerk
`,
  'ClerkUserProfileViewManager.kt': `package expo.modules.clerk
import android.view.View
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
class ClerkUserProfileViewManager : SimpleViewManager<View>() {
  override fun getName() = "ClerkUserProfileView"
  override fun createViewInstance(context: ThemedReactContext) = View(context)
}
`,
  'ClerkViewFactory.kt': `package expo.modules.clerk
`,
  'ClerkViewFactoryInterface.kt': `package expo.modules.clerk
`,
};

const withClerkNativePatches = (config) => {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const clerkSrcDir = path.resolve(
        __dirname, '..', 'node_modules', '@clerk', 'expo', 'android',
        'src', 'main', 'java', 'expo', 'modules', 'clerk'
      );
      const clerkBuildGradle = path.resolve(
        __dirname, '..', 'node_modules', '@clerk', 'expo', 'android', 'build.gradle'
      );
      if (!fs.existsSync(clerkBuildGradle)) return modConfig;

      // 1. Replace Compose-dependent files with no-op stubs
      for (const [file, stub] of Object.entries(CLERK_NATIVE_STUBS)) {
        const filePath = path.join(clerkSrcDir, file);
        fs.writeFileSync(filePath, stub, 'utf8');
      }

      // 2. Rewrite build.gradle with correct deps
      let content = fs.readFileSync(clerkBuildGradle, 'utf8');
      if (content.includes('PATCHED-BY-withClerkNativePatches')) return modConfig;

      // 2a. Remove Compose plugin (binary-incompatible with RN 0.81.x Kotlin)
      content = content.replace(
        /\s*id\s+'org\.jetbrains\.kotlin\.plugin\.compose'.*\n/,
        '\n'
      );

      // 2b. Remove buildFeatures { compose = true }
      content = content.replace(
        /\s*buildFeatures\s*\{\s*\n\s*compose\s*=\s*true\s*\n\s*\}\s*\n/,
        '\n'
      );

      // 2c. Add source excludes for Compose-dependent files
      content = content.replace(
        /java\.srcDirs\s*=\s*\['src\/main\/java',\s*"\$\{project\.buildDir\}\/generated\/source\/codegen\/java"\]/,
        `java {
        srcDirs = ['src/main/java', "\${project.buildDir}/generated/source/codegen/java"]
        exclude '**/ClerkAuthActivity.kt'
        exclude '**/ClerkAuthExpoView.kt'
        exclude '**/ClerkAuthViewManager.kt'
        exclude '**/ClerkUserProfileActivity.kt'
        exclude '**/ClerkUserProfileExpoView.kt'
        exclude '**/ClerkUserProfileViewManager.kt'
        exclude '**/ClerkViewFactory.kt'
        exclude '**/ClerkViewFactoryInterface.kt'
      }`
      );

      // 2d. Replace dependencies block — keep credential deps for Google Sign-In,
      // add clerk-android-api (lighter than clerk-android-ui, no Compose)
      content = content.replace(
        /\/\/ Note:.*\n\ndependencies \{[\s\S]*\}/,
        `// PATCHED-BY-withClerkNativePatches
dependencies {
  implementation 'com.facebook.react:react-native:+'
  implementation "org.jetbrains.kotlinx:kotlinx-coroutines-android:$kotlinxCoroutinesVersion"
  implementation "androidx.credentials:credentials:$credentialsVersion"
  implementation "androidx.credentials:credentials-play-services-auth:$credentialsVersion"
  implementation "com.google.android.libraries.identity.googleid:googleid:$googleIdVersion"
  implementation("com.clerk:clerk-android-api:$clerkAndroidApiVersion") {
    exclude group: 'org.jetbrains.kotlin'
    exclude group: 'org.jetbrains.kotlinx', module: 'kotlinx-serialization-json'
  }
}`
      );

      fs.writeFileSync(clerkBuildGradle, content, 'utf8');
      return modConfig;
    },
  ]);
};

// ---------------------------------------------------------------------------
// Compose and export
// ---------------------------------------------------------------------------
const withAndroidKotlinFix = (config) => {
  config = withPackageFix(config);
  config = withClerkNativePatches(config);
  config = withKotlinxSerializationRuntime(config);
  config = withOkhttpUrlConnectionRuntime(config);
  config = withAppKotlinOptions(config);
  config = withPackagingExcludes(config);
  config = withClerkDepsExclusion(config);
  config = withRootGradleResolutionFix(config);
  return config;
};

module.exports = withAndroidKotlinFix;
