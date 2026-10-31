package com.oducreative.reader.features.studytools

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

data class DictionaryEntry(val partOfSpeech: String, val language: String, val definitions: List<String>)

/**
 * Dicionário contextual.
 *  - Local: encaminha a palavra para apps de dicionário instalados (ACTION_PROCESS_TEXT) — offline.
 *  - Online (opcional, desativado por padrão): Wiktionary REST API. Envia SOMENTE a palavra consultada.
 */
class DictionaryService(private val context: Context) {

    fun localDictionaryApps(): List<android.content.pm.ResolveInfo> {
        val intent = Intent(Intent.ACTION_PROCESS_TEXT).setType("text/plain")
        return context.packageManager.queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY)
            .filter { it.activityInfo.packageName != context.packageName }
    }

    fun processTextIntent(word: String, info: android.content.pm.ResolveInfo): Intent =
        Intent(Intent.ACTION_PROCESS_TEXT)
            .setType("text/plain")
            .setClassName(info.activityInfo.packageName, info.activityInfo.name)
            .putExtra(Intent.EXTRA_PROCESS_TEXT, word)
            .putExtra(Intent.EXTRA_PROCESS_TEXT_READONLY, true)

    fun isOnline(): Boolean {
        val cm = context.getSystemService(ConnectivityManager::class.java) ?: return false
        val caps = cm.getNetworkCapabilities(cm.activeNetwork) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    suspend fun lookupOnline(word: String): Result<List<DictionaryEntry>> = withContext(Dispatchers.IO) {
        runCatching {
            val w = word.trim().trim { !it.isLetterOrDigit() }
            require(w.isNotEmpty()) { "Selecione uma palavra." }
            if (!isOnline()) error("Sem conexão com a internet. O dicionário online requer conexão.")
            val url = URL("https://en.wiktionary.org/api/rest_v1/page/definition/" + URLEncoder.encode(w, "UTF-8").replace("+", "%20"))
            val conn = (url.openConnection() as HttpURLConnection).apply {
                connectTimeout = 8000; readTimeout = 8000
                setRequestProperty("User-Agent", "ODUReader/1.0 (Android; educational reader)")
                setRequestProperty("Accept", "application/json")
            }
            try {
                when (conn.responseCode) {
                    200 -> parseWiktionary(conn.inputStream.bufferedReader().readText())
                    404 -> emptyList()
                    else -> error("Serviço de dicionário indisponível (HTTP ${conn.responseCode}).")
                }
            } finally {
                conn.disconnect()
            }
        }
    }

    companion object {
        fun parseWiktionary(json: String): List<DictionaryEntry> {
            val root = JSONObject(json)
            val out = mutableListOf<DictionaryEntry>()
            for (key in root.keys()) {
                val arr = root.optJSONArray(key) ?: continue
                for (i in 0 until arr.length()) {
                    val e = arr.optJSONObject(i) ?: continue
                    val defs = e.optJSONArray("definitions") ?: continue
                    val list = (0 until defs.length()).mapNotNull { j ->
                        defs.optJSONObject(j)?.optString("definition")?.let(::stripHtml)?.takeIf { it.isNotBlank() }
                    }
                    if (list.isNotEmpty()) out += DictionaryEntry(e.optString("partOfSpeech"), e.optString("language", key), list.take(6))
                }
            }
            return out
        }

        fun stripHtml(s: String): String = s.replace(Regex("<[^>]+>"), "").replace("&nbsp;", " ")
            .replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", "\"").trim()
    }
}
