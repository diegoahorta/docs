package com.estudos.hsk;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.util.Locale;

/** App 100% offline: a interface fica em assets/ e roda num WebView. */
public class MainActivity extends Activity implements TextToSpeech.OnInitListener {
    private WebView web;
    private TextToSpeech tts;
    private boolean ttsOk = false;
    private SharedPreferences prefs;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = getSharedPreferences("hsk", MODE_PRIVATE);
        getWindow().setStatusBarColor(Color.parseColor("#c0392b"));

        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setTextZoom(100);
        web.addJavascriptInterface(new Bridge(), "Android");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !request.getUrl().toString().startsWith("file:///android_asset/");
            }
        });
        web.loadUrl("file:///android_asset/index.html");
        setContentView(web);

        tts = new TextToSpeech(this, this);
    }

    @Override
    public void onInit(int status) {
        if (status == TextToSpeech.SUCCESS) {
            int r = tts.setLanguage(Locale.SIMPLIFIED_CHINESE);
            ttsOk = r != TextToSpeech.LANG_MISSING_DATA && r != TextToSpeech.LANG_NOT_SUPPORTED;
        }
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("window.onAndroidBack ? window.onAndroidBack() : false", value -> {
            if (!"true".equals(value)) MainActivity.super.onBackPressed();
        });
    }

    @Override
    protected void onDestroy() {
        if (tts != null) tts.shutdown();
        super.onDestroy();
    }

    /** Métodos chamados pelo JavaScript (window.Android). */
    public class Bridge {
        @JavascriptInterface
        public String getItem(String key) { return prefs.getString(key, null); }

        @JavascriptInterface
        public void setItem(String key, String value) { prefs.edit().putString(key, value).apply(); }

        @JavascriptInterface
        public boolean ttsAvailable() { return ttsOk; }

        @JavascriptInterface
        public void speak(String text, float rate) {
            if (!ttsOk) {
                runOnUiThread(() -> Toast.makeText(MainActivity.this,
                        "Instale a voz Chinês (China) nas configurações de texto para fala", Toast.LENGTH_LONG).show());
                return;
            }
            tts.setSpeechRate(rate);
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "hsk");
        }

        @JavascriptInterface
        public void share(String subject, String text) {
            runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_SEND);
                i.setType("text/plain");
                i.putExtra(Intent.EXTRA_SUBJECT, subject);
                i.putExtra(Intent.EXTRA_TEXT, text);
                startActivity(Intent.createChooser(i, "Salvar backup"));
            });
        }

        @JavascriptInterface
        public void copy(String text) {
            runOnUiThread(() -> {
                ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                cm.setPrimaryClip(ClipData.newPlainText("backup", text));
            });
        }

        @JavascriptInterface
        public void openTtsSettings() {
            runOnUiThread(() -> {
                try {
                    startActivity(new Intent("com.android.settings.TTS_SETTINGS"));
                } catch (Exception e) {
                    startActivity(new Intent(android.provider.Settings.ACTION_SETTINGS));
                }
            });
        }
    }
}
