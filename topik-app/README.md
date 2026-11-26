# TOPIK I · 1671 palavras (app Android off-line)

App para estudar as 1671 palavras do vocabulário TOPIK I (coreano → português, com o inglês original).

**Instalar:** copie `TOPIK-I-1671.apk` para o celular, abra o arquivo e permita "instalar apps de fontes desconhecidas". Funciona sem internet. Requer Android 5.0 ou superior.

## Funções
- **Estudar** – flashcards (coreano→português ou português→coreano), blocos de 100 palavras, ordem ou embaralhado, botões "Sei" / "Não sei", favoritas ★, deslizar para trocar de cartão.
- **Quiz** – múltipla escolha com 4 opções; prioriza palavras que você ainda não sabe; os erros entram na lista "revisar".
- **Lista** – busca em coreano, português ou inglês; toque na bolinha para mudar o status (novo / revisar / sei).
- **Progresso** – total dominado e progresso por bloco; o progresso fica salvo no aparelho.
- **Pronúncia 🔊** – usa a voz coreana do próprio Android (instale "Coreano" em Configurações › Sistema › Idioma › Saída de texto para voz; funciona off-line).

`vocabulario_topik1_pt.csv` traz a lista completa (nº, coreano, inglês, português) para usar em Excel/Anki.

## Compilar
`./build.sh` (precisa de `aapt apksigner zipalign dalvik-exchange android-sdk-platform-23` do Ubuntu). As traduções para português foram geradas por IA; algumas podem precisar de ajuste — edite `assets/words.js` e recompile.
