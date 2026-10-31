package com.oducreative.reader.features.texttospeech

import com.oducreative.reader.core.utilities.TextSegmenter
import com.oducreative.reader.data.sources.PdfTextSource
import org.readium.r2.shared.publication.Locator
import org.readium.r2.shared.publication.Publication
import org.readium.r2.shared.publication.services.content.Content
import org.readium.r2.shared.publication.services.content.content
import java.io.Closeable
import java.io.File

/** Um trecho a ser pronunciado, com a âncora de onde veio (para seguir/destacar no leitor). */
data class TtsSegment(
    val text: String,
    val page: Int? = null,
    val locator: Locator? = null,
    val language: String? = null,
)

/** Fornece trechos sob demanda — permite ler livros inteiros sem carregar tudo na memória. */
interface TtsSource : Closeable {
    val bookId: Long?
    val title: String
    val languageHint: String?
    suspend fun next(): TtsSegment?
    override fun close() {}
}

class TextTtsSource(
    text: String,
    override val title: String = "Trecho selecionado",
    override val languageHint: String? = null,
    override val bookId: Long? = null,
) : TtsSource {
    private val queue = ArrayDeque(TextSegmenter.sentences(text))
    override suspend fun next(): TtsSegment? = queue.removeFirstOrNull()?.let { TtsSegment(it, language = languageHint) }
}

/** Lê um PDF a partir de uma página, usando a camada de texto (PDFs digitalizados não têm texto). */
class PdfTtsSource(
    file: File,
    private var page: Int,
    private val pageCount: Int,
    override val bookId: Long,
    override val title: String,
    override val languageHint: String?,
) : TtsSource {
    private val text = PdfTextSource(file)
    private val queue = ArrayDeque<String>()
    private var emptyPagesInRow = 0

    override suspend fun next(): TtsSegment? {
        while (queue.isEmpty()) {
            if (page >= pageCount) return null
            val sentences = TextSegmenter.sentences(text.pageText(page))
            if (sentences.isEmpty()) {
                emptyPagesInRow++
                if (emptyPagesInRow >= 5) return null // provavelmente digitalizado
                page++
                continue
            }
            emptyPagesInRow = 0
            queue.addAll(sentences)
            page++
        }
        return TtsSegment(queue.removeFirst(), page = page - 1, language = languageHint)
    }

    override fun close() = text.close()
}

/** Lê um EPUB a partir de um Locator usando a Content API do Readium. */
class EpubTtsSource(
    private val publication: Publication,
    start: Locator?,
    override val bookId: Long,
    override val title: String,
    override val languageHint: String?,
) : TtsSource {
    private val iterator: Content.Iterator? = publication.content(start)?.iterator()
    private val pending = ArrayDeque<TtsSegment>()

    override suspend fun next(): TtsSegment? {
        val it = iterator ?: return null
        while (pending.isEmpty()) {
            val element = runCatching { it.nextOrNull() }.getOrNull() ?: return null
            val textual = element as? Content.TextualElement ?: continue
            val t = textual.text?.trim().orEmpty()
            if (t.isEmpty()) continue
            val lang = element.language?.code ?: languageHint
            TextSegmenter.sentences(t, maxLen = 1000).forEach { s ->
                pending += TtsSegment(s, locator = element.locator, language = lang)
            }
        }
        return pending.removeFirst()
    }

    override fun close() = publication.close()
}
