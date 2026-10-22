<div align="center">

# Liner

**Modern desktop music streaming player with syllable-synced lyrics and reactive dynamic visuals.**

[![Electron](https://img.shields.io/badge/Electron-44.0-47848F?style=flat-square&logo=electron&logoColor=black&labelColor=white)](https://electronjs.org)
[![React 19](https://img.shields.io/badge/React_19-19.2-61DAFB?style=flat-square&logo=react&logoColor=black&labelColor=white)](https://react.dev)
[![TypeScript 5](https://img.shields.io/badge/TypeScript_5-5.0-3178C6?style=flat-square&logo=typescript&logoColor=black&labelColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-v4.0-06B6D4?style=flat-square&logo=tailwindcss&logoColor=black&labelColor=white)](https://tailwindcss.com)
[![WebAssembly](https://img.shields.io/badge/Rust-WebAssembly-654FF0?style=flat-square&logo=webassembly&logoColor=black&labelColor=white)](https://webassembly.org)
[![License: Source-Available](https://img.shields.io/badge/License-Source--Available-blueviolet?style=flat-square&labelColor=white)](./LICENSE)

[Preview](#preview) •
[Architecture](#architecture) •
[Getting Started](#getting-started) •
[Building](#building) •
[Contributing](#contributing) •
[License](#license)

<br/>

<img src="./.github/assets/lyrics_preview.png" alt="Liner Fullscreen Lyrics" width="100%" />

</div>

---

## Preview

<div align="center">
  <table>
    <tr>
      <td align="center" width="50%">
        <img src="./.github/assets/home.png" alt="Liner Home Page" />
        <br/>
        <sub><b>Home</b></sub>
      </td>
      <td align="center" width="50%">
        <img src="./.github/assets/demo.gif" alt="Liner Fullscreen Mode Demo" />
        <br/>
        <sub><b>Fullscreen mode</b></sub>
      </td>
    </tr>
  </table>
</div>

---

> [!NOTE]
> Liner client connects to the official Liner API backend for music catalog, streaming playback, and synchronized lyrics.

---

## Architecture

```
liner/desktop/
├── electron/
│   ├── main.ts              # Electron main process & IPC handlers
│   ├── preload.ts           # Context bridge & secure renderer bindings
│   ├── crypto.ts            # High-performance in-memory WebAssembly signer
│   └── signer.ts            # Embedded WebAssembly binary
├── src/
│   ├── assets/              # Static assets and media
│   ├── components/          # Shared reusable UI components
│   ├── features/            # Feature modules (player, lyrics, queue, library, search, auth)
│   ├── pages/               # Route views (Home, Search, Album, Artist, Playlist)
│   ├── shared/              # API client, state stores (Zustand), and data contracts
│   ├── App.tsx              # Application root
│   └── main.tsx             # Vite entry point
├── package.json
└── vite.config.ts
```

---

## Getting Started

### Prerequisites

- **Node.js** `v20+` and **pnpm** or **Bun**
- Modern OS (Windows 10/11, macOS, or Linux)

---

### Setup

```bash
# 1. Clone repository
git clone https://github.com/tryliner/desktop.git
cd desktop

# 2. Install dependencies (pnpm or Bun)
pnpm install
# or
bun install
```

---

### Running in Development

```bash
# Start Liner in development mode (Electron app with Vite hot-reload)
pnpm run dev
# or
bun run dev
```

---

## Testing

```bash
# Run test suite with Vitest
bun run test
# or
pnpm test
```

---

## Building

```bash
# Build desktop packages for your current OS:

# Linux (AppImage & .deb)
bun run electron:build:linux

# Windows (.exe installer)
bun run electron:build:win
```

Compiled distributions will be placed in the `release/` directory.

---

## iOS (personal build)

This fork can be wrapped with Capacitor for a private build on a personal iPhone. It is not prepared for App Store distribution.

- Toolchain: Capacitor `8.5.3`, Node.js 22+, Xcode 26+ (CI runner `macos-26`).
- The bundle id must be identical in `capacitor.config.ts`, `ios/App/App.xcodeproj` (`PRODUCT_BUNDLE_IDENTIFIER`) and the App ID of the provisioning profile. `scripts/ios-secrets-check.sh` verifies this before the build.
- Required GitHub Secrets: `IOS_P12_BASE64`, `IOS_P12_PASSWORD`, `IOS_PROVISION_BASE64`, `KEYCHAIN_PASSWORD`.
- Encode signing files to base64 and store the result as a secret; never commit the files:
  - macOS: `base64 -i cert.p12 | pbcopy`, `base64 -i profile.mobileprovision | pbcopy`
  - Windows (PowerShell): `[Convert]::ToBase64String([IO.File]::ReadAllBytes("cert.p12")) | Set-Clipboard`
  - Windows (cmd): `certutil -encode cert.p12 cert.b64`, then remove the `-----BEGIN/END-----` lines

> [!WARNING]
> The Capacitor webview serves the app from the `capacitor://localhost` origin. The official Liner API may reject that origin via CORS. This is a known risk to verify on the first run on the device; do not work around it by spoofing request headers inside the app.

---

## Contributing

Bug fixes, small features, and docs fixes are welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md) before you open a pull request. The [license](./LICENSE) limits what a fork is allowed to do.

---

## Special Thanks

- [`@braccato/core`](https://github.com/better-lyrics/braccato) & `@braccato/parsers` — Synced lyrics components and format parsers.
- [`@kawarp/react`](https://github.com/better-lyrics/kawarp) & `@kawarp/core` — WebGL background shader components.
- [Solar Icons](https://solar-icons.com) & [MingCute Icons](https://www.mingcute.com) — Icon collections.

---

## License

Liner is distributed under the **Liner Source-Available & Non-Commercial Contribution License**.

- **Allowed**: Personal non-commercial usage, local builds, and upstream contributions.
- **Prohibited**: Commercial distribution, public competing forks, or extracting core algorithms for third-party products.

See [LICENSE](./LICENSE) for details.

