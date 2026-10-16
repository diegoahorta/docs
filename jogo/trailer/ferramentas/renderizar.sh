#!/bin/bash
# Renderiza o trailer em 4 partes paralelas e junta com a trilha.
S=$(dirname "$0"); OUT=$1
A="$S/cenas $S/arte - $S/linha.json"
cortes=(0 15 30 45 60)
for i in 0 1 2 3; do
  python3 -I $S/editar.py $S/cenas $S/arte - $S/linha.json $S/parte$i.mp4 ${cortes[$i]} ${cortes[$((i+1))]} > $S/parte$i.log 2>&1 &
done
wait
printf "file '%s'\n" $S/parte0.mp4 $S/parte1.mp4 $S/parte2.mp4 $S/parte3.mp4 > $S/partes.txt
ffmpeg -v error -y -f concat -safe 0 -i $S/partes.txt -i $S/trilha.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart "$OUT"
