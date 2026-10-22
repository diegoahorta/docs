package io.github.diegoahorta.drops;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * Tela única do app: uma WebView em tela cheia com o jogo (assets/index.html),
 * a ponte de voz (FalaNativa) e o botão "voltar" ligado ao jogo.
 *
 * O mesmo código serve aos dois apps (japonês e coreano); o idioma da voz vem
 * do <meta-data android:name="idiomaDaVoz"> do AndroidManifest.xml.
 */
public class MainActivity extends Activity {
    private static final String COR_DE_FUNDO = "#0f1630";
    private static final String PAGINA_DO_JOGO = "file:///android_asset/index.html";
    private static final String IDIOMA_PADRAO = "ja-JP";

    private WebView webView;
    private FalaNativa fala;

    @Override
    protected void onCreate(Bundle estadoSalvo) {
        super.onCreate(estadoSalvo);
        int fundo = Color.parseColor(COR_DE_FUNDO);
        getWindow().setStatusBarColor(fundo);
        getWindow().setNavigationBarColor(fundo);

        fala = new FalaNativa(this, lerIdiomaDaVoz());
        webView = new WebView(this);
        webView.setBackgroundColor(fundo);
        configurar(webView.getSettings());
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new ClienteDoJogo());
        webView.addJavascriptInterface(fala, "FalaNativa");
        setContentView(webView);
        webView.loadUrl(PAGINA_DO_JOGO);
    }

    /** Liga JavaScript, armazenamento local (progresso) e som sem gesto extra. */
    private static void configurar(WebSettings ajustes) {
        ajustes.setJavaScriptEnabled(true);
        ajustes.setDomStorageEnabled(true);
        ajustes.setDatabaseEnabled(true);
        ajustes.setMediaPlaybackRequiresUserGesture(false);
        ajustes.setAllowFileAccess(true);
        // O jogo já usa fontes grandes; o zoom de texto do sistema quebraria o layout.
        ajustes.setTextZoom(100);
    }

    /** Lê o idioma da voz (ex.: "ja-JP" ou "ko-KR") do AndroidManifest.xml. */
    private String lerIdiomaDaVoz() {
        try {
            ApplicationInfo info = getPackageManager()
                    .getApplicationInfo(getPackageName(), PackageManager.GET_META_DATA);
            String idioma = info.metaData != null ? info.metaData.getString("idiomaDaVoz") : null;
            return idioma != null ? idioma : IDIOMA_PADRAO;
        } catch (PackageManager.NameNotFoundException erro) {
            return IDIOMA_PADRAO;
        }
    }

    /**
     * Botão "voltar": pergunta ao jogo (window.voltarApp) se ele tratou o toque
     * (fechar um modal, sair de um jogo para o menu). Se não, fecha o app.
     */
    @Override
    public void onBackPressed() {
        webView.evaluateJavascript(
                "window.voltarApp ? window.voltarApp() : false",
                new ValueCallback<String>() {
                    @Override
                    public void onReceiveValue(String tratado) {
                        if (!"true".equals(tratado)) {
                            finish();
                        }
                    }
                });
    }

    @Override
    protected void onPause() {
        super.onPause();
        webView.onPause();
        fala.parar();
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
    }

    @Override
    protected void onDestroy() {
        fala.desligar();
        webView.destroy();
        super.onDestroy();
    }

    /** Mantém o jogo na WebView e abre links externos (créditos) no navegador. */
    private class ClienteDoJogo extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            if (url.startsWith("http://") || url.startsWith("https://")) {
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                } catch (ActivityNotFoundException erro) {
                    // Sem navegador instalado: simplesmente não abre.
                }
                return true;
            }
            return false;
        }
    }
}
