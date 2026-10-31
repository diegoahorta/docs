package com.oducreative.reader.features.studytools

import com.anthropic.client.okhttp.AnthropicOkHttpClient
import com.anthropic.errors.AnthropicServiceException
import com.anthropic.errors.AuthenticationException
import com.anthropic.errors.RateLimitException
import com.anthropic.models.beta.messages.BetaStopReason
import com.anthropic.models.beta.messages.MessageCreateParams
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.time.Duration

enum class AiTask(val label: String, val instruction: String) {
    SUMMARY(
        "Resumir",
        "Resuma o trecho a seguir em português do Brasil, em até 6 tópicos curtos, preservando termos técnicos."
    ),
    EXPLAIN(
        "Explicar frase",
        "Explique em português do Brasil, para um estudante, o significado da frase a seguir: sentido geral, estruturas gramaticais relevantes e nuances. Seja didático e conciso."
    ),
    VOCABULARY(
        "Vocabulário",
        "Identifique até 12 palavras ou expressões úteis para estudo no trecho a seguir. Para cada uma, dê: termo | tradução/definição em português | exemplo curto do próprio trecho. Use uma linha por item no formato 'termo | definição | exemplo'."
    ),
    EXERCISES(
        "Exercícios",
        "Crie 5 exercícios curtos (múltipla escolha ou lacunas) em português do Brasil sobre o trecho a seguir, com gabarito ao final."
    ),
}

/**
 * Fase 4 — IA opcional (desativada por padrão).
 * Usa a API Claude da Anthropic com uma chave fornecida pelo próprio usuário. Somente o trecho que
 * o usuário escolher explicitamente é enviado, e apenas quando ele toca em uma ação de IA.
 * Livros completos nunca são enviados.
 */
class AiAssistant {

    suspend fun run(task: AiTask, text: String, apiKey: String, model: String): Result<String> = withContext(Dispatchers.IO) {
        runCatching {
            require(apiKey.isNotBlank()) { "Configure sua chave de API em Configurações › Inteligência artificial." }
            val input = text.trim().take(MAX_INPUT_CHARS)
            require(input.isNotEmpty()) { "Selecione um trecho primeiro." }
            val client = AnthropicOkHttpClient.builder()
                .apiKey(apiKey)
                .timeout(Duration.ofSeconds(90))
                .build()
            try {
                val params = MessageCreateParams.builder()
                    .model(model)
                    .maxTokens(4000L)
                    .addBeta("server-side-fallback-2026-07-01")
                    .fallbacksDefault()
                    .system("Você é o tutor de leitura do ODU Reader. Responda de forma clara, correta e didática. Não invente informações que não estejam no texto.")
                    .addUserMessage("${task.instruction}\n\n<trecho>\n$input\n</trecho>")
                    .build()
                val message = client.beta().messages().create(params)
                if (message.stopReason().orElse(null) == BetaStopReason.REFUSAL) {
                    error("O modelo recusou esta solicitação. Tente outro trecho.")
                }
                message.content()
                    .mapNotNull { block -> block.text().orElse(null)?.text() }
                    .joinToString("\n")
                    .trim()
                    .ifEmpty { error("Resposta vazia do serviço de IA.") }
            } catch (e: AuthenticationException) {
                throw IllegalStateException("Chave de API inválida. Verifique-a nas configurações.", e)
            } catch (e: RateLimitException) {
                throw IllegalStateException("Limite de uso atingido. Tente novamente em instantes.", e)
            } catch (e: AnthropicServiceException) {
                throw IllegalStateException("Erro do serviço de IA (HTTP ${e.statusCode()}).", e)
            } finally {
                client.close()
            }
        }
    }

    companion object {
        const val MAX_INPUT_CHARS = 12_000
    }
}
