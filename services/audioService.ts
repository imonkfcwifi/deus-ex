
export class AudioService {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private enabled: boolean = true;
    private initialized: boolean = false;

    constructor() {
        if (typeof window !== 'undefined') {
            this.enabled = localStorage.getItem('god_mode_sound') !== 'false';
        }
    }

    private init() {
        if (this.initialized || typeof window === 'undefined') return;
        
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            this.ctx = new AudioContextClass();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3; // Default volume
            this.masterGain.connect(this.ctx.destination);
            this.initialized = true;
        } catch (e) {
            console.error("Audio initialization failed", e);
        }
    }

    // Call this on first user interaction to unlock audio context
    public async resume() {
        if (!this.initialized) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
    }

    public toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('god_mode_sound', String(this.enabled));
        return this.enabled;
    }

    public isEnabled() {
        return this.enabled;
    }

    // --- Sound Effects ---

    public playClick() {
        if (!this.enabled) return;
        this.resume();
        if (!this.ctx || !this.masterGain) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterGain);

        // Crisp mechanical click
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1500, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.05);
        
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    public playHover() {
        if (!this.enabled) return;
        this.resume();
        if (!this.ctx || !this.masterGain) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterGain);

        // Very subtle high frequency breath
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    public playTurnStart() {
        if (!this.enabled) return;
        this.resume();
        if (!this.ctx || !this.masterGain) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterGain);

        // Deep cinematic thud
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 1.2);
        
        gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

        osc.start();
        osc.stop(this.ctx.currentTime + 1.2);
    }

    public playDivinePresence() {
        if (!this.enabled) return;
        this.resume();
        if (!this.ctx || !this.masterGain) return;

        // Ethereal chord (C Major ish)
        const freqs = [523.25, 659.25, 783.99, 1046.50]; 
        const now = this.ctx.currentTime;

        freqs.forEach((f, i) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            
            osc.type = 'triangle';
            osc.frequency.value = f;
            
            osc.connect(gain);
            gain.connect(this.masterGain!);

            const start = now + i * 0.08;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.08, start + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 2.5);
            
            osc.start(start);
            osc.stop(start + 2.5);
        });
    }

    public playSuccess() {
        if (!this.enabled) return;
        this.resume();
        if (!this.ctx || !this.masterGain) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }
}

export const audio = new AudioService();
