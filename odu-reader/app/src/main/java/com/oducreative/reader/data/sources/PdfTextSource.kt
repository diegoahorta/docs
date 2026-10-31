package com.oducreative.reader.data.sources

import android.util.LruCache
import com.tom_roush.pdfbox.io.MemoryUsageSetting
import com.tom_roush.pdfbox.pdmodel.PDDocument
import com.tom_roush.pdfbox.text.PDFTextStripper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.io.Closeable
import java.io.File

data class PdfSearchHit(val page: Int, val snippet: String, val matchStart: Int, val matchLength: Int)

/**
 * Acesso à camada de texto do PDF via PdfBox-Android. Funciona apenas quando o PDF possui texto
 * embutido; PDFs digitalizados retornam texto vazio (use o OCR opcional nesses casos).
 * O documento é aberto de forma preguiçosa e com memória limitada (arquivos temporários).
 */
class PdfTextSource(private val file: File) : Closeable {
    private val mutex = Mutex()
    private var doc: PDDocument? = null
    private var failed = false
    private val cache = LruCache<Int, String>(64)

    private fun ensureOpen(): PDDocument? {
        if (failed) return null
        doc?.let { return it }
        return runCatching { PDDocument.load(file, MemoryUsageSetting.setupTempFileOnly()) }
            .onFailure { failed = true }
            .getOrNull()
            ?.also { doc = it }
    }

    /** Texto da página [index] (base 0); string vazia se não houver camada de texto. */
    suspend fun pageText(index: Int): String = withContext(Dispatchers.IO) {
        cache.get(index)?.let { return@withContext it }
        mutex.withLock {
            cache.get(index)?.let { return@withLock it }
            val d = ensureOpen() ?: return@withLock ""
            if (index !in 0 until d.numberOfPages) return@withLock ""
            val text = runCatching {
                PDFTextStripper().apply {
                    startPage = index + 1
                    endPage = index + 1
                    sortByPosition = true
                }.getText(d)
            }.getOrDefault("").trim()
            cache.put(index, text)
            text
        }
    }

    /** Busca textual progressiva, página por página. */
    fun search(query: String, pageCount: Int): Flow<PdfSearchHit> = flow {
        val q = query.trim()
        if (q.isEmpty()) return@flow
        for (p in 0 until pageCount) {
            val text = pageText(p)
            if (text.isEmpty()) continue
            var from = 0
            var hitsOnPage = 0
            while (hitsOnPage < 20) {
                val idx = text.indexOf(q, from, ignoreCase = true)
                if (idx < 0) break
                val start = (idx - 40).coerceAtLeast(0)
                val end = (idx + q.length + 60).coerceAtMost(text.length)
                val snippet = text.substring(start, end).replace('\n', ' ')
                emit(PdfSearchHit(p, snippet, idx - start, q.length))
                from = idx + q.length
                hitsOnPage++
            }
        }
    }.flowOn(Dispatchers.IO)

    suspend fun hasTextLayer(samplePages: Int = 3): Boolean {
        for (i in 0 until samplePages) if (pageText(i).length > 20) return true
        return false
    }

    suspend fun metadata(): Pair<String?, String?> = withContext(Dispatchers.IO) {
        mutex.withLock {
            val info = ensureOpen()?.documentInformation
            info?.title?.takeIf { it.isNotBlank() } to info?.author?.takeIf { it.isNotBlank() }
        }
    }

    override fun close() {
        runCatching { doc?.close() }
        doc = null
        cache.evictAll()
    }
}
