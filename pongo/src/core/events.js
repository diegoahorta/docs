// Barramento de eventos global, independente do Phaser.
// on() devolve uma função de cancelamento — use-a ao trocar de cena.
export function createEmitter() {
  const map = new Map()
  const api = {
    on(evt, fn) {
      if (!map.has(evt)) map.set(evt, new Set())
      map.get(evt).add(fn)
      return () => api.off(evt, fn)
    },
    once(evt, fn) {
      const off = api.on(evt, (...a) => {
        off()
        fn(...a)
      })
      return off
    },
    off(evt, fn) {
      map.get(evt)?.delete(fn)
    },
    emit(evt, ...args) {
      for (const fn of [...(map.get(evt) ?? [])]) {
        try {
          fn(...args)
        } catch (err) {
          console.error(`[bus] erro em "${evt}"`, err)
        }
      }
    }
  }
  return api
}

export const bus = createEmitter()
