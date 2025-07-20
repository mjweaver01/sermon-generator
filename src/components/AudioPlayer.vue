<template>
  <div class="audio-player-component">
    <!-- Audio Controls -->
    <div class="audio-controls">
      <div class="voice-selection">
        <select
          id="voice-select"
          v-model="selectedVoice"
          class="voice-select"
          :disabled="generatingAudio || props.streamingInProgress"
        >
          <option disabled>AI Voice</option>
          <option value="alloy">Alloy</option>
          <option value="echo">Echo</option>
          <option value="fable">Fable</option>
          <option value="onyx">Onyx</option>
          <option value="nova">Nova</option>
          <option value="shimmer">Shimmer</option>
        </select>
      </div>
      <button
        @click="generateAudio"
        :disabled="
          !markdownText || generatingAudio || props.streamingInProgress
        "
        class="audio-generate-btn"
      >
        <span v-if="generatingAudio" class="loading-spinner-btn"></span>
        <span class="btn-icon">{{ generatingAudio ? '⏳' : '🎵' }}</span>
        {{ generatingAudio ? 'Generating Audio...' : 'Generate Audio' }}
      </button>
    </div>

    <!-- Audio Player Section -->
    <div v-if="audioUrl" class="audio-player-section">
      <audio :src="audioUrl" controls class="audio-player"></audio>
      <button @click="downloadAudio" class="audio-download-btn">
        <span class="btn-icon">📥</span>
        Download Audio
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-message">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { storageService, type StorageLocation } from '../services/storage'

interface Props {
  markdownText: string
  filename?: string
  streamingInProgress?: boolean
  storageLocation?: StorageLocation
}

const props = withDefaults(defineProps<Props>(), {
  filename: 'sermon',
  streamingInProgress: false,
  storageLocation: 'local',
})

interface Emits {
  (e: 'audioGenerated', audioDataUrl: string): void
}

const emit = defineEmits<Emits>()

const selectedVoice = ref('alloy')
const generatingAudio = ref(false)
const audioUrl = ref('')
const error = ref('')

const generateAudio = async () => {
  if (!props.markdownText) return

  generatingAudio.value = true
  error.value = ''

  try {
    const response = await fetch('/api/generate-audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        markdownText: props.markdownText,
        voice: selectedVoice.value,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to generate audio')
    }

    // Get the JSON response with audioUrl and audioBuffer
    const responseData = await response.json()

    if (!responseData.audioUrl || !responseData.audioBuffer) {
      throw new Error('Invalid response format')
    }

    // Create a blob from the audio buffer for the audio player
    const audioBufferArray = new Uint8Array(responseData.audioBuffer)
    const audioBlob = new Blob([audioBufferArray], { type: 'audio/mpeg' })

    // Create a URL for the audio player controls
    if (audioUrl.value) {
      URL.revokeObjectURL(audioUrl.value)
    }
    audioUrl.value = URL.createObjectURL(audioBlob)

    // If storage location is Netlify, also save to Netlify Blobs
    let finalAudioUrl = responseData.audioUrl
    if (props.storageLocation === 'netlify') {
      try {
        const audioFilename = `audio_${Date.now()}_${selectedVoice.value}.mp3`
        const saveResult = await storageService.saveAudio(
          audioFilename,
          audioBufferArray.buffer,
          'netlify'
        )

        if (saveResult.success) {
          console.log('Audio saved to Netlify Blobs successfully')
          // Use a Netlify Blobs URL pattern for the shortcode
          finalAudioUrl = `/api/storage?operation=get&store=audio&key=${encodeURIComponent(audioFilename)}`
        } else {
          console.warn(
            'Failed to save audio to Netlify Blobs:',
            saveResult.error
          )
        }
      } catch (storageError) {
        console.warn('Error saving audio to Netlify Blobs:', storageError)
      }
    }

    // Emit the audio URL for the shortcode
    emit('audioGenerated', finalAudioUrl)
  } catch (err: any) {
    error.value = err.message || 'Failed to generate audio'
    console.error('Error generating audio:', err)
  } finally {
    generatingAudio.value = false
  }
}

const downloadAudio = () => {
  if (!audioUrl.value) return

  const a = document.createElement('a')
  a.href = audioUrl.value
  a.download = `${props.filename.replace(/\.md$/, '')}.mp3`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// Clean up audio URL when component is unmounted
onUnmounted(() => {
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
  }
})

// Clean up audio URL when markdownText changes
watch(
  () => props.markdownText,
  () => {
    if (audioUrl.value) {
      URL.revokeObjectURL(audioUrl.value)
      audioUrl.value = ''
    }
    error.value = ''
  }
)
</script>

<style scoped>
.audio-player-component {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.audio-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.voice-selection {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 150px;
}

.voice-selection label {
  font-weight: 600;
  color: #374151;
  font-size: 0.95rem;
  white-space: nowrap;
}

.voice-select {
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
}

.voice-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.voice-select:disabled {
  background-color: #f1f5f9;
  cursor: not-allowed;
  opacity: 0.7;
}

.audio-generate-btn {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.audio-generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
}

.audio-generate-btn:disabled {
  background: linear-gradient(135deg, #94a3b8, #64748b);
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 4px 12px rgba(148, 163, 184, 0.2);
}

.loading-spinner-btn {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.btn-icon {
  font-size: 1.1rem;
}

.audio-player-section {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  text-align: center;
}

.audio-player {
  width: 100%;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.audio-download-btn {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.audio-download-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
}

.error-message {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border: 1px solid #fca5a5;
  border-radius: 12px;
  padding: 1rem;
  margin-top: 1rem;
  text-align: center;
}

.error-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.error-message p {
  color: #dc2626;
  margin: 0;
  font-weight: 500;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .audio-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .voice-selection {
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .audio-player-section {
    padding: 1rem;
  }
}
</style>
