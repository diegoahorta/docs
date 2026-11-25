# TOPIK Estudos (Android, offline)

Versão para coreano do app de estudos, montada a partir das *Listas de revisão — rumo ao TOPIK II*,
da planilha `Vocabulario_Coreano.xlsx` e do `Anki_Coreano.csv`. Funciona sem internet: não pede a permissão INTERNET.

## Conteúdo
- **285 palavras + 163 pontos de gramática** nas quatro categorias: Melhorar (erros do caderno, com a forma errada e a correção), Fixar, Rever e Avançar (P1, P2 e P3 de referência).
- **Repetição espaçada** na ordem do plano: Melhorar → Fixar → Avançar P1 → Rever → Avançar P2, 15 novos por dia. A meta 1 (fim do Avançar P1) são 190 cartões.
- **Treinos**: 한국어→português, português→한국어, ouvir, **grafia** (escolher a forma certa entre distratores ㅓ×ㅕ, ㄴ×ㅇ, consoante copiada e os próprios erros do caderno), **ditado em 한글** (avisa sobre 띄어쓰기), escrita à mão, gramática padrão→significado, montar frases e simulado.
- **Gramática**: padrão, significado, exemplo com áudio, erro do caderno, aula do curso e campo “내 문장” para produção própria.
- Erros do caderno, principais achados, proposta/plano 2027, trechos ilegíveis e contagem regressiva para o TOPIK II (03/07/2027, data estimada).
- **Áudio** pela voz coreana do Android (TextToSpeech), offline depois de instalar a voz “Coreano”.

## Compilar e atualizar dados
Igual ao `hsk-app`: Android Studio, `gradle assembleRelease` ou o workflow `.github/workflows/hsk-apk.yml`.
```bash
python3 tools/xlsx_to_json.py Vocabulario_Coreano.xlsx app/src/main/assets/data.js
```
