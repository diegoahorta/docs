import com.android.apksig.ApkSigner;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FilterOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.util.Collections;
import java.util.Enumeration;
import java.util.zip.CRC32;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import java.util.zip.ZipOutputStream;

/**
 * Junta o APK do aapt2 com o classes.dex, alinha as entradas sem compressão
 * em 4 bytes (como o zipalign) e assina com APK Signature Scheme v2.
 *
 * Uso: java -cp apksig.jar:. ApkPacker in.apk classes.dex out.apk keystore senha alias
 */
public class ApkPacker {
    static class Counting extends FilterOutputStream {
        long count;

        Counting(OutputStream out) {
            super(out);
        }

        @Override
        public void write(int b) throws IOException {
            out.write(b);
            count++;
        }

        @Override
        public void write(byte[] b, int off, int len) throws IOException {
            out.write(b, off, len);
            count += len;
        }
    }

    static byte[] readAll(InputStream in) throws IOException {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        byte[] buf = new byte[65536];
        int n;
        while ((n = in.read(buf)) > 0) bos.write(buf, 0, n);
        return bos.toByteArray();
    }

    // Mídia e resources.arsc ficam sem compressão (exigência do Android 11+ para o .arsc).
    static boolean store(String name) {
        String n = name.toLowerCase();
        return n.equals("resources.arsc") || n.endsWith(".png") || n.endsWith(".mp3") || n.endsWith(".m4a")
                || n.endsWith(".ogg") || n.endsWith(".woff2");
    }

    static void put(ZipOutputStream zos, Counting counter, String name, byte[] data) throws IOException {
        ZipEntry e = new ZipEntry(name);
        if (store(name)) {
            e.setMethod(ZipEntry.STORED);
            e.setSize(data.length);
            e.setCompressedSize(data.length);
            CRC32 crc = new CRC32();
            crc.update(data);
            e.setCrc(crc.getValue());
            // Campo extra 0xD935 (o mesmo do zipalign) preenchido até os dados caírem em múltiplo de 4.
            int nameLen = name.getBytes("UTF-8").length;
            long dataStart = counter.count + 30 + nameLen;
            int extraLen = 4;
            while ((dataStart + extraLen) % 4 != 0) extraLen++;
            byte[] extra = new byte[extraLen];
            extra[0] = 0x35;
            extra[1] = (byte) 0xD9;
            extra[2] = (byte) (extraLen - 4);
            e.setExtra(extra);
        } else {
            e.setMethod(ZipEntry.DEFLATED);
        }
        e.setTime(1767225600000L); // data fixa dentro do intervalo DOS: sem campo extra de timestamp
        zos.putNextEntry(e);
        zos.write(data);
        zos.closeEntry();
    }

    public static void main(String[] args) throws Exception {
        File in = new File(args[0]);
        File dex = new File(args[1]);
        File out = new File(args[2]);
        File unsigned = new File(out.getPath() + ".unsigned");

        try (ZipFile src = new ZipFile(in);
             FileOutputStream fos = new FileOutputStream(unsigned)) {
            Counting counter = new Counting(fos);
            ZipOutputStream zos = new ZipOutputStream(counter);
            boolean wroteDex = false;
            Enumeration<? extends ZipEntry> entries = src.entries();
            // AndroidManifest.xml e resources.arsc primeiro, como o aapt2 gera.
            for (ZipEntry e : Collections.list(entries)) {
                if (e.isDirectory()) continue;
                byte[] data;
                try (InputStream is = src.getInputStream(e)) {
                    data = readAll(is);
                }
                put(zos, counter, e.getName(), data);
                if (!wroteDex && e.getName().equals("resources.arsc")) {
                    try (InputStream is = new FileInputStream(dex)) {
                        put(zos, counter, "classes.dex", readAll(is));
                    }
                    wroteDex = true;
                }
            }
            if (!wroteDex) {
                try (InputStream is = new FileInputStream(dex)) {
                    put(zos, counter, "classes.dex", readAll(is));
                }
            }
            zos.finish();
        }

        char[] pass = args[4].toCharArray();
        KeyStore ks = KeyStore.getInstance("PKCS12");
        try (InputStream is = new FileInputStream(args[3])) {
            ks.load(is, pass);
        }
        PrivateKey key = (PrivateKey) ks.getKey(args[5], pass);
        X509Certificate cert = (X509Certificate) ks.getCertificate(args[5]);
        ApkSigner.SignerConfig signer = new ApkSigner.SignerConfig.Builder(
                "ODU", key, Collections.singletonList(cert)).build();
        new ApkSigner.Builder(Collections.singletonList(signer))
                .setInputApk(unsigned)
                .setOutputApk(out)
                .setMinSdkVersion(24)
                .setV1SigningEnabled(false) // v2 basta: minSdk 24 (Android 7.0) já verifica v2
                .setV2SigningEnabled(true)
                .build()
                .sign();
        unsigned.delete();
        System.out.println("APK assinado: " + out.getPath());
    }
}
