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

	// The game lives in www/ at the repo root so it can be opened in a desktop
	// browser during development; the APK ships those exact same files.
	sourceSets["main"].assets.srcDirs("../www")
}
