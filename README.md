# Iglesia Adventista UNADECA - Live Translation Platform

A modern web application for live transcription and translation of church services using the Soniox SDK.

## Features

### 👥 End Users (Miembros)
- Real-time transcription display in Spanish
- Live translation to English (and other languages)
- Clean, readable interface optimized for all devices
- Auto-scrolling transcript feed
- Live status indicator

### ⚙️ Admin Panel
- Microphone device selector and management
- Real-time audio level monitoring
- Session management (start/stop broadcasts)
- Audio quality indicators
- Device detection and switching

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS for responsive design
- **Audio**: Web Audio API for microphone capture
- **Transcription**: Soniox SDK for live transcription/translation
- **State Management**: Zustand for app state
- **HTTP Client**: Axios for API calls

## Project Structure

```
src/
├── components/
│   ├── Layout/          # Header, Navigation, Footer
│   ├── EndUser/         # User-facing components (transcription, translation)
│   ├── Admin/           # Admin panel components (microphone setup, audio monitor)
│   └── Common/          # Reusable UI components (Button, Card, Alert)
├── services/
│   ├── config.ts        # Configuration management
│   ├── audioCapture.ts  # Web Audio API wrapper
│   └── soniox.ts        # Soniox SDK integration
├── hooks/
│   ├── useAudioCapture.ts     # Audio capture hook
│   └── useSonioxSession.ts    # Soniox session hook
├── context/
│   └── appStore.ts      # Global Zustand store
├── types/
│   └── index.ts         # TypeScript type definitions
├── App.tsx              # Main app component
├── main.tsx             # React entry point
└── index.css            # Global styles
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A valid Soniox API key
- Modern browser with WebRTC support

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd livetranslation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env.local
   ```

4. **Configure Soniox API Key**
   Edit `.env.local` and add your Soniox credentials:
   ```env
   VITE_SONIOX_API_KEY=your_api_key_here
   VITE_SONIOX_API_URL=https://api.soniox.com
   ```

### Development

```bash
npm run dev
```

Opens the app at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

Creates an optimized build in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Usage Guide

### For End Users (Miembros Tab)

1. Open the app in your browser
2. Select the "Miembros" (Members) tab
3. View live transcription as the service is broadcast
4. Switch between original Spanish and English translation
5. The transcript auto-scrolls to show new content

### For Administrators (Administrador Tab)

1. Select the "Administrador" (Admin) tab
2. **Select Audio Device**
   - Choose your microphone from the dropdown
   - Click "Actualizar Dispositivos" if your mic isn't listed
3. **Monitor Audio Levels**
   - Keep levels between 40-70% for optimal quality
   - Watch for red peaks which indicate clipping
4. **Start Broadcasting**
   - Click "Iniciar Transmisión" (Start Broadcasting)
   - The app will:
     - Create a Soniox transcription session
     - Connect to the live transcription service
     - Start capturing and streaming audio
5. **Monitor Status**
   - Green checkmarks indicate all systems are ready
   - Red alerts show any connection issues
6. **Stop Broadcasting**
   - Click "Detener Transmisión" (Stop Broadcasting)
   - The session will end and audio capture will stop

## Configuration

### Environment Variables

```env
# Soniox Configuration
VITE_SONIOX_API_KEY=your_soniox_api_key_here
VITE_SONIOX_API_URL=https://api.soniox.com

# Church Configuration
VITE_CHURCH_NAME=Iglesia Adventista UNADECA
VITE_CHURCH_LOGO_URL=https://your-logo-url.png

# Audio Settings
VITE_AUDIO_SAMPLE_RATE=16000
VITE_AUDIO_BUFFER_SIZE=4096

# Translation Settings
VITE_DEFAULT_SOURCE_LANGUAGE=es
VITE_DEFAULT_TARGET_LANGUAGE=en

# App Configuration
VITE_APP_ENV=development
VITE_APP_DEBUG=false
```

## Soniox Integration

The app integrates with Soniox for real-time transcription and translation:

1. **Session Management**: Creates transcription sessions via REST API
2. **WebSocket Streaming**: Sends audio data via WebSocket for real-time processing
3. **Transcription Results**: Receives transcription updates in real-time
4. **Translation**: Optionally translates results to target language

### Key Files

- `src/services/soniox.ts` - Soniox SDK wrapper
- `src/hooks/useSonioxSession.ts` - React hook for session management
- `src/services/audioCapture.ts` - Audio capture and processing

## Audio Capture Details

The app uses the Web Audio API to:

1. Capture microphone input with configurable constraints
2. Process audio in 4KB chunks (configurable)
3. Convert Float32 audio to Int16 for Soniox compatibility
4. Calculate real-time audio levels for monitoring
5. Implement echo cancellation and noise suppression

### Supported Audio Features

- ✅ Echo cancellation
- ✅ Noise suppression
- ✅ Auto gain control
- ✅ Real-time level monitoring
- ✅ Device switching
- ✅ Multiple language support

## Browser Support

- Chrome 80+
- Firefox 78+
- Safari 14.1+
- Edge 80+

**Note**: Requires HTTPS in production (WebRTC requirement)

## Troubleshooting

### No Audio Devices Found
- Check browser microphone permissions
- Ensure microphone is connected
- Try refreshing the device list

### Soniox Connection Error
- Verify API key is correct in `.env.local`
- Check internet connection
- Ensure API URL is accessible
- Check Soniox service status

### Poor Audio Quality
- Keep levels between 40-70%
- Reduce background noise
- Position microphone closer to speaker
- Check microphone settings in OS

### Transcription Not Appearing
- Verify session is active (green indicators)
- Check browser console for errors
- Ensure audio levels are above 20%
- Wait a moment for processing

## Performance Tips

1. **Client-side**
   - Use modern, fast browser
   - Close unnecessary tabs
   - Disable browser extensions
   
2. **Audio Setup**
   - Position microphone 6-12 inches from speaker
   - Reduce background noise
   - Use quality microphone (USB recommended)
   
3. **Network**
   - Ensure stable, high-bandwidth connection
   - Wired Ethernet preferred over WiFi
   - 10+ Mbps recommended for optimal performance

## API Reference

### Soniox Service Methods

```typescript
// Create transcription session
const sessionId = await sonioxService.createSession({
  languageCode: 'es',
  enableTranslation: true,
  translationLanguageCode: 'en'
});

// Connect to WebSocket
await sonioxService.connectWebSocket(sessionId);

// Send audio data
sonioxService.sendAudioData(Float32Array);

// Register transcription callback
sonioxService.onTranscription((result) => {
  console.log(result.text);
  console.log(result.translations);
});

// End session
await sonioxService.endSession();
```

### Audio Capture Service Methods

```typescript
// Initialize audio capture
await audioCaptureService.initialize(deviceId);

// Get available devices
const devices = await audioCaptureService.getAudioDevices();

// Start capturing
audioCaptureService.start((audioData) => {
  console.log('Audio chunk:', audioData);
});

// Stop capturing
audioCaptureService.stop();

// Switch device
await audioCaptureService.switchAudioDevice(newDeviceId);
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Commit with clear messages
5. Push and create a Pull Request

## License

MIT License - See LICENSE file for details

## Support

For technical support:
- Check the FAQ section
- Review error messages in browser console
- Contact church technical team
- Open an issue on GitHub

## Future Enhancements

- [ ] Multiple simultaneous translations
- [ ] Recorded session playback
- [ ] Searchable transcript history
- [ ] Custom language model support
- [ ] Analytics and statistics
- [ ] Mobile app version
- [ ] Speaker identification
- [ ] Sentiment analysis
- [ ] Accessibility improvements
- [ ] Dark mode theme

---

**Iglesia Adventista UNADECA** - Bringing the message to everyone, everywhere.
