package com.oducreative.blocos;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * ODU Blocos para Android: um WebView que serve o app empacotado em
 * assets/www (sem internet) e expõe ao JavaScript a ponte "OduNative" com
 * voz do Android, armazenamento nativo, microfone e backup em arquivo.
 */
public class MainActivity extends Activity {
    private static final String HOST = "appassets.local";
    private static final String START_URL = "https://" + HOST + "/index.html";
    private static final int REQ_MIC = 1;
    private static final int REQ_FILE = 2;
    private static final int REQ_EXPORT = 3;

    private WebView web;
    private TextToSpeech tts;
    private boolean ttsReady = false;
    private SharedPreferences prefs;
    private PermissionRequest pendingPermission;
    private ValueCallback<Uri[]> fileCallback;
    private String pendingExport;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = getSharedPreferences("odu-blocos", MODE_PRIVATE);

        final FrameLayout root = new FrameLayout(this);
        boolean night = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK)
                == Configuration.UI_MODE_NIGHT_YES;
        root.setBackgroundColor(night ? Color.parseColor("#161C27") : Color.WHITE);

        web = new WebView(this);
        root.addView(web, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        applyInsets(root);
        setContentView(root);
        // Só depois do setContentView: antes disso a DecorView não existe e
        // getInsetsController() derruba o app no Android 11+.
        styleSystemBars(night);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setTextZoom(100);

        web.setWebViewClient(new AssetClient());
        web.setWebChromeClient(new Chrome());
        web.addJavascriptInterface(new Bridge(), "OduNative");

        tts = new TextToSpeech(this, new TextToSpeech.OnInitListener() {
            @Override
            public void onInit(int status) {
                ttsReady = status == TextToSpeech.SUCCESS;
            }
        });
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override
            public void onStart(String id) {
            }

            @Override
            public void onDone(String id) {
                notifyJs("window.__oduTtsDone && window.__oduTtsDone(" + JSONObject.quote(id) + ")");
            }

            @Override
            public void onError(String id) {
                onDone(id);
            }
        });

        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl(START_URL);
    }

    /** Conteúdo nunca fica sob a barra de status ou de navegação (edge-to-edge do Android 15). */
    private void applyInsets(final View root) {
        root.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
            @Override
            public WindowInsets onApplyWindowInsets(View v, WindowInsets insets) {
                if (Build.VERSION.SDK_INT >= 30) {
                    android.graphics.Insets i = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.ime());
                    v.setPadding(i.left, i.top, i.right, i.bottom);
                    return WindowInsets.CONSUMED;
                }
                v.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                        insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
                return insets.consumeSystemWindowInsets();
            }
        });
    }

    @SuppressWarnings("deprecation")
    private void styleSystemBars(boolean night) {
        Window w = getWindow();
        int bar = night ? Color.parseColor("#161C27") : Color.WHITE;
        w.setStatusBarColor(bar);
        w.setNavigationBarColor(bar);
        if (Build.VERSION.SDK_INT >= 30) {
            w.getDecorView();
            WindowInsetsController c = w.getInsetsController();
            if (c != null) {
                int light = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                        | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
                c.setSystemBarsAppearance(night ? 0 : light, light);
            }
        } else if (!night) {
            int flags = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (Build.VERSION.SDK_INT >= 26) flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            w.getDecorView().setSystemUiVisibility(flags);
        }
    }

    private void notifyJs(final String script) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (web != null) web.evaluateJavascript(script, null);
            }
        });
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        String url = web.getUrl();
        boolean home = url == null || !url.contains("#") || url.endsWith("#inicio");
        if (web.canGoBack() && !home) web.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onDestroy() {
        if (tts != null) tts.shutdown();
        if (web != null) web.destroy();
        super.onDestroy();
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] permissions, int[] results) {
        if (code != REQ_MIC || pendingPermission == null) return;
        if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) {
            pendingPermission.grant(new String[] {PermissionRequest.RESOURCE_AUDIO_CAPTURE});
        } else {
            pendingPermission.deny();
        }
        pendingPermission = null;
    }

    @Override
    protected void onActivityResult(int code, int result, Intent data) {
        super.onActivityResult(code, result, data);
        if (code == REQ_FILE && fileCallback != null) {
            fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result, data));
            fileCallback = null;
        } else if (code == REQ_EXPORT) {
            boolean ok = false;
            String msg = "Backup cancelado.";
            if (result == RESULT_OK && data != null && data.getData() != null && pendingExport != null) {
                try (OutputStream out = getContentResolver().openOutputStream(data.getData())) {
                    out.write(pendingExport.getBytes(StandardCharsets.UTF_8));
                    ok = true;
                    msg = "Backup salvo.";
                } catch (IOException | NullPointerException e) {
                    msg = "Não foi possível salvar o backup.";
                }
            }
            pendingExport = null;
            notifyJs("window.__oduExportDone && window.__oduExportDone(" + ok + "," + JSONObject.quote(msg) + ")");
        }
    }

    /** Serve assets/www em https://appassets.local/ (origem segura: microfone e módulos ES funcionam). */
    private class AssetClient extends WebViewClient {
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri u = request.getUrl();
            if (!HOST.equals(u.getHost())) return null;
            String path = u.getPath();
            if (path == null || path.equals("/")) path = "/index.html";
            Map<String, String> headers = new HashMap<>();
            headers.put("Cache-Control", "no-cache");
            try {
                InputStream in = getAssets().open("www" + Uri.decode(path));
                String mime = mimeOf(path);
                String enc = mime.startsWith("text/") || mime.endsWith("json") ? "utf-8" : null;
                return new WebResourceResponse(mime, enc, 200, "OK", headers, in);
            } catch (IOException e) {
                return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", headers,
                        new ByteArrayInputStream(new byte[0]));
            }
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri u = request.getUrl();
            if (HOST.equals(u.getHost())) return false;
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, u));
            } catch (ActivityNotFoundException ignored) {
                // nenhum app para abrir o link
            }
            return true;
        }
    }

    private static String mimeOf(String path) {
        String p = path.toLowerCase(Locale.ROOT);
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".js") || p.endsWith(".mjs")) return "text/javascript";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".woff2")) return "font/woff2";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".mp3")) return "audio/mpeg";
        if (p.endsWith(".m4a")) return "audio/mp4";
        if (p.endsWith(".ogg")) return "audio/ogg";
        if (p.endsWith(".wav")) return "audio/wav";
        if (p.endsWith(".csv") || p.endsWith(".md")) return "text/plain";
        return "application/octet-stream";
    }

    private class Chrome extends WebChromeClient {
        @Override
        public void onPermissionRequest(final PermissionRequest request) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    boolean audio = false;
                    for (String r : request.getResources()) {
                        if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(r)) audio = true;
                    }
                    if (!audio) {
                        request.deny();
                        return;
                    }
                    if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                        request.grant(new String[] {PermissionRequest.RESOURCE_AUDIO_CAPTURE});
                    } else {
                        pendingPermission = request;
                        requestPermissions(new String[] {Manifest.permission.RECORD_AUDIO}, REQ_MIC);
                    }
                }
            });
        }

        @Override
        public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
            if (fileCallback != null) fileCallback.onReceiveValue(null);
            fileCallback = callback;
            try {
                startActivityForResult(params.createIntent(), REQ_FILE);
                return true;
            } catch (ActivityNotFoundException e) {
                fileCallback = null;
                return false;
            }
        }
    }

    /** Métodos chamados pelo JavaScript (src/core/native.js). */
    private class Bridge {
        @JavascriptInterface
        public String getItem(String key) {
            return prefs.getString(key, null);
        }

        @JavascriptInterface
        public void setItem(String key, String value) {
            prefs.edit().putString(key, value).apply();
        }

        @JavascriptInterface
        public boolean speak(String text, String lang, float rate, String id) {
            if (!ttsReady) return false;
            int avail = tts.setLanguage(Locale.forLanguageTag(lang));
            if (avail < TextToSpeech.LANG_AVAILABLE) return false;
            tts.setSpeechRate(rate);
            Bundle params = new Bundle();
            return tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, id) == TextToSpeech.SUCCESS;
        }

        @JavascriptInterface
        public void stopSpeech() {
            if (ttsReady) tts.stop();
        }

        @JavascriptInterface
        public boolean hasVoice(String lang) {
            return ttsReady && tts.isLanguageAvailable(Locale.forLanguageTag(lang)) >= TextToSpeech.LANG_AVAILABLE;
        }

        @JavascriptInterface
        public boolean isReady() {
            return ttsReady;
        }

        @JavascriptInterface
        public void openVoiceInstall() {
            Intent i = new Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                startActivity(i);
            } catch (ActivityNotFoundException e) {
                Intent settings = new Intent("com.android.settings.TTS_SETTINGS");
                settings.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                try {
                    startActivity(settings);
                } catch (ActivityNotFoundException ignored) {
                    // aparelho sem tela de configuração de voz
                }
            }
        }

        @JavascriptInterface
        public void exportFile(final String name, String content) {
            pendingExport = content;
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                    i.addCategory(Intent.CATEGORY_OPENABLE);
                    i.setType("application/json");
                    i.putExtra(Intent.EXTRA_TITLE, name);
                    startActivityForResult(i, REQ_EXPORT);
                }
            });
        }

        @JavascriptInterface
        public String version() {
            return BuildConfig.VERSION_NAME;
        }
    }
}
