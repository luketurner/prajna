# Bucket app

> [!CAUTION]
> This app was basically 100% written by AI using spec-driven development. In other words, it was vibe-coded.
>
> I'm using it myself, but YMMV.

A simple mobile app for meditation tracking.

1. Record meditation sessions.
2. Tag sessions with user-defined tags (e.g. based on meditation type, how you felt, or whatever you want.)
3. Compare aggregate meditation time to goals (e.g. yearly resolutions).

Written using [React Native](https://reactnative.dev/) and [Expo](https://expo.dev).

## Development

```bash

# Run dev server
npm run start

# Development Android build on EAS
eas login
eas build --platform android --profile development
```
