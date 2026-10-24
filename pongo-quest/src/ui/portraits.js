// Retratos (data URLs) gerados no PreloadScene a partir dos sprites.
const portraits = {}
export const setPortrait = (id, url) => (portraits[id] = url)
export const portrait = (id) => portraits[id] || ''
