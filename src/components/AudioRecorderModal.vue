<template>
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="audio-recorder-title">
    <div class="modal-content">
      <div class="modal-header d-flex justify-content-between align-items-center">
        <h4 id="audio-recorder-title">
          Recording active <span>{{ formatTime(elapsedTime) }}</span>
        </h4>
        <div class="recording-symbol" :class="{ 'paused': isPaused }" aria-hidden="true">
          <i v-if="!isPaused" class="bi bi-circle-fill"></i>
          <i v-else class="bi bi-pause-fill text-warning"></i>
        </div>
      </div>
      <div class="button-group mt-3">
        <button
          v-if="!isPaused"
          @click="pauseRecording"
          class="btn btn-warning"
          aria-label="Pause Recording"
          role="button"
        >
          <i class="bi bi-pause-fill" aria-hidden="true"></i> Pause
        </button>
        <button
          v-else
          @click="resumeRecording"
          class="btn btn-info"
          aria-label="Resume Recording"
          role="button"
        >
          <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i> Resume
        </button>
        <button
          @click="stopRecording"
          class="btn btn-danger"
          aria-label="Stop Recording"
          role="button"
        >
          <i class="bi bi-square-fill" aria-hidden="true"></i> Stop
        </button>
        <button
          @click="cancelRecording"
          class="btn btn-outline-secondary"
          aria-label="Cancel Recording"
          role="button"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      mediaRecorder: null,
      audioChunks: [],
      elapsedTime: 0,
      timer: null,
      isPaused: false,
    };
  },
  created() {
    this.startRecording();
  },
  methods: {
    async startRecording() {
      this.startTimer();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.start();

        this.mediaRecorder.ondataavailable = event => {
          this.audioChunks.push(event.data);
        };

        this.mediaRecorder.onstop = () => {
          if (this.audioChunks.length > 0) {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/ogg; codecs=opus' });
            this.$emit('audio-ready', audioBlob);
          }
          this.cleanup();
        };
      } catch (error) {
        this.$emit('error', 'Microphone access denied.');
        this.cancelRecording();
      }
    },
    pauseRecording() {
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.pause();
        this.stopTimer();
        this.isPaused = true;
      }
    },
    resumeRecording() {
      if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
        this.mediaRecorder.resume();
        this.startTimer();
        this.isPaused = false;
      }
    },
    stopRecording() {
      if (this.mediaRecorder && (this.mediaRecorder.state === 'recording' || this.mediaRecorder.state === 'paused')) {
        this.mediaRecorder.stop();
      }
      this.stopTimer();
      this.focusMessageInput();
    },
    cancelRecording() {
      this.cleanup();
      this.$emit('close-recorder');
      this.focusMessageInput();
    },
    startTimer() {
      this.timer = setInterval(() => {
        this.elapsedTime++;
      }, 1000);
    },
    stopTimer() {
      clearInterval(this.timer);
    },
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    cleanup() {
      if (this.mediaRecorder) {
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        this.mediaRecorder = null;
      }
      this.audioChunks = [];
      this.stopTimer();
      this.elapsedTime = 0;
      this.isPaused = false;
    },
    focusMessageInput() {
      this.$emit('focus-input');
    }
  },
  beforeDestroy() {
    this.stopTimer();
    this.cleanup();
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--modal-background);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-content {
  background-color: var(--modal-content-background);
  padding: 20px 30px;
  border-radius: 10px;
  box-shadow: var(--modal-shadow);
  min-width: 300px;
}

.modal-header {
  margin-bottom: 15px;
}

.button-group {
  display: flex;
  justify-content: space-between;
}

button {
  padding: 10px;
  transition: var(--btn-transition);
}

button:active {
  transform: scale(var(--btn-active-scale));
  opacity: var(--btn-active-opacity);
}

.recording-symbol {
  font-size: 18px;
  color: red;
  animation: pulse 1s infinite;
}

.paused {
  animation: none;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}
</style>