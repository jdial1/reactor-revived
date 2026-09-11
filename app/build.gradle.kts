// AGP 9 has built-in Kotlin support, so there is no Kotlin plugin here - and no
// dependencies block at all. The app is one Activity on the platform WebView.
plugins {
	id("com.android.application")
}

android {
	namespace = "com.jdial.reactor"
	compileSdk = 36

	defaultConfig {
		applicationId = "com.jdial.reactor"
		minSdk = 28
		targetSdk = 36
		versionCode = 1
		versionName = "1.0"
	}

	// Without this the release APK was 2.24 MB, of which 2.42 MB uncompressed
	// was classes.dex: the whole Kotlin runtime, shipped to run one Activity.
	// R8 takes that dex to 9 KB. The default rules keep @JavascriptInterface
	// members, which is what the save/load bridge needs.
	buildTypes {
		release {
			isMinifyEnabled = true
			isShrinkResources = true
			proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"))
		}
	}

	// Kotlin's reflection metadata describes classes nothing here reflects on.
	packaging {
		resources.excludes += setOf("kotlin/**", "META-INF/*.version", "DebugProbesKt.bin")
	}

	// The game lives in www/ at the repo root so it can be opened in a desktop
	// browser during development; the APK ships those exact same files.
	sourceSets["main"].assets.srcDirs("../www")
}
