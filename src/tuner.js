import { NoteDetector } from './note-detector.js';
import { Metronome } from './metronome.js';

export class Tuner {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.mediaStream = null;
        this.noteDetector = null;
        this.isListening = false;
        this.selectedNote = null;
        this.currentView = 'basic';
        
        // Metronome instance
        this.metronome = new Metronome();
        this.metronomeUpdateInterval = null;
        
        this.initializeUI();
        this.setupEventListeners();
    }

    async initializeUI() {
        // Set default view
        this.currentView = 'basic';
        this.updateView();

        // Initialize microphone selection
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const micSelect = document.getElementById('micSelect');
            const audioInputs = devices.filter(device => device.kind === 'audioinput');
            
            audioInputs.forEach(input => {
                const option = document.createElement('option');
                option.value = input.deviceId;
                option.text = input.label || `Microphone ${micSelect.length + 1}`;
                micSelect.appendChild(option);
            });

            if (audioInputs.length > 0) {
                micSelect.value = audioInputs[0].deviceId;
            }
        } catch (error) {
            console.error('Error getting audio devices:', error);
        }
    }

    setupEventListeners() {
        // View selector buttons
        document.getElementById('btnBasic').addEventListener('click', () => {
            this.currentView = 'basic';
            this.updateView();
        });
        document.getElementById('btnMetronome').addEventListener('click', () => {
            this.currentView = 'metronome';
            this.updateView();
        });

        // Microphone selection
        document.getElementById('micSelect').addEventListener('change', (e) => {
            if (this.isListening) {
                this.stopListening();
                this.startListening();
            }
        });

        // Start/Stop button
        document.getElementById('startButton').addEventListener('click', () => {
            if (this.isListening) {
                this.stopListening();
            } else {
                this.startListening();
            }
        });

        // Note buttons (Basic View)
        document.querySelectorAll('.note-button').forEach(button => {
            button.addEventListener('click', () => {
                this.selectNote(button.dataset.note);
            });
        });

        // Metronome controls
        this.setupMetronomeEventListeners();
    }

    setupMetronomeEventListeners() {
        // Tempo controls
        const tempoSlider = document.getElementById('tempoSlider');
        const tempoInput = document.getElementById('tempoInput');
        
        tempoSlider.addEventListener('input', (e) => {
            const tempo = parseInt(e.target.value);
            tempoInput.value = tempo;
            this.metronome.setTempo(tempo);
            this.updateMetronomeDisplay();
        });
        
        tempoInput.addEventListener('input', (e) => {
            const tempo = parseInt(e.target.value);
            tempoSlider.value = tempo;
            this.metronome.setTempo(tempo);
            this.updateMetronomeDisplay();
        });

        // Volume control
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeDisplay = document.getElementById('volumeDisplay');
        
        volumeSlider.addEventListener('input', (e) => {
            const volume = parseInt(e.target.value) / 100;
            volumeDisplay.textContent = `${e.target.value}%`;
            this.metronome.setVolume(volume);
        });

        // Time signature controls
        const beatsSelect = document.getElementById('beatsSelect');
        const divisionSelect = document.getElementById('divisionSelect');
        
        beatsSelect.addEventListener('change', () => {
            this.updateTimeSignature();
        });
        
        divisionSelect.addEventListener('change', () => {
            this.updateTimeSignature();
        });

        // Metronome buttons
        const metronomeStartButton = document.getElementById('metronomeStartButton');
        
        metronomeStartButton.addEventListener('click', () => {
            this.toggleMetronome();
        });
    }

    updateTimeSignature() {
        const beats = parseInt(document.getElementById('beatsSelect').value);
        const division = parseInt(document.getElementById('divisionSelect').value);
        this.metronome.setTimeSignature(beats, division);
        this.updateBeatIndicator();
    }

    updateBeatIndicator() {
        const beatIndicator = document.getElementById('beatIndicator');
        const beats = parseInt(document.getElementById('beatsSelect').value);
        
        // Clear existing dots
        beatIndicator.innerHTML = '';
        
        // Create dots for each beat
        for (let i = 0; i < beats; i++) {
            const dot = document.createElement('div');
            dot.className = 'beat-dot';
            if (i === 0) {
                dot.classList.add('accent');
            }
            beatIndicator.appendChild(dot);
        }
    }

    toggleMetronome() {
        if (this.metronome.isPlaying) {
            this.stopMetronome();
        } else {
            this.startMetronome();
        }
    }

    startMetronome() {
        this.metronome.start();
        this.updateMetronomeUI();
        this.startMetronomeUpdates();
    }

    stopMetronome() {
        this.metronome.stop();
        this.updateMetronomeUI();
        this.stopMetronomeUpdates();
    }

    updateMetronomeUI() {
        const startButton = document.getElementById('metronomeStartButton');
        const display = document.getElementById('metronomeDisplay');
        
        if (this.metronome.isPlaying) {
            startButton.textContent = 'Stop Metronome';
            startButton.classList.add('playing');
        } else {
            startButton.textContent = 'Start Metronome';
            startButton.classList.remove('playing');
            display.classList.remove('playing', 'accent');
        }
    }

    startMetronomeUpdates() {
        this.metronomeUpdateInterval = setInterval(() => {
            this.updateMetronomeDisplay();
        }, 50); // Update every 50ms for smooth animation
    }

    stopMetronomeUpdates() {
        if (this.metronomeUpdateInterval) {
            clearInterval(this.metronomeUpdateInterval);
            this.metronomeUpdateInterval = null;
        }
    }

    updateMetronomeDisplay() {
        const display = document.getElementById('metronomeDisplay');
        const beatDots = document.querySelectorAll('.beat-dot');
        
        // Update tempo display
        display.textContent = `${this.metronome.tempo} BPM`;
        
        // Update beat indicator
        if (this.metronome.isPlaying) {
            const currentBeat = this.metronome.getCurrentBeat() - 1;
            const isAccent = this.metronome.isAccentBeat();
            
            // Reset all dots
            beatDots.forEach((dot, index) => {
                dot.classList.remove('active');
                if (index === 0) {
                    dot.classList.add('accent');
                } else {
                    dot.classList.remove('accent');
                }
            });
            
            // Highlight current beat
            if (beatDots[currentBeat]) {
                beatDots[currentBeat].classList.add('active');
                if (isAccent) {
                    display.classList.add('accent');
                } else {
                    display.classList.remove('accent');
                }
                display.classList.add('playing');
                
                // Remove playing class after animation
                setTimeout(() => {
                    display.classList.remove('playing');
                }, 500);
            }
        }
    }

    updateView() {
        const tunerViews = document.getElementById('tunerViews');
        const metronomeView = document.getElementById('metronomeView');
        // Update button active state
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        if (this.currentView === 'basic') {
            document.getElementById('btnBasic').classList.add('active');
        } else if (this.currentView === 'metronome') {
            document.getElementById('btnMetronome').classList.add('active');
        }

        if (this.currentView === 'metronome') {
            tunerViews.style.display = 'none';
            metronomeView.style.display = 'block';
            metronomeView.classList.add('active');
            this.updateBeatIndicator();
            this.updateMetronomeDisplay();
        } else {
            tunerViews.style.display = 'block';
            metronomeView.style.display = 'none';
            metronomeView.classList.remove('active');
            // Update specific tuner view
            const basicView = document.getElementById('basicView');
            basicView.style.display = 'grid';
        }
    }

    selectNote(note) {
        this.selectedNote = note;
        
        // Update active state in basic view
        document.querySelectorAll('.note-button').forEach(button => {
            button.classList.toggle('active', button.dataset.note === note);
        });
    }

    async startListening() {
        try {
            const micSelect = document.getElementById('micSelect');
            const constraints = {
                audio: {
                    deviceId: micSelect.value ? { exact: micSelect.value } : undefined
                }
            };

            this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 32768;
            
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            source.connect(this.analyser);
            
            this.noteDetector = new NoteDetector(this.audioContext.sampleRate);
            this.isListening = true;
            
            document.getElementById('startButton').textContent = 'Stop Tuning';
            document.getElementById('startButton').classList.add('listening');
            
            this.processAudio();
        } catch (error) {
            console.error('Error starting audio:', error);
            alert('Error accessing microphone. Please make sure you have granted permission.');
        }
    }

    stopListening() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.isListening = false;
        this.mediaStream = null;
        this.audioContext = null;
        this.analyser = null;
        
        document.getElementById('startButton').textContent = 'Start Tuning';
        document.getElementById('startButton').classList.remove('listening');
        document.getElementById('tuningStatus').textContent = '';
        document.getElementById('frequencyDisplay').textContent = '';
    }

    processAudio() {
        if (!this.isListening) return;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Float32Array(bufferLength);
        this.analyser.getFloatTimeDomainData(dataArray);

        const { frequency, amplitude } = this.noteDetector.findPeakFrequency(dataArray);
        const frequencyDisplay = document.getElementById('frequencyDisplay');
        const tuningStatus = document.getElementById('tuningStatus');
        
        // Always show frequency if detected
        if (frequency) {
            frequencyDisplay.textContent = `${frequency.toFixed(1)} Hz`;
            
            if (amplitude > 0.1) {  // Only show note if we have a strong enough signal
                const { note, cents } = this.noteDetector.findClosestNote(frequency);
                
                if (this.selectedNote) {
                    if (note === this.selectedNote) {
                        if (Math.abs(cents) < 5) {
                            tuningStatus.textContent = 'In Tune!';
                            tuningStatus.style.color = '#4CAF50';
                        } else {
                            const direction = cents > 0 ? 'too high' : 'too low';
                            tuningStatus.textContent = `${Math.abs(cents).toFixed(1)} cents ${direction}`;
                            tuningStatus.style.color = '#f44336';
                        }
                    } else {
                        tuningStatus.textContent = `Playing ${note} (target: ${this.selectedNote})`;
                        tuningStatus.style.color = '#f44336';
                    }
                } else {
                    tuningStatus.textContent = `Playing ${note}`;
                    tuningStatus.style.color = '#2196F3';
                }
            } else {
                tuningStatus.textContent = 'Weak signal';
                tuningStatus.style.color = '#666';
            }
        } else {
            frequencyDisplay.textContent = 'No frequency detected';
            tuningStatus.textContent = 'No note detected';
            tuningStatus.style.color = '#666';
        }

        requestAnimationFrame(() => this.processAudio());
    }

    destroy() {
        this.stopListening();
        this.stopMetronome();
        if (this.metronome) {
            this.metronome.destroy();
        }
    }
}

// Initialize the tuner when the page loads
window.addEventListener('load', () => {
    new Tuner();
}); 