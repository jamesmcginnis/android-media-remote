# Android Media Remote

VERY MUCH A WORK IN PROGRESS!!

A custom Home Assistant Lovelace card providing a Material Design Android TV media remote and player interface. Control your Android TV with a beautiful, responsive card that integrates seamlessly with your Home Assistant dashboard.

[![hacs][hacs-shield]][hacs]

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=jamesmcginnis&repository=android-media-remote&category=plugin)

---

## Preview

![Android Media Remote — Expanded view](https://raw.githubusercontent.com/jamesmcginnis/android-media-remote/main/preview1.png)

![Android Media Remote — Remote control view](https://raw.githubusercontent.com/jamesmcginnis/android-media-remote/main/preview2.png)

![Android Media Remote — Compact view](https://raw.githubusercontent.com/jamesmcginnis/android-media-remote/main/preview3.png)

![Android Media Remote — App switcher](https://raw.githubusercontent.com/jamesmcginnis/android-media-remote/main/preview4.png)

---

## Features

- **Material Design 3** media controls — FAB play/pause button, outlined nav buttons, tonal shuffle and repeat toggles
- **Remote overlay** — circular D-pad with Back, Home, Google Assistant, App switcher and Power, launched directly from the album art area
- **Three views** — compact strip, expanded player and full remote, switchable with a single tap
- **Three-tier command dispatch** — tries Android TV Remote (IP), falls back to ADB, then to HA media_player services automatically
- **Auto entity switching** — automatically follows whichever media player is actively playing
- **Volume control** — slider or step buttons, supports a separate volume entity (e.g. an external amplifier)
- **Progress bar** — seekable, with live timestamps
- **App launcher** — quick-switch between Android TV sources from within the remote overlay
- **Compact mute button** — mute toggle in the controls row, synced to the entity's mute state
- **HACS compatible** — installs and updates through the Home Assistant Community Store

---

## Installation

### Via HACS (recommended)

1. Click the button above, or open HACS → Frontend and search for **Android Media Remote**.
2. Click **Download**.
3. Restart Home Assistant.
4. Add the card to your dashboard (see [Configuration](#configuration) below).

### Manual

1. Download `android-media-remote.js` from the [latest release][releases].
2. Copy it to your `www` folder (e.g. `/config/www/android-media-remote.js`).
3. In Home Assistant go to **Settings → Dashboards → Resources** and add:
   - URL: `/local/android-media-remote.js`
   - Type: `JavaScript module`
4. Restart Home Assistant (or clear your browser cache).

---

## Integration Setup

The card works best with the **Android TV Remote** integration, but automatically falls back to older methods if it isn't available. You only need to set up one of the following.

### Option 1 — Android TV Remote ✅ Recommended (HA 2023.5+)

The official integration added in Home Assistant 2023.5. Communicates over IP — no ADB or developer mode required on the TV.

1. Go to **Settings → Devices & Services → Add Integration**.
2. Search for **Android TV Remote** and follow the on-screen pairing steps.
3. HA will create both a `media_player.*` and a `remote.*` entity for your TV.
4. Add the card — it will auto-detect the `remote.*` entity and use it immediately.

### Option 2 — androidtv / Fire TV (ADB)

The legacy integration. Requires ADB debugging to be enabled on the TV.

1. On your TV: go to **Settings → Device Preferences → About → Build** and tap the build number 7 times to unlock developer mode. Then enable **USB Debugging** (or **Network Debugging** for Wi-Fi ADB).
2. In HA go to **Settings → Devices & Services → Add Integration** and search for **Android TV** or **Fire TV**.
3. Follow the connection steps. HA will create a `media_player.*` entity.
4. The card will automatically fall back to ADB commands when no `remote.*` entity is found.

### Option 3 — Cast only

If you only have a Cast integration (e.g. a basic Chromecast without Google TV), media playback controls (play/pause, volume, source switching) will work but the D-pad remote and keycodes will not fire. No extra setup needed.

---

## Configuration

Add the card via the UI card picker, or paste the YAML below directly into a dashboard card editor.

### Minimal

```yaml
type: custom:android-media-remote
entities:
  - media_player.living_room_tv
```

### Full options

```yaml
type: custom:android-media-remote
entities:
  - media_player.living_room_tv
  - media_player.bedroom_tv
  - media_player.office_chromecast

# Optional: override the auto-detected remote.* entity.
# By default the card derives this from your media_player entity name.
remote_entity: remote.living_room_tv

# Optional: separate entity for volume (e.g. an AV receiver or soundbar)
volume_entity: media_player.av_receiver

# Display mode on first load: compact | expanded | remote
startup_mode: compact

# Volume control style: slider (default) or buttons
volume_control: slider

# Show the entity selector dropdown
show_entity_selector: true

# Automatically switch to whichever entity is actively playing
auto_switch: true

# Accent colour for the progress bar, play button and active states
accent_color: "#4285F4"

# Colour for the volume slider thumb
volume_accent: "#4285F4"

# Track title text colour
title_color: "#ffffff"

# Artist / subtitle text colour
artist_color: "rgba(255,255,255,0.65)"
```

### Options reference

| Option | Type | Default | Description |
|---|---|---|---|
| `entities` | list | **required** | One or more `media_player` entity IDs |
| `remote_entity` | string | auto | Override the `remote.*` entity for keycode commands. Auto-detects `remote.<device_name>` if omitted |
| `volume_entity` | string | — | Separate entity to use for volume control |
| `startup_mode` | string | `compact` | Initial view: `compact`, `expanded` or `remote` |
| `volume_control` | string | `slider` | Volume UI style: `slider` or `buttons` |
| `show_entity_selector` | boolean | `true` | Show the entity picker dropdown |
| `auto_switch` | boolean | `true` | Automatically switch to the playing entity |
| `accent_color` | string | `#4285F4` | Progress bar and highlight colour |
| `volume_accent` | string | `#4285F4` | Volume slider accent colour |
| `title_color` | string | `#ffffff` | Track title text colour |
| `artist_color` | string | `rgba(255,255,255,0.65)` | Artist / subtitle text colour |

---

## Command Dispatch

Every remote key press goes through a three-tier fallback chain to maximise compatibility across different Android TV setups. No configuration is needed — the card detects what's available automatically.

```
Tier 1 — remote.send_command with KEYCODE_* names
  └─ Tier 2 — androidtv.adb_command with input keyevent N
       └─ Tier 3 — media_player.* HA services
```

**Tier 1** is used when a `remote.*` entity exists (Android TV Remote integration). Commands use proper `KEYCODE_*` names sent over IP — the most reliable method, requires no ADB or developer mode on the TV.

**Tier 2** kicks in automatically if Tier 1 fails or no remote entity is found. Uses `input keyevent N` via ADB through the legacy androidtv integration. Requires ADB debug to be enabled on the TV.

**Tier 3** is the HA-native fallback for actions HA can handle natively — play, pause, volume set, source select, turn on/off. Used when neither a remote entity nor an ADB connection is available.

### Full keycode reference

| Button | KEYCODE name | ADB keyevent |
|---|---|---|
| D-pad Up | `KEYCODE_DPAD_UP` | 19 |
| D-pad Down | `KEYCODE_DPAD_DOWN` | 20 |
| D-pad Left | `KEYCODE_DPAD_LEFT` | 21 |
| D-pad Right | `KEYCODE_DPAD_RIGHT` | 22 |
| OK / Select | `KEYCODE_DPAD_CENTER` | 23 |
| Back | `KEYCODE_BACK` | 4 |
| Home | `KEYCODE_HOME` | 3 |
| Menu | `KEYCODE_MENU` | 82 |
| Power (toggle off) | `KEYCODE_POWER` | 26 |
| Wake (from standby) | `KEYCODE_WAKEUP` | 224 |
| Sleep | `KEYCODE_SLEEP` | 223 |
| Settings | `KEYCODE_SETTINGS` | 176 |
| Google Assistant | `KEYCODE_ASSIST` | 225 |
| Search | `KEYCODE_SEARCH` | 84 |
| Volume Up | `KEYCODE_VOLUME_UP` | 24 |
| Volume Down | `KEYCODE_VOLUME_DOWN` | 25 |
| Mute | `KEYCODE_VOLUME_MUTE` | 164 |
| Play | `KEYCODE_MEDIA_PLAY` | 126 |
| Pause | `KEYCODE_MEDIA_PAUSE` | 127 |
| Play / Pause | `KEYCODE_MEDIA_PLAY_PAUSE` | 85 |
| Stop | `KEYCODE_MEDIA_STOP` | 86 |
| Next | `KEYCODE_MEDIA_NEXT` | 87 |
| Previous | `KEYCODE_MEDIA_PREVIOUS` | 88 |
| Rewind | `KEYCODE_MEDIA_REWIND` | 89 |
| Fast Forward | `KEYCODE_MEDIA_FAST_FORWARD` | 90 |
| HDMI 1 | `KEYCODE_TV_INPUT_HDMI_1` | 243 |
| HDMI 2 | `KEYCODE_TV_INPUT_HDMI_2` | 244 |
| HDMI 3 | `KEYCODE_TV_INPUT_HDMI_3` | 245 |
| HDMI 4 | `KEYCODE_TV_INPUT_HDMI_4` | 246 |
| Input (cycle) | `KEYCODE_TV_INPUT` | 178 |

---

## Platform Compatibility

### ✅ Fully supported — all features work out of the box

| Platform | Integration needed | Notes |
|---|---|---|
| **Android TV** | Android TV Remote (HA 2023.5+) **or** androidtv (ADB) | Full D-pad, all keycodes, media controls, volume, mute, smart power, app launcher |
| **Google TV** (Chromecast with Google TV, Nvidia Shield, etc.) | Android TV Remote (HA 2023.5+) **or** androidtv (ADB) | Identical to Android TV — same integration, same `KEYCODE_*` names |
| **Amazon Fire TV** | fire_tv (ADB) | Android-based, same ADB keycodes — all commands work via ADB |

### ⚠️ Media controls work, D-pad remote does not

The playback buttons (play, pause, previous, next, volume, seek, source switching) all work on the platforms below because they use standard HA `media_player.*` services. The D-pad and keycode buttons do not work because these platforms use different service names or command formats that the card does not currently map.

| Platform | Integration | What works | What doesn't |
|---|---|---|---|
| **Roku** | `rokutv` | All media controls, source switching | D-pad navigation (Roku uses its own command names via a different service) |
| **Samsung Tizen** | `samsungtv` | All media controls, power | D-pad (requires `samsungtv.send_command` with `KEY_*` names) |
| **LG webOS** | `webostv` | All media controls | D-pad (requires `webostv.button` with different command names) |
| **Apple TV** | `apple_tv` | All media controls | D-pad (requires `apple_tv.remote_button` with a `movement` parameter) |
| **Kodi** | `kodi` | Full media controls | D-pad — Kodi has no `remote.*` entity and uses `kodi.*` services for navigation |

### ✅ Media controls only (remote panel not applicable)

| Platform | Notes |
|---|---|
| **Plex / VLC / Emby / Jellyfin** | Play, pause, seek and volume work. No remote concept. |
| **Sonos and audio-only devices** | Volume and playback controls work. Remote D-pad not relevant. |
| **Cast (basic Chromecast)** | Play, pause, volume and source switching work. No remote entity and no ADB. |

### App-level limitations

Some limitations come from the streaming app rather than the integration or the card, and affect all platforms.

- **Seek bar** — Netflix, YouTube and most DRM-protected apps block `media_position` reporting. The progress bar will show zero for these sources even though playback is working normally.
- **Shuffle / Repeat** — only meaningful for local media or Spotify Connect. Streaming apps ignore these.
- **App launcher** — depends on the `source_list` attribute being populated. Some minimal Android TV builds return an empty list.
- **Google Assistant button** — requires the Android TV Remote integration or ADB debug mode. Will not fire on a Cast-only setup.

---

## Contributing

Issues and pull requests are welcome on [GitHub][github].

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

[releases-shield]: https://img.shields.io/github/release/jamesmcginnis/android-media-remote.svg
[releases]: https://github.com/jamesmcginnis/android-media-remote/releases
[license-shield]: https://img.shields.io/github/license/jamesmcginnis/android-media-remote.svg
[hacs-shield]: https://img.shields.io/badge/HACS-Default-41BDF5.svg
[hacs]: https://github.com/hacs/integration
[github]: https://github.com/jamesmcginnis/android-media-remote
