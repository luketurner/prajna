<p style="margin: auto; max-width: 256px;" align="center" width="100%">

<img width="256" height="256" src="assets/images/splash-icon.png">

</p>

<h1 align="center">Prajna</h1>

A simple Android app for meditation tracking.

<p style="margin: auto;" align="center" width="100%">

<img width="30%" src="docs/goals.png">

<img width="30%" src="docs/timer.png">

<img width="30%" src="docs/stats.png">

</p>

Features:

- Record your meditation sessions in the app, or enter past sessions manually.
- Create a timer for your meditation, e.g. 20 minutes. Get notified when the timer is done by a singing bowl sound.
- Create multiple stages of timers, e.g. 10 minutes, then 5 minutes, then 10 minutes. Get notified between each stage. Useful for longer sessions where you want to take scheduled breaks.
- Define goals, e.g. "I'll meditate 100 hours this year," and compare your progress against the goal.
- See statistics like total meditation time, streaks, etc.
- Import/Export user data (sessions and goals) as JSON.

Non-features:

- No ads, fees, or distractions.
- No network access (all data is saved locally on your device).
- No guided meditations or other "content."

> [!WARNING]
> This app was written with AI assistance. If that bothers you, don't use it.

## Installation

Prajna is not distributed on the Google Play Store. To install it, you need to manually download and install the `.apk` file from the [latest release](https://github.com/luketurner/prajna/releases/latest).

## Development

Prajna is written using [React Native](https://reactnative.dev/) and [Expo](https://expo.dev).

```bash

# Run dev server
npm run start

# Development Android build on EAS
eas login
npm run build:develop

# Build an APK
npm run build:preview
```
