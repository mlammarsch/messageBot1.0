<template>
  <!-- Modal für die Audioaufnahme -->
  <div
    class="modal fade show"
    style="display: block"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
    aria-labelledby="audio-recorder-title"
  >
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h4 id="audio-recorder-title" class="modal-title">
            Recording active <span>{{ formatTime(elapsedTime) }}</span>
            <!-- Zeigt die verstrichene Aufnahmezeit an -->
          </h4>
          <!-- Schließen-Button -->
          <button
            type="button"
            class="btn-close"
            aria-label="Close"
            @click="cancelRecording"
          ></button>
        </div>
        <div
          class="modal-body d-flex justify-content-center align-items-center"
        >
          <div
            class="recording-symbol"
            :class="{ paused: isPaused }"
            aria-hidden="true"
          >
            <!-- Aufnahme-Symbol; geändert je nach Pause-Status -->
            <i v-if="!isPaused" class="bi bi-circle-fill display-4"></i>
            <i v-else class="bi bi-pause-fill text-warning display-4"></i>
          </div>
        </div>
        <div class="modal-footer">
          <div class="d-flex" style="width: 100%">
            <!-- Button zum Pausieren der Aufnahme -->
            <button
              v-if="!isPaused"
              @click="pauseRecording"
              class="btn btn-warning rounded-pill"
              style="width: 33%"
              aria-label="Pause Recording"
            >
              Pause
            </button>
            <!-- Button zum Fortsetzen der Aufnahme -->
            <button
              v-else
              @click="resumeRecording"
              class="btn btn-info rounded-pill"
              style="width: 33%"
              aria-label="Resume Recording"
            >
              Resume
            </button>
            <!-- Button zum Stoppen der Aufnahme -->
            <button
              @click="stopRecording"
              class="btn btn-danger rounded-pill"
              style="width: 33%"
              aria-label="Stop Recording"
            >
              Stop
            </button>
            <!-- Button zum Abbrechen der Aufnahme -->
            <button
              @click="cancelRecording"
              class="btn btn-outline-secondary rounded-pill"
              style="width: 33%"
              aria-label="Cancel Recording"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      mediaRecorder: null, // Zustand des MediaRecorders
      audioChunks: [], // Gesammelte Audio-Chunks
      elapsedTime: 0, // Verstrichene Zeit in Sekunden
      timer: null, // Timer für die verstrichene Zeit
      isPaused: false, // Zustand zur Überwachung, ob die Aufnahme pausiert ist
    };
  },
  created() {
    this.startRecording(); // Startet die Aufnahme bei Erstellung der Komponente
    document.addEventListener("keypress", this.handleKeyPress); // Fügt Eventlistener für Tastatureingaben hinzu
  },
  beforeDestroy() {
    this.stopTimer(); // Stoppt den Timer bevor die Komponente zerstört wird
    this.cleanup(); // Bereinigt Ressourcen
    document.removeEventListener("keypress", this.handleKeyPress); // Entfernt den Eventlistener
  },
  methods: {
    // Startet die Audioaufnahme
    async startRecording() {
      this.startTimer(); // Startet den Timer für die verstrichene Zeit
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        }); // Anfrage zur Mikrofon-Nutzung
        this.mediaRecorder = new MediaRecorder(stream); // Initialisiert den MediaRecorder
        this.mediaRecorder.start(); // Beginnt die Aufnahme

        // Wo Daten verfügbar sind, speichere sie
        this.mediaRecorder.ondataavailable = (event) => {
          this.audioChunks.push(event.data); // Fügt die Daten den Audio-Chunks hinzu
        };

        // Wenn die Aufnahme gestoppt wird
        this.mediaRecorder.onstop = () => {
          if (this.audioChunks.length > 0) {
            const audioBlob = new Blob(this.audioChunks, {
              type: "audio/ogg; codecs=opus",
            }); // Erzeugt ein Blob aus den Chunks
            this.$emit("audio-ready", audioBlob); // Emitte das fertige Audio-Blob
          }
          this.cleanup(); // Bereinigt nach der Aufzeichnung
        };
      } catch (error) {
        this.$emit("error", "Microphone access denied."); // Fehler bei Mikrofonzugriff
        this.cancelRecording(); // Abbrechen der Aufnahme
      }
    },
    // Pausiert die Aufnahme
    pauseRecording() {
      if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
        this.mediaRecorder.pause(); // Pausiere den MediaRecorder
        this.stopTimer(); // Stoppe den Timer
        this.isPaused = true; // Setze den Pause-Zustand
      }
    },
    // Setzt die Aufnahme fort
    resumeRecording() {
      if (this.mediaRecorder && this.mediaRecorder.state === "paused") {
        this.mediaRecorder.resume(); // Setzte die Aufnahme fort
        this.startTimer(); // Starte den Timer erneut
        this.isPaused = false; // Setze den Pause-Zustand zurück
      }
    },
    // Stoppt die Aufnahme
    stopRecording() {
      if (
        this.mediaRecorder &&
        (this.mediaRecorder.state === "recording" ||
          this.mediaRecorder.state === "paused")
      ) {
        this.mediaRecorder.stop(); // Stoppe den MediaRecorder
      }
      this.stopTimer(); // Stoppe den Timer
      this.focusMessageInput(); // Fokussiere das Eingabefeld
    },
    // Bricht die Aufnahme ab
    cancelRecording() {
      this.cleanup(); // Bereinigt die Ressourcen
      this.$emit("close-recorder"); // Emitte das Event zum Schließen des Recorders
      this.focusMessageInput(); // Fokussiere das Eingabefeld
    },
    // Startet den Timer für die verstrichene Zeit
    startTimer() {
      this.timer = setInterval(() => {
        this.elapsedTime++; // Erhöhe die verstrichene Zeit um 1 Sekunde
      }, 1000); // Timer-Intervall auf 1 Sekunde setzen
    },
    // Stoppt den Timer
    stopTimer() {
      clearInterval(this.timer); // Stoppe den Timer
    },
    // Formatiert die verstrichene Zeit als Minuten:Sekunden
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60); // Berechne Minuten
      const secs = seconds % 60; // Berechne Sekunden
      return `${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`; // Formatiere die Zeit
    },
    // Bereinigt alle Ressourcen
    cleanup() {
      if (this.mediaRecorder) {
        this.mediaRecorder.stream.getTracks().forEach((track) => track.stop()); // Stoppe alle Streams
        this.mediaRecorder = null; // Setze den MediaRecorder zurück
      }
      this.audioChunks = []; // Leere die Audio-Chunks
      this.stopTimer(); // Stoppe den Timer
      this.elapsedTime = 0; // Setze die verstrichene Zeit zurück
      this.isPaused = false; // Setze den Pause-Zustand zurück
    },
    // Fokussiert das Eingabefeld
    focusMessageInput() {
      this.$emit("focus-input"); // Emitte das Event zum Fokussieren
    },
    // Handler für die Tasteneingaben
    handleKeyPress(event) {
      if (event.key === "Enter") {
        this.stopRecording(); // Stoppe die Aufnahme bei Enter-Taste
      }
    },
  },
};
</script>

<style scoped>
.recording-symbol {
  font-size: 30px; /* Vergrößert das Aufnahmeicon */
  color: red; /* Farbe für das Aufnahmeicon */
  animation: pulse 1s infinite; /* Pulsierende Animation */
}

.paused {
  animation: none; /* Entferne Animation wenn pausiert */
}

/* Pulsierende Animation definieren */
@keyframes pulse {
  0%,
  100% {
    transform: scale(1); /* Ursprüngliche Größe */
  }
  50% {
    transform: scale(1.2); /* Vergrößert auf 1.2 bei 50% */
  }
}
</style>
