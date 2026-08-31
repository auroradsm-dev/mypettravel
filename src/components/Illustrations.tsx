/**
 * SVG illustrations — warm gold (#C9A96E) line art.
 * All rendered as data-URI Images for React Native web compatibility.
 */
import { Image, View } from 'react-native'

function svgUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

// ── Detail dog (for Welcome hero) ────────────────────────────────────────────

const DOG_SVG = `<svg width="240" height="260" viewBox="0 0 240 260" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="118" cy="82" rx="36" ry="32" stroke="#C9A96E" stroke-width="3" fill="none"/>
  <path d="M88 64 Q70 50 64 74 Q60 94 78 98" stroke="#C9A96E" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M140 58 Q154 48 156 70 Q156 84 144 90" stroke="#C9A96E" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <circle cx="104" cy="76" r="5" fill="#C9A96E"/>
  <circle cx="103" cy="75" r="2" fill="#F7F4EF"/>
  <path d="M97 67 Q104 63 111 67" stroke="#C9A96E" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <ellipse cx="141" cy="90" rx="7" ry="6" fill="#C9A96E"/>
  <path d="M144 96 Q150 104 144 108" stroke="#C9A96E" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M88 108 Q118 118 144 108" stroke="#C9A96E" stroke-width="4" fill="none" stroke-linecap="round"/>
  <circle cx="116" cy="116" r="5" fill="#C9A96E"/>
  <path d="M88 108 Q82 122 78 134" stroke="#C9A96E" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M144 108 Q152 122 154 134" stroke="#C9A96E" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M78 134 Q70 152 72 170 Q74 190 88 200 Q104 210 124 208 Q148 204 160 186 Q168 172 164 152 Q160 134 154 134" stroke="#C9A96E" stroke-width="3" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="M162 164 Q186 150 188 128 Q190 110 174 104" stroke="#C9A96E" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M86 198 L84 228 Q83 235 88 236 Q94 236 93 228 L91 198" stroke="#C9A96E" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M106 204 L105 232 Q104 239 109 240 Q115 240 114 232 L112 204" stroke="#C9A96E" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

// ── Paw prints ────────────────────────────────────────────────────────────────

const PAW_SVG = `<svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="13" cy="24" rx="7" ry="8.5" fill="#C9A96E"/>
  <ellipse cx="25" cy="14" rx="8" ry="9" fill="#C9A96E"/>
  <ellipse cx="38" cy="14" rx="8" ry="9" fill="#C9A96E"/>
  <ellipse cx="49" cy="24" rx="7" ry="8.5" fill="#C9A96E"/>
  <path d="M30 33 Q16 28 14 40 Q12 52 30 56 Q48 52 46 40 Q44 28 30 33Z" fill="#C9A96E"/>
</svg>`

const PAW_OUTLINE_SVG = `<svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="13" cy="24" rx="7" ry="8.5" stroke="#C9A96E" stroke-width="2" fill="none"/>
  <ellipse cx="25" cy="14" rx="8" ry="9" stroke="#C9A96E" stroke-width="2" fill="none"/>
  <ellipse cx="38" cy="14" rx="8" ry="9" stroke="#C9A96E" stroke-width="2" fill="none"/>
  <ellipse cx="49" cy="24" rx="7" ry="8.5" stroke="#C9A96E" stroke-width="2" fill="none"/>
  <path d="M30 33 Q16 28 14 40 Q12 52 30 56 Q48 52 46 40 Q44 28 30 33Z" stroke="#C9A96E" stroke-width="2" fill="none"/>
</svg>`

// ── Abstract background illustrations ─────────────────────────────────────────
// Thin-stroke, line-art style. Low opacity. Positioned as decorative backgrounds.

/** Large sitting dog — used on Home & Welcome */
const BG_DOG_SEATED = `<svg viewBox="0 0 340 420" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M 58 220 C 50 172 62 130 96 102 C 130 74 172 70 200 90" stroke="#C9A96E" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <path d="M 200 90 C 222 68 258 62 280 80 C 304 98 306 132 290 152 C 274 172 246 176 224 162 C 202 148 196 120 200 90Z" stroke="#C9A96E" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <path d="M 210 74 C 194 54 174 60 168 80 C 164 94 172 112 186 116" stroke="#C9A96E" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <path d="M 58 220 C 68 264 96 286 132 288 C 168 290 196 270 204 242" stroke="#C9A96E" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <path d="M 204 242 C 218 218 218 194 204 172 C 192 152 210 148 224 162" stroke="#C9A96E" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <path d="M 58 208 C 36 188 26 160 34 134 C 42 110 64 102 80 116" stroke="#C9A96E" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <path d="M 92 288 L 88 358" stroke="#C9A96E" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <path d="M 114 290 L 110 354" stroke="#C9A96E" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <circle cx="258" cy="112" r="5" fill="#C9A96E"/>
  <path d="M 286 145 C 276 158 280 172 290 168" stroke="#C9A96E" stroke-width="1" stroke-linecap="round" fill="none"/>
</svg>`

/** Walking / trotting dog — Timeline, Task screens */
const BG_DOG_WALK = `<svg viewBox="0 0 380 280" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M 20 140 C 40 110 80 96 120 100 C 160 104 190 128 210 120 C 230 112 250 88 290 82 C 330 76 360 94 370 120" stroke="#C9A96E" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <path d="M 20 148 C 40 178 70 192 100 190 C 130 188 155 172 170 178 C 185 184 200 200 230 200 C 260 200 280 188 300 170" stroke="#C9A96E" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <path d="M 290 82 C 310 60 340 58 356 72 C 372 86 370 112 354 126 C 338 140 314 140 300 128 C 286 116 284 96 290 82Z" stroke="#C9A96E" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <path d="M 300 70 C 288 52 270 56 264 74 C 260 86 268 100 280 104" stroke="#C9A96E" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <path d="M 22 136 C 6 118 4 92 14 76 C 24 62 42 62 50 76" stroke="#C9A96E" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <path d="M 56 192 L 44 240" stroke="#C9A96E" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <path d="M 80 192 L 74 238" stroke="#C9A96E" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <path d="M 180 188 L 186 236 C 188 244 196 246 202 240" stroke="#C9A96E" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <path d="M 210 196 L 218 240" stroke="#C9A96E" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <circle cx="334" cy="104" r="4.5" fill="#C9A96E"/>
</svg>`

/** Close-up dog face — Profile, Calendar, Todos, Ask */
const BG_DOG_FACE = `<svg viewBox="0 0 300 340" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M 50 180 C 44 140 56 100 88 76 C 120 52 162 50 192 68 C 224 86 238 122 230 158 C 222 194 196 218 162 226 C 128 234 94 220 72 200 C 58 188 52 186 50 180Z" stroke="#C9A96E" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <path d="M 64 100 C 44 78 24 84 16 108 C 10 126 18 150 36 160 C 50 168 66 164 74 154" stroke="#C9A96E" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <path d="M 188 56 C 200 34 224 30 240 46 C 256 62 252 90 234 104 C 218 116 198 112 190 100" stroke="#C9A96E" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <circle cx="110" cy="148" r="8" stroke="#C9A96E" stroke-width="1.5" fill="none"/>
  <circle cx="112" cy="146" r="3" fill="#C9A96E"/>
  <ellipse cx="190" cy="172" rx="14" ry="10" stroke="#C9A96E" stroke-width="1.5" fill="none"/>
  <path d="M 136 200 C 140 216 152 224 164 220" stroke="#C9A96E" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <path d="M 100 76 C 106 56 116 46 128 52" stroke="#C9A96E" stroke-width="1" stroke-linecap="round" fill="none"/>
  <path d="M 60 230 L 54 310" stroke="#C9A96E" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <path d="M 85 238 L 82 312" stroke="#C9A96E" stroke-width="1.5" stroke-linecap="round" fill="none"/>
</svg>`

// ── Exported small components ─────────────────────────────────────────────────

export function DogIllustration({ size = 240 }: { size?: number }) {
  return (
    <Image
      source={{ uri: svgUri(DOG_SVG) }}
      style={{ width: size, height: size * 1.08 }}
      resizeMode="contain"
    />
  )
}

export function PawPrint({ size = 32, opacity = 1 }: { size?: number; opacity?: number }) {
  return (
    <Image
      source={{ uri: svgUri(PAW_SVG) }}
      style={{ width: size, height: size, opacity }}
      resizeMode="contain"
    />
  )
}

export function PawPrintOutline({ size = 32 }: { size?: number }) {
  return (
    <Image
      source={{ uri: svgUri(PAW_OUTLINE_SVG) }}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  )
}

export function PawTrail({ style }: { style?: object }) {
  const prints = [
    { top: 20, left: 30, rotate: '-15deg', size: 22, opacity: 0.18 },
    { top: 60, left: 75, rotate: '10deg', size: 18, opacity: 0.12 },
    { top: 100, left: 25, rotate: '-20deg', size: 24, opacity: 0.15 },
  ]
  return (
    <View style={[{ position: 'absolute' }, style]} pointerEvents="none">
      {prints.map((p, i) => (
        <View key={i} style={{ position: 'absolute', top: p.top, left: p.left, transform: [{ rotate: p.rotate }] }}>
          <PawPrint size={p.size} opacity={p.opacity} />
        </View>
      ))}
    </View>
  )
}

// ── Page background illustrations ─────────────────────────────────────────────

type BgVariant = 'seated' | 'walk' | 'face'

const BG_SVG: Record<BgVariant, string> = {
  seated: BG_DOG_SEATED,
  walk: BG_DOG_WALK,
  face: BG_DOG_FACE,
}

type BgSize = { width: number; height: number }

const BG_NATURAL_SIZE: Record<BgVariant, BgSize> = {
  seated: { width: 340, height: 420 },
  walk:   { width: 380, height: 280 },
  face:   { width: 300, height: 340 },
}

type PageBgProps = {
  variant?: BgVariant
  size?: number          // width in px (height scales proportionally)
  opacity?: number
  style?: object
}

export function PageBackground({ variant = 'seated', size = 380, opacity = 0.25, style }: PageBgProps) {
  const nat = BG_NATURAL_SIZE[variant]
  const h = Math.round((size / nat.width) * nat.height)
  const uri = svgUri(BG_SVG[variant])

  // Use CSS backgroundImage — more reliable than Image for inline SVGs in RN Web
  const cssStyle: any = {
    position: 'absolute',
    width: size,
    height: h,
    opacity,
    backgroundImage: `url("${uri}")`,
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
  }

  return <View style={[cssStyle, style]} pointerEvents="none" />
}
