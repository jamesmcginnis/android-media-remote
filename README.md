# Android Media Remote

A Material Design 3 Lovelace card for Home Assistant that turns any dashboard into a full Android TV remote and media player. Three views in one card — compact strip, expanded player, and a circular D-pad remote — all switchable with a single tap.

[![License][license-shield]](LICENSE)
[![hacs][hacs-shield]][hacs]

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=jamesmcginnis&repository=android-media-remote&category=plugin)

---

## Preview

![Expanded view](https://raw.githubusercontent.com/jamesmcginnis/android-media-remote/main/preview1.png)
![Remote control](https://raw.githubusercontent.com/jamesmcginnis/android-media-remote/main/preview2.png)
![Compact view](https://raw.githubusercontent.com/jamesmcginnis/android-media-remote/main/preview3.png)
![App switcher](https://raw.githubusercontent.com/jamesmcginnis/android-media-remote/main/preview4.png)

---

## Features

- **Three views** — compact strip, expanded player, full D-pad remote. Switch between them with a single tap on the artwork
- **Material Design 3 controls** — proportioned play/pause FAB, outlined prev/next buttons, smaller secondary shuffle and repeat toggles
- **Circular D-pad** — directional pad with OK, plus chip buttons for Back, Home, Google Assistant, Apps and Power
- **Three-tier command dispatch** — automatically tries Android TV Remote (IP) → ADB → HA media_player services, with no configuration needed
- **Smart power** — sends `KEYCODE_WAKEUP` + `media_player.turn_on` simultaneously when the TV is off; uses `KEYCODE_POWER` when on
- **Volume control** — slider (default) or +/− step buttons; supports routing volume to a separate entity such as an AV receiver
- **Mute toggle** — compact circular button in the controls row, synced to the entity's mute state
- **Seekable progress bar** — scrub to position with live elapsed / remaining timestamps
- **App launcher** — tap Apps in the remote to switch sources; shows the current playing app when no source list is configured
- **Stable track display** — title and artist are cached between HA polling cycles so the card never flickers to "Playing"
- **Auto entity switching** — automatically follows whichever media player is actively playing
- **Visual editor** — all options configurable through the Lovelace UI, no YAML required
- **HACS compatible** — installs and updates via the Home Assistant Community Store

---

## Installation

### Via HACS (recommended)

1. Click the HACS badge above, or open **HACS → Frontend** and search for **Android Media Remote**.
2. Click **Download**.
3. Hard-refresh your browser (Ctrl+Shift+R / Cmd+Shift+R).
4. Add the card to a dashboard via the card picker or YAML.

### Manual

1. Download `android-media-remote.js` from the [latest release][releases].
2. Copy it to `/config/www/android-media-remote.js`.
3. Go to **Settings → Dashboards → Resources** and add:
   - URL: `/local/android-media-remote.js`
   - Type: `JavaScript module`
4. Hard-refresh your browser.

---

## Integration Setup

The card works without any special integration — but the more capable the integration, the more buttons work. You only need one of the following.

### Option 1 — Android TV Remote ✅ Recommended (HA 2023.5+)

Communicates over IP. No ADB, no developer mode, no cables.

1. Go to **Settings → Devices & Services → Add Integration**.
2. Search for **Android TV Remote** and complete the pairing steps.
3. HA creates both `media_player.*` and `remote.*` entities for the TV.
4. Add the card — it auto-detects the `remote.*` entity and everything works immediately.

### Option 2 — androidtv / Fire TV (ADB)

The legacy integration. Full keycode support via ADB.

1. On the TV: **Settings → Device Preferences → About → Build** — tap Build 7 times to unlock developer mode, then enable **Network Debugging**.
2. In HA: **Settings → Devices & Services → Add Integration** → search **Android TV** or **Fire TV**.
3. The card auto-detects the absence of a `remote.*` entity and falls back to ADB commands.

### Option 3 — Cast (basic Chromecast)

No setup needed. A subset of features work — see [Platform Compatibility](#platform-compatibility) for the full tested breakdown.

---

## Configuration

The card has a full visual editor — click **Edit** on any card then **Configure** to access all options without writing YAML. For manual configuration:

### Minimal

```yaml
type: custom:android-media-remote
entities:
  - media_player.living_room_tv
```

### Full reference

```yaml
type: custom:android-media-remote

# One or more media_player entity IDs shown in the selector dropdown
entities:
  - media_player.living_room_tv
  - media_player.bedroom_tv
  - media_player.office_chromecast

# Override the auto-detected remote.* entity (optional)
# Default: remote.<device_name> derived from the media_player entity
remote_entity: remote.living_room_tv

# Route volume to a different entity, e.g. an AV receiver (optional)
volume_entity: media_player.av_receiver

# Starting view: compact | expanded | remote
startup_mode: compact

# Volume control style: slider | buttons
volume_control: slider

# Show/hide the entity selector dropdown
show_entity_selector: true

# Automatically switch to the entity that is actively playing
auto_switch: true

# Accent colour — play button, progress bar, active states
accent_color: "#4285F4"

# Volume slider thumb colour
volume_accent: "#4285F4"

# Track title colour
title_color: "#ffffff"

# Artist / subtitle colour
artist_color: "rgba(255,255,255,0.65)"
```

### Options reference

| Option | Type | Default | Description |
|---|---|---|---|
| `entities` | list | **required** | One or more `media_player` entity IDs |
| `remote_entity` | string | auto | Override the `remote.*` entity. Auto-detects `remote.<name>` if omitted |
| `volume_entity` | string | — | Route volume commands to a different entity |
| `startup_mode` | string | `compact` | Initial view: `compact`, `expanded` or `remote` |
| `volume_control` | string | `slider` | `slider` or `buttons` |
| `show_entity_selector` | boolean | `true` | Show the entity picker dropdown |
| `auto_switch` | boolean | `true` | Follow the actively playing entity |
| `accent_color` | string | `#4285F4` | Play button and highlight colour |
| `volume_accent` | string | `#4285F4` | Volume slider accent colour |
| `title_color` | string | `#ffffff` | Track title colour |
| `artist_color` | string | `rgba(255,255,255,0.65)` | Artist / subtitle colour |

---

## Command Dispatch

Every button press goes through a three-tier fallback chain. The card detects what is available automatically — no configuration needed.

```
Tier 1  remote.send_command  →  KEYCODE_* over IP  (Android TV Remote integration)
   └─ Tier 2  androidtv.adb_command  →  input keyevent N  (legacy androidtv / Fire TV)
        └─ Tier 3  media_player.*  →  HA native services  (all platforms)
```

**Power on** is a special case: `media_player.turn_on` and `KEYCODE_WAKEUP` are sent simultaneously so the TV wakes reliably regardless of which integration is present.

### Keycode reference

| Button | KEYCODE | ADB event |
|---|---|---|
| D-pad Up | `KEYCODE_DPAD_UP` | 19 |
| D-pad Down | `KEYCODE_DPAD_DOWN` | 20 |
| D-pad Left | `KEYCODE_DPAD_LEFT` | 21 |
| D-pad Right | `KEYCODE_DPAD_RIGHT` | 22 |
| OK / Select | `KEYCODE_DPAD_CENTER` | 23 |
| Back | `KEYCODE_BACK` | 4 |
| Home | `KEYCODE_HOME` | 3 |
| Menu | `KEYCODE_MENU` | 82 |
| Wake (from standby) | `KEYCODE_WAKEUP` | 224 |
| Power (toggle off) | `KEYCODE_POWER` | 26 |
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
| HDMI 1–4 | `KEYCODE_TV_INPUT_HDMI_1` … `_4` | 243–246 |
| Input (cycle) | `KEYCODE_TV_INPUT` | 178 |

---

## Platform Compatibility

### ✅ Fully supported

All buttons, all keycodes, D-pad, volume, mute, power, app launcher and media controls work on these platforms.

| Platform | Integration |
|---|---|
| **Android TV** | Android TV Remote (HA 2023.5+) **or** androidtv (ADB) |
| **Google TV** — Chromecast with Google TV, Nvidia Shield TV | Android TV Remote (HA 2023.5+) **or** androidtv (ADB) |
| **Amazon Fire TV** | fire_tv (ADB) |

### ⚠️ Partially supported — Chromecast / Cast (beta tested)

| Feature | Status | Notes |
|---|---|---|
| Power on | ✅ | `media_player.turn_on` fires immediately |
| Power off | ✅ | Reliable |
| D-pad, OK, Home, Back | ✅ | Requires Android TV Remote integration to also be present |
| Play / Pause / Next / Prev | ✅ | Always works |
| Volume slider and buttons | ✅ | Always works |
| Mute | ✅ | Always works |
| Track title and artist | ✅ | Cached — no flicker between Cast polling cycles |
| App launcher | ⚠️ | Shows the currently playing app; switchable list requires `source_list` in Cast config |
| Google Assistant (Mic) | ❌ | Cast has no `remote.*` entity and no ADB — `KEYCODE_ASSIST` cannot be sent. Platform limitation. |

### ⚠️ Media controls work, D-pad does not

| Platform | Integration | Works | Doesn't work |
|---|---|---|---|
| **Roku** | `rokutv` | All media controls, source switching | D-pad (different service and command names) |
| **Samsung Tizen** | `samsungtv` | All media controls, power | D-pad (requires `samsungtv.send_command` with `KEY_*` names) |
| **LG webOS** | `webostv` | All media controls | D-pad (requires `webostv.button` service) |
| **Apple TV** | `apple_tv` | All media controls | D-pad (requires `apple_tv.remote_button` with a `movement` parameter) |
| **Kodi** | `kodi` | Full media controls | D-pad (Kodi uses `kodi.*` services — no `remote.*` entity) |

### ✅ Media controls only

Plex, VLC, Emby, Jellyfin, Sonos and other audio/video players — play, pause, seek and volume work; the remote D-pad is not applicable.

### Known app-level limitations

These affect all platforms regardless of integration, because they are enforced by the streaming app itself.

- **Seek bar** — Netflix, YouTube and most DRM apps block `media_position` reporting. The progress bar stays at zero even during active playback.
- **Shuffle / Repeat** — meaningful only for local media or Spotify Connect. Streaming apps ignore these commands.
- **App launcher** — the card checks both `source_list` and `app_list` attributes. When neither is populated it shows the current app as a read-only hint with instructions for configuring sources.
- **Google Assistant** — requires the Android TV Remote integration or ADB. Will not fire on a Cast-only setup. This is a platform limitation, not a card bug.

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
