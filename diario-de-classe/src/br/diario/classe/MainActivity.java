package br.diario.classe;

import android.app.Activity;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.util.Base64;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
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
import java.nio.charset.Charset;

/**
 * Diário de Classe: a interface roda 100% offline a partir de assets/ dentro de um WebView.
 * Esta Activity fornece à interface (via objeto JavaScript "Android"):
 *  - persistência dos dados em arquivo interno do app (funciona sem internet);
 *  - abertura de arquivos externos (.xlsx, .xls, .csv, .json) pelo seletor do sistema;
 *  - gravação de arquivos exportados (.xlsx, .json) onde o usuário escolher.
 */
public class MainActivity extends Activity {

    private static final int REQ_IMPORT = 1001;
    private static final int REQ_EXPORT = 1002;
    private static final Charset UTF8 = Charset.forName("UTF-8");

    private WebView web;
    private byte[] pendingExport;
    private String pendingExportName;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);
        s.setTextZoom(100);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                // O app é totalmente offline: não navega para fora dos assets.
                return !url.startsWith("file:///android_asset/");
            }
        });
        web.setWebChromeClient(new WebChromeClient());
        web.addJavascriptInterface(new Bridge(), "Android");
        web.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("window.handleBack ? String(window.handleBack()) : 'false'",
                new ValueCallback<String>() {
                    @Override
                    public void onReceiveValue(String value) {
                        if (!"\"true\"".equals(value) && !"true".equals(value)) {
                            finish();
                        }
                    }
                });
    }

    private File dataFile() {
        return new File(getFilesDir(), "diario.json");
    }

    private void callJs(final String script) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                web.evaluateJavascript(script, null);
            }
        });
    }

    private static String jsString(String s) {
        if (s == null) return "null";
        StringBuilder b = new StringBuilder("\"");
        for (char c : s.toCharArray()) {
            switch (c) {
                case '"': b.append("\\\""); break;
                case '\\': b.append("\\\\"); break;
                case '\n': b.append("\\n"); break;
                case '\r': b.append("\\r"); break;
                case ' ': b.append("\\u2028"); break;
                case ' ': b.append("\\u2029"); break;
                default:
                    if (c < 0x20) b.append(String.format("\\u%04x", (int) c));
                    else b.append(c);
            }
        }
        return b.append('"').toString();
    }

    private static byte[] readAll(InputStream in) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[16384];
        int n;
        while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
        in.close();
        return out.toByteArray();
    }

    private String displayName(Uri uri) {
        String name = null;
        Cursor c = null;
        try {
            c = getContentResolver().query(uri, null, null, null, null);
            if (c != null && c.moveToFirst()) {
                int idx = c.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (idx >= 0) name = c.getString(idx);
            }
        } catch (Exception ignored) {
        } finally {
            if (c != null) c.close();
        }
        if (name == null) name = uri.getLastPathSegment();
        return name == null ? "arquivo" : name;
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        Uri uri = (resultCode == RESULT_OK && data != null) ? data.getData() : null;

        if (requestCode == REQ_IMPORT) {
            if (uri == null) {
                callJs("window.onNativeImport && window.onNativeImport(null, null)");
                return;
            }
            try {
                byte[] bytes = readAll(getContentResolver().openInputStream(uri));
                String b64 = Base64.encodeToString(bytes, Base64.NO_WRAP);
                callJs("window.onNativeImport && window.onNativeImport("
                        + jsString(displayName(uri)) + ", \"" + b64 + "\")");
            } catch (Exception e) {
                callJs("window.onNativeError && window.onNativeError("
                        + jsString("Não foi possível ler o arquivo: " + e.getMessage()) + ")");
            }
        } else if (requestCode == REQ_EXPORT) {
            byte[] bytes = pendingExport;
            String name = pendingExportName;
            pendingExport = null;
            if (uri == null || bytes == null) {
                callJs("window.onNativeExport && window.onNativeExport(false, null)");
                return;
            }
            try {
                OutputStream out = getContentResolver().openOutputStream(uri, "wt");
                out.write(bytes);
                out.close();
                callJs("window.onNativeExport && window.onNativeExport(true, " + jsString(name) + ")");
            } catch (Exception e) {
                callJs("window.onNativeError && window.onNativeError("
                        + jsString("Não foi possível salvar o arquivo: " + e.getMessage()) + ")");
            }
        }
    }

    /** Métodos chamados pela interface JavaScript. */
    public class Bridge {

        @JavascriptInterface
        public String loadData() {
            File f = dataFile();
            if (!f.exists()) return "";
            try {
                return new String(readAll(new FileInputStream(f)), UTF8);
            } catch (Exception e) {
                return "";
            }
        }

        @JavascriptInterface
        public boolean saveData(String json) {
            // Grava em arquivo temporário e renomeia, para não corromper os dados se o app fechar no meio.
            File tmp = new File(getFilesDir(), "diario.json.tmp");
            File bak = new File(getFilesDir(), "diario.bak.json");
            try {
                FileOutputStream out = new FileOutputStream(tmp);
                out.write(json.getBytes(UTF8));
                out.getFD().sync();
                out.close();
                File f = dataFile();
                if (f.exists()) {
                    bak.delete();
                    f.renameTo(bak);
                }
                return tmp.renameTo(f);
            } catch (Exception e) {
                return false;
            }
        }

        @JavascriptInterface
        public void pickFile() {
            runOnUiThread(new Runnable() { @Override public void run() {
                Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                i.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        "application/vnd.ms-excel",
                        "application/vnd.oasis.opendocument.spreadsheet",
                        "text/csv", "text/comma-separated-values", "text/plain",
                        "application/json", "application/octet-stream"});
                try {
                    startActivityForResult(i, REQ_IMPORT);
                } catch (Exception e) {
                    Intent g = new Intent(Intent.ACTION_GET_CONTENT);
                    g.addCategory(Intent.CATEGORY_OPENABLE);
                    g.setType("*/*");
                    startActivityForResult(Intent.createChooser(g, "Escolha o arquivo"), REQ_IMPORT);
                }
            }});
        }

        @JavascriptInterface
        public void saveFile(final String fileName, final String mime, String base64) {
            pendingExport = Base64.decode(base64, Base64.DEFAULT);
            pendingExportName = fileName;
            runOnUiThread(new Runnable() { @Override public void run() {
                Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType(mime);
                i.putExtra(Intent.EXTRA_TITLE, fileName);
                startActivityForResult(i, REQ_EXPORT);
            }});
        }

        @JavascriptInterface
        public void toast(final String msg) {
            runOnUiThread(new Runnable() { @Override public void run() {
                Toast.makeText(MainActivity.this, msg, Toast.LENGTH_SHORT).show();
            }});
        }
    }
}
