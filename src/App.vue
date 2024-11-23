<template>
  <div class="app-container">
    
    <!-- Der Chat-Bereich mit Nachrichten-Liste -->
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
            <!-- Symbole für Audio-Anhang -->
            <i class="bi bi-paperclip" aria-hidden="true"></i>
            <i class="bi bi-speaker" aria-hidden="true"></i>
          </template>
        </div>
      </div>
    </div>

    <!-- Warnmeldung für fehlende Webhook-URL -->
    <div v-if="!webhookURL" class="alert alert-warning" role="alert">
      Webhook URL is not set. Please configure it in settings.
    </div>

    <!-- Rückmeldung nach Nachrichtenvorgängen -->
    <div v-if="responseMessage" class="alert alert-info" role="alert">
      {{ responseMessage }}
    </div>

    <!-- Eingabebereich für Text und Audiomeldungen -->
    <div class="input-area p-2 border-top bg-light" ref="inputArea">
      <div class="d-flex align-items-center mb-2">
        <button 
          class="btn btn-outline-secondary me-2 rounded-pill" 
          @click="startRecording" 
          aria-label="Record Audio"
          role="button"
        >
          <i class="bi bi-mic-fill" aria-hidden="true"></i>
        </button>
        <!-- Nachrichteneingabe -->
        <input 
          ref="messageInput" 
          type="text" 
          v-model="message" 
          placeholder="Type a message" 
          class="form-control mx-2 rounded-pill" 
          aria-label="Nachricht eingeben"
        />
        <button 
          @click="sendMessage" 
          class="btn btn-primary btn-send rounded-pill" 
          :class="{ 'btn-disabled': isSendDisabled }"
          aria-label="Send Message"
          role="button"
          :disabled="isSendDisabled"
        >
          <i class="bi bi-send" aria-hidden="true"></i>
        </button>
      </div>

      <!-- Audiowiedergabebereich -->
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

    <!-- Audio-Rekorder-Modal Darstellung -->
    <AudioRecorderModal 
      v-if="showAudioRecorder" 
      @audio-ready="setAudio" 
      @error="setError" 
      @close-recorder="showAudioRecorder = false"
      @focus-input="focusMessageInput"
    />

    <!-- Settings Buttons -->
    <div class="container position-relative text-center">
      <i 
        @click="openSettings" 
        class="bi bi-gear position-absolute" 
        aria-label="Open Settings"
        role="button"
        style="top: 10px; right: 10px; font-size: 24px; cursor: pointer; color: grey;"
      ></i>

      <i 
        @click="openCategoryModal" 
        class="bi bi-tags position-absolute" 
        aria-label="Open Category Dialog"
        role="button"
        style="top: 70px; right: 10px; font-size: 24px; cursor: pointer; color: grey;"
      ></i>
    </div>

    <!-- Einstellungen-Button -->
    <div class="d-flex">
      <div class="row align-items-end">
        
      </div>
    </div>
    <div class="row">
      <!-- Kategorie-Button -->
      <div class="col align-items-end">
        
      </div>
    </div>

    <!-- Webhook-Einstellungskomponente -->
    <WebhookSettings 
      :isOpen="isSettingsOpen" 
      :currentUrl="webhookURL" 
      @webhook-updated="updateWebhookURL"
      @webhook-cleared="clearWebhookURL"
      @clear-messages="clearMessages" 
      @close-settings="closeSettings"
    />

    <!-- Category Modal -->
    <CategoryModal 
      v-if="showCategoryModal" 
      @close-modal="closeCategoryModal"
      @focus-chat-input="focusMessageInput"
    />
  </div>
</template>

<script>
import AudioRecorderModal from './components/AudioRecorderModal.vue';
import WebhookSettings from './components/WebhookSettings.vue';
import CategoryModal from './components/CategoryModal.vue';
import { sendToWebhook } from './services/api';
import { loadWebhookURL, saveWebhookURL, saveMessages, loadMessages } from './services/storage.js';

export default {
  components: {
    AudioRecorderModal,
    WebhookSettings,
    CategoryModal,
  },
  data() {
    return {
      message: '', // Der aktuelle Inhalt der Textnachricht, die der Benutzer eingegeben hat
      audio: null, // Das aktuelle Audioblatt, das der Benutzer aufgenommen hat
      messages: loadMessages() || [], // Geladene Nachrichten aus dem Local Storage
      webhookURL: loadWebhookURL() || '', // Geladene Webhook-URL aus dem Local Storage
      responseMessage: '', // Rückantwortnachricht, um dem Benutzer den Status einer Aktion mitzuteilen
      isSending: false, // Status, ob eine Nachricht gesendet wird
      isSettingsOpen: false, // Status, ob das Einstellungspanel offen ist
      showAudioRecorder: false, // Status, ob das Audio-Rekorder-Modal geöffnet ist
      showCategoryModal: false // Status, ob das Kategoriedialog geöffnet ist
    };
  },
  computed: {
    // Liefert eine URL des Audios, damit es im Audio-Tag abgespielt werden kann
    audioURL() {
      return this.audio ? URL.createObjectURL(this.audio) : '';
    },
    // Ermittelt, ob der Sende-Button deaktiviert werden soll
    isSendDisabled() {
      return this.isSending || (!this.message.trim() && !this.audio) || !this.webhookURL;
    }
  },
  methods: {
    // Sendet die Nachricht zum konfigurierten Webhook
    async sendMessage() {
      // Zuerst überprüfen, ob eine Webhook-URL existiert
      if (!this.webhookURL) {
        this.responseMessage = "Error: No Webhook URL set.";
        return;
      }
      // Überprüft, ob eine Nachricht gesendet wird und ob eine Eingabe oder ein Audio vorliegt
      if (this.isSending || (!this.message.trim() && !this.audio)) return;

      this.isSending = true;
      const timestamp = new Date().toISOString(); // Aktueller Zeitstempel im ISO-Format
      const os = this.getOS(); // Betriebssystem des Benutzers ermitteln
      const browser = this.getBrowser(); // Browser des Benutzers ermitteln

      const data = {
        text: this.message.trim() || 'n/a',
        audio: this.audio,
        timestamp: new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin', hour12: false }),
        os: os,
        browser: browser,
        audioAttached: !!this.audio,
        imageAttached: false
      };

      try {
        // Senden der Nachricht an den Webhook
        const response = await sendToWebhook(this.webhookURL, data);
        if (response.status === 200) {
          this.storeMessage(true); // Erfolgsmeldung speichert die gesendete Nachricht
          this.clearInputs(); // Klare die Eingabe- und Audiobereiche
          this.scrollToBottom(); // Scroll zum Ende der Chat-Nachrichten
        } else {
          this.responseMessage = `Error: Server antwortete mit Status ${response.status}.`;
        }
      } catch (error) {
        this.storeMessage(false); // Speichern der gescheiterten Nachricht
        this.responseMessage = "Error: Nachricht konnte nicht gesendet werden.";
      } finally {
        this.isSending = false; // Zurücksetzen des Sende-Status
        saveMessages(this.messages); // Speichern der Nachrichten im Local Storage
        this.$nextTick(() => {
          this.$refs.messageInput.focus(); // Fokussiert das Texteingabefeld beim nächsten DOM-Update
          this.adjustChatLayout(); // Anpassung des Chat-Layouts
        });
      }
    },
    // Speichert die Nachricht in der Nachrichtenliste und im Speicher
    storeMessage(success) {
      const newMessage = {
        timestamp: new Date(),
        success: success,
        text: this.message.trim() || 'n/a',
        hasAudio: Boolean(this.audio)
      };
      this.messages.unshift(newMessage); // Neue Nachricht oben hinzufügen
    },
    // Formatieren des Zeitstempels in ein gut lesbares Format
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
    // Ermittelt das Betriebssystem basierend auf dem User-Agent
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
    // Ermittelt den Browser basierend auf dem User-Agent
    getBrowser() {
      const userAgent = window.navigator.userAgent;
      if (/Firefox\//.test(userAgent)) return 'Firefox';
      if (/Chrome\//.test(userAgent) && /Edg\//.test(userAgent)) return 'Edge';
      if (/Chrome\//.test(userAgent)) return 'Chrome';
      if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) return 'Safari';
      return 'Unknown Browser';
    },
    // Löschen der Nachrichteneingabe und Audioaufnahme
    clearInputs() {
      this.message = '';
      this.audio = null;
    },
    // Öffnen des Einstellungsdialogs
    openSettings() {
      this.isSettingsOpen = true;
    },
    // Schließen des Einstellungsdialogs
    closeSettings() {
      this.isSettingsOpen = false;
    },
    // Öffnen des Kategoriedialogs
    openCategoryModal() {
      this.showCategoryModal = true;
    },
    // Schließen des Kategoriedialogs
    closeCategoryModal() {
      this.showCategoryModal = false;
      this.focusMessageInput();
    },
    // Aktualisieren der Webhook-URL und Speicherung dieser
    updateWebhookURL(newURL) {
      this.webhookURL = newURL;
      saveWebhookURL(newURL); // Speichern der neuen URL im Local Storage
      this.responseMessage = "Webhook URL erfolgreich aktualisiert!";
      setTimeout(() => {
        this.responseMessage = ''; // Entfernen der Bestätigungsmeldung nach 4 Sekunden
      }, 4000);
    },
    // Löscht die aktuelle Webhook-URL
    clearWebhookURL() {
      this.webhookURL = '';
      saveWebhookURL(''); // Löschen der URL aus dem Local Storage
      this.responseMessage = "Webhook URL gelöscht!";
      setTimeout(() => {
        this.responseMessage = ''; // Entfernen der Bestätigungsmeldung nach 4 Sekunden
      }, 4000);
    },
    // Setzt das Audioobjekt und schließt den Audiorecorder
    setAudio(audioBlob) {
      this.audio = audioBlob;
      this.showAudioRecorder = false;
    },
    // Löscht das angehängte Audio
    deleteAudio() {
      this.audio = null;
      this.focusMessageInput(); // Fokussiert wieder das Texteingabefeld
    },
    // Setzt eine Fehlernachricht und zeigt sie an
    setError(error) {
      this.responseMessage = error;
    },
    // Öffnen des Audiorecorders
    startRecording() {
      this.showAudioRecorder = true;
    },
    // Löscht alle Nachrichten und speichert diesen Zustand
    clearMessages() {
      this.messages = [];
      saveMessages(this.messages);
    },
    // Scrollt zum Ende des Chat-Inhalts
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.chatContainer;
        container.scrollTop = container.scrollHeight;
      });
    },
    // Passt das Layout des Chats an, um Höhe von Eingabeelementen zu berücksichtigen
    adjustChatLayout() {
      const container = this.$refs.chatContainer;
      container.style.paddingBottom = this.$refs.inputArea.clientHeight + 'px';
    },
    // Fokussiert das Eingabefeld
    focusMessageInput() {
      this.$nextTick(() => {
        this.$refs.messageInput.focus();
      });
    },
    // Behandelt Tasteneingaben, z.B. Enter drücken
    handleKeyPress(event) {
      if (event.key === 'Enter' && !this.showAudioRecorder && !this.isSettingsOpen && !this.isSendDisabled) {
        this.sendMessage();
      }
    }
  },
  // Beim Mounten der Komponente durchgeführte Aktionen
  mounted() {
    const savedURL = loadWebhookURL();
    if (savedURL) {
      this.webhookURL = savedURL;
    }
    this.$nextTick(() => {
      this.scrollToBottom(); // Initialisiere Scrollposition
      this.adjustChatLayout(); // Initialisiere Layoutanpassungen
    });
    document.addEventListener('keypress', this.handleKeyPress);
  },
  // Bereinigung bei der Zerstörung der Komponente
  beforeDestroy() {
    document.removeEventListener('keypress', this.handleKeyPress);
  }
};
</script>

<style>
/* Stile für Warnmeldungen und allgemeines Design */
.alert {
  margin: 10px 0;
  padding: 10px;
  border-radius: 5px;
}

/* Farben für alert-Komponenten */
.alert-warning {
  background-color: #ffeb3b;
  color: #1a1a1a;
}

.alert-info {
  background-color: #cce5ff;
  color: #004085;
}

/* Hauptkontainer-Stile */
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background-color: #e0f7e9;
}

/* Stile für den Chatinhalt */
.chat-content {
  position: absolute;
  top: 0;
  bottom: 00px; /* Höhe der Eingabeleiste beachten */
  width: 100%;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column-reverse;
  scroll-behavior: smooth;
}

/* Stile für Chatblasen */
.chat-bubble {
  background-color: var(--chat-bubble-background);
  border-radius: var(--chat-bubble-border-radius);
  padding: var(--chat-bubble-padding);
  max-width: 90%;
  margin-top: var(--chat-bubble-margin);
  margin-bottom: 0; /* Entfernt den unteren Abstand */
  align-self: flex-start;
}

.message-timestamp {
  font-size: 0.8em;
  color: #6c757d;
}

.message-status {
  margin-bottom: 5px;
}

.audio-control {
  margin-top: 10px;
  display: flex;
  align-items: center;
}

/* Eingabebereich-Stile */
.input-area {
  position: absolute;
  bottom: 0;
  width: 100%;
  background-color: #ffffff;
  border-top: solid 1px rgba(0,0,0,.125);
  z-index: 1;
}

.settings-button {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
}

.category-button {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
}

/* Button-Transition bei Aktivierung */
button {
  transition: var(--btn-transition);
}

button:active {
  transform: scale(var(--btn-active-scale));
  opacity: var(--btn-active-opacity);
}

.btn-primary:disabled,
.btn-disabled {
  background-color: #ccc !important;
  cursor: not-allowed;
  opacity: 0.5 !important;
}
</style>