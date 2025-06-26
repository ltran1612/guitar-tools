# Guitar Tuner & Metronome

A web-based application for tuning guitars and practicing with a metronome using your computer's microphone and speakers.

## Features

### Guitar Tuner
- Real-time frequency detection
- Display of closest guitar note with cents deviation
- Simple and intuitive interface
- Support for standard guitar tuning (E2, A2, D3, G3, B3, E4)
- Two view modes: Basic buttons and 3D guitar visualization
- Visual feedback for tuning accuracy

### Metronome
- Adjustable tempo from 40-200 BPM
- Multiple time signatures (2/4, 3/4, 4/4, 5/4, 6/4, 7/4, 8/4)
- Visual beat indicator with accent highlighting
- Volume control
- Real-time tempo display
- Smooth click sounds with accent on first beat

## Requirements

- Modern web browser with microphone support
- Microphone input device
- Speakers or headphones for metronome

## Installation

1. Clone this repository or download the files
2. Open `index.html` in your web browser
3. Grant microphone permissions when prompted

## Usage

### Guitar Tuner
1. Select "Basic Tuner" or "Guitar View" from the dropdown
2. Choose your microphone from the dropdown menu
3. Click "Start Tuning" to begin listening
4. Select a target note (optional)
5. Play a note on your guitar
6. The application will display the detected frequency and tuning status
7. Click "Stop Tuning" to stop listening

### Metronome
1. Select "Metronome" from the dropdown
2. Adjust the tempo using the slider or input field (40-200 BPM)
3. Set the time signature using the dropdown menus
4. Adjust volume as needed
5. Click "Start Metronome" to begin
6. The beat indicator will show the current beat with visual feedback
7. Click "Stop" to stop the metronome

## How it Works

### Tuner
The application uses Fast Fourier Transform (FFT) to analyze the audio input from your microphone and detect the fundamental frequency of the played note. It then compares this frequency to the standard frequencies of guitar strings to determine the closest matching note and calculates the deviation in cents.

### Metronome
The metronome generates click sounds using Web Audio API oscillators with exponential decay. It uses precise timing intervals to maintain consistent tempo and provides visual feedback through the beat indicator.

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## Tips for Best Results

### Tuner
- Use in a quiet environment
- Play single notes clearly
- Ensure your microphone is working properly
- Position your guitar close to the microphone
- Select a target note for more accurate tuning feedback

### Metronome
- Use headphones for better audio isolation
- Start with slower tempos when learning new pieces
- Use the visual beat indicator to stay in sync
- Adjust volume to comfortable levels

## Technical Details

- Built with vanilla JavaScript (ES6 modules)
- Uses Web Audio API for audio processing
- FFT implementation for frequency analysis
- Responsive design with CSS Grid and Flexbox
- No external dependencies required 