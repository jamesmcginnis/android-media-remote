# Android Media Remote

A Material Design Android TV media remote and player card for Home Assistant.

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=jamesmcginnis&repository=android-media-remote&category=plugin)

---

![Android Media Remote — Expanded view](https://raw.githubusercontent.com/jamesmcginnis/android-media-remote/main/preview1.png)

![Android Media Remote — Remote control view](https://raw.githubusercontent.com/jamesmcginnis/android-media-remote/main/preview2.png)

![Android Media Remote — Compact view](https://raw.githubusercontent.com/jamesmcginnis/android-media-remote/main/preview3.png)

![Android Media Remote — App switcher](https://raw.githubusercontent.com/jamesmcginnis/android-media-remote/main/preview4.png)

---

## What this card does

Control your Android TV directly from any Home Assistant dashboard with a single card that gives you three views in one — compact strip, expanded player and a full D-pad remote — all switchable with a single tap.

- **Material Design 3 controls** — FAB play/pause, outlined prev/next buttons, tonal shuffle and repeat toggles, compact mute button
- **Circular D-pad remote** — Back, Home, Google Assistant, App switcher, Power and full directional navigation
- **Three-tier command dispatch** — automatically uses the best available method: Android TV Remote (IP) → ADB → HA media_player services
- **Volume control** — slider or step buttons, supports a separate entity for external receivers or soundbars
- **App launcher** — quick-switch between Android TV sources from the remote overlay
- **Auto entity switching** — follows the active media player automatically

---

## Platform compatibility

### ✅ Fully supported

| Platform | How |
|---|---|
| **Android TV** | Android TV Remote integration (HA 2023.5+) or androidtv ADB |
| **Google TV** (Chromecast with Google TV, Nvidia Shield, etc.) | Android TV Remote integration (HA 2023.5+) or androidtv ADB |
| **Amazon Fire TV** | fire_tv integration via ADB |

All keycodes, D-pad navigation, volume, mute, smart power (wake vs toggle), app launcher and media controls work fully on these platforms.

### ⚠️ Media controls work, D-pad remote does not

| Platform | Integration |
|---|---|
| Roku | `rokutv` |
| Samsung Tizen | `samsungtv` |
| LG webOS | `webostv` |
| Apple TV | `apple_tv` |
| Kodi | `kodi` |

Play, pause, previous, next, volume, seek and source switching all work on these platforms via standard HA `media_player.*` services. The D-pad remote buttons do not fire because these platforms use different service names or command formats.

### ✅ Media controls only

Basic Cast, Plex, VLC, Emby, Jellyfin, Sonos and other audio/video players — playback and volume controls work, remote D-pad not applicable.

---

## Recommended setup for Android TV

Install the **Android TV Remote** integration (HA 2023.5+) for the best experience. It communicates over IP with no ADB or developer mode required, and gives full keycode support for every button on the card. If you prefer ADB, the legacy **androidtv** integration is fully supported too — the card detects which is available and uses it automatically.

---

## Minimal configuration

```yaml
type: custom:android-media-remote
entities:
  - media_player.living_room_tv
```

See the [README](https://github.com/jamesmcginnis/android-media-remote#configuration) for the full configuration reference, keycode table and integration setup guide.
