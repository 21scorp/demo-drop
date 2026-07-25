/**
 * Procedural sound engine (WebAudio). No audio files — every sound is synthesized,
 * so it ships in a few KB and scales in pitch/energy with what's happening in game.
 * Instantiated only in the browser, lazily, on the first user gesture.
 */

import type { FlareKind } from "./types";

// Pentatonic-ish scale (Hz) for pleasant, non-dissonant blips.
const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0];

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private musicNodes: { osc: OscillatorNode; lfo: OscillatorNode; filt: BiquadFilterNode } | null = null;
  private musicTimer: ReturnType<typeof setInterval> | null = null;

  private sfxVolume = 0.6;
  private musicVolume = 0.35;

  /** Create (or resume) the audio graph. Call from a user gesture. */
  ensure(): boolean {
    if (typeof window === "undefined") return false;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);

      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = this.sfxVolume;
      this.sfxBus.connect(this.master);

      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = this.musicVolume * 0.5;
      this.musicBus.connect(this.master);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return true;
  }

  setSfxVolume(v: number) {
    this.sfxVolume = Math.max(0, Math.min(1, v));
    if (this.sfxBus) this.sfxBus.gain.value = this.sfxVolume;
  }

  setMusicVolume(v: number) {
    this.musicVolume = Math.max(0, Math.min(1, v));
    if (this.musicBus) this.musicBus.gain.value = this.musicVolume * 0.5;
    if (this.musicVolume <= 0) this.stopMusic();
    else if (this.ctx && !this.musicNodes) this.startMusic();
  }

  private now(): number {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  /** One shaped oscillator note. */
  private note(
    freq: number,
    opts: { dur?: number; type?: OscillatorType; gain?: number; when?: number; glideTo?: number } = {},
  ) {
    if (!this.ctx || !this.sfxBus || this.sfxVolume <= 0) return;
    const { dur = 0.16, type = "triangle", gain = 0.5, when = 0, glideTo } = opts;
    const t0 = this.now() + when;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this.sfxBus);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  /** Tap: pitch climbs with the combo streak for that "one more" pull. */
  tap(comboStep = 0) {
    if (!this.ensure()) return;
    const idx = Math.min(SCALE.length - 1, comboStep % SCALE.length);
    this.note(SCALE[idx]!, { dur: 0.11, type: "triangle", gain: 0.28 });
  }

  buy() {
    if (!this.ensure()) return;
    this.note(392, { dur: 0.09, type: "sine", gain: 0.3 });
    this.note(587.33, { dur: 0.12, type: "sine", gain: 0.25, when: 0.05 });
  }

  denied() {
    if (!this.ensure()) return;
    this.note(180, { dur: 0.12, type: "sawtooth", gain: 0.12, glideTo: 120 });
  }

  flareSpawn() {
    if (!this.ensure()) return;
    this.note(880, { dur: 0.5, type: "sine", gain: 0.12, glideTo: 1320 });
  }

  flare(kind: FlareKind) {
    if (!this.ensure()) return;
    const chords: Record<FlareKind, number[]> = {
      surge: [523.25, 659.25, 783.99],
      frenzy: [440, 554.37, 659.25, 880],
      tapstorm: [659.25, 783.99, 987.77],
      jackpot: [523.25, 659.25, 783.99, 1046.5, 1318.51],
    };
    chords[kind].forEach((f, i) => this.note(f, { dur: 0.35, type: "sine", gain: 0.22, when: i * 0.05 }));
  }

  achievement() {
    if (!this.ensure()) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      this.note(f, { dur: 0.22, type: "triangle", gain: 0.22, when: i * 0.07 }),
    );
  }

  /** Light rising arpeggio when you break into a new scale (K → M → B → …). */
  milestone() {
    if (!this.ensure()) return;
    [523.25, 783.99, 1046.5].forEach((f, i) =>
      this.note(f, { dur: 0.18, type: "sine", gain: 0.18, when: i * 0.06 }),
    );
  }

  prestige() {
    if (!this.ensure()) return;
    // Descending "collapse" then rising "rebirth".
    this.note(880, { dur: 0.6, type: "sawtooth", gain: 0.2, glideTo: 110 });
    [261.63, 329.63, 392, 523.25, 659.25, 783.99].forEach((f, i) =>
      this.note(f, { dur: 0.5, type: "sine", gain: 0.2, when: 0.5 + i * 0.09 }),
    );
  }

  /* ── ambient pad ───────────────────────────────────────────────────────── */

  startMusic() {
    if (!this.ensure() || !this.ctx || !this.musicBus || this.musicNodes) return;
    if (this.musicVolume <= 0) return;
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const filt = this.ctx.createBiquadFilter();
    osc.type = "sawtooth";
    osc.frequency.value = 65.41; // low C
    filt.type = "lowpass";
    filt.frequency.value = 240;
    filt.Q.value = 6;
    lfo.frequency.value = 0.06;
    lfoGain.gain.value = 120;
    lfo.connect(lfoGain);
    lfoGain.connect(filt.frequency);
    osc.connect(filt);
    filt.connect(this.musicBus);
    osc.start();
    lfo.start();
    this.musicNodes = { osc, lfo, filt };

    // Occasional soft high notes over the drone.
    this.musicTimer = setInterval(() => {
      if (this.musicVolume <= 0) return;
      const f = SCALE[Math.floor(Math.random() * SCALE.length)]! * 2;
      if (!this.ctx || !this.musicBus) return;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = "sine";
      o.frequency.value = f;
      const t0 = this.now();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.04, t0 + 0.8);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3);
      o.connect(g);
      g.connect(this.musicBus);
      o.start(t0);
      o.stop(t0 + 3.2);
    }, 4200);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.musicNodes) {
      try {
        this.musicNodes.osc.stop();
        this.musicNodes.lfo.stop();
      } catch {
        /* already stopped */
      }
      this.musicNodes = null;
    }
  }
}

let singleton: AudioEngine | null = null;
export function getAudio(): AudioEngine {
  if (!singleton) singleton = new AudioEngine();
  return singleton;
}
