/**
 * Android TV Media Remote
 * Custom Lovelace card for Home Assistant.
 * Material Design 3 media controls, circular D-pad remote overlay.
 * https://github.com/jamesmcginnis/android-media-remote
 */

class AndroidMediaRemote extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._timer        = null;
    this._androidPulse = null;
    this._manualSelection = false;
    this._entity       = null;
    this._remoteMode   = false;
    this._lastVolume   = null;
    this._volDebounce  = null;
    this._volLastFired = null;
  }

  static getConfigElement() {
    return document.createElement('android-media-remote-editor');
  }

  static getStubConfig() {
    return {
      entities: [],
      auto_switch: true,
      accent_color: '#4285F4',
      volume_accent: '#4285F4',
      title_color: '#ffffff',
      artist_color: '#ffffff',
      show_entity_selector: true,
      volume_control: 'slider',
      startup_mode: 'compact',
      volume_entity: ''
    };
  }

  setConfig(config) {
    if (!config.entities || config.entities.length === 0) throw new Error('Please define entities');
    const prevStartup = this._config?.startup_mode;
    this._config = {
      accent_color: '#4285F4',
      volume_accent: '#4285F4',
      title_color: '#ffffff',
      artist_color: '#ffffff',
      auto_switch: true,
      show_entity_selector: true,
      volume_control: 'slider',
      startup_mode: 'compact',
      volume_entity: '',
      ...config
    };
    if (!this._entity) this._entity = this._config.entities[0];
    if (prevStartup !== undefined && prevStartup !== this._config.startup_mode && this.shadowRoot.innerHTML) {
      this._applyStartupMode();
    }
  }

  _applyStartupMode() {
    const card = this.shadowRoot.getElementById('cardOuter');
    if (!card) return;
    const mode = this._config.startup_mode || 'compact';
    card.classList.remove('mode-compact', 'remote-open');
    if (this._remoteMode) this._remoteMode = false;
    if (mode === 'compact') {
      card.classList.add('mode-compact');
    } else if (mode === 'remote') {
      requestAnimationFrame(() => this._openRemote());
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.shadowRoot.innerHTML) {
      this.render();
      this.setupListeners();
      this._applyStartupMode();
    }

    if (this._config.auto_switch) {
      const active = this._config.entities.find(e => hass.states[e]?.state === 'playing');
      if (active && (this._entity !== active || !this._manualSelection)) {
        if (this._entity !== active) { this._entity = active; this._manualSelection = false; }
      }
    }

    const stateObj = hass.states[this._entity];
    if (stateObj) this.updateContent(stateObj);
  }

  connectedCallback() {
    this._timer = setInterval(() => this.updateLiveProgress(), 1000);
    this._androidPulse = setInterval(() => {
      if (this._hass?.connected && this._entity && this._hass.states[this._entity]) {
        this._hass.callService('homeassistant', 'update_entity', { entity_id: this._entity }).catch(() => {});
      }
    }, 10000);
    requestAnimationFrame(() => this._applyStartupMode());
  }

  disconnectedCallback() {
    if (this._timer)        clearInterval(this._timer);
    if (this._androidPulse) clearInterval(this._androidPulse);
  }

  getDeviceIcon(stateObj) {
    const name = (stateObj?.attributes?.friendly_name || '').toLowerCase();
    if (name.includes('tv'))
      return `<svg viewBox="0 0 24 24" width="120" height="120" fill="rgba(255,255,255,0.3)"><path d="M21,3H3C1.89,3 1,3.89 1,5V17A2,2 0 0,0 3,19H8V21H16V19H21A2,2 0 0,0 23,17V5C23,3.89 22.1,3 21,3M21,17H3V5H21V17Z"/></svg>`;
    return `<svg viewBox="0 0 24 24" width="120" height="120" fill="rgba(255,255,255,0.3)"><path d="M12,3V13.55C11.41,13.21 10.73,13 10,13C7.79,13 6,14.79 6,17C6,19.21 7.79,21 10,21C12.21,21 14,19.21 14,17V7H18V3H12Z"/></svg>`;
  }

  updateLiveProgress() {
    const state = this._hass?.states[this._entity];
    if (!state || state.state !== 'playing') return;
    const r        = this.shadowRoot;
    const duration = state.attributes.media_duration;
    let pos        = state.attributes.media_position;
    if (pos !== undefined && state.attributes.media_position_updated_at) {
      pos += (Date.now() - new Date(state.attributes.media_position_updated_at).getTime()) / 1000;
    }
    if (duration && pos !== undefined) {
      const pct  = Math.min((pos / duration) * 100, 100);
      const fill = r.getElementById('progFill');
      if (fill) fill.style.width = `${pct}%`;
      const cur  = r.getElementById('pCur');
      if (cur)  cur.textContent = this.formatTime(pos);
    }
  }

  /* ── Remote open / close ──────────────────────────────────── */
  _openRemote() {
    this._remoteMode = true;
    const r    = this.shadowRoot;
    const card = r.getElementById('cardOuter');
    card.classList.add('remote-open');
    r.getElementById('remoteOverlay').classList.remove('hidden');
    r.getElementById('albumImg').classList.add('hidden');
    r.getElementById('mainPlaceholder').classList.add('hidden');
  }

  _closeRemote() {
    this._remoteMode = false;
    const r    = this.shadowRoot;
    const card = r.getElementById('cardOuter');
    card.classList.remove('remote-open');
    r.getElementById('remoteOverlay').classList.add('hidden');
    // Close apps dropdown
    const dd = r.getElementById('rAppsDropdown');
    if (dd) { dd.classList.add('hidden'); r.getElementById('rApps')?.classList.remove('r-apps-open'); }
    // Restore art
    const state = this._hass?.states[this._entity];
    if (state) {
      const isPlaying = state.state === 'playing';
      const artUrl    = state.attributes.entity_picture;
      const albumImg  = r.getElementById('albumImg');
      const mainPh    = r.getElementById('mainPlaceholder');
      if (isPlaying && artUrl) {
        albumImg.classList.remove('hidden');
        mainPh.classList.add('hidden');
      } else {
        albumImg.classList.add('hidden');
        mainPh.innerHTML = this.getDeviceIcon(state);
        mainPh.classList.remove('hidden');
      }
    }
  }

  _toggleRemote() {
    this._remoteMode ? this._closeRemote() : this._openRemote();
  }

  /* ── Helpers ──────────────────────────────────────────────── */
  get _volEntity() {
    const ve = this._config?.volume_entity;
    return (ve && ve.trim()) ? ve.trim() : this._entity;
  }

  sendRemoteCommand(command) {
    const remoteId = this._entity.replace('media_player.', 'remote.');
    this._hass.callService('remote', 'send_command', {
      entity_id: remoteId, command
    }).catch(() => {
      this._hass.callService('androidtv', 'adb_command', {
        entity_id: this._entity, command: this._mapToAdb(command)
      }).catch(() => {});
    });
  }

  _mapToAdb(command) {
    const map = {
      up: 'input keyevent 19', down: 'input keyevent 20',
      left: 'input keyevent 21', right: 'input keyevent 22',
      select: 'input keyevent 23', back: 'input keyevent 4',
      home: 'input keyevent 3', menu: 'input keyevent 82',
      assistant: 'input keyevent 225', search: 'input keyevent 84',
    };
    return map[command] || command;
  }

  call(svc, data = {}) {
    this._hass.callService('media_player', svc, { entity_id: this._entity, ...data });
  }

  doSeek(e) {
    const state = this._hass.states[this._entity];
    if (!state?.attributes?.media_duration) return;
    const rect    = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    this.call('media_seek', { seek_position: state.attributes.media_duration * percent });
  }

  _openMoreInfo() {
    const ev = new Event('hass-more-info', { bubbles: true, composed: true });
    ev.detail = { entityId: this._entity };
    this.dispatchEvent(ev);
  }

  formatTime(s) {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60), rs = Math.floor(s % 60);
    return `${m}:${rs < 10 ? '0' : ''}${rs}`;
  }

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :host { display: block; --accent: #4285F4; --vol-accent: #4285F4; }

        ha-card {
          background: rgba(18,18,18,0.92) !important;
          backdrop-filter: blur(32px) saturate(160%) !important;
          -webkit-backdrop-filter: blur(32px) saturate(160%) !important;
          color: #fff !important;
          border-radius: 16px !important;
          overflow: hidden;
          font-family: 'Google Sans', Roboto, 'Segoe UI', sans-serif;
          position: relative;
          border: 1px solid rgba(255,255,255,0.10) !important;
          box-shadow: 0 8px 40px rgba(0,0,0,0.55) !important;
          transition: all 0.3s ease;
        }

        /* ─── Size toggle buttons ─────────────────────────────
         *
         * .art-size-toggle  — inside art-wrapper, bottom-left.
         *   Directly opposite the remote-btn at bottom-right.
         *   z-index 5 so it floats above the remote overlay (z-4).
         *   Not needed in compact — art-wrapper is display:none.
         *
         * .compact-size-toggle — on ha-card top-right.
         *   Only shown when mode-compact is active.
         *
         * Both use .size-toggle-base for shared appearance.
         */
        .size-toggle-base {
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.18) !important;
          border-radius: 10px !important;
          width: 38px; height: 38px;
          cursor: pointer; color: #fff;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s ease; padding: 0;
        }
        .size-toggle-base:hover  { background: rgba(255,255,255,0.14); }
        .size-toggle-base:active,
        .size-toggle-base.pressed { transform: scale(0.91); }
        .size-toggle-base svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 2.5; }

        .art-size-toggle {
          position: absolute; bottom: 12px; left: 12px; z-index: 5;
        }

        .compact-size-toggle {
          display: none;
          position: absolute; top: 8px; right: 8px;
          width: 32px; height: 32px;
          border-radius: 8px !important;
          z-index: 10;
        }
        .mode-compact .compact-size-toggle { display: flex; }

        /* ─── Art wrapper ─────────────────────────────────── */
        .art-wrapper {
          width: 100%; aspect-ratio: 1;
          background: linear-gradient(135deg, rgba(30,30,30,0.95), rgba(18,18,18,0.98));
          display: flex; align-items: center; justify-content: center;
          overflow: hidden; cursor: pointer; position: relative;
        }
        .art-wrapper img { width: 100%; height: 100%; object-fit: cover; }
        .placeholder-svg { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }

        /* ─── Remote trigger — bottom-right of art ──────────── */
        .remote-toggle-btn {
          position: absolute; bottom: 12px; right: 12px;
          width: 38px; height: 38px;
          border-radius: 10px !important;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.18) !important;
          z-index: 5; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s ease; padding: 0;
        }
        .remote-toggle-btn svg { width: 18px; height: 18px; fill: rgba(255,255,255,0.82); transition: fill 0.2s; }
        .remote-toggle-btn:active,
        .remote-toggle-btn.pressed { transform: scale(0.91); }
        /* Blue tint when remote open — signals "tap to close" */
        .remote-open .remote-toggle-btn { background: rgba(66,133,244,0.28) !important; border-color: rgba(66,133,244,0.55) !important; }
        .remote-open .remote-toggle-btn svg { fill: #4285F4; }
        .mode-compact .remote-toggle-btn { display: none; }

        /* ─── Remote overlay ────────────────────────────────── */
        .remote-overlay {
          position: absolute; inset: 0;
          background: rgba(11,11,17,0.98);
          display: flex; align-items: center; justify-content: center;
          z-index: 4; cursor: default;
        }
        .remote-overlay.hidden { display: none; }

        /* ─── Remote panel ──────────────────────────────────── */
        .remote-panel {
          display: flex; flex-direction: column; align-items: center;
          gap: 10px; width: 100%; height: 100%;
          padding: 14px 14px 14px;
        }

        /*
         * SINGLE TOP ROW: Back · Home · Mic · Apps · Power
         * All 5 chips in one flex row, compact padding so they all fit.
         */
        .r-top-row {
          display: flex; width: 100%; align-items: center; gap: 6px;
        }

        .r-chip-btn {
          display: flex; align-items: center; gap: 4px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12) !important;
          border-radius: 8px !important;
          padding: 6px 10px !important;
          cursor: pointer; color: rgba(255,255,255,0.85);
          font-size: 11.5px; font-weight: 500;
          font-family: 'Google Sans', Roboto, sans-serif;
          white-space: nowrap; transition: all 0.14s ease;
        }
        .r-chip-btn svg { width: 13px; height: 13px; fill: rgba(255,255,255,0.85); flex-shrink: 0; }
        .r-chip-btn:active,
        .r-chip-btn.pressed { background: rgba(255,255,255,0.15); transform: scale(0.94); }

        /* Power — red tint when on */
        .r-power-btn.r-power-on { background: rgba(234,67,53,0.17); border-color: rgba(234,67,53,0.38) !important; }
        .r-power-btn.r-power-on svg { fill: rgba(239,83,80,1); }
        .r-power-btn.r-power-on:active,
        .r-power-btn.r-power-on.pressed { background: rgba(234,67,53,0.27) !important; }

        /* Mic (Assistant) — icon has a subtle blue hint but NO background tint by default */
        .r-assistant-btn svg { fill: rgba(130,170,255,0.75); }
        .r-assistant-btn:active,
        .r-assistant-btn.pressed { background: rgba(66,133,244,0.22) !important; }
        .r-assistant-btn:active svg,
        .r-assistant-btn.pressed svg { fill: #4285F4; }

        /* Apps — open state */
        .r-apps-btn.r-apps-open { background: rgba(255,255,255,0.14); border-color: rgba(255,255,255,0.26) !important; }

        /* ─── Apps dropdown ─────────────────────────────────── */
        .r-apps-dropdown {
          position: absolute; top: 52px; left: 14px; right: 14px;
          background: rgba(22,22,30,0.99);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px; z-index: 10; overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.7);
          max-height: 220px; overflow-y: auto;
        }
        .r-apps-dropdown.hidden { display: none; }
        .r-apps-dropdown::-webkit-scrollbar { width: 3px; }
        .r-apps-dropdown::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
        .r-app-item {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 16px; font-size: 14px; color: rgba(255,255,255,0.85);
          font-family: 'Google Sans', Roboto, sans-serif;
          cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: background 0.1s ease;
        }
        .r-app-item:last-child { border-bottom: none; }
        .r-app-item:active, .r-app-item:hover { background: rgba(255,255,255,0.07); }
        .r-app-item svg { width: 16px; height: 16px; fill: rgba(255,255,255,0.4); flex-shrink: 0; }
        .r-app-item.r-app-active { color: #4285F4; }
        .r-app-item.r-app-active svg { fill: #4285F4; }

        /* ─── D-Pad ─────────────────────────────────────────── */
        .clickpad-wrap { display: flex; align-items: center; justify-content: center; width: 100%; flex: 1; }
        .clickpad {
          position: relative; width: 70%; aspect-ratio: 1;
          border-radius: 50%;
          background: radial-gradient(ellipse at 42% 36%, rgba(50,50,62,0.98) 0%, rgba(20,20,28,1) 100%);
          border: 1px solid rgba(255,255,255,0.07);
          box-shadow: inset 0 2px 0 rgba(255,255,255,0.05), inset 0 -2px 0 rgba(0,0,0,0.4), 0 12px 40px rgba(0,0,0,0.65);
          overflow: hidden; flex-shrink: 0; user-select: none;
        }
        .cp-dir {
          position: absolute; background: transparent;
          border: none !important; border-radius: 0 !important;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: background 0.1s ease; padding: 0; z-index: 2;
        }
        .cp-dir svg { fill: rgba(255,255,255,0.45); pointer-events: none; width: 26px; height: 26px; transition: all 0.1s ease; }
        .cp-dir:active, .cp-dir.pressed { background: rgba(255,255,255,0.09); }
        .cp-dir:active svg, .cp-dir.pressed svg { fill: #fff; filter: drop-shadow(0 0 5px rgba(255,255,255,0.55)); }
        .cp-up    { top: 0; left: 0; right: 0; height: 34%; align-items: flex-start; padding-top: 13px; }
        .cp-down  { bottom: 0; left: 0; right: 0; height: 34%; align-items: flex-end; padding-bottom: 13px; }
        .cp-left  { top: 0; left: 0; bottom: 0; width: 30%; justify-content: flex-start; padding-left: 15px; }
        .cp-right { top: 0; right: 0; bottom: 0; width: 30%; justify-content: flex-end; padding-right: 15px; }
        .cp-select {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%,-50%);
          width: 34%; aspect-ratio: 1; border-radius: 50% !important;
          background: rgba(66,133,244,0.14);
          border: 1px solid rgba(66,133,244,0.28) !important;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.07), 0 2px 12px rgba(0,0,0,0.45);
          cursor: pointer; z-index: 3; transition: all 0.1s ease; padding: 0;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.65); font-size: 11px; font-weight: 600;
          font-family: 'Google Sans', Roboto, sans-serif; letter-spacing: 0.4px;
        }
        .cp-select:active, .cp-select.pressed {
          background: rgba(66,133,244,0.30);
          box-shadow: 0 0 22px rgba(66,133,244,0.35);
          transform: translate(-50%,-50%) scale(0.93);
        }

        /* ─── Content area ──────────────────────────────────── */
        .content { padding: 18px 18px 14px; display: flex; flex-direction: column; }
        .info-row { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; }

        .mini-art {
          display: none; width: 52px; height: 52px; border-radius: 8px;
          overflow: hidden; background: rgba(40,40,40,0.7);
          align-items: center; justify-content: center;
          border: 1px solid rgba(255,255,255,0.08); cursor: pointer; flex-shrink: 0;
        }
        .mini-art img { width: 100%; height: 100%; object-fit: cover; }
        .track-info  { flex: 1; overflow: hidden; padding-right: 40px; }
        .track-title  { font-size: 18px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: 0.1px; color: #fff; }
        .track-artist { font-size: 14px; color: rgba(255,255,255,0.65); margin-bottom: 10px; font-weight: 400; }

        .progress-bar  { height: 3px; background: rgba(255,255,255,0.12); border-radius: 2px; margin-bottom: 6px; cursor: pointer; overflow: hidden; }
        .progress-fill { height: 100%; background: var(--accent); width: 0%; border-radius: 2px; transition: width 0.3s ease; }
        .progress-times { display: flex; justify-content: space-between; font-size: 11px; color: rgba(255,255,255,0.45); font-variant-numeric: tabular-nums; }

        /* ─── Material Design 3 media controls ──────────────────
         *
         * .controls  — buttons only row, centred with natural gap.
         *              No volume here — that sits on .vol-row below.
         * .vol-row   — separate row: [icon] [slider]
         *
         * FAB: filled blue circle — Play/Pause
         * Outlined circles: Prev / Next
         * Ghost circles: Shuffle / Repeat (tonal when active)
         * Compact only: MiniRemote (left) + Mute (right)
         */
        .controls {
          display: flex; justify-content: center; align-items: center;
          gap: 12px;
          margin: 16px 0 0; padding: 0;
        }

        /* Volume on its own row — never competes with playback buttons */
        .vol-row {
          display: flex; align-items: center; gap: 10px;
          width: 100%; margin-top: 14px;
        }
        .vol-row-icon { width: 16px; height: 16px; fill: rgba(255,255,255,0.35); flex-shrink: 0; }

        /* FAB */
        .md-fab {
          width: 64px; height: 64px; border-radius: 50% !important;
          background: var(--accent);
          box-shadow: 0 4px 12px rgba(66,133,244,0.45), 0 1px 3px rgba(0,0,0,0.4);
          border: none !important; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.18s cubic-bezier(0.4,0,0.2,1);
          position: relative; overflow: hidden; flex-shrink: 0;
        }
        .md-fab svg { width: 30px; height: 30px; fill: #fff; }
        .md-fab::after { content: ''; position: absolute; inset: 0; border-radius: 50%; background: rgba(255,255,255,0); transition: background 0.18s ease; }
        .md-fab:active::after,
        .md-fab.pressed::after { background: rgba(255,255,255,0.14); }
        .md-fab:active, .md-fab.pressed { transform: scale(0.92); box-shadow: 0 2px 6px rgba(66,133,244,0.35); }

        /* Outlined nav buttons */
        .md-nav-btn {
          width: 48px; height: 48px; border-radius: 50% !important;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10) !important;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.18s ease; position: relative; overflow: hidden;
        }
        .md-nav-btn svg { width: 26px; height: 26px; fill: rgba(255,255,255,0.82); }
        .md-nav-btn:active, .md-nav-btn.pressed { background: rgba(255,255,255,0.14); transform: scale(0.93); }

        /* Ghost icon buttons */
        .md-icon-btn {
          width: 40px; height: 40px; border-radius: 50% !important;
          background: transparent; border: none !important;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: background 0.18s ease; position: relative; overflow: hidden;
        }
        .md-icon-btn svg { width: 22px; height: 22px; fill: rgba(255,255,255,0.38); transition: fill 0.18s ease; }
        .md-icon-btn::after { content: ''; position: absolute; inset: 0; border-radius: 50%; background: rgba(255,255,255,0); transition: background 0.18s ease; }
        .md-icon-btn:active::after,
        .md-icon-btn.pressed::after { background: rgba(255,255,255,0.12); }
        .md-icon-btn.active svg { fill: var(--accent); }
        .md-icon-btn.active { background: rgba(66,133,244,0.12); }

        /* Mini remote — compact only, replaces shuffle slot */
        .mini-remote-btn {
          display: none; width: 34px; height: 34px;
          border-radius: 8px !important;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12) !important;
          cursor: pointer; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all 0.18s ease; padding: 0;
        }
        .mini-remote-btn svg { width: 16px; height: 16px; fill: rgba(255,255,255,0.7); }
        .mini-remote-btn:active,
        .mini-remote-btn.pressed { background: rgba(255,255,255,0.16); transform: scale(0.92); }

        /* Compact mute button — far-right of controls, compact only */
        .compact-mute-btn {
          display: none; width: 34px; height: 34px;
          border-radius: 50% !important; border: none !important;
          background: transparent; cursor: pointer;
          align-items: center; justify-content: center;
          flex-shrink: 0; transition: all 0.18s ease;
          position: relative; overflow: hidden;
        }
        .compact-mute-btn svg { width: 18px; height: 18px; fill: rgba(255,255,255,0.38); transition: fill 0.18s ease; }
        .compact-mute-btn::after { content: ''; position: absolute; inset: 0; border-radius: 50%; background: rgba(255,255,255,0); transition: background 0.18s ease; }
        .compact-mute-btn:active::after,
        .compact-mute-btn.pressed::after { background: rgba(255,255,255,0.12); }
        .compact-mute-btn.muted svg { fill: rgba(234,67,53,0.9); }
        .compact-mute-btn.muted { background: rgba(234,67,53,0.10); }

        /* Volume */
        .vol-section { display: none; } /* vol-row handles this now */
        .vol-icon    { display: none; width: 18px; height: 18px; fill: rgba(255,255,255,0.5); cursor: pointer; }
        .vol-btn {
          display: none; cursor: pointer; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all 0.2s ease;
          padding: 0; background: none; border: none !important; border-radius: 50% !important;
        }
        .vol-btn svg { width: 22px; height: 22px; fill: rgba(255,255,255,0.5); }
        .vol-btn:active, .vol-btn.pressed { transform: scale(0.92); background: rgba(255,255,255,0.1); }
        .vol-btn:active svg, .vol-btn.pressed svg { fill: #fff; filter: drop-shadow(0 0 6px rgba(255,255,255,0.7)); }
        .volume-slider {
          flex: 1; height: 4px; accent-color: var(--vol-accent);
          cursor: pointer; -webkit-appearance: none; appearance: none;
          background: rgba(255,255,255,0.12); border-radius: 2px;
        }
        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none; width: 14px; height: 14px;
          border-radius: 50%; background: var(--vol-accent); cursor: pointer;
        }

        /* vol-btn-mode: hide slider row, show +/− buttons in controls */
        .vol-btn-mode .vol-btn { display: flex; }
        .vol-btn-mode .vol-row { display: none; }

        .selector {
          width: 100%; padding: 9px 10px;
          background: rgba(40,40,40,0.7); color: #fff;
          border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
          margin-top: 12px; font-size: 13px; cursor: pointer;
          text-align: center; text-align-last: center;
          font-family: 'Google Sans', Roboto, sans-serif;
        }
        .selector.hidden { display: none !important; }
        .selector-hidden .content { padding-bottom: 12px; }

        .hidden { display: none !important; }
        .hide-selector .selector { display: none !important; }
        .hide-selector .content  { padding-bottom: 8px; }

        /* ─── Compact overrides ───────────────────────────── */
        .mode-compact .art-wrapper    { display: none; }
        .mode-compact .mini-art       { display: flex; width: 44px; height: 44px; }
        .mode-compact .content        { padding: 10px; display: flex; flex-direction: column; gap: 0; }
        .mode-compact .info-row       { margin-bottom: 0; }
        .mode-compact .track-info     { padding-right: 40px; }
        .mode-compact .track-title    { font-size: 14px; }
        .mode-compact .track-artist   { font-size: 12px; margin-bottom: 0; }
        .mode-compact .controls       { margin: 8px 0 0; gap: 8px; }
        .mode-compact .md-fab         { width: 44px; height: 44px; }
        .mode-compact .md-fab svg     { width: 22px; height: 22px; }
        .mode-compact .md-nav-btn     { width: 36px; height: 36px; }
        .mode-compact .md-nav-btn svg { width: 19px; height: 19px; }
        .mode-compact .md-icon-btn         { display: none; }
        .mode-compact .mini-remote-btn     { display: flex; }
        .mode-compact .compact-mute-btn    { display: flex; }
        /* Compact vol row: tighter spacing */
        .mode-compact .vol-row        { margin-top: 8px; gap: 8px; }
        .mode-compact .progress-bar   { margin-top: 8px; }
        .mode-compact .selector,
        .mode-compact .progress-times { display: none; }

        /* General button reset */
        button {
          background: none; border: none; cursor: pointer; padding: 0;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.18s cubic-bezier(0.4,0,0.2,1);
          border-radius: 50%;
        }
      </style>

      <ha-card id="cardOuter" class="mode-compact">

        <!-- SIZE TOGGLE (compact only) — top-right of card -->
        <button class="size-toggle-base compact-size-toggle" id="compactSizeToggle">
          <svg viewBox="0 0 24 24"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
        </button>

        <div class="art-wrapper" id="artClick">
          <img id="albumImg" class="hidden">
          <div id="mainPlaceholder" class="placeholder-svg"></div>

          <!-- REMOTE BUTTON — bottom-right of art, z-index 5 -->
          <button class="remote-toggle-btn" id="remoteBtn">
            <svg viewBox="0 0 24 24"><path d="M17 5H7a5 5 0 0 0-5 5v4a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5v-4a5 5 0 0 0-5-5zm-8 9H7v-2h2v2zm0-4H7V8h2v2zm4 6h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V6h2v2zm4 8h-2v-6h2v6z"/></svg>
          </button>

          <!-- SIZE TOGGLE — bottom-left of art, exactly opposite remote-btn -->
          <button class="size-toggle-base art-size-toggle" id="artSizeToggle">
            <svg viewBox="0 0 24 24"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
          </button>

          <!-- REMOTE OVERLAY -->
          <div class="remote-overlay hidden" id="remoteOverlay">
            <div class="remote-panel">

              <!-- SINGLE TOP ROW: Back · Home · Mic · Apps · Power -->
              <div class="r-top-row">
                <button class="r-chip-btn" id="rBack">
                  <svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>Back
                </button>
                <button class="r-chip-btn" id="rHome">
                  <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>Home
                </button>
                <button class="r-chip-btn r-assistant-btn" id="rAssistant">
                  <svg viewBox="0 0 24 24"><path d="M12 15c1.66 0 2.99-1.34 2.99-3L15 6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 15 6.7 12H5c0 3.42 2.72 6.23 6 6.72V22h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>Mic
                </button>
                <button class="r-chip-btn r-apps-btn" id="rApps">
                  <svg viewBox="0 0 24 24"><path d="M4,8H8V4H4M10,20H14V16H10M4,20H8V16H4M4,14H8V10H4M10,14H14V10H10M16,4V8H20V4M10,8H14V4H10M16,14H20V10H16M16,20H20V16H16Z"/></svg>Apps
                </button>
                <button class="r-chip-btn r-power-btn" id="rPower">
                  <svg viewBox="0 0 24 24"><path d="M16.56,5.44L15.11,6.89C16.84,7.94 18,9.83 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12C6,9.83 7.16,7.94 8.88,6.88L7.44,5.44C5.36,6.88 4,9.28 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12C20,9.28 18.64,6.88 16.56,5.44M13,3H11V13H13V3Z"/></svg>Power
                </button>
              </div>

              <!-- Apps dropdown — positioned just below single header row -->
              <div class="r-apps-dropdown hidden" id="rAppsDropdown"></div>

              <!-- D-Pad — fills all remaining vertical space -->
              <div class="clickpad-wrap">
                <div class="clickpad">
                  <button class="cp-dir cp-up"    id="rUp">   <svg viewBox="0 0 24 24"><path d="M13,20H11V8L5.5,13.5L4.08,12.08L12,4.16L19.92,12.08L18.5,13.5L13,8V20Z"/></svg></button>
                  <button class="cp-dir cp-down"  id="rDown"> <svg viewBox="0 0 24 24"><path d="M11,4H13V16L18.5,10.5L19.92,11.92L12,19.84L4.08,11.92L5.5,10.5L11,16V4Z"/></svg></button>
                  <button class="cp-dir cp-left"  id="rLeft"> <svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/></svg></button>
                  <button class="cp-dir cp-right" id="rRight"><svg viewBox="0 0 24 24"><path d="M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z"/></svg></button>
                  <button class="cp-select" id="rSelect">OK</button>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- CONTENT -->
        <div class="content">
          <div class="info-row">
            <div class="mini-art" id="miniArtClick">
              <img id="miniImg">
              <div id="miniPlaceholder" class="placeholder-svg"></div>
            </div>
            <div class="track-info">
              <div class="track-title"  id="tTitle">Loading...</div>
              <div class="track-artist" id="tArtist"></div>
            </div>
          </div>

          <div class="progress-bar" id="progWrap"><div class="progress-fill" id="progFill"></div></div>
          <div class="progress-times"><span id="pCur">0:00</span><span id="pTot">0:00</span></div>

          <div class="controls">
            <!-- Compact: mini remote (left) -->
            <button class="mini-remote-btn" id="miniRemoteBtn">
              <svg viewBox="0 0 24 24"><path d="M17 5H7a5 5 0 0 0-5 5v4a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5v-4a5 5 0 0 0-5-5zm-8 9H7v-2h2v2zm0-4H7V8h2v2zm4 6h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V6h2v2zm4 8h-2v-6h2v6z"/></svg>
            </button>
            <!-- Vol-btn-mode: volume down -->
            <button class="vol-btn" id="btnVolDown"><svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg></button>
            <!-- Expanded: shuffle -->
            <button class="md-icon-btn" id="btnShuffle">
              <svg viewBox="0 0 24 24"><path d="M14.83,13.41L13.42,14.82L16.55,17.95L14.5,20H20V14.5L17.96,16.54L14.83,13.41M14.5,4H20V9.5L17.96,7.46L5.41,20L4,18.59L16.54,6.04L14.5,4M10.59,9.17L5.41,4L4,5.41L9.17,10.58L10.59,9.17Z"/></svg>
            </button>
            <!-- Prev -->
            <button class="md-nav-btn" id="btnPrev"><svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button>
            <!-- FAB Play/Pause -->
            <button class="md-fab" id="btnPlay"><svg viewBox="0 0 24 24" id="playIcon"></svg></button>
            <!-- Next -->
            <button class="md-nav-btn" id="btnNext"><svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>
            <!-- Expanded: repeat -->
            <button class="md-icon-btn" id="btnRepeat"><svg viewBox="0 0 24 24" id="repeatIcon"></svg></button>
            <!-- Vol-btn-mode: volume up -->
            <button class="vol-btn" id="btnVolUp"><svg viewBox="0 0 24 24"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/></svg></button>
            <!-- Compact: mute toggle (right) -->
            <button class="compact-mute-btn" id="btnMute">
              <svg viewBox="0 0 24 24" id="muteIcon"><path d="M3,9V15H7L12,20V4L7,9H3M18.5,12C18.5,10.23 17.48,8.71 16,7.97V16C17.48,15.29 18.5,13.77 18.5,12Z"/></svg>
            </button>
          </div>

          <!-- Volume row — sits below the playback controls, never squashes them -->
          <div class="vol-row">
            <svg class="vol-row-icon" viewBox="0 0 24 24"><path d="M3,9V15H7L12,20V4L7,9H3M18.5,12C18.5,10.23 17.48,8.71 16,7.97V16C17.48,15.29 18.5,13.77 18.5,12Z"/></svg>
            <input type="range" class="volume-slider" id="vSlider" min="0" max="100">
          </div>

          <!-- Legacy vol-section kept for vol-btn-mode wiring (hidden by default) -->
          <div class="vol-section" style="display:none;">
            <svg class="vol-icon" viewBox="0 0 24 24"></svg>
          </div>

          <select class="selector" id="eSelector"></select>
        </div>

      </ha-card>
    `;
  }

  /* ══════════════════════════════════════════════════════════
     SETUP LISTENERS
  ══════════════════════════════════════════════════════════ */
  setupListeners() {
    const r = this.shadowRoot;

    const addPress = (el) => {
      if (!el) return;
      el.addEventListener('pointerdown',  () => el.classList.add('pressed'));
      el.addEventListener('pointerup',    () => el.classList.remove('pressed'));
      el.addEventListener('pointerleave', () => el.classList.remove('pressed'));
    };

    /* Size toggles */
    const toggleSize = () => r.getElementById('cardOuter').classList.toggle('mode-compact');
    r.getElementById('compactSizeToggle').onclick = toggleSize;
    r.getElementById('artSizeToggle').onclick = (e) => { e.stopPropagation(); toggleSize(); };
    addPress(r.getElementById('compactSizeToggle'));
    addPress(r.getElementById('artSizeToggle'));

    /* Art click */
    r.getElementById('artClick').onclick = () => { if (!this._remoteMode) this._openMoreInfo(); };
    r.getElementById('miniArtClick').onclick = () => this._openMoreInfo();

    /* Remote toggle */
    const remoteBtn = r.getElementById('remoteBtn');
    remoteBtn.onclick = (e) => { e.stopPropagation(); this._toggleRemote(); };
    addPress(remoteBtn);

    /* Mini remote (compact) */
    const miniRemoteBtn = r.getElementById('miniRemoteBtn');
    miniRemoteBtn.onclick = () => {
      const card = r.getElementById('cardOuter');
      if (card.classList.contains('mode-compact')) card.classList.remove('mode-compact');
      if (!this._remoteMode) requestAnimationFrame(() => this._openRemote());
    };
    addPress(miniRemoteBtn);

    /* Playback */
    r.getElementById('btnPlay').onclick    = () => this.call('media_play_pause');
    r.getElementById('btnPrev').onclick    = () => this.call('media_previous_track');
    r.getElementById('btnNext').onclick    = () => this.call('media_next_track');
    r.getElementById('btnShuffle').onclick = () => {
      const state = this._hass.states[this._entity];
      this.call('shuffle_set', { shuffle: !state.attributes.shuffle });
    };
    r.getElementById('btnRepeat').onclick  = () => {
      const state = this._hass.states[this._entity];
      const next  = state.attributes.repeat === 'all' ? 'one' : state.attributes.repeat === 'one' ? 'off' : 'all';
      this.call('repeat_set', { repeat: next });
    };
    ['btnPlay','btnPrev','btnNext','btnShuffle','btnRepeat'].forEach(id => addPress(r.getElementById(id)));

    /* Compact mute */
    r.getElementById('btnMute').onclick = () => {
      const muted = this._hass.states[this._entity]?.attributes?.is_volume_muted;
      this._hass.callService('media_player', 'volume_mute', {
        entity_id: this._volEntity, is_volume_muted: !muted
      });
    };
    addPress(r.getElementById('btnMute'));

    /* Volume buttons */
    const sendVolCmd = (dir) => {
      const volEnt = this._volEntity;
      const remId  = (volEnt === this._entity) ? this._entity.replace('media_player.', 'remote.') : null;
      const hasRem = remId && !!this._hass.states[remId];
      if (hasRem) {
        this._hass.callService('remote', 'send_command', {
          entity_id: remId, command: dir > 0 ? 'volume_up' : 'volume_down'
        }).catch(() => {});
      } else {
        const current = this._hass.states[volEnt]?.attributes?.volume_level || 0;
        this._hass.callService('media_player', 'volume_set', {
          entity_id: volEnt, volume_level: Math.min(1, Math.max(0, current + dir * 0.05))
        });
      }
    };
    r.getElementById('btnVolUp').onclick   = () => sendVolCmd(1);
    r.getElementById('btnVolDown').onclick = () => sendVolCmd(-1);
    addPress(r.getElementById('btnVolUp'));
    addPress(r.getElementById('btnVolDown'));

    /* Volume slider */
    r.getElementById('vSlider').oninput = (e) => {
      const newLevel = parseFloat(e.target.value) / 100;
      const volEnt   = this._volEntity;
      const remId    = (volEnt === this._entity) ? this._entity.replace('media_player.', 'remote.') : null;
      const hasRem   = remId && !!this._hass.states[remId];
      if (hasRem) {
        const prev  = this._lastVolume ?? (this._hass.states[this._entity]?.attributes?.volume_level ?? 0.5);
        const delta = newLevel - prev;
        if (Math.abs(delta) > 0.008) {
          const cmd = delta > 0 ? 'volume_up' : 'volume_down';
          const now = Date.now();
          if (!this._volLastFired || (now - this._volLastFired) >= 380) {
            if (this._volDebounce) { clearTimeout(this._volDebounce); this._volDebounce = null; }
            this._hass.callService('remote', 'send_command', { entity_id: remId, command: cmd }).catch(() => {});
            this._volLastFired = now;
          } else {
            if (this._volDebounce) clearTimeout(this._volDebounce);
            this._volDebounce = setTimeout(() => {
              this._hass.callService('remote', 'send_command', { entity_id: remId, command: cmd }).catch(() => {});
              this._volLastFired = Date.now();
            }, 380 - (now - this._volLastFired));
          }
          this._lastVolume = newLevel;
        }
      } else {
        this._hass.callService('media_player', 'volume_set', { entity_id: volEnt, volume_level: newLevel });
        this._lastVolume = newLevel;
      }
    };

    /* Entity selector */
    r.getElementById('eSelector').onchange = (e) => {
      this._entity = e.target.value;
      this._manualSelection = true;
      this._lastVolume = null; this._volLastFired = null;
      if (this._volDebounce) { clearTimeout(this._volDebounce); this._volDebounce = null; }
      if (this._remoteMode) this._closeRemote();
      this.updateContent(this._hass.states[this._entity]);
    };

    /* Progress seek */
    r.getElementById('progWrap').onclick = (e) => this.doSeek(e);

    /* Remote D-pad / chips */
    const rCmd = (id, fn) => {
      const el = r.getElementById(id);
      if (!el) return;
      el.onclick = (e) => { e.stopPropagation(); fn(); };
      addPress(el);
    };
    rCmd('rBack',      () => this.sendRemoteCommand('back'));
    rCmd('rHome',      () => this.sendRemoteCommand('home'));
    rCmd('rAssistant', () => this.sendRemoteCommand('assistant'));
    rCmd('rUp',        () => this.sendRemoteCommand('up'));
    rCmd('rDown',      () => this.sendRemoteCommand('down'));
    rCmd('rLeft',      () => this.sendRemoteCommand('left'));
    rCmd('rRight',     () => this.sendRemoteCommand('right'));
    rCmd('rSelect',    () => this.sendRemoteCommand('select'));
    rCmd('rPower',     () => {
      const state = this._hass.states[this._entity];
      const isOff = ['off','standby','unavailable'].includes(state?.state);
      this.call(isOff ? 'turn_on' : 'turn_off');
    });

    /* Apps dropdown */
    const rAppsBtn      = r.getElementById('rApps');
    const rAppsDropdown = r.getElementById('rAppsDropdown');
    const closeApps     = () => { rAppsDropdown.classList.add('hidden'); rAppsBtn.classList.remove('r-apps-open'); };
    const openApps      = () => {
      const state   = this._hass.states[this._entity];
      const sources = state?.attributes?.source_list || [];
      const current = state?.attributes?.source || '';
      rAppsDropdown.innerHTML = sources.length
        ? sources.map(src => `
            <div class="r-app-item ${src === current ? 'r-app-active' : ''}" data-src="${src}">
              <svg viewBox="0 0 24 24"><path d="M8,5.14V19.14L19,12.14L8,5.14Z"/></svg>${src}
            </div>`).join('')
        : `<div class="r-app-item" style="color:rgba(255,255,255,0.35);cursor:default;">No apps available</div>`;
      rAppsDropdown.querySelectorAll('.r-app-item[data-src]').forEach(item => {
        item.onclick = (e) => { e.stopPropagation(); this.call('select_source', { source: item.dataset.src }); closeApps(); };
      });
      rAppsDropdown.classList.remove('hidden');
      rAppsBtn.classList.add('r-apps-open');
    };
    rAppsBtn.onclick = (e) => { e.stopPropagation(); rAppsDropdown.classList.contains('hidden') ? openApps() : closeApps(); };
    addPress(rAppsBtn);
    r.getElementById('remoteOverlay').onclick = (e) => { e.stopPropagation(); };
    r.getElementById('remoteOverlay').addEventListener('click', (e) => {
      if (!rAppsBtn.contains(e.target) && !rAppsDropdown.contains(e.target)) closeApps();
    });
  }

  /* ══════════════════════════════════════════════════════════
     UPDATE CONTENT
  ══════════════════════════════════════════════════════════ */
  updateContent(state) {
    const r = this.shadowRoot;
    if (!state || !r) return;

    const isPlaying = state.state === 'playing';
    r.host.style.setProperty('--accent',     this._config.accent_color);
    r.host.style.setProperty('--vol-accent', this._config.volume_accent || this._config.accent_color);

    /* Track info */
    const titleEl  = r.getElementById('tTitle');
    const artistEl = r.getElementById('tArtist');
    titleEl.textContent  = state.attributes.media_title  || (isPlaying ? 'Playing' : 'Idle');
    titleEl.style.color  = this._config.title_color  || '#ffffff';
    artistEl.textContent = state.attributes.media_artist || state.attributes.friendly_name || '';
    artistEl.style.color = this._config.artist_color || 'rgba(255,255,255,0.65)';

    const cardOuter = r.getElementById('cardOuter');
    cardOuter.classList.toggle('vol-btn-mode',    this._config.volume_control === 'buttons');
    cardOuter.classList.toggle('hide-selector',   this._config.show_entity_selector === false);

    /* Shuffle / repeat */
    r.getElementById('btnShuffle').classList.toggle('active', isPlaying && state.attributes.shuffle === true);
    const rep = state.attributes.repeat;
    r.getElementById('btnRepeat').classList.toggle('active', isPlaying && rep !== undefined && rep !== 'off');

    /* Remote power chip */
    const rPowerBtn = r.getElementById('rPower');
    if (rPowerBtn) {
      rPowerBtn.classList.toggle('r-power-on', !['off','standby','unavailable'].includes(state.state));
    }

    /* Repeat icon */
    r.getElementById('repeatIcon').innerHTML = rep === 'one'
      ? '<path d="M7,7H17V10L21,6L17,2V5H5V11H7V7M17,17H7V14L3,18L7,22V19H19V13H17V17M10.75,15V13H9.5V12L10.7,11.9V11H11.75V15H10.75Z"/>'
      : '<path d="M7,7H17V10L21,6L17,2V5H5V11H7V7M17,17H7V14L3,18L7,22V19H19V13H17V17Z"/>';

    /* Play icon */
    r.getElementById('playIcon').innerHTML = isPlaying
      ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>'
      : '<path d="M8 5v14l11-7z"/>';

    /* Mute button — syncs to entity mute state */
    const isMuted  = state.attributes.is_volume_muted === true;
    const muteBtn  = r.getElementById('btnMute');
    if (muteBtn) {
      muteBtn.classList.toggle('muted', isMuted);
      r.getElementById('muteIcon').innerHTML = isMuted
        ? '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>'
        : '<path d="M3,9V15H7L12,20V4L7,9H3M18.5,12C18.5,10.23 17.48,8.71 16,7.97V16C17.48,15.29 18.5,13.77 18.5,12Z"/>';
    }

    /* Album art */
    const artUrl  = state.attributes.entity_picture;
    const mainImg = r.getElementById('albumImg');
    const miniImg = r.getElementById('miniImg');
    const mainPh  = r.getElementById('mainPlaceholder');
    const miniPh  = r.getElementById('miniPlaceholder');

    if (isPlaying && artUrl) {
      miniImg.src = artUrl;
      miniImg.classList.remove('hidden');
      miniPh.classList.add('hidden');
    } else {
      miniImg.classList.add('hidden');
      miniPh.innerHTML = this.getDeviceIcon(state).replace('width="120" height="120"', 'width="24" height="24"');
      miniPh.classList.remove('hidden');
    }

    if (!this._remoteMode) {
      if (isPlaying && artUrl) {
        mainImg.src = artUrl;
        mainImg.classList.remove('hidden');
        mainPh.classList.add('hidden');
      } else {
        mainImg.classList.add('hidden');
        mainPh.innerHTML = this.getDeviceIcon(state);
        mainPh.classList.remove('hidden');
      }
    }

    /* Volume slider */
    const volState = this._hass?.states[this._volEntity];
    r.getElementById('vSlider').value = ((volState?.attributes?.volume_level ?? state.attributes.volume_level ?? 0) * 100);

    /* Progress */
    r.getElementById('pTot').textContent = this.formatTime(state.attributes.media_duration || 0);

    /* Entity selector */
    const sel = r.getElementById('eSelector');
    if (sel) {
      const show = this._config.show_entity_selector !== false;
      sel.classList.toggle('hidden', !show);
      cardOuter.classList.toggle('selector-hidden', !show);
      if (show) {
        sel.innerHTML = (this._config.entities || []).map(ent => {
          const s = this._hass.states[ent];
          return `<option value="${ent}" ${ent === this._entity ? 'selected' : ''}>${s?.attributes?.friendly_name || ent}</option>`;
        }).join('');
      }
    }
  }
}


/* ══════════════════════════════════════════════════════════════
   EDITOR
══════════════════════════════════════════════════════════════ */
class AndroidMediaRemoteEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._initialized = false;
    this._searchTerm  = '';
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._initialized) this.render();
  }

  setConfig(config) {
    this._config = config;
    if (this._initialized) this.updateUI();
  }

  updateUI() {
    const root = this.shadowRoot;
    if (!root) return;
    const set = (id, val) => { const el = root.getElementById(id); if (el) el.value = val; };
    const chk = (id, val) => { const el = root.getElementById(id); if (el) el.checked = val; };
    set('accent_color',         this._config.accent_color  || '#4285F4');
    set('volume_accent',        this._config.volume_accent || this._config.accent_color || '#4285F4');
    set('title_color',          this._config.title_color   || '#ffffff');
    set('artist_color',         this._config.artist_color  || '#ffffff');
    chk('auto_switch',          this._config.auto_switch !== false);
    chk('show_entity_selector', this._config.show_entity_selector !== false);
    chk('volume_control_btn',   this._config.volume_control === 'buttons');
    set('startup_mode',         this._config.startup_mode  || 'compact');
    set('volume_entity',        this._config.volume_entity || '');
  }

  render() {
    if (!this._hass || !this._config) return;
    this._initialized = true;
    const selected   = this._config.entities || [];
    const others     = Object.keys(this._hass.states)
      .filter(e => e.startsWith('media_player.') && !selected.includes(e)).sort();
    const sortedList = [...selected, ...others];

    this.shadowRoot.innerHTML = `
      <style>
        .container { display: flex; flex-direction: column; gap: 18px; padding: 10px; color: var(--primary-text-color); font-family: 'Google Sans', Roboto, sans-serif; }
        .row { display: flex; flex-direction: column; gap: 8px; }
        label { font-weight: bold; font-size: 14px; }
        input[type="text"], .checklist { width: 100%; background: var(--card-background-color); color: var(--primary-text-color); border: 1px solid #444; border-radius: 6px; }
        input[type="text"] { padding: 7px 10px; font-size: 13px; }
        .checklist { max-height: 300px; overflow-y: auto; margin-top: 5px; -webkit-overflow-scrolling: touch; }
        .check-item { display: flex; align-items: center; padding: 8px 12px; border-bottom: 1px solid #333; background: var(--card-background-color); touch-action: none; }
        .dragging { opacity: 0.5; background: #444 !important; }
        .drag-handle { cursor: grab; padding: 10px; color: #888; font-size: 20px; user-select: none; }
        .toggle-row { display: flex; align-items: center; justify-content: space-between; }
        .color-section { display: flex; gap: 15px; }
        .color-item { flex: 1; display: flex; flex-direction: column; gap: 5px; }
        input[type="color"] { width: 100%; height: 40px; cursor: pointer; border: 1px solid #444; border-radius: 6px; background: none; }
      </style>
      <div class="container">
        <div class="color-section">
          <div class="color-item"><label>Main Accent</label><input type="color" id="accent_color"></div>
          <div class="color-item"><label>Volume Accent</label><input type="color" id="volume_accent"></div>
        </div>
        <div class="color-section">
          <div class="color-item"><label>Title Colour</label><input type="color" id="title_color"></div>
          <div class="color-item"><label>Artist Colour</label><input type="color" id="artist_color"></div>
        </div>
        <div class="row"><div class="toggle-row"><label>Auto Switch Entities</label><input type="checkbox" id="auto_switch"></div></div>
        <div class="row"><div class="toggle-row"><label>Show Media Player Selector</label><input type="checkbox" id="show_entity_selector"></div></div>
        <div class="row"><div class="toggle-row"><label>Use Volume Buttons (instead of slider)</label><input type="checkbox" id="volume_control_btn"></div></div>
        <div class="row">
          <div class="toggle-row">
            <label>Startup View</label>
            <select id="startup_mode" style="background:var(--card-background-color);color:var(--primary-text-color);border:1px solid #444;border-radius:6px;padding:5px 8px;font-size:13px;cursor:pointer;">
              <option value="compact">Compact</option>
              <option value="expanded">Expanded</option>
              <option value="remote">Remote Control</option>
            </select>
          </div>
        </div>
        <div class="row">
          <label>Volume Entity <span style="font-weight:normal;font-size:12px;color:#888;">(optional — route volume to a different device)</span></label>
          <select id="volume_entity" style="background:var(--card-background-color);color:var(--primary-text-color);border:1px solid #444;border-radius:6px;padding:5px 8px;font-size:13px;cursor:pointer;width:100%;">
            <option value="">— Same as active media player —</option>
            ${Object.keys(this._hass.states).filter(e => e.startsWith('media_player.')).sort().map(e => {
              const name = this._hass.states[e]?.attributes?.friendly_name || e;
              return `<option value="${e}">${name}</option>`;
            }).join('')}
          </select>
        </div>
        <div class="row">
          <label>Manage &amp; Reorder Media Players</label>
          <input type="text" id="search" placeholder="Filter entities...">
          <div class="checklist" id="entityList">
            ${sortedList.map(ent => {
              const isSel = selected.includes(ent);
              return `
                <div class="check-item" data-id="${ent}" draggable="${isSel}">
                  <div class="drag-handle"><svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:#888;display:block;"><path d="M9,3H11V5H9V3M13,3H15V5H13V3M9,7H11V9H9V7M13,7H15V9H13V7M9,11H11V13H9V11M13,11H15V13H13V11M9,15H11V17H9V15M13,15H15V17H13V15M9,19H11V21H9V19M13,19H15V21H13V21V19Z"/></svg></div>
                  <input type="checkbox" ${isSel ? 'checked' : ''}>
                  <span style="margin-left:10px;flex:1;">${this._hass.states[ent]?.attributes?.friendly_name || ent}</span>
                </div>`;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    this._setupSearch();
    this._setupReordering();
    this._setupListeners();
    this.updateUI();
  }

  _setupSearch() {
    this.shadowRoot.getElementById('search').addEventListener('input', (e) => {
      this._searchTerm = e.target.value.toLowerCase();
      this.shadowRoot.querySelectorAll('.check-item').forEach(item => {
        item.style.display = item.textContent.toLowerCase().includes(this._searchTerm) ? 'flex' : 'none';
      });
    });
  }

  _setupReordering() {
    const list = this.shadowRoot.getElementById('entityList');
    let dragged = null;
    list.addEventListener('dragstart', (e) => {
      dragged = e.target.closest('.check-item');
      if (!dragged.querySelector('input').checked) { e.preventDefault(); return; }
      dragged.classList.add('dragging');
    });
    list.addEventListener('dragover', (e) => {
      e.preventDefault();
      const after = this._getDragAfterElement(list, e.clientY);
      after == null ? list.appendChild(dragged) : list.insertBefore(dragged, after);
    });
    list.addEventListener('dragend', () => { dragged.classList.remove('dragging'); this._saveOrder(); });
    list.addEventListener('touchstart', (e) => {
      if (e.target.classList.contains('drag-handle')) {
        dragged = e.target.closest('.check-item');
        if (!dragged.querySelector('input').checked) return;
        dragged.classList.add('dragging');
      }
    }, { passive: false });
    list.addEventListener('touchmove', (e) => {
      if (!dragged) return;
      e.preventDefault();
      const after = this._getDragAfterElement(list, e.touches[0].clientY);
      after == null ? list.appendChild(dragged) : list.insertBefore(dragged, after);
    }, { passive: false });
    list.addEventListener('touchend', () => {
      if (!dragged) return;
      dragged.classList.remove('dragging'); dragged = null; this._saveOrder();
    });
  }

  _getDragAfterElement(container, y) {
    return [...container.querySelectorAll('.check-item:not(.dragging)')].reduce((closest, child) => {
      const box = child.getBoundingClientRect(), offset = y - box.top - box.height / 2;
      return (offset < 0 && offset > closest.offset) ? { offset, element: child } : closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  _saveOrder() {
    const newOrder = Array.from(this.shadowRoot.querySelectorAll('.check-item'))
      .filter(i => i.querySelector('input').checked)
      .map(i => i.getAttribute('data-id'));
    this._updateConfig('entities', newOrder);
  }

  _setupListeners() {
    const root = this.shadowRoot;
    root.querySelectorAll('.check-item input').forEach(cb => { cb.onclick = () => this._saveOrder(); });
    root.getElementById('accent_color').oninput           = (e) => this._updateConfig('accent_color',         e.target.value);
    root.getElementById('volume_accent').oninput          = (e) => this._updateConfig('volume_accent',        e.target.value);
    root.getElementById('title_color').oninput            = (e) => this._updateConfig('title_color',          e.target.value);
    root.getElementById('artist_color').oninput           = (e) => this._updateConfig('artist_color',         e.target.value);
    root.getElementById('auto_switch').onchange           = (e) => this._updateConfig('auto_switch',          e.target.checked);
    root.getElementById('show_entity_selector').onchange  = (e) => this._updateConfig('show_entity_selector', e.target.checked);
    root.getElementById('volume_control_btn').onchange    = (e) => this._updateConfig('volume_control',       e.target.checked ? 'buttons' : 'slider');
    root.getElementById('startup_mode').onchange          = (e) => this._updateConfig('startup_mode',         e.target.value);
    root.getElementById('volume_entity').onchange         = (e) => this._updateConfig('volume_entity',        e.target.value);
  }

  _updateConfig(key, value) {
    if (!this._config) return;
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: { ...this._config, [key]: value } },
      bubbles: true, composed: true
    }));
  }
}


/* ══════════════════════════════════════════════════════════════
   REGISTRATION
══════════════════════════════════════════════════════════════ */
if (!customElements.get('android-media-remote')) {
  customElements.define('android-media-remote', AndroidMediaRemote);
}
if (!customElements.get('android-media-remote-editor')) {
  customElements.define('android-media-remote-editor', AndroidMediaRemoteEditor);
}

window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === 'android-media-remote')) {
  window.customCards.push({
    type: 'android-media-remote',
    name: 'Android TV Media Remote',
    preview: true,
    description: 'A Material Design media player with Android TV remote control.'
  });
}
