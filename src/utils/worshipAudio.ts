// Gentle Web Audio ambient chord pad to distinguish sung worship practice from spoken drills

class WorshipAudioPad {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private isPlaying = false;

  public startGentlePad() {
    if (typeof window === 'undefined') return;
    this.stopGentlePad();

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      const master = this.ctx.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.05, now + 0.8);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(520, now);

      filter.connect(master);
      master.connect(this.ctx.destination);
      this.masterGain = master;

      // Warm Cmaj9 worship pad voicing (C3, G3, D4, E4)
      const freqs = [130.81, 196.0, 293.66, 329.63];
      this.activeOscillators = freqs.map((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.connect(filter);
        osc.start(now);
        return osc;
      });
      this.isPlaying = true;
    } catch (err) {
      console.warn('Ambient worship pad unavailable:', err);
    }
  }

  public stopGentlePad() {
    if (!this.ctx || !this.isPlaying) {
      this.activeOscillators = [];
      this.isPlaying = false;
      return;
    }
    try {
      const now = this.ctx.currentTime;
      if (this.masterGain) {
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(Math.max(this.masterGain.gain.value, 0.001), now);
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      }
      const oscs = [...this.activeOscillators];
      setTimeout(() => {
        oscs.forEach((o) => {
          try {
            o.stop();
            o.disconnect();
          } catch {
            // ignore
          }
        });
      }, 380);
    } catch {
      // ignore
    } finally {
      this.activeOscillators = [];
      this.isPlaying = false;
    }
  }
}

export const worshipPad = new WorshipAudioPad();
