# Pacote de áudio gravado

Coloque aqui gravações de falantes nativos para substituir a voz sintética.

- Uma pasta por idioma: `en/`, `fr/`, `de/`, `es/`.
- O nome do arquivo é o identificador da frase ou do bloco, listado em `roteiro.csv` (gerado por `npm run audio:roteiro`).
- Formatos aceitos: `.mp3`, `.m4a`, `.ogg` ou `.wav`.

Depois de adicionar os arquivos, rode `npm run audio:manifest` (o `npm run android:build` já faz isso) para o app passar a usá-los.
