# Android Media Remote

A Material Design 3 Lovelace card that turns any Home Assistant dashboard into a full Android TV remote and media player.

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=jamesmcginnis&repository=android-media-remote&category=plugin)

---

## What it does

Three views in one card — compact strip, expanded player, and a full circular D-pad remote — switchable with a single tap on the artwork.

- **Material Design 3 controls** — proportioned play/pause FAB, outlined prev/next, secondary shuffle and repeat toggles, compact mute button
- **Circular D-pad remote** — directional pad with OK, Back, Home, App switcher and Power
- **Three-tier command dispatch** — automatically uses the best available path: Android TV Remote (IP) → ADB → HA media_player services
- **Smart power** — wakes the TV via `turn_on` and `KEYCODE_WAKEUP` simultaneously so it works on every setup
- **Volume control** — slider or step buttons; supports a separate entity for external receivers or soundbars
- **App launcher** — switch sources directly from the remote via a scrollable dropdown; shows the current app when no source list is configured
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

### ⚠️ Media controls work, D-pad does not

Roku (`rokutv`), Samsung Tizen (`samsungtv`), LG webOS (`webostv`), Apple TV (`apple_tv`), Kodi (`kodi`) — playback, volume and source switching all work via standard HA services. D-pad navigation requires platform-specific service calls not currently mapped.

### ✅ Media controls only

Plex, VLC, Emby, Jellyfin, Sonos — play, pause, seek and volume work; remote D-pad not applicable.

---

## Recommended setup

Install the **Android TV Remote** integration (HA 2023.5+) — it communicates over IP with no ADB or developer mode required, and unlocks every button on the card. The legacy **androidtv** ADB integration is fully supported too; the card detects which is available and uses it automatically.

---

## App Launcher

Tap the **Apps** button in the remote view to open a scrollable source list. Tapping any entry switches to that app immediately using HA's `media_player.select_source` service.

### How the card populates the list

The card checks two entity attributes in order:

1. `source_list` — the standard HA attribute, populated by most integrations automatically
2. `app_list` — used by some older androidtv / Fire TV integrations

If neither attribute is present, the dropdown still opens but shows the **currently active app** as a read-only label, along with a hint to configure a source list. This lets you at least see what is playing without being able to switch.

### Android TV and Google TV

The Android TV Remote and androidtv integrations populate `source_list` automatically from the apps installed on the device. No extra configuration is needed — open the remote, tap Apps, and the full installed app list appears.

If you want to **limit the list to specific apps** rather than showing every installed app, you can do so in the integration options:

1. Go to **Settings → Devices & Services** and open your Android TV device.
2. Select **Configure** and look for the app filter or source list options.
3. Untick any apps you do not want to appear.

### Fire TV

The `fire_tv` integration exposes an `app_list` attribute. The card reads this automatically. No additional configuration is required.

### Chromecast / Cast

Cast devices do not expose a source list by default. To enable app switching you need to add a `source_list` to the entity via a template or the Cast integration's advanced options.

The simplest approach is to add a `source_list` via `configuration.yaml` using a `customize` entry:

```yaml
homeassistant:
  customize:
    media_player.your_chromecast:
      source_list:
        - Netflix
        - YouTube
        - Disney+
        - Plex
        - Spotify
```

The names must exactly match what your Chromecast recognises as app IDs or friendly names. After saving, restart HA and the Apps button will show your list.

### Other platforms

Roku, Samsung Tizen, LG webOS, Kodi and most other integrations populate `source_list` with their own input or app list automatically. The Apps button will work without any extra configuration on these platforms — though note that D-pad navigation is not supported on those devices.

### Troubleshooting

If the Apps button shows **"No apps available"**, the entity has neither a `source_list` nor an `app_list` attribute and no current source is reported. Check the entity's attributes in **Developer Tools → States**, find your `media_player.*` entity and look for `source_list` or `app_list` in the attribute panel. If neither exists, use the `customize` approach above to define one manually.

---

## Minimal configuration

```yaml
type: custom:android-media-remote
entities:
  - media_player.living_room_tv
```

See the [README](https://github.com/jamesmcginnis/android-media-remote#readme) for the full configuration reference, complete keycode table, integration setup guide and platform compatibility details.
