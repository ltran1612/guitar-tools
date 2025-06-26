export class NoteDetector {
    constructor(sampleRate = 44100) {
        // Audio parameters
        this.sampleRate = sampleRate;
        this.blockSize = 32768;
        this.powerThreshold = 0.00001;
        this.minFreq = 60;  // Lower minimum frequency to better catch A2
        this.maxFreq = 4000;

        // Standard guitar tuning frequencies (E2, A2, D3, G3, B3, E4)
        this.guitarNotes = {
            'E2': 82.41,
            'A2': 110.00,
            'D3': 146.83,
            'G3': 196.00,
            'B3': 246.94,
            'E4': 329.63
        };

        // Extended note frequencies for higher octaves
        this.extendedNotes = {
            ...this.guitarNotes,
        };

        // Create Hann window
        this.hannWindow = this.createHannWindow(this.blockSize);

        // Initialize frequency bands with wider bands for lower frequencies
        this.initializeFrequencyBands();
    }

    createHannWindow(size) {
        const window = new Float32Array(size);
        for (let i = 0; i < size; i++) {
            window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1)));
        }
        return window;
    }

    initializeFrequencyBands() {
        // Create frequency bands for each note
        this.frequencyBands = {};
        for (const [note, freq] of Object.entries(this.extendedNotes)) {
            // Use wider bands for lower frequencies
            const bandWidth = note.includes('2') ? 0.02 : 0.01;  // 2% for lower notes, 1% for higher
            this.frequencyBands[note] = {
                min: freq * (1 - bandWidth),
                max: freq * (1 + bandWidth),
                center: freq
            };
        }
    }

    findPeakFrequency(data) {
        // Calculate signal power
        const signalPower = data.reduce((sum, val) => sum + val * val, 0) / data.length;
        
        // Debug signal power
        console.log('Signal Power:', signalPower);
        
        if (signalPower < this.powerThreshold) {
            console.log('Signal too weak');
            return { frequency: null, amplitude: 0 };
        }

        // Apply Hann window
        const windowedData = data.map((val, i) => val * this.hannWindow[i]);

        // Calculate FFT
        const fft = this.calculateFFT(windowedData);
        
        // Calculate frequency resolution
        const deltaFreq = this.sampleRate / this.blockSize;

        // Find the dominant frequency
        const dominantFreq = this.findDominantFrequency(fft, deltaFreq);
        
        if (dominantFreq) {
            // Debug information
            console.log('Frequency Detection:', {
                signalPower,
                dominantFreq: dominantFreq.freq,
                confidence: dominantFreq.confidence,
                closestNote: this.findClosestNote(dominantFreq.freq).note
            });
            
            return { frequency: dominantFreq.freq, amplitude: dominantFreq.confidence };
        }
        
        console.log('No dominant frequency found');
        return { frequency: null, amplitude: 0 };
    }

    findDominantFrequency(fft, deltaFreq) {
        // Calculate the magnitude spectrum
        const magnitudeSpectrum = new Float32Array(fft.length);
        for (let i = 0; i < fft.length; i++) {
            magnitudeSpectrum[i] = Math.abs(fft[i]);
        }

        // Find peaks in the magnitude spectrum
        const peaks = this.findPeaks(magnitudeSpectrum, deltaFreq);
        console.log('Found peaks:', peaks);
        
        // Calculate the energy in each frequency band
        const bandEnergies = this.calculateBandEnergies(peaks);
        console.log('Band energies:', bandEnergies);
        
        // Find the band with the highest energy
        let maxEnergy = 0;
        let dominantNote = null;
        
        for (const [note, energy] of Object.entries(bandEnergies)) {
            if (energy > maxEnergy) {
                maxEnergy = energy;
                dominantNote = note;
            }
        }

        if (dominantNote) {
            console.log('Dominant note:', dominantNote, 'Energy:', maxEnergy);
            return {
                freq: this.frequencyBands[dominantNote].center,
                confidence: maxEnergy
            };
        }

        return null;
    }

    findPeaks(magnitudeSpectrum, deltaFreq) {
        const peaks = [];
        const minIndex = Math.floor(this.minFreq / deltaFreq);
        const maxIndex = Math.min(
            Math.floor(this.maxFreq / deltaFreq),
            magnitudeSpectrum.length
        );

        // Find local maxima with adjusted threshold for lower frequencies
        for (let i = minIndex + 1; i < maxIndex - 1; i++) {
            if (magnitudeSpectrum[i] > magnitudeSpectrum[i - 1] && 
                magnitudeSpectrum[i] > magnitudeSpectrum[i + 1]) {
                const freq = i * deltaFreq;
                const amplitude = magnitudeSpectrum[i];
                
                // Use a lower threshold for frequencies around A2
                const threshold = (freq > 100 && freq < 120) ? 0.05 : 0.1;
                
                // Only consider significant peaks
                if (amplitude > threshold * Math.max(...magnitudeSpectrum)) {
                    peaks.push({
                        freq,
                        amplitude
                    });
                }
            }
        }

        return peaks;
    }

    calculateBandEnergies(peaks) {
        const bandEnergies = {};
        
        // Initialize energies for all bands
        for (const note of Object.keys(this.frequencyBands)) {
            bandEnergies[note] = 0;
        }

        // Calculate energy in each band
        for (const peak of peaks) {
            for (const [note, band] of Object.entries(this.frequencyBands)) {
                if (peak.freq >= band.min && peak.freq <= band.max) {
                    // Add energy to the band, weighted by how close to center
                    const distanceFromCenter = Math.abs(peak.freq - band.center);
                    const weight = 1 - (distanceFromCenter / (band.max - band.min));
                    bandEnergies[note] += peak.amplitude * weight;
                }
            }
        }

        return bandEnergies;
    }

    calculateFFT(data) {
        const n = data.length;
        const fft = new Float32Array(n / 2);
        const real = new Float32Array(data);
        const imag = new Float32Array(n).fill(0);

        // Perform FFT
        this.fft(real, imag);

        // Calculate magnitude spectrum
        for (let i = 0; i < fft.length; i++) {
            fft[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
        }

        return fft;
    }

    fft(real, imag) {
        const n = real.length;
        if (n <= 1) return;

        // Bit reversal
        for (let i = 0; i < n; i++) {
            const j = this.reverseBits(i, Math.log2(n));
            if (j > i) {
                [real[i], real[j]] = [real[j], real[i]];
                [imag[i], imag[j]] = [imag[j], imag[i]];
            }
        }

        // Cooley-Tukey FFT
        for (let size = 2; size <= n; size *= 2) {
            const halfsize = size / 2;
            const tablestep = n / size;
            for (let i = 0; i < n; i += size) {
                for (let j = i, k = 0; j < i + halfsize; j++, k += tablestep) {
                    const tpre = real[j + halfsize] * Math.cos(2 * Math.PI * k / n) +
                               imag[j + halfsize] * Math.sin(2 * Math.PI * k / n);
                    const tpim = -real[j + halfsize] * Math.sin(2 * Math.PI * k / n) +
                               imag[j + halfsize] * Math.cos(2 * Math.PI * k / n);
                    real[j + halfsize] = real[j] - tpre;
                    imag[j + halfsize] = imag[j] - tpim;
                    real[j] += tpre;
                    imag[j] += tpim;
                }
            }
        }
    }

    reverseBits(x, bits) {
        let y = 0;
        for (let i = 0; i < bits; i++) {
            y = (y << 1) | (x & 1);
            x >>>= 1;
        }
        return y;
    }

    findClosestNote(frequency) {
        if (!frequency) return { note: null, frequency: null, difference: Infinity, cents: 0 };
        
        let closestNote = null;
        let minDiff = Infinity;

        // First check extended notes (including higher octaves)
        for (const [note, freq] of Object.entries(this.extendedNotes)) {
            const diff = Math.abs(freq - frequency);
            if (diff < minDiff) {
                minDiff = diff;
                closestNote = note;
            }
        }

        const targetFreq = this.extendedNotes[closestNote];
        const cents = this.calculateCents(frequency, targetFreq);

        return {
            note: closestNote,
            frequency: targetFreq,
            difference: minDiff,
            cents: cents
        };
    }

    calculateCents(actualFreq, targetFreq) {
        if (!actualFreq || !targetFreq) return 0;
        return Math.round(1200 * Math.log2(actualFreq / targetFreq));
    }

    getTuningStatus(currentFreq, targetFreq) {
        if (!targetFreq) return '';
        
        const diff = currentFreq - targetFreq;
        if (Math.abs(diff) < 0.5) return 'Perfect!';
        return diff > 0 ? 'Too high' : 'Too low';
    }
} 