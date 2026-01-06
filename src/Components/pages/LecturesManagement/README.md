# AI Lecture System - Production Implementation

## Architecture Overview

This is a fully React-based AI lecture system with NO iframe, NO Unity, NO 3D models.
Everything runs in standard DOM/Canvas using Web APIs.

### Component Structure

```
LectureVideo.jsx (Main Container)
├── AudioManager.jsx (Centralized audio control)
├── Avatar.jsx (SVG-based with lipsync)
├── QuestionPopup.jsx (Voice/text question input)
└── Chatbot.jsx (AI assistant interface)
```

## State Machine

```
IDLE
  ↓ (Start Recording)
RECORDING_ACTIVE + SLIDE_PLAYING
  ↓ (Slide ends)
QUESTION_WAIT
  ↓ (1.5s delay)
QuestionPopup opens
  ↓
  ├─ YES → CHATBOT_ACTIVE (pause slide)
  │         ↓ (Close chatbot)
  │         ↓ (3s delay)
  │         SLIDE_PLAYING (resume)
  │
  └─ NO/Timeout → Next SLIDE_PLAYING
```

## Key Features

### 1. Avatar System (SVG-based)
- **Lipsync**: Driven by Web Audio API AnalyserNode
- **Eye Blink**: Automatic random blinking (2-5s intervals)
- **Mouth Movement**: Real-time sync with audio amplitude
- **No fake timers**: All animation driven by actual audio data

### 2. Audio Management
- **Single Audio Source**: Only one audio plays at a time
- **Two Audio Types**:
  - Slide narration audio
  - Chatbot response audio
- **Seamless Switching**: Avatar lipsync follows active audio source
- **Pause/Resume**: Maintains exact timestamp position

### 3. Question Popup
- **Auto-opens**: 1.5 seconds after slide ends
- **Voice Recognition**: Auto-starts microphone
- **Text Input**: Also accepts typed input
- **Timeout**: 15 seconds auto-close
- **Keywords**:
  - YES: "yes", "ha", "haan", "haa", "yeah", "yep", "hmm"
  - NO: "no", "nahi", "na", "next", "nope"
- **Important**: Voice input does NOT go to chatbot history

### 4. Chatbot Component
- **Separate from Question Popup**: Different voice recognition instance
- **Mic Button**: Converts voice → text → writes to input field
- **Chat History**: Maintains conversation context
- **Audio Response**: Triggers avatar lipsync
- **Close Behavior**: 3-second grace period before resuming slide

### 5. Recording System
- **Records**:
  - Avatar (SVG rendered to canvas)
  - Slides (whiteboard content)
  - Background
  - Narration audio (from AudioContext)
- **Does NOT record**:
  - Microphone input
  - Browser UI
  - User voice
- **Technology**:
  - `canvas.captureStream()` for video
  - `MediaStreamDestination` for audio
  - Combined into single MediaRecorder
- **Output**: Single downloadable WebM video

### 6. Slide Display
- **Conditional Rendering**:
  - If `bullets.length > 0`: Show title + bullets
  - If `bullets.length === 0`: Show title + narration text
  - Never show empty bullet UI

## Data Flow

### Slide Playback
```
1. Fetch lecture data from API
2. Load slide audio URL
3. Decode audio → AudioBuffer
4. Create BufferSource → Connect to Analyser → Destination
5. Start playback
6. Avatar reads from Analyser (real-time lipsync)
7. On audio end → Trigger question popup
```

### Chatbot Interaction
```
1. User clicks chat button
2. Chatbot opens
3. User clicks mic OR types
4. If mic: Voice → Text → Input field
5. User sends message
6. Socket.IO emits to backend
7. Backend responds with text + audio_url
8. Play chatbot audio
9. Avatar switches lipsync to chatbot audio
10. Slide audio paused (maintains timestamp)
```

### Question Popup Flow
```
1. Slide ends
2. Wait 1.5 seconds
3. Open popup
4. Auto-start voice recognition
5. Listen for YES/NO keywords
6. If YES: Open chatbot, pause slide
7. If NO/Timeout: Move to next slide
8. Voice input does NOT enter chat history
```

## Bug Prevention

### ✅ Audio Playing but No Lipsync
- **Solution**: Analyser always connected to active audio source
- **Check**: `onAudioSourceChange` callback updates parent

### ✅ Recording Missing Avatar/Slides
- **Solution**: Canvas captures entire UI
- **Check**: All visual elements rendered to canvas

### ✅ Popup Triggering at Wrong Time
- **Solution**: State machine prevents conflicts
- **Check**: `QUESTION_WAIT` state only after slide ends

### ✅ Chatbot Mic Opening Question Popup
- **Solution**: Separate SpeechRecognition instances
- **Check**: Question popup has its own recognition ref

### ✅ Slide Audio Not Resuming
- **Solution**: Store AudioBuffer + pause timestamp
- **Check**: `resumeSlideAudio()` uses stored position

### ✅ Duplicate MediaRecorder Streams
- **Solution**: Single recorder for entire lecture
- **Check**: Start once, stop at lecture end

### ✅ Audio Desync After Pause
- **Solution**: Track `audioContext.currentTime` offsets
- **Check**: Resume uses `start(0, pauseTime)`

## API Integration

### Socket.IO Events
- **Emit**: `lecture:chat` with `{ lecture_id, question }`
- **Listen**: `lecture:reply` with `{ answer, audio_url }`

### REST API
- **GET** `/lectures/:id/play` → Returns lecture JSON URL
- **GET** `/lectures/:id.json` → Returns slide data

## Performance Optimizations

1. **Audio Preloading**: Not implemented (loads on-demand)
2. **Canvas Rendering**: 30 FPS for recording
3. **Analyser FFT Size**: 256 (balance between quality and performance)
4. **Voice Recognition**: Continuous mode with interim results
5. **State Updates**: Minimal re-renders using refs

## Browser Compatibility

- **Chrome**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ⚠️ Requires user gesture for AudioContext
- **Edge**: ✅ Full support

## Known Limitations

1. **No 3D Avatar**: SVG-based simple avatar
2. **No Preloading**: Audio loads when slide starts
3. **No Offline Mode**: Requires network for audio/API
4. **No Mobile Recording**: MediaRecorder may have issues on mobile

## Future Enhancements

1. Add audio preloading for smoother transitions
2. Implement more sophisticated avatar (Canvas-based)
3. Add slide thumbnails/preview
4. Support multiple languages
5. Add subtitle/caption support
6. Implement slide annotations

## Usage

```jsx
import LectureVideo from './LectureVideo';

<LectureVideo 
  theme="light" 
  isDark={false}
/>
```

Pass lecture data via React Router:
```jsx
navigate('/lecture', {
  state: {
    lectureId: '123',
    title: 'Introduction to Physics',
    subject: 'Physics'
  }
});
```

## File Structure

```
LecturesManagement/
├── LectureVideo.jsx          # Main container
└── components/
    ├── Avatar.jsx            # SVG avatar with lipsync
    ├── AudioManager.jsx      # Audio control system
    ├── QuestionPopup.jsx     # Question popup with voice
    └── Chatbot.jsx           # AI assistant interface
```

## Production Checklist

- [x] No iframe
- [x] No Unity/3D engines
- [x] React-based components
- [x] Web Audio API integration
- [x] MediaRecorder implementation
- [x] State machine
- [x] Lipsync from audio
- [x] Voice recognition
- [x] Socket.IO integration
- [x] Recording system
- [x] Error handling
- [x] Clean code structure

---

**Built with**: React 18, Web Audio API, MediaRecorder API, SpeechRecognition API, Socket.IO
**No external dependencies**: Three.js, Unity, GLB loaders, or iframe-based solutions
