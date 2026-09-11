package com.jdial.reactor

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.content.res.AssetManager
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import org.json.JSONObject
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
private const val EXPORT = 1
private const val IMPORT = 2

class MainActivity : Activity() {

	private lateinit var web: WebView
	private var pending: String? = null

	@SuppressLint("SetJavaScriptEnabled")
	override fun onCreate(savedInstanceState: Bundle?) {
		super.onCreate(savedInstanceState)

		web = WebView(this)
		web.settings.javaScriptEnabled = true
		web.settings.domStorageEnabled = true
		web.webViewClient = AssetClient(assets)
		web.addJavascriptInterface(Bridge(), "Android")
		setContentView(web)
		web.loadUrl("https://$HOST/index.html")
	}

	/**
	 * The only two things the game cannot do for itself. Everything else -
	 * autosave, the game itself - lives in JavaScript.
	 */
	inner class Bridge {
		@JavascriptInterface
		fun exportSave(json: String) {
			pending = json
			pick(Intent.ACTION_CREATE_DOCUMENT, EXPORT)
		}

		@JavascriptInterface
		fun importSave() = pick(Intent.ACTION_OPEN_DOCUMENT, IMPORT)
	}

	/** Bridge methods arrive on a WebView thread; the picker must be started on ours. */
	private fun pick(action: String, code: Int) = runOnUiThread {
		startActivityForResult(
			Intent(action).apply {
				addCategory(Intent.CATEGORY_OPENABLE)
				type = "application/json"
				putExtra(Intent.EXTRA_TITLE, "reactor-revived.json")
			},
			code,
		)
	}

	@Deprecated("startActivityForResult is the AndroidX-free way to use the document picker")
	override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
		@Suppress("DEPRECATION")
		super.onActivityResult(requestCode, resultCode, data)
		val uri = data?.data ?: return
		when (requestCode) {
			EXPORT -> {
				contentResolver.openOutputStream(uri)?.use { it.write(pending.orEmpty().toByteArray()) }
				web.evaluateJavascript("window.saved?.()", null)
			}
			IMPORT -> {
				val json = contentResolver.openInputStream(uri)?.bufferedReader()?.use { it.readText() } ?: return
				web.evaluateJavascript("window.importSave(${JSONObject.quote(json)})", null)
			}
		}
	}
}

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

private val MIME = mapOf(
	"html" to "text/html",
	"js" to "text/javascript",
	"css" to "text/css",
	"png" to "image/png",
)
