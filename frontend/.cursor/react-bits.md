# React Bits (reactbits.dev) — DevOS catalog

Use the TypeScript + Tailwind variant. Prefer CLI when possible:

```bash
npx shadcn@latest add "https://reactbits.dev/r/<Name>-TS-TW"
```

Note: on this Windows/npm setup the CLI may try `bun`. If it fails, install peer deps with npm and place the component under `src/components/<Name>/`.

## Components already in this repo

| Component | Path | Use for |
|-----------|------|---------|
| Aurora | `components/Aurora/Aurora.tsx` | Ambient AI / hero backgrounds |
| SpotlightCard | `components/SpotlightCard/SpotlightCard.tsx` | Project cards, Stack asset cards |

## Recommended picks for DevOS

| Need | Component slug |
|------|----------------|
| Cursor spotlight card | SpotlightCard-TS-TW |
| 3D tilt (image heroes) | TiltedCard-TS-TW |
| Sliding pill nav | PillNav-TS-TW (GSAP-heavy — prefer our Framer `PillTabBar` for in-app tabs) |
| Animated border / glow | GlowBorder / BorderBeam equivalents |
| Click sparks | ClickSpark-TS-TW |
| Text effects | BlurText, SplitText |

## Peer deps we use

- `ogl` — Aurora
- `gsap` — already in package.json (PillNav etc.)
- Prefer Framer Motion layoutId for pill navs inside the product (consistent with Round 1 chrome)
