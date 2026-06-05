# KodeView

KodeView is a focused mobile code reader for public GitHub repositories. Paste a repo link, download the ZIP, and browse the source code locally without signing in, cloning with Git, or needing an internet connection after the first download.

The app is intentionally read-only. It is built for reading code, checking examples, learning from repositories, and keeping useful projects available offline.

## Highlights

- Download public GitHub repositories through GitHub's public API and ZIP links.
- Extract repositories into local app storage.
- Browse files with a clean mobile file explorer.
- Open readable files in a full-screen code viewer.
- Read code with lightweight syntax coloring.
- Switch between system, light, and dark themes.
- Review offline cache stats in Settings.
- No login, no private repo access, no commits, no pushes, no branches, no editing.

## Getting Started

Install dependencies:

```bash
npm install
```

Start the Expo dev server:

```bash
npx expo start
```

Open the app in Expo Go or a native build for the real offline storage flow. The web preview is useful for layout checks, but mobile storage is the main target.

## Scripts

```bash
npm run start
npm run android
npm run ios
npm run web
npm run lint
```

Type-check:

```bash
npx tsc --noEmit
```

## Expo Build Checklist

Before building on expo.dev or EAS, run:

```bash
npm install
npm ci --dry-run
npm run lint
npx tsc --noEmit
```

Expo cloud builds commonly use `npm ci`, which is strict. `package.json` and `package-lock.json` must match exactly. If they are out of sync, the APK or app build can fail before the app even compiles.

Good habits:

- Use npm consistently for this project.
- Use `npx expo install package-name` for Expo packages.
- Use `npm install package-name` for normal JavaScript packages.
- Commit `package.json` and `package-lock.json` together after dependency changes.
- Run `npm ci --dry-run` before sending a cloud build.

## EAS Build

This project includes an `eas.json` with development, preview, and production profiles.

Production Android build:

```bash
npx eas-cli@latest build -p android --profile production
```

Production iOS build:

```bash
npx eas-cli@latest build -p ios --profile production
```

Both platforms:

```bash
npx eas-cli@latest build --profile production
```

## Project Shape

```text
app/                  Expo Router screens and tab layout
components/           App UI components and code viewer
hooks/                Theme preference and platform hooks
lib/                  GitHub parsing, palette, and repository storage logic
assets/               App icons and static images
```

## Product Direction

KodeView should stay simple: public repositories, offline reading, and a polished code-viewing experience. It is not meant to become a Git client or editor.
