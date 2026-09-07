pluginManagement {
	// AGP itself pulls gson/jsr305 from Maven Central; the app has no dependencies.
	repositories { google(); mavenCentral() }
}
dependencyResolutionManagement {
	repositories { google(); mavenCentral() }
}

rootProject.name = "reactor-revived"
include(":app")
