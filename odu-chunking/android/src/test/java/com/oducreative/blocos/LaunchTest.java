package com.oducreative.blocos;

import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;

import android.app.Activity;
import android.net.Uri;
import android.os.Bundle;
import android.view.ViewGroup;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.lang.reflect.Method;
import java.util.Collections;
import java.util.Map;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.Config;

@RunWith(RobolectricTestRunner.class)
/**
 * Abre o app de verdade (framework Android via Robolectric) no Android 7, 11 e 15:
 * cobre o crash de inicialização do 1.0.0 (getInsetsController antes do setContentView),
 * o servidor de assets, a ponte OduNative, o voltar e a recriação da tela.
 */
public class LaunchTest {
  static WebView findWeb(ViewGroup g) {
    for (int i = 0; i < g.getChildCount(); i++) {
      if (g.getChildAt(i) instanceof WebView) return (WebView) g.getChildAt(i);
      if (g.getChildAt(i) instanceof ViewGroup) {
        WebView w = findWeb((ViewGroup) g.getChildAt(i));
        if (w != null) return w;
      }
    }
    return null;
  }

  static WebResourceRequest req(final String url) {
    return new WebResourceRequest() {
      public Uri getUrl() { return Uri.parse(url); }
      public boolean isForMainFrame() { return false; }
      public boolean isRedirect() { return false; }
      public boolean hasGesture() { return false; }
      public String getMethod() { return "GET"; }
      public Map<String, String> getRequestHeaders() { return Collections.emptyMap(); }
    };
  }

  static Object call(Object o, String name, Class<?>[] types, Object... args) throws Exception {
    Method m = o.getClass().getMethod(name, types);
    m.setAccessible(true);
    return m.invoke(o, args);
  }

  void launch() throws Exception {
    ActivityController<MainActivity> c = Robolectric.buildActivity(MainActivity.class).setup();
    MainActivity a = c.get();
    WebView w = findWeb((ViewGroup) a.getWindow().getDecorView());
    assertNotNull("WebView ausente", w);
    assertEquals("https://appassets.local/index.html", shadowOf(w).getLastLoadedUrl());
    assertTrue(w.getSettings().getJavaScriptEnabled());
    assertTrue(w.getSettings().getDomStorageEnabled());

    // Servidor de assets: index, módulo JS, vendor, fonte e 404
    WebViewClient client = shadowOf(w).getWebViewClient();
    String[][] cases = {
      {"https://appassets.local/index.html", "text/html", "200"},
      {"https://appassets.local/", "text/html", "200"},
      {"https://appassets.local/src/main.js", "text/javascript", "200"},
      {"https://appassets.local/vendor/phaser/phaser.esm.min.js", "text/javascript", "200"},
      {"https://appassets.local/vendor/fonts/fonts.css", "text/css", "200"},
      {"https://appassets.local/src/data/lexico.js", "text/javascript", "200"},
      {"https://appassets.local/nao-existe.js", "text/plain", "404"},
    };
    for (String[] k : cases) {
      WebResourceResponse r = client.shouldInterceptRequest(w, req(k[0]));
      assertNotNull(k[0], r);
      assertEquals(k[0], k[1], r.getMimeType());
      assertEquals(k[0], Integer.parseInt(k[2]), r.getStatusCode());
      if (k[2].equals("200")) assertTrue(k[0] + " vazio", r.getData().read() >= 0);
    }
    assertNull("outros hosts não são interceptados", client.shouldInterceptRequest(w, req("https://example.com/x.js")));
    assertTrue("link externo abre fora", client.shouldOverrideUrlLoading(w, req("https://example.com/")));
    assertFalse(client.shouldOverrideUrlLoading(w, req("https://appassets.local/index.html#aula-l01")));

    // Ponte JavaScript
    Object bridge = shadowOf(w).getJavascriptInterface("OduNative");
    assertNotNull("ponte OduNative", bridge);
    call(bridge, "setItem", new Class<?>[] {String.class, String.class}, "k", "{\"a\":1}");
    assertEquals("{\"a\":1}", call(bridge, "getItem", new Class<?>[] {String.class}, "k"));
    assertNull(call(bridge, "getItem", new Class<?>[] {String.class}, "inexistente"));
    call(bridge, "speak", new Class<?>[] {String.class, String.class, float.class, String.class}, "Hello", "en-US", 0.9f, "u1");
    call(bridge, "hasVoice", new Class<?>[] {String.class}, "fr-FR");
    call(bridge, "isReady", new Class<?>[] {});
    call(bridge, "stopSpeech", new Class<?>[] {});
    call(bridge, "openVoiceInstall", new Class<?>[] {});
    call(bridge, "exportFile", new Class<?>[] {String.class, String.class}, "b.json", "{}");
    org.robolectric.shadows.ShadowLooper.idleMainLooper();
    assertFalse(((String) call(bridge, "version", new Class<?>[] {})).isEmpty());

    // Voltar, girar a tela (recriação) e fechar
    a.onBackPressed();
    c.configurationChange();
    Bundle state = new Bundle();
    c.saveInstanceState(state);
    c.pause().stop().destroy();
    ActivityController<MainActivity> again = Robolectric.buildActivity(MainActivity.class).setup(state);
    again.pause().stop().destroy();
  }

  @Test @Config(sdk = 35) public void android15() throws Exception { launch(); }
  @Test @Config(sdk = 35, qualifiers = "night") public void android15Escuro() throws Exception { launch(); }
  @Test @Config(sdk = 30) public void android11() throws Exception { launch(); }
  @Test @Config(sdk = 24) public void android7() throws Exception { launch(); }
}
