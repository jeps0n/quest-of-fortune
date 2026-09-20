import { Assets, Texture } from 'pixi.js'
import type { SymbolId } from '../../game/math/SpinResult'
/**
 * Artwork contract for reel symbols.
 *
 * Keep entries null until the corresponding production artwork exists.
 * Adding artwork is then a data change: place the file under public/assets/symbols
 * and replace null with its BASE_URL-relative path below.
 */
export const SYMBOL_ART_ASSETS: Readonly<Record<SymbolId, string | null>> = {
  SCROLL: 'assets/symbols/low/scroll.png',
  COIN: 'assets/symbols/low/coin.png',
  RING: 'assets/symbols/low/ring.png',
  CHEST: 'assets/symbols/low/chest.png',
  GEM: 'assets/symbols/low/gem.png',
  CROWN: 'assets/symbols/low/crown.png',
  ARCHER: 'assets/symbols/high/archer.png',
  KNIGHT: 'assets/symbols/high/knight.png',
  MAGE: 'assets/symbols/high/mage.png',
  DRAGON: 'assets/symbols/high/dragon.png',
}
const textures = new Map<SymbolId, Texture>()
export async function loadSymbolArtwork(): Promise<void> {
  const entries = Object.entries(SYMBOL_ART_ASSETS) as [SymbolId, string | null][]
  await Promise.all(entries.map(async ([id, path]) => {
    if (!path) return
    try {
      const texture = await Assets.load<Texture>(`${import.meta.env.BASE_URL}${path}`)
      textures.set(id, texture)
    } catch (error) {
      // Artwork is presentation-only. A missing image must never prevent the game
      // from starting; SymbolSprite will retain the programmatic fallback instead.
      console.warn(`[symbols] Failed to load artwork for ${id}; using fallback.`, error)
    }
  }))
}
export function getSymbolArtwork(id: SymbolId): Texture | undefined {
  return textures.get(id)
}
