package br.aprendapython.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Aprenda Python: o app inteiro (HTML/CSS/JS + interpretador Python em WebAssembly)
 * fica dentro do APK, na pasta assets/www, e é servido para o WebView a partir do
 * domínio virtual https://appassets.androidplatform.net/ — nenhuma conexão com a
 * internet é necessária.
 */
public class MainActivity extends Activity {

    private static final String HOST = "appassets.androidplatform.net";
    private static final String INICIO = "https://" + HOST + "/index.html";
    private static final Map<String, String> TIPOS = new HashMap<String, String>();

    static {
        TIPOS.put("html", "text/html");
        TIPOS.put("js", "text/javascript");
        TIPOS.put("mjs", "text/javascript");
        TIPOS.put("css", "text/css");
        TIPOS.put("json", "application/json");
        TIPOS.put("map", "application/json");
        TIPOS.put("wasm", "application/wasm");
        TIPOS.put("zip", "application/zip");
        TIPOS.put("md", "text/markdown");
        TIPOS.put("py", "text/plain");
        TIPOS.put("txt", "text/plain");
        TIPOS.put("svg", "image/svg+xml");
        TIPOS.put("png", "image/png");
        TIPOS.put("ico", "image/x-icon");
    }

    private WebView web;

    @Override
    protected void onCreate(Bundle estado) {
        super.onCreate(estado);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        web = new WebView(this);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);           // localStorage: progresso do aluno
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);
        s.setTextZoom(100);
        s.setSupportZoom(false);

        // WebChromeClient padrão = caixas de diálogo de alert/confirm/prompt (usadas por input())
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new Cliente());

        if (estado != null) web.restoreState(estado);
        else web.loadUrl(INICIO);
    }

    @Override
    protected void onSaveInstanceState(Bundle estado) {
        super.onSaveInstanceState(estado);
        web.saveState(estado);
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("window.aoVoltarAndroid ? window.aoVoltarAndroid() : false", new ValueCallback<String>() {
            @Override
            public void onReceiveValue(String tratou) {
                if (!"true".equals(tratou)) {
                    MainActivity.super.onBackPressed();
                }
            }
        });
    }

    private class Cliente extends WebViewClient {
        // Sobrescreve o método da API 24+ (o android.jar de compilação é o da API 23,
        // por isso sem @Override; em tempo de execução a sobrescrita funciona normalmente).
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
            return abrirExterno(req.getUrl());
        }

        @Override
        @SuppressWarnings("deprecation")
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return abrirExterno(Uri.parse(url));
        }

        private boolean abrirExterno(Uri u) {
            if (HOST.equals(u.getHost())) return false;
            // links externos (documentação etc.) abrem no navegador do aparelho
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, u));
            } catch (Exception ignorado) {
                // nenhum navegador instalado
            }
            return true;
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
            Uri u = req.getUrl();
            if (!HOST.equals(u.getHost())) {
                // bloqueia qualquer acesso à rede: o app é totalmente offline
                return new WebResourceResponse("text/plain", "utf-8", 403, "Offline", null, null);
            }
            String caminho = u.getPath();
            if (caminho == null || caminho.equals("/") || caminho.isEmpty()) caminho = "/index.html";
            String ext = caminho.substring(caminho.lastIndexOf('.') + 1).toLowerCase();
            String tipo = TIPOS.containsKey(ext) ? TIPOS.get(ext) : "application/octet-stream";
            String cod = tipo.startsWith("text/") || tipo.equals("application/json") || tipo.equals("image/svg+xml") ? "utf-8" : null;
            Map<String, String> cab = new HashMap<String, String>();
            cab.put("Access-Control-Allow-Origin", "*");
            cab.put("Cache-Control", "no-cache");
            try {
                InputStream in = getAssets().open("www" + caminho);
                return new WebResourceResponse(tipo, cod, 200, "OK", cab, in);
            } catch (IOException e) {
                return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", cab, null);
            }
        }
    }
}
