// Sprites 2D sobre planos do Three.js, ancorados no centro da base.
import * as THREE from 'three';

const GEO_BASE = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
const GEO_CENTRO = new THREE.PlaneGeometry(1, 1);

export class Sprite {
  constructor(pai, tex, { escala = 1, centro = false, cor = 0xffffff, opacidade = 1 } = {}) {
    this.material = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
      color: cor,
      opacity: opacidade,
    });
    this.mesh = new THREE.Mesh(centro ? GEO_CENTRO : GEO_BASE, this.material);
    this.escala = escala;
    this.espelho = 1;
    this.tex = null;
    this.trocar(tex);
    pai.add(this.mesh);
  }

  trocar(tex, escala = this.escala) {
    this.escala = escala;
    if (tex && tex !== this.tex) {
      this.material.map = tex;
      this.tex = tex;
    }
    if (this.tex) {
      this.mesh.scale.set(this.tex.userData.w * escala * this.espelho, this.tex.userData.h * escala, 1);
    }
  }

  virar(dir) {
    if (dir === this.espelho) return;
    this.espelho = dir;
    this.mesh.scale.x = Math.abs(this.mesh.scale.x) * dir;
  }

  pos(x, y) {
    // âncora horizontal do quadro (centro do corpo); o espelhamento já vem no sinal de scale.x
    const ax = this.tex?.userData.ax ?? 0.5;
    this.mesh.position.x = x - (ax - 0.5) * this.mesh.scale.x;
    this.mesh.position.y = y;
  }

  set ordem(n) {
    this.mesh.renderOrder = n;
  }

  set visivel(v) {
    this.mesh.visible = v;
  }

  remover() {
    this.mesh.parent?.remove(this.mesh);
    this.material.dispose();
  }
}

/** Plano retangular (x0,y0)-(x1,y1) com textura repetida a cada `tile` px. */
export function plano(pai, tex, x0, y0, x1, y1, { tileX, tileY, ordem = 0, cor = 0xffffff, opacidade = 1 } = {}) {
  const t = tex.clone();
  t.needsUpdate = true;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.userData = { ...tex.userData };
  const w = x1 - x0;
  const h = y1 - y0;
  t.repeat.set(w / (tileX || tex.userData.w), h / (tileY || tex.userData.h));
  const m = new THREE.Mesh(
    GEO_CENTRO,
    new THREE.MeshBasicMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, color: cor, opacity: opacidade }),
  );
  m.scale.set(w, h, 1);
  m.position.set(x0 + w / 2, y0 + h / 2, 0);
  m.renderOrder = ordem;
  pai.add(m);
  return m;
}

/** Plano de cor sólida. */
export function retangulo(pai, cor, x0, y0, x1, y1, ordem = 0, opacidade = 1) {
  const m = new THREE.Mesh(
    GEO_CENTRO,
    new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: opacidade, depthTest: false, depthWrite: false }),
  );
  m.scale.set(x1 - x0, y1 - y0, 1);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0);
  m.renderOrder = ordem;
  pai.add(m);
  return m;
}
