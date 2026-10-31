package com.oducreative.reader.data.sources

import android.content.Context
import org.readium.r2.shared.publication.Publication
import org.readium.r2.shared.publication.services.isRestricted
import org.readium.r2.shared.util.asset.AssetRetriever
import org.readium.r2.shared.util.getOrElse
import org.readium.r2.shared.util.http.DefaultHttpClient
import org.readium.r2.streamer.PublicationOpener
import org.readium.r2.streamer.parser.DefaultPublicationParser
import java.io.File

/**
 * Ponto único de acesso ao Readium Kotlin Toolkit para abrir EPUBs locais.
 * Publicações com DRM não são abertas (nenhuma ContentProtection é registrada) — o app
 * não tenta remover proteções.
 */
class ReadiumServices(context: Context) {
    private val appContext = context.applicationContext
    private val httpClient = DefaultHttpClient()
    val assetRetriever = AssetRetriever(appContext.contentResolver, httpClient)
    private val publicationOpener = PublicationOpener(
        publicationParser = DefaultPublicationParser(
            appContext,
            httpClient = httpClient,
            assetRetriever = assetRetriever,
            pdfFactory = null,
        ),
    )

    class OpenException(message: String) : Exception(message)

    suspend fun open(file: File): Publication {
        val asset = assetRetriever.retrieve(file).getOrElse {
            throw OpenException("Não foi possível ler o arquivo: ${it.message}")
        }
        val publication = publicationOpener.open(asset, allowUserInteraction = false).getOrElse {
            asset.close()
            throw OpenException("EPUB inválido, corrompido ou protegido por DRM: ${it.message}")
        }
        if (publication.isRestricted) {
            publication.close()
            throw OpenException("Este livro é protegido por DRM e não pode ser aberto pelo ODU Reader.")
        }
        return publication
    }
}
