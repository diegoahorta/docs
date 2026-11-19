package br.leitor.estudos;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.OpenableColumns;
import android.util.Base64;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Casca nativa: hospeda a aplicação web (assets/www) num WebView, totalmente off-line.
 * Os arquivos são servidos em https://app.local/ (origem segura -> IndexedDB persistente).
 */
public class MainActivity extends Activity {

    private static final String HOST = "app.local";
    private static final String BASE = "https://" + HOST + "/";
    private static final int REQ_PICK = 1001;
    private static final int REQ_SAVE = 1002;

    private WebView web;
    private ValueCallback<Uri[]> fileCallback;
    private final Map<String, Uri> incoming = new HashMap<>();
    private final List<JSONObject> pendingIncoming = new ArrayList<>();
    private boolean pageReady = false;
    private File pendingSaveFile;
    private String pendingSaveId;
    private final Handler ui = new Handler(Looper.getMainLooper());

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#F4F6FA"));
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setBuiltInZoomControls(false);
        s.setSupportZoom(false);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);
        s.setTextZoom(100);

        web.addJavascriptInterface(new Bridge(), "AndroidBridge");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (!HOST.equals(u.getHost())) {
                    // Bloqueia qualquer acesso externo: app off-line.
                    return new WebResourceResponse("text/plain", "utf-8", 403, "Offline", null, null);
                }
                String path = u.getPath();
                if (path == null || path.equals("/")) path = "/index.html";
                if (path.startsWith("/__incoming/")) {
                    return serveIncoming(path.substring("/__incoming/".length()));
                }
                return serveAsset("www" + path);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !HOST.equals(request.getUrl().getHost());
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                pageReady = true;
                flushIncoming();
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                boolean docsOnly = false;
                for (String t : params.getAcceptTypes()) if (t != null && t.contains("pdf")) docsOnly = true;
                if (docsOnly) {
                    i.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{
                            "application/pdf",
                            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
                }
                i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);
                try {
                    startActivityForResult(i, REQ_PICK);
                } catch (Exception e) {
                    fileCallback = null;
                    return false;
                }
                return true;
            }
        });

        web.loadUrl(BASE + "index.html");
        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIntent(intent);
    }

    /** Recebe arquivos de "Abrir com"/"Compartilhar" e os expõe para o JS via /__incoming/. */
    private void handleIntent(Intent intent) {
        if (intent == null) return;
        List<Uri> uris = new ArrayList<>();
        String action = intent.getAction();
        if (Intent.ACTION_VIEW.equals(action) && intent.getData() != null) {
            uris.add(intent.getData());
        } else if (Intent.ACTION_SEND.equals(action)) {
            Uri u = intent.getParcelableExtra(Intent.EXTRA_STREAM);
            if (u != null) uris.add(u);
        } else if (Intent.ACTION_SEND_MULTIPLE.equals(action)) {
            ArrayList<Uri> list = intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM);
            if (list != null) uris.addAll(list);
        }
        for (Uri u : uris) {
            try {
                String id = UUID.randomUUID().toString();
                incoming.put(id, u);
                JSONObject o = new JSONObject();
                o.put("id", id);
                o.put("name", displayName(u));
                o.put("mime", getContentResolver().getType(u));
                pendingIncoming.add(o);
            } catch (Exception ignored) { }
        }
        flushIncoming();
    }

    private void flushIncoming() {
        if (!pageReady || pendingIncoming.isEmpty()) return;
        JSONArray arr = new JSONArray();
        for (JSONObject o : pendingIncoming) arr.put(o);
        pendingIncoming.clear();
        final String js = "window.onAndroidIncoming && window.onAndroidIncoming(" + arr + ")";
        // pequeno atraso para o app JS terminar de iniciar
        ui.postDelayed(() -> web.evaluateJavascript(js, null), 600);
    }

    private String displayName(Uri u) {
        String name = null;
        try (Cursor c = getContentResolver().query(u, null, null, null, null)) {
            if (c != null && c.moveToFirst()) {
                int idx = c.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (idx >= 0) name = c.getString(idx);
            }
        } catch (Exception ignored) { }
        if (name == null) name = u.getLastPathSegment();
        return name == null ? "documento" : name;
    }

    private WebResourceResponse serveIncoming(String id) {
        Uri u = incoming.get(id);
        if (u == null) return new WebResourceResponse("text/plain", "utf-8", 404, "Not found", null, null);
        try {
            InputStream in = getContentResolver().openInputStream(u);
            String mime = getContentResolver().getType(u);
            return new WebResourceResponse(mime == null ? "application/octet-stream" : mime, null, 200, "OK", null, in);
        } catch (Exception e) {
            return new WebResourceResponse("text/plain", "utf-8", 500, "Error", null, null);
        }
    }

    private WebResourceResponse serveAsset(String path) {
        try {
            InputStream in = getAssets().open(path);
            Map<String, String> headers = new HashMap<>();
            headers.put("Cache-Control", "no-cache");
            return new WebResourceResponse(mimeFor(path), mimeFor(path).startsWith("text") || path.endsWith(".js") ? "utf-8" : null,
                    200, "OK", headers, in);
        } catch (IOException e) {
            return new WebResourceResponse("text/plain", "utf-8", 404, "Not found", null, null);
        }
    }

    private static String mimeFor(String p) {
        String l = p.toLowerCase();
        if (l.endsWith(".html")) return "text/html";
        if (l.endsWith(".js") || l.endsWith(".mjs")) return "text/javascript";
        if (l.endsWith(".css")) return "text/css";
        if (l.endsWith(".svg")) return "image/svg+xml";
        if (l.endsWith(".png")) return "image/png";
        if (l.endsWith(".json")) return "application/json";
        if (l.endsWith(".wasm")) return "application/wasm";
        if (l.endsWith(".ttf")) return "font/ttf";
        return "application/octet-stream";
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_PICK) {
            if (fileCallback == null) return;
            Uri[] result = null;
            if (resultCode == RESULT_OK && data != null) {
                if (data.getClipData() != null) {
                    ClipData cd = data.getClipData();
                    result = new Uri[cd.getItemCount()];
                    for (int i = 0; i < cd.getItemCount(); i++) result[i] = cd.getItemAt(i).getUri();
                } else if (data.getData() != null) {
                    result = new Uri[]{data.getData()};
                }
            }
            fileCallback.onReceiveValue(result);
            fileCallback = null;
        } else if (requestCode == REQ_SAVE) {
            boolean ok = false;
            if (resultCode == RESULT_OK && data != null && data.getData() != null && pendingSaveFile != null) {
                try (InputStream in = new FileInputStream(pendingSaveFile);
                     OutputStream out = getContentResolver().openOutputStream(data.getData())) {
                    byte[] buf = new byte[64 * 1024];
                    int n;
                    while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
                    ok = true;
                } catch (Exception e) {
                    ok = false;
                }
            }
            if (pendingSaveFile != null) pendingSaveFile.delete();
            pendingSaveFile = null;
            final String js = "window.onAndroidSaved && window.onAndroidSaved(" + JSONObject.quote(pendingSaveId) + "," + ok + ")";
            web.evaluateJavascript(js, null);
        }
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("window.onAndroidBack ? window.onAndroidBack() : false", value -> {
            if (!"true".equals(value)) MainActivity.super.onBackPressed();
        });
    }

    /** Ponte JS -> nativo. */
    private class Bridge {
        private final Map<String, FileOutputStream> writes = new HashMap<>();
        private final Map<String, File> files = new HashMap<>();

        @JavascriptInterface
        public void copyText(String text) {
            ui.post(() -> {
                ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                cm.setPrimaryClip(ClipData.newPlainText("trecho", text));
            });
        }

        @JavascriptInterface
        public void toast(String msg) {
            ui.post(() -> Toast.makeText(MainActivity.this, msg, Toast.LENGTH_SHORT).show());
        }

        @JavascriptInterface
        public void shareText(String title, String text) {
            ui.post(() -> {
                Intent i = new Intent(Intent.ACTION_SEND);
                i.setType("text/plain");
                i.putExtra(Intent.EXTRA_SUBJECT, title);
                i.putExtra(Intent.EXTRA_TEXT, text);
                startActivity(Intent.createChooser(i, "Compartilhar"));
            });
        }

        /** Salvamento em partes (base64) para arquivos grandes, ex.: backup. */
        @JavascriptInterface
        public String beginSave() {
            try {
                String id = UUID.randomUUID().toString();
                File f = new File(getCacheDir(), "save-" + id);
                writes.put(id, new FileOutputStream(f));
                files.put(id, f);
                return id;
            } catch (IOException e) {
                return "";
            }
        }

        @JavascriptInterface
        public boolean appendSave(String id, String base64) {
            FileOutputStream out = writes.get(id);
            if (out == null) return false;
            try {
                out.write(Base64.decode(base64, Base64.DEFAULT));
                return true;
            } catch (IOException e) {
                return false;
            }
        }

        @JavascriptInterface
        public void finishSave(String id, String fileName, String mime) {
            FileOutputStream out = writes.remove(id);
            File f = files.remove(id);
            try { if (out != null) out.close(); } catch (IOException ignored) { }
            if (f == null) return;
            ui.post(() -> {
                pendingSaveFile = f;
                pendingSaveId = id;
                Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType(mime == null || mime.isEmpty() ? "application/octet-stream" : mime);
                i.putExtra(Intent.EXTRA_TITLE, fileName);
                try {
                    startActivityForResult(i, REQ_SAVE);
                } catch (Exception e) {
                    f.delete();
                    web.evaluateJavascript("window.onAndroidSaved && window.onAndroidSaved(" + JSONObject.quote(id) + ",false)", null);
                }
            });
        }

        @JavascriptInterface
        public void setImmersive(boolean on) {
            ui.post(() -> {
                View d = getWindow().getDecorView();
                d.setSystemUiVisibility(on
                        ? View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        : View.SYSTEM_UI_FLAG_VISIBLE);
            });
        }

        @JavascriptInterface
        public void keepScreenOn(boolean on) {
            ui.post(() -> {
                if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            });
        }
    }
}
