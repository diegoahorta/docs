package com.bujo.offline;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Casca nativa do Bullet Journal offline.
 * Toda a interface roda em assets/www (HTML/JS) dentro de um WebView sem acesso à internet.
 * A ponte "Native" persiste os dados em arquivo interno e cuida de exportar/importar/imprimir.
 */
public class MainActivity extends Activity {

    private static final int REQ_EXPORT = 41;
    private static final int REQ_IMPORT = 42;
    private static final String DATA_FILE = "journal.json";

    private WebView web;
    private String pendingContent;
    private String pendingMime;
    private WebView printView; // referência mantida até a impressão começar

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#F7F3EA"));
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(false);
        s.setBlockNetworkLoads(true);          // garante funcionamento offline
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);
        s.setTextZoom(100);
        web.addJavascriptInterface(new Bridge(), "Native");
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !request.getUrl().toString().startsWith("file:///android_asset/");
            }
        });
        setContentView(web);
        web.loadUrl("file:///android_asset/www/index.html");
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("window.bujoBack ? window.bujoBack() : false", new android.webkit.ValueCallback<String>() {
            @Override public void onReceiveValue(String value) {
                if (!"true".equals(value)) MainActivity.super.onBackPressed();
            }
        });
    }

    @Override
    protected void onPause() {
        super.onPause();
        web.evaluateJavascript("window.bujoFlush && window.bujoFlush()", null);
    }

    // ---------- arquivo de dados ----------

    private File dataFile() { return new File(getFilesDir(), DATA_FILE); }

    private synchronized void writeData(String json) throws Exception {
        File tmp = new File(getFilesDir(), DATA_FILE + ".tmp");
        try (FileOutputStream out = new FileOutputStream(tmp)) {
            out.write(json.getBytes(StandardCharsets.UTF_8));
            out.getFD().sync();
        }
        File target = dataFile();
        File bak = new File(getFilesDir(), DATA_FILE + ".bak");
        if (target.exists()) {
            bak.delete();
            target.renameTo(bak);
        }
        if (!tmp.renameTo(target)) throw new Exception("rename failed");
    }

    private static String readAll(InputStream in) throws Exception {
        ByteArrayOutputStream buf = new ByteArrayOutputStream();
        byte[] b = new byte[8192];
        int n;
        while ((n = in.read(b)) > 0) buf.write(b, 0, n);
        return new String(buf.toByteArray(), StandardCharsets.UTF_8);
    }

    private void toast(final String msg) {
        runOnUiThread(new Runnable() { @Override public void run() { Toast.makeText(MainActivity.this, msg, Toast.LENGTH_SHORT).show(); }});
    }

    private void callJs(final String fn, final String arg) {
        final String quoted = org.json.JSONObject.quote(arg == null ? "" : arg);
        runOnUiThread(new Runnable() { @Override public void run() { web.evaluateJavascript(fn + "(" + quoted + ")", null); }});
    }

    // ---------- ponte JS ----------

    private class Bridge {
        @JavascriptInterface
        public String load() {
            File f = dataFile();
            if (!f.exists()) f = new File(getFilesDir(), DATA_FILE + ".bak");
            if (!f.exists()) return "";
            try (FileInputStream in = new FileInputStream(f)) {
                return readAll(in);
            } catch (Exception e) {
                return "";
            }
        }

        @JavascriptInterface
        public boolean save(String json) {
            try {
                writeData(json);
                return true;
            } catch (Exception e) {
                return false;
            }
        }

        /** Abre o seletor do sistema para o usuário escolher onde salvar o arquivo exportado. */
        @JavascriptInterface
        public void exportFile(final String fileName, final String mime, final String content) {
            runOnUiThread(new Runnable() { @Override public void run() {
                pendingContent = content;
                pendingMime = mime;
                Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType(mime);
                i.putExtra(Intent.EXTRA_TITLE, fileName);
                try {
                    startActivityForResult(i, REQ_EXPORT);
                } catch (Exception e) {
                    toast("Não foi possível abrir o seletor de arquivos");
                }
            }});
        }

        /** Compartilha o conteúdo como texto (e-mail, WhatsApp, Drive, etc.). */
        @JavascriptInterface
        public void share(final String subject, final String text) {
            runOnUiThread(new Runnable() { @Override public void run() {
                Intent i = new Intent(Intent.ACTION_SEND);
                i.setType("text/plain");
                i.putExtra(Intent.EXTRA_SUBJECT, subject);
                i.putExtra(Intent.EXTRA_TEXT, text);
                startActivity(Intent.createChooser(i, "Compartilhar"));
            }});
        }

        /** Abre o seletor de arquivos para importar um backup JSON. */
        @JavascriptInterface
        public void importFile() {
            runOnUiThread(new Runnable() { @Override public void run() {
                Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                i.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"application/json", "text/plain", "application/octet-stream"});
                try {
                    startActivityForResult(i, REQ_IMPORT);
                } catch (Exception e) {
                    toast("Não foi possível abrir o seletor de arquivos");
                }
            }});
        }

        /** Imprime / salva como PDF um documento HTML gerado pelo app. */
        @JavascriptInterface
        public void printHtml(final String title, final String html) {
            runOnUiThread(new Runnable() { @Override public void run() {
                final WebView pv = new WebView(MainActivity.this);
                printView = pv;
                pv.getSettings().setBlockNetworkLoads(true);
                pv.setWebViewClient(new WebViewClient() {
                    @Override
                    public void onPageFinished(WebView view, String url) {
                        PrintManager pm = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                        PrintDocumentAdapter ad = view.createPrintDocumentAdapter(title);
                        pm.print(title, ad, new PrintAttributes.Builder()
                                .setMediaSize(PrintAttributes.MediaSize.ISO_A5).build());
                    }
                });
                pv.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null);
            }});
        }

        @JavascriptInterface
        public void setBars(final String color, final boolean dark) {
            runOnUiThread(new Runnable() { @Override public void run() {
                try {
                    Window w = getWindow();
                    int c = Color.parseColor(color);
                    w.setStatusBarColor(c);
                    w.setNavigationBarColor(c);
                    View d = w.getDecorView();
                    int flags = d.getSystemUiVisibility();
                    if (dark) flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                    else flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                    if (Build.VERSION.SDK_INT >= 26) {
                        if (dark) flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                        else flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                    }
                    d.setSystemUiVisibility(flags);
                    web.setBackgroundColor(c);
                } catch (Exception ignored) { }
            }});
        }

        @JavascriptInterface
        public void toast(String msg) { MainActivity.this.toast(msg); }

        @JavascriptInterface
        public boolean isNative() { return true; }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_EXPORT) {
            String content = pendingContent;
            pendingContent = null;
            if (resultCode != RESULT_OK || data == null || data.getData() == null || content == null) return;
            Uri uri = data.getData();
            try (OutputStream out = getContentResolver().openOutputStream(uri, "wt")) {
                out.write(content.getBytes(StandardCharsets.UTF_8));
                toast("Arquivo exportado com sucesso");
            } catch (Exception e) {
                toast("Erro ao exportar: " + e.getMessage());
            }
        } else if (requestCode == REQ_IMPORT) {
            if (resultCode != RESULT_OK || data == null || data.getData() == null) return;
            try (InputStream in = getContentResolver().openInputStream(data.getData())) {
                callJs("window.bujoImported", readAll(in));
            } catch (Exception e) {
                toast("Erro ao ler arquivo: " + e.getMessage());
            }
        }
    }
}
