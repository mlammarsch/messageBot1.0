<template>
  <div class="app-container">
    <!-- Warnmeldung -->
    <div v-if="!webhookURL" class="alert alert-warning" role="alert">
      Webhook URL is not set. Please configure it in settings.
    </div>

    <!-- Rückmeldung -->
    <div v-if="responseMessage" class="alert alert-info" role="alert">
      {{ responseMessage }}
    </div>

    <!-- Chat -->
    <div class="chat-content" ref="chatContainer" role="log" aria-live="polite">
      <div 
        v-for="message in messages" 
        :key="message.timestamp"
        class="chat-bubble"
        role="article"
        aria-labelledby="message-timestamp"
      >
        <div class="message-timestamp" id="message-timestamp">
          <strong>{{ formatTimestamp(message.timestamp) }}</strong>
        </div>
        <div class="message-status">
          <span :class="{'text-success': message.success, 'text-danger': !message.success}">
            {{ message.success ? 'Message sent successfully' : 'Failed to send message' }}
          </span>
        </div>
        <div>
          {{ message.text }}
          <template v-if="message.hasAudio">
            <i class="bi bi-paperclip" aria-hidden="true"></i>
            <i class="bi bi-speaker" aria-hidden="true"></i>
          </template>
        </div>
      </div>
    </div>

    <!-- Eingabebereich -->
    <div class="input-area p-2 border-top bg-light">
      <div class="d-flex align-items-center mb-2">
        <button 
          class="btn btn-outline-secondary me-2" 
          @click="startRecording" 
          aria-label="Record Audio"
          role="button"
        >
          <i class="bi bi-mic-fill" aria-hidden="true"></i>
        </button>
        <input 
          ref="messageInput" 
          type="text" 
          v-model="message" 
          placeholder="Type a message" 
          class="form-control mx-2" 
          aria-label="Nachricht eingeben"
        />
        <button 
          @click="sendMessage" 
          class="btn btn-primary btn-send" 
          :class="{ 'btn-disabled': isSendDisabled }"
          aria-label="Send Message"
          role="button"
          :disabled="isSendDisabled"
        >
          <i class="bi bi-send" aria-hidden="true"></i>
        </button>
      </div>

      <div v-if="audio" class="audio-control d-flex align-items-center mb-2">
        <audio 
          :src="audioURL" 
          controls 
          class="flex-grow-1 me-2" 
          aria-label="Audio abspielen"
        ></audio>
        <button 
          class="btn btn-outline-danger btn-delete" 
          @click="deleteAudio" 
          aria-label="Delete Audio"
          role="button"
        >
          <i class="bi bi-trash" aria-hidden="true"></i>
        </button>
      </div>
    </div>

    <!-- Modal -->
    <AudioRecorderModal 
      v-if="showAudioRecorder" 
      @audio-ready="setAudio" 
      @error="setError" 
      @close-recorder="showAudioRecorder = false"
      @focus-input="focusMessageInput"
    />

    <!-- Einstellungen -->
    <button 
      @click="openSettings" 
      class="settings-button btn btn-link position-absolute top-0 end-0 m-2" 
      aria-label="Open Settings"
      role="button"
    >
      <i class="bi bi-gear" aria-hidden="true"></i>
    </button>
    
    <WebhookSettings 
      :isOpen="isSettingsOpen" 
      :currentUrl="webhookURL" 
      @webhook-updated="updateWebhookURL"
      @webhook-cleared="clearWebhookURL"
      @clear-messages="clearMessages" 
      @close-settings="closeSettings"
    />
  </div>
</template>

<script>
// Importieren der notwendigen Komponenten und Services
import AudioRecorderModal from './components/AudioRecorderModal.vue';
import WebhookSettings from './components/WebhookSettings.vue';
import { sendToWebhook } from './services/api';
import { loadWebhookURL, saveWebhookURL, saveMessages, loadMessages } from './services/storage.js';

export default {
  components: {
    AudioRecorderModal,
    WebhookSettings,
  },
  data() {
    return {
      message: '', // Der Nachrichtentext
      audio: null, // Der Audiodaten-Blob
      messages: loadMessages() || [], // Geladene Nachrichten
      webhookURL: loadWebhookURL() || '', // Die Webhook-URL
      responseMessage: '', // Rückmeldung an den Benutzer
      isSending: false, // Sendeoperation läuft gerade
      isSettingsOpen: false, // Einstellungs-Dialog offen
      showAudioRecorder: false // Audiorekorder-Dialog offen
    };
  },
  computed: {
    // URL für das Audio-Element
    audioURL() {
      return this.audio ? URL.createObjectURL(this.audio) : '';
    },
    // Deaktiviert den Senden-Button
    isSendDisabled() {
      return this.isSending || (!this.message.trim() && !this.audio) || !this.webhookURL;
    }
  },
  methods: {
    // Versendet eine Nachricht mit Daten an den Webhook
    async sendMessage() {
      if (!this.webhookURL) {
        this.responseMessage = "Error: No Webhook URL set.";
        return;
      }
      if (this.isSending || (!this.message.trim() && !this.audio)) return;

      this.isSending = true;
      const timestamp = new Date();
      const os = this.getOS();
      const browser = this.getBrowser();

      const data = {
        text: this.message.trim() || 'n/a', // Nachricht oder 'n/a'
        audio: this.audio,
        timestamp: timestamp.toISOString(), // Hinzufügen des Zeitstempels
        os: os, // Betriebssystem ermitteln
        browser: browser, // Browser ermitteln
        audioAttached: !!this.audio, // Audio-Anhang
        imageAttached: false // Bild-Anhang (zukünftig)
      };

      try {
        const response = await sendToWebhook(this.webhookURL, data);
        if (response.status === 200) {
          this.storeMessage(true);
          this.clearInputs();
          this.scrollToBottom();
        } else {
          this.responseMessage = `Error: Server antwortete mit Status ${response.status}.`;
        }
      } catch (error) {
        this.storeMessage(false);
        this.responseMessage = "Error: Nachricht konnte nicht gesendet werden.";
      } finally {
        this.isSending = false;
        saveMessages(this.messages);
        this.$nextTick(() => {
          this.$refs.messageInput.focus();
        });
      }
    },
    // Speichert die Nachricht in der Verlaufsliste
    storeMessage(success) {
      const newMessage = {
        timestamp: new Date(),
        success: success,
        text: this.message.trim() || 'n/a',
        hasAudio: Boolean(this.audio)
      };
      this.messages.unshift(newMessage);
    },
    // Formatiert einen Zeitstempel
    formatTimestamp(timestamp) {
      if (!timestamp) return '';
      const options = { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        timeZone: 'Europe/Berlin' 
      };
      return new Intl.DateTimeFormat('de-DE', options).format(new Date(timestamp));
    },
    // Ermittelt das Betriebssystem
    getOS() {
      const userAgent = window.navigator.userAgent;
      if (/Windows NT 10.0/.test(userAgent)) return 'Windows 10';
      if (/Windows NT 11.0/.test(userAgent)) return 'Windows 11';
      if (/Mac OS X/.test(userAgent)) return 'macOS';
      if (/Linux/.test(userAgent)) return 'Linux';
      if (/iPhone|iPad|iPod/.test(userAgent)) return 'iOS';
      if (/Android/.test(userAgent)) return 'Android';
      return 'Unknown OS';
    },
    // Ermittelt den Browser
    getBrowser() {
      const userAgent = window.navigator.userAgent;
      if (/Firefox\//.test(userAgent)) return 'Firefox';
      if (/Chrome\//.test(userAgent) && /Edg\//.test(userAgent)) return 'Edge';
      if (/Chrome\//.test(userAgent)) return 'Chrome';
      if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) return 'Safari';
      return 'Unknown Browser';
    },
    // Löscht die Eingabefelder
    clearInputs() {
      this.message = '';
      this.audio = null;
    },
    // Öffnet die Einstellungen
    openSettings() {
      this.isSettingsOpen = true;
    },
    // Schließt die Einstellungen
    closeSettings() {
      this.isSettingsOpen = false;
    },
    // Aktualisiert die Webhook-URL
    updateWebhookURL(newURL) {
      this.webhookURL = newURL;
      saveWebhookURL(newURL);
      this.responseMessage = "Webhook URL erfolgreich aktualisiert!";
      setTimeout(() => {
        this.responseMessage = '';
      }, 4000);
    },
    // Löscht die Webhook-URL
    clearWebhookURL() {
      this.webhookURL = '';
      saveWebhookURL('');
      this.responseMessage = "Webhook URL gelöscht!";
      setTimeout(() => {
        this.responseMessage = '';
      }, 4000);
    },
    // Setzt das aufgenommene Audio
    setAudio(audioBlob) {
      this.audio = audioBlob;
      this.showAudioRecorder = false;
    },
    // Löscht das aufgenommene Audio
    deleteAudio() {
      this.audio = null;
      this.focusMessageInput();
    },
    // Setzt einen Fehler
    setError(error) {
      this.responseMessage = error;
    },
    // Startet die Aufnahme
    startRecording() {
      this.showAudioRecorder = true;
    },
    // Löscht alle Nachrichten
    clearMessages() {
      this.messages = [];
      saveMessages(this.messages);
    },
    // Scrollt zum Ende der Chatliste
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.chatContainer;
        const threshold = 50; 
        const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
        if (isAtBottom) {
          container.scrollTop = 0; 
        }
      });
    },
    // Fokussiert das Nachrichteneingabefeld
    focusMessageInput() {
      this.$nextTick(() => {
        this.$refs.messageInput.focus();
      });
    }
  },
  mounted() {
    const savedURL = loadWebhookURL();
    if (savedURL) {
      this.webhookURL = savedURL;
    }
    this.$nextTick(() => {
      this.scrollToBottom();
    });
  },
};
</script>

<style>
.alert {
  margin: 10px 0;
  padding: 10px;
  border-radius: 5px;
}

.alert-warning {
  background-color: #ffeb3b;
  color: #1a1a1a;
}

.alert-info {
  background-color: #cce5ff;
  color: #004085;
}

/* Gesamtcontainer des Chat-Systems */
.app-container {
  height: 100vh; 
  display: flex;
  flex-direction: column; 
  background-color: #e0f7e9; 
  position: relative; 
}

/* Container für den Chatverlauf */
.chat-content {
  flex-grow: 1; 
  overflow-y: auto; 
  padding: 10px;
  display: flex;
  flex-direction: column-reverse; 
  scroll-behavior: smooth; 
}

/* Einzelne Chatnachricht */
.chat-bubble {
  background-color: var(--chat-bubble-background); 
  border-radius: var(--chat-bubble-border-radius); 
  padding: var(--chat-bubble-padding); 
  max-width: 80%; 
  margin: var(--chat-bubble-margin); 
  position: relative; 
  align-self: flex-start;
}

/* Zeitstempel der Nachricht */
.message-timestamp {
  font-size: 0.8em;
  color: #6c757d;
}

/* Status der Nachricht */
.message-status {
  margin-bottom: 5px;
}

/* Container für den Audio-Player */
.audio-control {
  margin-top: 10px;
  display: flex;
  align-items: center;
}

/* Bereich für die Eingabe von Nachrichten */
.input-area {
  padding: 10px;
  background-color: #ffffff;
  border-top: solid 1px rgba(0,0,0,.125); 
}

.bg-light {
  background-color: #f8f9fa;
}

.settings-button {
  position: absolute;
  top: 10px;
  right: 10px;
}

/* Visuelle Effekte für alle Buttons */
button {
  transition: var(--btn-transition); 
}

button:active {
  transform: scale(var(--btn-active-scale)); 
  opacity: var(--btn-active-opacity); 
}

/* Deaktivierte Buttons */
.btn-primary:disabled,
.btn-disabled {
  background-color: #ccc !important;
  cursor: not-allowed;
  opacity: 0.5 !important;
}
</style>