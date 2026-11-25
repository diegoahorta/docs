# HSK Estudos (Android, offline)

App de estudo de mandarim montado a partir do *Diagnóstico do caderno de mandarim*, da planilha
`Vocabulario_Mandarim.xlsx` e do `Anki_Mandarim.csv`. Funciona sem internet: não pede a permissão INTERNET.

## Conteúdo
- **952 cartões**: 20 palavras para revisar (erros do caderno, com a correção) e 932 palavras do HSK 1–3 (prioridades 1, 2 e 3, 13 temas).
- **Repetição espaçada** (SM-2): 15 novos por dia (ajustável), na ordem do diagnóstico (revisar → P1 → P2 → P3).
- **Treinos**: 汉字→português, português→汉字, tons, ouvir e reconhecer, ditado com tom (digite `ni3hao3` ou `nǐhǎo`), escrita à mão em quadro 米字格 e simulado de 20 questões.
- **Gramática G01–G50**: padrão, exemplo com áudio e pinyin, exercício de montar a frase e campo “我的句子”.
- **Erros recorrentes**, **plano de 4 semanas** (26/11–23/12/2026) e contagem regressiva para o novo HSK 3 (07/11/2027).
- **Áudio** pela voz chinesa do Android (TextToSpeech). Funciona offline depois que a voz “Chinês (China)” estiver instalada no mecanismo de voz do Google.
- **Backup** do progresso: exportar (compartilhar/copiar) e importar.

## Como compilar
- **Android Studio**: abra a pasta `hsk-app/` e use *Build → Build APK(s)*.
- **Linha de comando** (com Android SDK instalado): `gradle assembleRelease` dentro de `hsk-app/`.
- **GitHub Actions**: `.github/workflows/hsk-apk.yml` compila a cada push em `hsk-app/` e publica `HSK-Estudos.apk` em *Releases*.

A chave em `keystore/` é só para instalação pessoal (sideload): mantém a mesma assinatura entre versões para que as atualizações instalem por cima sem apagar o progresso.

## Atualizar os dados
```bash
python3 tools/xlsx_to_json.py Vocabulario_Mandarim.xlsx app/src/main/assets/data.js
```
