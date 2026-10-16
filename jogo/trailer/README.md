# Trailer: Boulos vs Ratus Nunes

`boulos-vs-ratus-nunes-trailer.mp4`: 60 s, 1920×1080, 30 fps, H.264 + AAC.

## Roteiro

| Tempo | Cena |
| --- | --- |
| 0–6 s | Relâmpagos revelam o Ratus Nunes; a Paulista à noite em câmera lenta: "SÃO PAULO. A CIDADE FOI TOMADA... PELA GANGUE DOS RATOS" |
| 6–8 s | Impacto: o vilão em close (arte da capa), "RATUS NUNES, O REI DOS RATOS" |
| 8–10 s | Impacto: o subchefe, "RATUS DIREITUS, O BRAÇO DIREITO" |
| 10–12,6 s | Impacto: o herói, "MAS O POVO TEM UM LÍDER: BOULOS" |
| 12,6–16 s | Cortes acelerando no chimbal: "PREPARE OS PUNHOS", "BORA!" |
| 16–52,4 s | Drop drum and bass: a jornada pelo mapa da Zona Sul (o ônibus vai de bairro em bairro, que acende em vermelho), intercalada com a luta em cada fase: Marsilac, Parelheiros (voadora do ônibus em câmera lenta), Grajaú BNH, Cidade Dutra, cortes "JAB, DIRETO, JOELHADA, CHUTE!", Ratus Direitus, o ônibus saindo do mapa rumo à Paulista, Ratus Nunes, a Força do Povo e "5 BAIRROS, 1 SUBCHEFE, 1 CHEFÃO, 0 PIEDADE" |
| 52,4–60 s | Logo "Boulos contra Ratus Nunes", katakana e "JOGUE AGORA NO NAVEGADOR" |

## Como gerar de novo

Precisa de Node.js, Playwright com Chromium, Python 3 com Pillow e NumPy, e ffmpeg.
Com um servidor servindo a raiz do repositório em `http://localhost:8765`:

```bash
F=jogo/trailer/ferramentas; P=/tmp/trailer          # P: pasta de trabalho
export BOULOS_REPO=$(pwd)
mkdir -p $P/arte && cp $F/*.py $F/*.sh $F/linha.json $P/
cp jogo/sprites/ui_mapa_*.png $P/arte/                # mapa da Zona Sul
node $F/capturar.mjs $P/cenas                       # grava as cenas do jogo quadro a quadro
node $F/trilha.mjs $F/linha.json $P/trilha_bruta.wav
ffmpeg -i $P/trilha_bruta.wav -af "highpass=f=28:poles=2,highpass=f=28:poles=2,loudnorm=I=-12:TP=-1:LRA=14" $P/trilha.wav
# recortes da capa usados na edição (capa.png, rato.png, boulos.png, logo.png, katakana.png):
python3 -c "
from PIL import Image
c=Image.open('assets/sprites/capa-boulos-contra-ratus-nunes.png').convert('RGB'); c.save('$P/arte/capa.png')
c.crop((0,0,1024,230)).save('$P/arte/katakana.png'); c.crop((0,1080,1024,1536)).save('$P/arte/logo.png')
c.crop((150,140,1024,760)).save('$P/arte/rato.png'); c.crop((60,420,780,1100)).save('$P/arte/boulos.png')
d=Image.open('assets/sprites/ratus-direitus.webp').convert('RGBA').crop((1040,0,1240,178)); d.crop(d.getbbox()).save('$P/arte/direitus.png')"
$P/renderizar.sh $P/trailer.mp4                     # renderiza em 4 partes paralelas e junta com a trilha
```
