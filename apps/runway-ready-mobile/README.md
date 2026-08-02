# Runway Ready — Mobile (Expo + React Native + Skia)

A real React Native mobile app version of the dress-up game, built with
[Expo](https://expo.dev) and [`@shopify/react-native-skia`](https://shopify.github.io/react-native-skia/)
for rendering. This replaces the earlier web prototype's flat SVG shapes with
a proper GPU-backed graphics engine, and fixes the clothing/pet overlap bugs
at the root by driving every part's position off a single "body rig" —
shoulders, hands, hips, ankles, ground line — instead of independent
fixed-pixel guesses per garment.

The original web prototype at `../dressup-game/` is untouched and still works
standalone; this is a separate, from-scratch mobile project in the same repo.

## What's different from the web version

- **Single source of truth for body geometry** (`src/geometry/bodyRig.ts`):
  arm/leg/torso positions are all derived from one `buildRig(bodyProfile)`
  call, so clothing and skin can never drift apart from each other.
- **Pets are placed dynamically**, not at a fixed spot: `getPetSocket()`
  reads the *actual* outfit currently worn (its hem width/height) and
  computes where the pet's feet should land so it always stands clear of
  the hem instead of being covered by a "square polygon" placeholder.
- **Skia vector rendering** instead of hand-written SVG path strings — real
  gradients, real path composition, and a foundation that can grow into
  richer shading/detail as the app develops, without hitting the ceiling the
  flat-SVG approach had.

## Running it yourself

You'll need [Node.js](https://nodejs.org) installed. From this directory:

```bash
npm install
npx expo start
```

That prints a QR code in your terminal.

### Testing on your iPhone/iPad

1. Install the **Expo Go** app from the App Store.
2. Make sure your phone and your computer are on the **same Wi-Fi network**.
3. Run `npx expo start` (as above) and scan the QR code with your iPhone's
   Camera app (it'll prompt to open in Expo Go).
4. If your phone can't reach your computer directly (different networks,
   corporate/guest Wi-Fi, VPN, etc.), run `npx expo start --tunnel` instead —
   this relays the connection through Expo's cloud so it works from anywhere,
   at the cost of a slightly slower reload.

No Mac or Xcode is required for this workflow — Expo Go handles building and
running the JS bundle on-device.

### Running it in a browser instead

```bash
npx expo start --web
```

This is mainly useful for a quick visual check without a phone in hand. It
uses Skia's WebAssembly build (`public/canvaskit.wasm`, already bundled in
the repo) to render the same Skia drawing code that runs natively on iOS and
Android.

## Project layout

- `src/geometry/` — the body rig, capsule/hand path math, color helpers, and
  the `Shape → Skia path` bridge.
- `src/data/` — body types, hair, outfits, shoes, and pets, each as data
  describing shapes rather than components.
- `src/components/` — `CharacterCanvas` (the main render), `GradientFill`,
  `DetailShapes`, `PetGroup`.
- `src/screens/DressUpScreen.tsx` — the tabbed picker UI.
