<template>
  <div class="modal fade show" style="display: block;" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="audio-recorder-title">
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h4 id="audio-recorder-title" class="modal-title">
            Recording active <span>{{ formatTime(elapsedTime) }}</span>
          </h4>
          <button type="button" class="btn-close" aria-label="Close" @click="cancelRecording"></button>
        </div>
        <div class="modal-body d-flex justify-content-center align-items-center">
          <div class="recording-symbol" :class="{ 'paused': isPaused }" aria-hidden="true">
            <i v-if="!isPaused" class="bi bi-circle-fill display-4"></i>
            <i v-else class="bi bi-pause-fill text-warning display-4"></i>
          </div>
        </div>
        <div class="modal-footer">
          <button
            v-if="!isPaused"
            @click="pauseRecording"
            class="btn btn-warning rounded-pill"
            aria-label="Pause Recording"
          >
            <i class="bi bi-pause-fill" aria-hidden="true"></i> Pause
          </button>
          <button
            v-else
            @click="resumeRecording"
            class="btn btn-info rounded-pill"
            aria-label="Resume Recording"
          >
            <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i> Resume
          </button>
          <button
            @click="stopRecording"
            class="btn btn-danger rounded-pill"
            aria-label="Stop Recording"
          >
            <i class="bi bi-square-fill" aria-hidden="true"></i> Stop
          </button>
          <button
            @click="cancelRecording"
            class="btn btn-outline-secondary rounded-pill"
            aria-label="Cancel Recording"
          >
            Cancel
          </button>
        </div>
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
    document.addEventListener('keypress', this.handleKeyPress);
  },
  beforeDestroy() {
    this.stopTimer();
    this.cleanup();
    document.removeEventListener('keypress', this.handleKeyPress);
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
    },
    handleKeyPress(event) {
      if (event.key === 'Enter') {
        this.stopRecording();
      }
    }
  }
};
</script>

<style scoped>
.recording-symbol {
  font-size: 30px; /* Vergrößert das Aufnahmeicon */
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