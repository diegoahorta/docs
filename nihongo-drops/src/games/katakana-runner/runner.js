// O corredor: um bonequinho redondo com faixa na cabeça, desenhado com
// Graphics. Troca de pista com um pulinho e "tropeça" quando erra.

const COR_CORPO = 0xff8fb1;
const COR_FAIXA = 0xd64545;
const COR_OLHO = 0x141a33;

function desenharCorpo(grafico, tamanho) {
  const raio = tamanho / 2;
  grafico.clear();
  // sombra no chão da pista
  grafico.fillStyle(0x000000, 0.25);
  grafico.fillEllipse(0, raio * 0.95, raio * 1.4, raio * 0.3);
  // corpo
  grafico.fillStyle(COR_CORPO, 1);
  grafico.fillCircle(0, 0, raio * 0.8);
  // faixa (hachimaki) com as pontas voando para trás
  grafico.fillStyle(COR_FAIXA, 1);
  grafico.fillRect(-raio * 0.8, -raio * 0.42, raio * 1.6, raio * 0.2);
  grafico.fillTriangle(
    -raio * 0.75,
    -raio * 0.4,
    -raio * 1.25,
    -raio * 0.65,
    -raio * 1.2,
    -raio * 0.2,
  );
  // olhos olhando para frente (direita)
  grafico.fillStyle(COR_OLHO, 1);
  grafico.fillCircle(raio * 0.2, -raio * 0.05, raio * 0.1);
  grafico.fillCircle(raio * 0.5, -raio * 0.05, raio * 0.1);
}

/** Cria o corredor. Devolve { conteiner, posicionar, irPara, comemorar, tropecar }. */
export function criarCorredor(cena) {
  const corpo = cena.add.graphics();
  const conteiner = cena.add.container(0, 0, [corpo]).setDepth(5);
  let corrida = null;
  let movimento = null;

  const corredor = {
    conteiner,
    tamanho: 60,

    /** Define tamanho e posição sem animação (início e redimensionamento). */
    posicionar(x, y, tamanho) {
      corredor.tamanho = tamanho;
      desenharCorpo(corpo, tamanho);
      cena.tweens.killTweensOf(conteiner);
      conteiner.setPosition(x, y).setAngle(0).setScale(1);
    },

    /** Balanço de corrida (desligado com animações reduzidas). */
    correr(ativo) {
      corrida?.remove();
      corrida = null;
      corpo.y = 0;
      if (ativo) {
        corrida = cena.tweens.add({
          targets: corpo,
          y: -corredor.tamanho * 0.08,
          duration: 160,
          yoyo: true,
          repeat: -1,
        });
      }
    },

    /** Vai para outra pista com um pulinho. */
    irPara(y, animado) {
      // Para só o movimento anterior; o giro de comemoração continua.
      movimento?.stop();
      if (!animado) {
        conteiner.y = y;
        return;
      }
      movimento = cena.tweens.add({ targets: conteiner, y, duration: 150, ease: 'Quad.easeOut' });
      cena.tweens.add({
        targets: conteiner,
        scaleX: 0.85,
        scaleY: 1.15,
        duration: 75,
        yoyo: true,
      });
    },

    comemorar(animado) {
      if (animado) {
        cena.tweens.add({
          targets: conteiner,
          angle: 360,
          duration: 350,
          onComplete: () => conteiner.setAngle(0),
        });
      }
    },

    tropecar(animado) {
      if (animado) {
        cena.tweens.add({ targets: conteiner, angle: -25, duration: 90, yoyo: true, repeat: 1 });
      }
      corpo.setAlpha(0.4);
      cena.time.delayedCall(400, () => corpo.setAlpha(1));
    },
  };
  return corredor;
}
