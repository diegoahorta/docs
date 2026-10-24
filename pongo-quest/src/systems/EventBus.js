// Barramento simples para comunicação entre Phaser (mundo) e a UI DOM.
class EventBus {
  constructor() {
    this.listeners = new Map()
  }

  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event).add(fn)
    return () => this.off(event, fn)
  }

  once(event, fn) {
    const off = this.on(event, (...args) => {
      off()
      fn(...args)
    })
    return off
  }

  off(event, fn) {
    this.listeners.get(event)?.delete(fn)
  }

  emit(event, payload) {
    this.listeners.get(event)?.forEach((fn) => {
      try {
        fn(payload)
      } catch (err) {
        console.error(`[bus] erro em "${event}"`, err)
      }
    })
  }
}

export const bus = new EventBus()
export { EventBus }
