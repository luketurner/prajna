<p style="margin: auto; max-width: 256px;" align="center" width="100%">

<img width="256" height="256" src="assets/images/splash-icon.png">

</p>

<h1 align="center">Prajna</h1>

A simple mobile app for meditation tracking.

1. Record meditation sessions.
2. Tag sessions with user-defined tags (e.g. based on meditation type, how you felt, or whatever you want.)
3. Compare aggregate meditation time to goals (e.g. yearly resolutions).

> [!WARNING]
> This app was basically 100% written by AI using spec-driven development. In other words, it was vibe-coded, and comes with all the jank that implies. YMMV.

Written using [React Native](https://reactnative.dev/) and [Expo](https://expo.dev).

## Development

```bash

# Run dev server
npm run start

# Development Android build on EAS
eas login
eas build --platform android --profile development

# Build an APK
eas build --platform android --profile preview
```
