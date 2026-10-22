package io.github.diegoahorta.drops;

import android.content.Context;
import android.speech.tts.TextToSpeech;
import android.webkit.JavascriptInterface;
import java.util.Locale;

/**
 * Ponte entre o jogo (JavaScript) e o TextToSpeech do Android.
 * A WebView não tem a síntese de voz da web (speechSynthesis); o jogo usa
 * window.FalaNativa.falar(texto, velocidade) quando esta ponte existe.
 */
public class FalaNativa implements TextToSpeech.OnInitListener {
    private final TextToSpeech tts;
    private final Locale idioma;
    private volatile boolean pronta = false;

    public FalaNativa(Context contexto, String tagDoIdioma) {
        idioma = Locale.forLanguageTag(tagDoIdioma);
        tts = new TextToSpeech(contexto, this);
    }

    /** Chamado quando o motor de voz termina de iniciar. */
    @Override
    public void onInit(int status) {
        if (status != TextToSpeech.SUCCESS) {
            return;
        }
        int resultado = tts.setLanguage(idioma);
        pronta = resultado != TextToSpeech.LANG_MISSING_DATA
                && resultado != TextToSpeech.LANG_NOT_SUPPORTED;
    }

    /** O aparelho tem voz no idioma do app? (Se não, instale-a nos ajustes de voz.) */
    @JavascriptInterface
    public boolean temVoz() {
        return pronta;
    }

    /** Fala o texto, interrompendo a fala anterior. */
    @JavascriptInterface
    public void falar(String texto, float velocidade) {
        if (!pronta || texto == null || texto.isEmpty()) {
            return;
        }
        tts.setSpeechRate(velocidade);
        tts.speak(texto, TextToSpeech.QUEUE_FLUSH, null, "fala");
    }

    public void parar() {
        tts.stop();
    }

    public void desligar() {
        tts.shutdown();
    }
}
