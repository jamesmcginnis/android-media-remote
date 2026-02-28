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

Control your Android TV directly from any Home Assistant dashboard with a single card that gives you:

- **Three views in one** — compact strip for small spaces, expanded player, and a full remote control overlay with a circular D-pad
- **Material Design 3 controls** — FAB play/pause, outlined prev/next buttons, tonal shuffle and repeat toggles
- **Remote overlay** — Back, Home, Google Assistant, App switcher, Power and circular D-pad
- **Volume control** — supports a separate volume entity for external receivers or speakers
- **App launcher** — quick-switch between Android TV sources from the remote overlay
- **Auto entity switching** — follows the active media player automatically

---

## Minimal configuration

```yaml
type: custom:android-media-remote
entity: media_player.living_room_tv
```

See the [README](https://github.com/jamesmcginnis/android-media-remote#configuration) for the full list of configuration options.
