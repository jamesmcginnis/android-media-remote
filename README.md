# Android Media Remote

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

- **Material Design 3** media controls — FAB play/pause button, outlined nav buttons, tonal icon buttons for shuffle and repeat
- **Remote overlay** — circular D-pad with Back, Home, Google Assistant, App switcher and Power, launched directly from the album art area
- **Three views** — compact strip, expanded player and full remote, switchable with a single tap
- **Auto entity switching** — automatically follows whichever media player is actively playing
- **Volume control** — slider or step buttons, supports a separate volume entity (e.g. an external amplifier)
- **Progress bar** — seekable, with live timestamps
- **App launcher** — quick-switch between Android TV sources from within the remote overlay
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

## Configuration

Add the card via the UI card picker, or paste the YAML below directly into a dashboard card editor.

### Minimal

```yaml
type: custom:android-media-remote
entity: media_player.living_room_tv
```

### Full options

```yaml
type: custom:android-media-remote
entity: media_player.living_room_tv

# Optional: separate entity used for volume (e.g. a receiver or speaker)
volume_entity: media_player.av_receiver

# Display mode when the card first loads
# Options: expanded | compact | remote
startup_mode: expanded

# Accent colour for the progress bar and active states
accent_color: "#4285F4"

# Colour for the volume slider thumb
volume_color: "#4285F4"

# Override the title text colour
title_color: "#e8eaed"

# Override the artist/subtitle text colour
artist_color: "rgba(232,234,237,0.55)"

# List of media_player entities to show in the entity selector.
# If omitted the card auto-discovers all media_player entities.
entities:
  - media_player.living_room_tv
  - media_player.bedroom_tv
  - media_player.office_chromecast
```

### Options reference

| Option | Type | Default | Description |
|---|---|---|---|
| `entity` | string | **required** | Primary `media_player` entity ID |
| `volume_entity` | string | — | Separate entity to use for volume control |
| `startup_mode` | string | `expanded` | Initial view: `expanded`, `compact` or `remote` |
| `accent_color` | string | `#4285F4` | Progress bar and highlight colour |
| `volume_color` | string | `#4285F4` | Volume slider accent colour |
| `title_color` | string | `#e8eaed` | Track title text colour |
| `artist_color` | string | `rgba(232,234,237,0.55)` | Artist / subtitle text colour |
| `entities` | list | auto | Pinned entities shown in the selector dropdown |

---

## Remote Commands

The remote overlay sends commands using the standard Home Assistant `remote.send_command` service. The card will fall back to `androidtv.adb_command` with ADB keycodes if no remote entity is configured.

| Button | Keycode |
|---|---|
| Back | `KEYCODE_BACK` (4) |
| Home | `KEYCODE_HOME` (3) |
| Google Assistant | `KEYCODE_ASSIST` (225) |
| D-pad Up | `KEYCODE_DPAD_UP` (19) |
| D-pad Down | `KEYCODE_DPAD_DOWN` (20) |
| D-pad Left | `KEYCODE_DPAD_LEFT` (21) |
| D-pad Right | `KEYCODE_DPAD_RIGHT` (22) |
| OK / Select | `KEYCODE_DPAD_CENTER` (23) |

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
