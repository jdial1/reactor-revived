package com.jdial.reactor

import android.annotation.SuppressLint
import android.app.Activity
import android.content.res.AssetManager
import android.os.Bundle
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import java.io.IOException

/**
 * The whole Android app: a full-screen WebView serving www/ from the APK's assets.
 *
 * The game is served from a real https:// origin rather than file:// because a
 * modern WebView gives file:// an opaque origin - localStorage is unavailable and
 * ES modules refuse to load. Twenty lines of shouldInterceptRequest buys a stable
 * origin without pulling in androidx.webkit.
 */
private const val HOST = "reactor.local"
private const val START_URL = "https://$HOST/index.html"

class MainActivity : Activity() {

	private lateinit var web: WebView

	@SuppressLint("SetJavaScriptEnabled")
	override fun onCreate(savedInstanceState: Bundle?) {
		super.onCreate(savedInstanceState)

		web = WebView(this)
		web.settings.javaScriptEnabled = true
		web.settings.domStorageEnabled = true
		web.settings.mediaPlaybackRequiresUserGesture = false
		web.webViewClient = AssetClient(assets)
		setContentView(web)

		if (savedInstanceState == null) web.loadUrl(START_URL) else web.restoreState(savedInstanceState)
	}

	override fun onSaveInstanceState(outState: Bundle) {
		super.onSaveInstanceState(outState)
		web.saveState(outState)
	}

	@Suppress("OVERRIDE_DEPRECATION", "DEPRECATION")
	override fun onBackPressed() {
		if (web.canGoBack()) web.goBack() else super.onBackPressed()
	}
}

private class AssetClient(private val assets: AssetManager) : WebViewClient() {

	override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
		if (request.url.host != HOST) return null
		val path = request.url.path.orEmpty().trimStart('/').ifEmpty { "index.html" }
		return try {
			WebResourceResponse(mimeOf(path), "utf-8", assets.open(path))
		} catch (e: IOException) {
			WebResourceResponse("text/plain", "utf-8", 404, "Not Found", emptyMap(), null)
		}
	}

	private fun mimeOf(path: String) = when (path.substringAfterLast('.', "")) {
		"html" -> "text/html"
		"js" -> "text/javascript"
		"css" -> "text/css"
		"json" -> "application/json"
		"svg" -> "image/svg+xml"
		"png" -> "image/png"
		else -> "application/octet-stream"
	}
}
