/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Procedural Web Audio API Sound Engine
class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private isMuted: boolean = false;
  private musicTimer: number | null = null;
  private musicPlaying: boolean = false;
  private currentBassStep: number = 0;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initCtx() {
    try {
      if (!this.ctx) {
        const AudioContextClass =
          typeof window !== 'undefined'
            ? window.AudioContext ||
              (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
            : null;
        if (!AudioContextClass) return;

        this.ctx = new AudioContextClass();

        this.masterGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();

        this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

        this.sfxGain.connect(this.masterGain);
        this.musicGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      }

      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch {
      // AudioContext unavailable or restricted in iframe; game will run in silent mode safely
    }
  }

  public setVolumes(master: number, sfx: number, music: number, muted: boolean) {
    this.isMuted = muted;
    if (!this.ctx || !this.masterGain || !this.sfxGain || !this.musicGain) return;

    const t = this.ctx.currentTime;
    this.masterGain.gain.linearRampToValueAtTime(muted ? 0 : Math.max(0, Math.min(1, master)), t + 0.05);
    this.sfxGain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, sfx)), t + 0.05);
    this.musicGain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, music)), t + 0.05);
  }

  public playLaser(type: 'light' | 'heavy' | 'sniper' | 'enemy' = 'light') {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'light') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(750, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.12);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.12);
    } else if (type === 'heavy') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.22);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.22);
    } else if (type === 'sniper') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.18);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.18);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.14);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.14);
    }
  }

  public playExplosion(type: 'small' | 'large' | 'boss' = 'small') {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const duration = type === 'boss' ? 0.8 : type === 'large' ? 0.45 : 0.25;

    // White noise node
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(type === 'boss' ? 350 : 600, t);
    filter.frequency.exponentialRampToValueAtTime(40, t + duration);

    const gain = this.ctx.createGain();
    const initialVol = type === 'boss' ? 0.6 : type === 'large' ? 0.4 : 0.25;
    gain.gain.setValueAtTime(initialVol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + duration);

    // Deep sub-bass thud for heavy explosions
    if (type !== 'small') {
      const osc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + duration);
      subGain.gain.setValueAtTime(type === 'boss' ? 0.5 : 0.3, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.connect(subGain);
      subGain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + duration);
    }
  }

  public playCrystalPickup(combo: number = 1) {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Pentatonic scale frequency offset with combo
    const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const pitch = notes[(combo - 1) % notes.length] * (1 + Math.floor((combo - 1) / notes.length) * 0.2);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.5, t + 0.08);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playDash() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(660, t + 0.1);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.22);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  public playEMP() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.linearRampToValueAtTime(800, t + 0.15);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.4);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  public playLevelUp() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const chordNotes = [440, 554.37, 659.25, 880];
    const t = this.ctx.currentTime;

    chordNotes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startTime = t + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }

  public playPlayerHit() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.15);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  public playBossPhaseWarning(phase: number = 2) {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;

    // Deep sub-bass dread pulse
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(phase === 3 ? 140 : 100, t);
    subOsc.frequency.exponentialRampToValueAtTime(30, t + 0.8);
    subGain.gain.setValueAtTime(0.4, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(t);
    subOsc.stop(t + 0.8);

    // Urgent tactical klaxon pulses
    const pulseCount = phase === 3 ? 4 : 3;
    const baseFreq = phase === 3 ? 880 : phase === 2 ? 660 : 440;

    for (let i = 0; i < pulseCount; i++) {
      const pulseTime = t + i * 0.16;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = phase === 3 ? 'sawtooth' : 'square';
      osc.frequency.setValueAtTime(baseFreq, pulseTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.65, pulseTime + 0.12);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(baseFreq * 1.2, pulseTime);
      filter.Q.setValueAtTime(3, pulseTime);

      gain.gain.setValueAtTime(0.25, pulseTime);
      gain.gain.exponentialRampToValueAtTime(0.001, pulseTime + 0.14);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(pulseTime);
      osc.stop(pulseTime + 0.14);
    }
  }

  public playMegaBossAlarm() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;

    // Seismic sub-rumble
    const rumble = this.ctx.createOscillator();
    const rumbleGain = this.ctx.createGain();
    rumble.type = 'sawtooth';
    rumble.frequency.setValueAtTime(150, t);
    rumble.frequency.exponentialRampToValueAtTime(28, t + 1.2);
    rumbleGain.gain.setValueAtTime(0.5, t);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    rumble.connect(rumbleGain);
    rumbleGain.connect(this.sfxGain);
    rumble.start(t);
    rumble.stop(t + 1.2);

    // Ominous multi-tonal apocalyptic war horn
    const freqs = [185.0, 220.0, 277.18, 370.0];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + 0.05 * idx);
      osc.frequency.linearRampToValueAtTime(freq * 0.94, t + 1.0);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, t);
      filter.frequency.exponentialRampToValueAtTime(350, t + 1.0);

      gain.gain.setValueAtTime(0.18, t + 0.05 * idx);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + 0.05 * idx);
      osc.stop(t + 1.1);
    });
  }

  public playCommanderReward() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Triumphant ascending cosmic chords: Cmaj9 -> Emaj -> Gmaj7
    const fanfareNotes = [261.63, 329.63, 392.0, 493.88, 523.25, 659.25, 783.99, 987.77, 1046.5];
    fanfareNotes.forEach((freq, i) => {
      const st = t + i * 0.07;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = i >= 6 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, st);

      gain.gain.setValueAtTime(0.24, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(st);
      osc.stop(st + 0.45);
    });

    // Radiant resonance chime
    const shimmer = this.ctx.createOscillator();
    const shimmerGain = this.ctx.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(1318.51, t + 0.55); // E6
    shimmerGain.gain.setValueAtTime(0.2, t + 0.55);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(this.sfxGain);
    shimmer.start(t + 0.55);
    shimmer.stop(t + 1.4);
  }

  public playGameOver() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const notes = [329.63, 293.66, 261.63, 196.0];
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const st = t + i * 0.2;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, st);
      gain.gain.setValueAtTime(0.22, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(st);
      osc.stop(st + 0.35);
    });
  }

  // Dynamic Ambient Cosmic Arpeggiator Music
  public startMusic() {
    this.initCtx();
    if (this.musicPlaying) return;
    this.musicPlaying = true;

    const bassLine = [65.41, 73.42, 82.41, 65.41, 98.0, 87.31, 73.42, 65.41]; // C2, D2, E2, C2, G2, F2, D2, C2
    const arpNotes = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63];

    const stepDuration = 280; // ms
    let arpIdx = 0;

    const loop = () => {
      if (!this.musicPlaying) return;
      if (this.ctx && this.musicGain && !this.isMuted && this.ctx.state === 'running') {
        const t = this.ctx.currentTime;

        // Bass step every 2 arpeggio ticks
        if (arpIdx % 2 === 0) {
          const bassFreq = bassLine[this.currentBassStep % bassLine.length];
          this.currentBassStep++;

          const bassOsc = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();
          const filter = this.ctx.createBiquadFilter();

          bassOsc.type = 'sawtooth';
          bassOsc.frequency.setValueAtTime(bassFreq, t);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(220, t);

          bassGain.gain.setValueAtTime(0.18, t);
          bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

          bassOsc.connect(filter);
          filter.connect(bassGain);
          bassGain.connect(this.musicGain);

          bassOsc.start(t);
          bassOsc.stop(t + 0.45);
        }

        // Arpeggiator chime
        const note = arpNotes[arpIdx % arpNotes.length];
        arpIdx++;

        const arpOsc = this.ctx.createOscillator();
        const arpGain = this.ctx.createGain();

        arpOsc.type = 'triangle';
        arpOsc.frequency.setValueAtTime(note, t);

        arpGain.gain.setValueAtTime(0.08, t);
        arpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

        arpOsc.connect(arpGain);
        arpGain.connect(this.musicGain);

        arpOsc.start(t);
        arpOsc.stop(t + 0.2);
      }

      this.musicTimer = window.setTimeout(loop, stepDuration);
    };

    loop();
  }

  public stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  public playCreditReward() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    // Sparkling 4-tone triumphant coin/credit arpeggio
    const notes = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6
    const t = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const start = t + idx * 0.06;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, start + 0.15);

      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(start);
      osc.stop(start + 0.28);
    });
  }

  public playMissionComplete() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    // Fanfare chord for completing an objective
    const t = this.ctx.currentTime;
    const chords = [
      { notes: [440, 554.37, 659.25], time: 0, dur: 0.15 },
      { notes: [523.25, 659.25, 783.99], time: 0.14, dur: 0.35 },
    ];

    chords.forEach((chord) => {
      chord.notes.forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const start = t + chord.time;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + chord.dur);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(start);
        osc.stop(start + chord.dur);
      });
    });
  }

  public playCosmicWarp(isSectorChange: boolean = false) {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;

    if (isSectorChange) {
      // Deep hyperspace warp surge: sub-bass rumble + resonant filter sweep + star chime
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 0.65);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.65);

      // Ethereal harmonics ascending chime
      const freqs = [392.0, 587.33, 880.0, 1174.66];
      freqs.forEach((freq, idx) => {
        const chimeOsc = this.ctx!.createOscillator();
        const chimeGain = this.ctx!.createGain();
        const startTime = t + 0.12 + idx * 0.07;

        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(freq, startTime);
        chimeGain.gain.setValueAtTime(0.14, startTime);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

        chimeOsc.connect(chimeGain);
        chimeGain.connect(this.sfxGain!);
        chimeOsc.start(startTime);
        chimeOsc.stop(startTime + 0.45);
      });
    } else {
      // Rapid quantum wave warp: brisk high-tech sweep
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, t);
      osc.frequency.exponentialRampToValueAtTime(840, t + 0.16);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.38);

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.38);
    }
  }
}

export const sound = new SoundEngine();
