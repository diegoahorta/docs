package com.oducreative.reader.features.studytools

import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.common.model.RemoteModelManager
import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.TranslateRemoteModel
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.TranslatorOptions
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * Tradução com Google ML Kit on-device. O texto é traduzido NO APARELHO; a internet só é
 * usada uma vez para baixar o modelo de cada idioma (~30 MB). Recurso desativado por padrão e
 * habilitado explicitamente pelo usuário nas configurações.
 */
class TranslationService {

    fun supported(tag: String?): String? = tag?.substringBefore('-')?.lowercase()?.let { TranslateLanguage.fromLanguageTag(it) }

    suspend fun isModelDownloaded(lang: String): Boolean = suspendCancellableCoroutine { cont ->
        RemoteModelManager.getInstance().isModelDownloaded(TranslateRemoteModel.Builder(lang).build())
            .addOnSuccessListener { cont.resume(it) }
            .addOnFailureListener { cont.resume(false) }
    }

    suspend fun translate(text: String, sourceTag: String, targetTag: String): Result<String> = runCatching {
        val src = supported(sourceTag) ?: error("Idioma de origem não suportado pela tradução on-device: $sourceTag")
        val tgt = supported(targetTag) ?: error("Idioma de destino não suportado: $targetTag")
        if (src == tgt) return@runCatching text
        val translator = Translation.getClient(
            TranslatorOptions.Builder().setSourceLanguage(src).setTargetLanguage(tgt).build()
        )
        try {
            suspendCancellableCoroutine<Unit> { cont ->
                translator.downloadModelIfNeeded(DownloadConditions.Builder().build())
                    .addOnSuccessListener { cont.resume(Unit) }
                    .addOnFailureListener {
                        cont.resumeWithException(IllegalStateException("Não foi possível baixar o modelo de tradução. Conecte-se à internet uma vez para baixá-lo.", it))
                    }
            }
            suspendCancellableCoroutine<String> { cont ->
                translator.translate(text)
                    .addOnSuccessListener { cont.resume(it) }
                    .addOnFailureListener { cont.resumeWithException(it) }
            }
        } finally {
            translator.close()
        }
    }
}
