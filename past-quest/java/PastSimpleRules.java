import java.io.FileDescriptor;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Random;
import java.util.Scanner;
import java.util.Set;

/**
 * Motor de regras do past simple (Units 10–11) do Pongo Past Quest.
 *
 * <ul>
 *   <li>{@link #regularPast(String)}: ortografia do -ed (+d, -ied, consoante dobrada).</li>
 *   <li>{@link #edSound(String)}: pronúncia do -ed (/t/, /d/, /ɪd/).</li>
 *   <li>{@code validate}: confere o banco de verbos exportado pelo build em Python.</li>
 *   <li>{@code drill}: um mini-jogo no terminal com XP e combo.</li>
 * </ul>
 *
 * <pre>
 *   javac -d build/classes java/PastSimpleRules.java
 *   java -cp build/classes PastSimpleRules validate build/verbs.tsv
 *   java -cp build/classes PastSimpleRules drill build/verbs.tsv
 *   java -cp build/classes PastSimpleRules explain stop
 * </pre>
 */
public final class PastSimpleRules {

    /** Verbos de duas sílabas com a última sílaba tônica: dobram a consoante (prefer → preferred). */
    private static final Set<String> STRESSED_LAST = Set.of("prefer", "admit", "refer", "regret", "permit", "commit", "occur", "control");
    private static final String VOWELS = "aeiou";

    private PastSimpleRules() { }

    record Verb(String base, String past, String kind, String sound, String pt) { }

    // ------------------------------------------------------------------ regras

    static boolean isVowel(char c) { return VOWELS.indexOf(c) >= 0; }

    static int syllables(String w) {
        int n = 0;
        boolean prev = false;
        String s = w.endsWith("e") && w.length() > 2 ? w.substring(0, w.length() - 1) : w;
        for (char c : s.toCharArray()) {
            boolean v = isVowel(c) || c == 'y';
            if (v && !prev) n++;
            prev = v;
        }
        return Math.max(1, n);
    }

    /** consoante-vogal-consoante no fim (sem w, x, y no final). */
    static boolean endsCVC(String w) {
        int n = w.length();
        if (n < 3) return false;
        char a = w.charAt(n - 3), b = w.charAt(n - 2), c = w.charAt(n - 1);
        return !isVowel(a) && isVowel(b) && !isVowel(c) && "wxy".indexOf(c) < 0;
    }

    /** Ortografia do past simple regular. */
    public static String regularPast(String base) {
        String w = base.toLowerCase(Locale.ROOT).trim();
        if (w.endsWith("e")) return w + "d";                                       // dance → danced
        if (w.endsWith("y") && w.length() > 1 && !isVowel(w.charAt(w.length() - 2))) {
            return w.substring(0, w.length() - 1) + "ied";                           // study → studied
        }
        if (endsCVC(w) && (syllables(w) == 1 || STRESSED_LAST.contains(w))) {
            return w + w.charAt(w.length() - 1) + "ed";                              // stop → stopped
        }
        return w + "ed";                                                             // work → worked, visit → visited
    }

    /** Pronúncia do -ed a partir da forma base. */
    public static String edSound(String base) {
        String w = base.toLowerCase(Locale.ROOT).trim();
        String core = w.endsWith("e") && w.length() > 2 ? w.substring(0, w.length() - 1) : w;
        if (core.endsWith("t") || core.endsWith("d")) return "/ɪd/";                 // started, needed, decided
        if (w.endsWith("ce") || w.endsWith("se") && !w.endsWith("ise")) return "/t/"; // danced
        String[] voiceless = {"p", "k", "f", "s", "x", "sh", "ch", "gh", "ss"};
        for (String v : voiceless) if (core.endsWith(v)) return "/t/";               // walked, watched, laughed
        return "/d/";                                                                // cleaned, played, lived
    }

    /** Explica a regra usada, em português. */
    public static String explain(String base) {
        String w = base.toLowerCase(Locale.ROOT).trim();
        String past = regularPast(w);
        String why;
        if (w.endsWith("e")) why = "termina em -e: só + d";
        else if (past.endsWith("ied")) why = "consoante + y → -ied";
        else if (past.length() == w.length() + 3) why = "consoante-vogal-consoante tônica: dobra a consoante";
        else if (w.endsWith("y")) why = "vogal + y: só + ed";
        else why = "regra geral: + ed";
        String s = edSound(w);
        String som = switch (s) {
            case "/ɪd/" -> "depois de t/d o -ed ganha uma sílaba";
            case "/t/" -> "som surdo antes do -ed";
            default -> "som sonoro antes do -ed";
        };
        return w + " → " + past + "  (" + why + ")  ·  som " + s + " (" + som + ")";
    }

    // ------------------------------------------------------------------ dados

    static List<Verb> load(Path tsv) throws IOException {
        List<Verb> out = new ArrayList<>();
        List<String> lines = Files.readAllLines(tsv, StandardCharsets.UTF_8);
        for (int i = 1; i < lines.size(); i++) {
            String line = lines.get(i);
            if (line.isBlank()) continue;
            String[] c = line.split("\t", -1);
            if (c.length < 5) throw new IOException("linha " + (i + 1) + " com colunas faltando");
            out.add(new Verb(c[0], c[1], c[2], c[3], c[4]));
        }
        return out;
    }

    static int validate(List<Verb> verbs) {
        int ok = 0, bad = 0;
        for (Verb v : verbs) {
            if (!"regular".equals(v.kind())) continue;
            String p = regularPast(v.base());
            String s = edSound(v.base());
            boolean good = p.equals(v.past()) && s.equals(v.sound());
            if (good) ok++;
            else {
                bad++;
                System.out.printf("  ✗ %-8s banco: %-9s %-5s | regra: %-9s %s%n", v.base(), v.past(), v.sound(), p, s);
            }
        }
        long irregular = verbs.stream().filter(v -> "irregular".equals(v.kind())).count();
        System.out.printf("Java: %d regulares conferidos (%d ok, %d divergentes), %d irregulares listados.%n", ok + bad, ok, bad, irregular);
        return bad == 0 ? 0 : 2;
    }

    // ------------------------------------------------------------------ mini-jogo

    static void drill(List<Verb> verbs, int rounds) {
        Random rnd = new Random();
        List<Verb> deck = new ArrayList<>(verbs);
        Collections.shuffle(deck, rnd);
        int xp = 0, combo = 0, best = 0, hearts = 5, right = 0;
        System.out.println("Pongo Past Quest · treino no terminal. Escreva o past simple. (Enter vazio = sair)\n");
        try (Scanner in = new Scanner(System.in, StandardCharsets.UTF_8)) {
            for (int i = 0; i < Math.min(rounds, deck.size()) && hearts > 0; i++) {
                Verb v = deck.get(i);
                System.out.printf("[%d/%d] ♥%d  %s (%s) → ", i + 1, rounds, hearts, v.base(), v.pt());
                if (!in.hasNextLine()) break;
                String a = in.nextLine().trim().toLowerCase(Locale.ROOT);
                if (a.isEmpty()) break;
                boolean ok = v.past().equals(a) || (v.past().contains(" / ") && List.of(v.past().split(" / ")).contains(a));
                if (ok) {
                    combo++; right++; best = Math.max(best, combo);
                    int gain = 10 + (combo == 5 ? 10 : 0) + (combo > 0 && combo % 10 == 0 ? 25 : 0);
                    xp += gain;
                    System.out.println("  ✓ +" + gain + " XP" + (combo >= 3 ? "  combo ×" + combo : ""));
                } else {
                    combo = 0; hearts--;
                    System.out.println("  ✗ " + v.past() + ("regular".equals(v.kind()) ? "   ← " + explain(v.base()) : "   (irregular: memorize!)"));
                }
            }
        }
        System.out.printf("%nFim! %d acertos · %d XP · melhor combo %d%n", right, xp, best);
    }

    // ------------------------------------------------------------------ main

    public static void main(String[] args) throws IOException {
        System.setOut(new PrintStream(new FileOutputStream(FileDescriptor.out), true, StandardCharsets.UTF_8));
        String cmd = args.length > 0 ? args[0] : "help";
        switch (cmd) {
            case "validate" -> System.exit(validate(load(Path.of(args.length > 1 ? args[1] : "build/verbs.tsv"))));
            case "drill" -> drill(load(Path.of(args.length > 1 ? args[1] : "build/verbs.tsv")), args.length > 2 ? Integer.parseInt(args[2]) : 12);
            case "explain" -> { for (int i = 1; i < args.length; i++) System.out.println(explain(args[i])); }
            default -> System.out.println("uso: PastSimpleRules validate|drill [verbs.tsv] [rodadas] | explain <verbo>...");
        }
    }
}
