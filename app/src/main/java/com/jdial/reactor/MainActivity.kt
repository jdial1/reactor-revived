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
 * ES modules refuse to load. A dozen lines of shouldInterceptRequest buys a stable
 * origin without pulling in androidx.webkit.
 */
private const val HOST = "reactor.local"

class MainActivity : Activity() {

	@SuppressLint("SetJavaScriptEnabled")
	override fun onCreate(savedInstanceState: Bundle?) {
		super.onCreate(savedInstanceState)

		val web = WebView(this)
		web.settings.javaScriptEnabled = true
		web.settings.domStorageEnabled = true
		web.webViewClient = AssetClient(assets)
		setContentView(web)
		web.loadUrl("https://$HOST/index.html")
	}
}

private val MIME = mapOf(
	"html" to "text/html",
	"js" to "text/javascript",
	"css" to "text/css",
	"png" to "image/png",
)

private class AssetClient(private val assets: AssetManager) : WebViewClient() {

	override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
		if (request.url.host != HOST) return null
		val path = request.url.path!!.trimStart('/')
		// The WebView asks for /favicon.ico whether or not we ship one; an
		// uncaught FileNotFoundException here takes the whole process down.
		val body = try { assets.open(path) } catch (e: IOException) { return null }
		return WebResourceResponse(MIME[path.substringAfterLast('.')] ?: "application/octet-stream", "utf-8", body)
	}
}
