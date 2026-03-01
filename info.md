# Android Media Remote

A Material Design 3 Lovelace card that turns any Home Assistant dashboard into a full Android TV remote and media player.

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=jamesmcginnis&repository=android-media-remote&category=plugin)

---

![Expanded view](https://raw.githubusercontent.com/jamesmcginnis/android-media-remote/main/preview1.png)
![Remote control](https://raw.githubusercontent.com/jamesmcginnis/android-media-remote/main/preview2.png)
![Compact view](https://raw.githubusercontent.com/jamesmcginnis/android-media-remote/main/preview3.png)
![App switcher](https://raw.githubusercontent.com/jamesmcginnis/android-media-remote/main/preview4.png)

---

## What it does

Three views in one card — compact strip, expanded player, and a full circular D-pad remote — switchable with a single tap on the artwork.

- **Material Design 3 controls** — proportioned play/pause FAB, outlined prev/next, secondary shuffle and repeat toggles, compact mute button
- **Circular D-pad remote** — directional pad with OK, Back, Home, Google Assistant, App switcher and Power
- **Three-tier command dispatch** — automatically uses the best available path: Android TV Remote (IP) → ADB → HA media_player services
- **Smart power** — wakes the TV via `turn_on` and `KEYCODE_WAKEUP` simultaneously so it works on every setup
- **Volume control** — slider or step buttons; supports a separate entity for external receivers or soundbars
- **App launcher** — switch sources directly from the remote; shows the current app when no source list is configured
- **Stable track display** — title and artist cached between polling cycles, no flicker to "Playing"
- **Auto entity switching** — follows the active media player automatically
- **Full visual editor** — configure everything through the Lovelace UI, no YAML required

---

## Platform compatibility

### ✅ Fully supported

| Platform | Integration |
|---|---|
| **Android TV** | Android TV Remote (HA 2023.5+) or androidtv (ADB) |
| **Google TV** — Chromecast with Google TV, Nvidia Shield | Android TV Remote (HA 2023.5+) or androidtv (ADB) |
| **Amazon Fire TV** | fire_tv (ADB) |

All buttons, D-pad, volume, mute, power, app launcher and media controls work in full.

### ⚠️ Partially supported — Chromecast / Cast (beta tested)

| Feature | Status |
|---|---|
| Power on / off | ✅ |
| D-pad, OK, Home, Back | ✅ requires Android TV Remote integration |
| Play / Pause / Next / Prev / Volume / Mute | ✅ always |
| Track title and artist | ✅ stable, no flicker |
| App launcher | ⚠️ shows current app; full list needs `source_list` in Cast config |
| Google Assistant (Mic) | ❌ Cast platform limitation — cannot be fixed in the card |

### ⚠️ Media controls work, D-pad does not

Roku (`rokutv`), Samsung Tizen (`samsungtv`), LG webOS (`webostv`), Apple TV (`apple_tv`), Kodi (`kodi`) — playback, volume and source switching all work via standard HA services. D-pad navigation requires platform-specific service calls not currently mapped.

### ✅ Media controls only

Plex, VLC, Emby, Jellyfin, Sonos — play, pause, seek and volume work; remote D-pad not applicable.

---

## Recommended setup

Install the **Android TV Remote** integration (HA 2023.5+) — it communicates over IP with no ADB or developer mode required, and unlocks every button on the card. The legacy **androidtv** ADB integration is fully supported too; the card detects which is available and uses it automatically.

---

## Minimal configuration

```yaml
type: custom:android-media-remote
entities:
  - media_player.living_room_tv
```

See the [README](https://github.com/jamesmcginnis/android-media-remote#readme) for the full configuration reference, complete keycode table, integration setup guide and platform compatibility details.
