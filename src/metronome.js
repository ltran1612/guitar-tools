export class Metronome {
    constructor() {
        this.audioContext = null;
        this.isPlaying = false;
        this.tempo = 120;
        this.timeSignature = { beats: 4, division: 4 };
        this.currentBeat = 0;
        this.intervalId = null;
        this.volume = 0.5;
        
        // Audio buffers for different click sounds
        this.clickBuffer = null;
        this.accentBuffer = null;
        
        this.initializeAudio();
    }

    async initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            await this.createClickSounds();
        } catch (error) {
            console.error('Error initializing metronome audio:', error);
        }
    }

    async createClickSounds() {
        // Create regular click sound (higher frequency)
        this.clickBuffer = this.createClickBuffer(800, 0.1);
        
        // Create accent click sound (lower frequency, longer duration)
        this.accentBuffer = this.createClickBuffer(600, 0.15);
    }

    createClickBuffer(frequency, duration) {
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            // Create a click sound with exponential decay
            data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 10) * this.volume;
        }
        
        return buffer;
    }

    start() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.currentBeat = 0;
        
        const intervalMs = (60 / this.tempo) * 1000;
        
        // Play first click immediately and set up interval for subsequent clicks
        this.playClick();
        
        this.intervalId = setInterval(() => {
            this.currentBeat = (this.currentBeat + 1) % this.timeSignature.beats;
            this.playClick();
        }, intervalMs);
    }

    stop() {
        if (!this.isPlaying) return;
        
        this.isPlaying = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.currentBeat = 0;
    }

    playClick() {
        if (!this.audioContext || !this.clickBuffer || !this.accentBuffer) return;
        
        // Resume audio context if suspended
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        const buffer = this.currentBeat === 0 ? this.accentBuffer : this.clickBuffer;
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.start();
    }

    setTempo(tempo) {
        this.tempo = Math.max(40, Math.min(200, tempo));
        if (this.isPlaying) {
            this.stop();
            this.start();
        }
    }

    setTimeSignature(beats, division) {
        this.timeSignature = { beats, division };
        this.currentBeat = 0;
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.createClickSounds(); // Recreate buffers with new volume
    }

    getCurrentBeat() {
        return this.currentBeat + 1;
    }

    isAccentBeat() {
        return this.currentBeat === 0;
    }

    destroy() {
        this.stop();
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
} 