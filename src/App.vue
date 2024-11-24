<template>
  <!-- Hauptcontainer der Applikation -->
  <div class="app-container">
    <!-- **Chat-Bereich** für Nachrichten -->
    <div class="chat-content" ref="chatContainer" role="log" aria-live="polite">
      <!-- Wiederholt Nachrichten in `messages` Array -->
      <div
        v-for="message in messages"
        :key="message.timestamp"
        class="chat-bubble p-3 mb-3 border"
        role="article"
        aria-labelledby="message-timestamp"
      >
        <!-- Zeigt den Zeitstempel der Nachricht an -->
        <div
          class="message-timestamp mb-1"
          id="message-timestamp"
          style="font-size: 0.85rem; color: #666"
        >
          <strong>{{ formatTimestamp(message.timestamp) }}</strong>
        </div>
        <!-- Status der Nachricht, abhängig davon ob erfolgreich gesendet -->
        <div class="message-status mb-2" style="font-size: 0.9rem">
          <span
            :class="{
              'text-success': message.success,
              'text-danger': !message.success,
            }"
          >
            {{
              message.success
                ? "Versand erfolgreich"
                : "Versand fehlgeschlagen!"
            }}
          </span>
        </div>
        <!-- Detailinformationen der Nachricht -->
        <div>
          <div class="mb-1" style="color: #777">
            <!-- Beschriftung und Inhalt der Nachricht -->
            <em>Text:</em>&nbsp;&nbsp;<span style="color: #000">{{
              message.text
            }}</span
            ><br />
            <em>Kategorie:</em>&nbsp;&nbsp;<span style="color: #000">{{
              message.category || "Keine Kategorie"
            }}</span>
          </div>
          <!-- Anzeige von Anhang-Symbolen bei vorhandenem Audio -->
          <div
            v-if="message.hasAudio"
            class="d-flex justify-content-end"
            style="margin-top: 0.5rem"
          >
            <i class="bi bi-paperclip ml-2" aria-hidden="true"></i>
            <i class="bi bi-soundwave ml-2" aria-hidden="true"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Warnung, wenn Webhook-URL fehlt -->
    <div v-if="!webhookURL" class="alert alert-warning" role="alert">
      Webhook URL is not set. Please configure it in settings.
    </div>

    <!-- **Feedbackmeldung** nach Nachrichtentransaktionen -->
    <div v-if="responseMessage" class="alert alert-info" role="alert">
      {{ responseMessage }}
    </div>

    <!-- Eingabefläche für Nachrichten -->
    <div class="input-area p-2" ref="inputArea">
      <div class="d-flex align-items-center mb-2">
        <!-- Eingabefeld für Nachrichtentext -->
        <input
          ref="messageInput"
          type="text"
          v-model="message"
          placeholder="Type a message"
          class="form-control mx-1 rounded-pill flex-grow-1"
          aria-label="Nachricht eingeben"
        />

        <!-- Icon zum Start der Audioaufnahme -->
        <i
          class="bi bi-mic-fill mx-2 text-muted"
          @click="startRecording"
          aria-label="Record Audio"
          role="img"
          style="cursor: pointer"
        ></i>

        <!-- Button zum Senden der Nachricht -->
        <button
          @click="sendMessage"
          class="button-send mx-1"
          :class="{ 'button-disabled': isSendDisabled }"
          aria-label="Send Message"
          role="button"
          :disabled="isSendDisabled"
        >
          <i class="bi bi-send" aria-hidden="true"></i>
        </button>
      </div>

      <!-- Audiosteuerung zur Wiedergabe -->
      <div v-if="audio" class="audio-control d-flex align-items-center mb-2">
        <audio
          :src="audioURL"
          controls
          class="flex-grow-1 me-2"
          aria-label="Audio abspielen"
        ></audio>
        <button
          class="button-delete-audio"
          @click="deleteAudio"
          aria-label="Delete Audio"
          role="button"
        >
          <i class="bi bi-trash" aria-hidden="true"></i>
        </button>
      </div>
    </div>

    <!-- Modal zum Aufnehmen von Audio -->
    <AudioRecorderModal
      v-if="showAudioRecorder"
      @audio-ready="setAudio"
      @error="setError"
      @close-recorder="showAudioRecorder = false"
      @focus-input="focusMessageInput"
    />

    <!-- Modal zur Auswahl der Kategorie -->
    <CategorySelect
      v-if="showCategorySelect"
      :isVisible="showCategorySelect"
      @update:isVisible="showCategorySelect = $event"
      @category-selected="confirmSendMessage"
    />

    <!-- Einstellungsbutton -->
    <div class="container position-relative text-center">
      <i
        @click="openSettings"
        class="bi bi-gear position-absolute"
        aria-label="Open Settings"
        role="button"
        style="
          top: 10px;
          right: 10px;
          font-size: 24px;
          cursor: pointer;
          color: grey;
        "
      ></i>

      <!-- Button zum Öffnen des Kategoriemodal -->
      <i
        @click="openCategoryModal"
        class="bi bi-tags position-absolute"
        aria-label="Open Category Dialog"
        role="button"
        style="
          top: 70px;
          right: 10px;
          font-size: 24px;
          cursor: pointer;
          color: grey;
        "
      ></i>
    </div>

    <!-- Komponente zur Konfiguration der Webhook-URL -->
    <WebhookSettings
      :isOpen="isSettingsOpen"
      :currentUrl="webhookURL"
      @webhook-updated="updateWebhookURL"
      @webhook-cleared="clearWebhookURL"
      @clear-messages="clearMessages"
      @close-settings="closeSettings"
    />

    <!-- Modal zur Auswahl der Kategorie -->
    <CategoryModal
      v-if="showCategoryModal"
      @close-modal="closeCategoryModal"
      @focus-chat-input="focusMessageInput"
    />
  </div>
</template>

<script>
import AudioRecorderModal from "./components/AudioRecorderModal.vue"; // Import des AudioRecorder Modals
import WebhookSettings from "./components/WebhookSettings.vue"; // Import der Webhook Einstellungen
import CategoryModal from "./components/CategoryModal.vue"; // Import des Kategoriemodals
import CategorySelect from "./components/CategorySelect.vue"; // Import der Kategori Auswahl
import { sendToWebhook } from "./services/api"; // API-Service zum Senden von Daten
import {
  loadWebhookURL,
  saveWebhookURL,
  saveMessages,
  loadMessages,
} from "./services/storage.js"; // Speicherverwaltungsfunktionen
import { loadCategories } from "./services/storage.js"; // Funktion zum Laden der Kategorien

export default {
  components: {
    AudioRecorderModal, // Registrierung des AudioRecorder Modals
    WebhookSettings, // Registrierung der Webhook Einstellungen
    CategoryModal, // Registrierung des Kategoriemodals
    CategorySelect, // Registrierung der Kategori Auswahl
  },
  data() {
    return {
      message: "", // Aktuelle Nachricht des Benutzers
      audio: null, // Aktuelle Audioaufnahme
      messages: loadMessages() || [], // Geladene Nachrichten oder leeres Array
      webhookURL: loadWebhookURL() || "", // Geladene Webhook-URL
      responseMessage: "", // Nachricht zur Rückmeldung nach Aktionen
      isSending: false, // Status, ob Nachricht gesendet wird
      isSettingsOpen: false, // Status, ob Einstellungen offen sind
      showAudioRecorder: false, // Status für das AudioRecorder Modal
      showCategoryModal: false, // Status für das Kategoriemodal
      showCategorySelect: false, // Status für die Kategori Auswahl
    };
  },
  computed: {
    // Generiere URL für die Audioaufnahme
    audioURL() {
      return this.audio ? URL.createObjectURL(this.audio) : "";
    },
    // Bestimmt, ob der Senden-Button deaktiviert ist
    isSendDisabled() {
      return (
        this.isSending || // Senden ist aktiv
        (!this.message.trim() && !this.audio) || // Keine Nachricht und kein Audio
        !this.webhookURL // Webhook-URL ist nicht gesetzt
      );
    },
  },
  methods: {
    // Hauptmethode zum Senden der Nachricht
    async sendMessage() {
      const categories = loadCategories(); // Lade vorhandene Kategorien
      // Wenn Kategorien vorhanden sind, öffne die Auswahl
      if (categories.length > 0) {
        this.showCategorySelect = true;
        return;
      } else {
        // ansonsten sende die Nachricht direkt
        this.confirmSendMessage();
      }
    },
    // Bestätigt das Senden der Nachricht mit Kategorie
    confirmSendMessage(category) {
      this.isSending = true; // Setzte den Status auf "sendend"
      const data = {
        text: this.message.trim() || "n/a", // Text der Nachricht
        audio: this.audio, // Audio-Datei (falls vorhanden)
        category: category || "Uncategorized", // Kategorie, Standardwert ist "Uncategorized"
        timestamp: new Date().toLocaleString("de-DE", {
          // Aktueller Zeitstempel
          timeZone: "Europe/Berlin",
          hour12: false,
        }),
        os: this.getOS(), // Betriebssystem des Benutzers
        browser: this.getBrowser(), // Browser des Benutzers
        audioAttached: !!this.audio, // Ob Audio angehängt ist
        imageAttached: false, // Momentan keine Bildanhänge
      };

      // Senden der Daten an den Webhook
      sendToWebhook(this.webhookURL, data)
        .then((response) => {
          if (response.status === 200) {
            // Nachricht erfolgreich gesendet
            this.storeMessage(true, category);
            this.clearInputs(); // Eingabefelder zurücksetzen
            this.scrollToBottom(); // Zum Ende des Chats scrollen
          } else {
            // Fehlerhafte Antwort vom Server
            this.responseMessage = `Error: Server antwortete mit Status ${response.status}.`;
          }
        })
        .catch(() => {
          // Fehler beim Senden
          this.storeMessage(false, category);
          this.responseMessage =
            "Error: Nachricht konnte nicht gesendet werden.";
        })
        .finally(() => {
          this.isSending = false; // Setze den Sende-Status zurück
          saveMessages(this.messages); // Speichere Nachrichten
          this.$nextTick(() => {
            this.focusMessageInput(); // Fokussiere Eingabefeld
            this.adjustChatLayout(); // Passe das Layout an
          });
        });
    },
    // Speichert eine neue Nachricht im Nachrichten-Array
    storeMessage(success, category) {
      const newMessage = {
        timestamp: new Date(), // Aktueller Zeitstempel
        success: success, // Erfolg oder Fehlerstatus
        text: this.message.trim() || "n/a", // Text der Nachricht
        hasAudio: Boolean(this.audio), // Flag, ob Audio vorhanden ist
        category: category, // Kategorie der Nachricht
      };
      this.messages.unshift(newMessage); // Füge die Nachricht oben ein
    },
    // Formatiert den Zeitstempel für die Anzeige
    formatTimestamp(timestamp) {
      if (!timestamp) return ""; // Gebe leer zurück, wenn kein Zeitstempel vorhanden
      const options = {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Europe/Berlin", // Zeitzone
      };
      return new Intl.DateTimeFormat("de-DE", options).format(
        new Date(timestamp) // Formatiere den Zeitstempel
      );
    },
    // Bestimmt das Betriebssystem des Benutzers
    getOS() {
      const userAgent = window.navigator.userAgent;
      if (/Windows NT 10.0/.test(userAgent)) return "Windows 10";
      if (/Windows NT 11.0/.test(userAgent)) return "Windows 11";
      if (/Mac OS X/.test(userAgent)) return "macOS";
      if (/Linux/.test(userAgent)) return "Linux";
      if (/iPhone|iPad|iPod/.test(userAgent)) return "iOS";
      if (/Android/.test(userAgent)) return "Android";
      return "Unknown OS"; // Unbekanntes OS
    },
    // Bestimmt den Browser des Benutzers
    getBrowser() {
      const userAgent = window.navigator.userAgent;
      if (/Firefox\//.test(userAgent)) return "Firefox";
      if (/Chrome\//.test(userAgent) && /Edg\//.test(userAgent)) return "Edge";
      if (/Chrome\//.test(userAgent)) return "Chrome";
      if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent))
        return "Safari";
      return "Unknown Browser"; // Unbekannter Browser
    },
    // Setzt die Eingabefelder zurück
    clearInputs() {
      this.message = ""; // Leert das Nachrichteneingabefeld
      this.audio = null; // Entfernt das Audio
    },
    // Öffnet die Einstellungen
    openSettings() {
      this.isSettingsOpen = true; // Setzt den Status auf "offen"
    },
    // Schließt die Einstellungen
    closeSettings() {
      this.isSettingsOpen = false; // Setzt den Status auf "geschlossen"
    },
    // Öffnet das Kategoriemodal
    openCategoryModal() {
      this.showCategoryModal = true; // Setzt den Status für das Modal auf "offen"
    },
    // Schließt das Kategoriemodal
    closeCategoryModal() {
      this.showCategoryModal = false; // Setzt den Status auf "geschlossen"
      this.focusMessageInput(); // Fokussiert das Eingabefeld
    },
    // Aktualisiert die Webhook-URL
    updateWebhookURL(newURL) {
      this.webhookURL = newURL; // Setzt die neue URL
      saveWebhookURL(newURL); // Speichert die URL
      this.responseMessage = "Webhook URL erfolgreich aktualisiert!"; // Rückmeldung
      setTimeout(() => {
        this.responseMessage = ""; // Löscht die Rückmeldung nach 4 Sekunden
      }, 4000);
    },
    // Löscht die Webhook-URL
    clearWebhookURL() {
      this.webhookURL = ""; // Setzt die URL auf leer
      saveWebhookURL(""); // Leert die gespeicherte URL
      this.responseMessage = "Webhook URL gelöscht!"; // Rückmeldung
      setTimeout(() => {
        this.responseMessage = ""; // Löscht die Rückmeldung nach 4 Sekunden
      }, 4000);
    },
    // Setzt die Audioaufnahme
    setAudio(audioBlob) {
      this.audio = audioBlob; // Setzt die Audio-Blob
      this.showAudioRecorder = false; // Schließt das Aufnahme-Modal
    },
    // Löscht die Audioaufnahme
    deleteAudio() {
      this.audio = null; // Setzt das Audio zurück
      this.focusMessageInput(); // Fokussiert das Eingabefeld
    },
    // Setzt die Fehlernachricht
    setError(error) {
      this.responseMessage = error; // Speichert die Fehlernachricht
    },
    // Startet die Audioaufnahme
    startRecording() {
      this.showAudioRecorder = true; // Öffnet das AudioRecorder Modal
    },
    // Löscht alle Nachrichten
    clearMessages() {
      this.messages = []; // Setzt die Nachrichtenliste zurück
      saveMessages(this.messages); // Speichert das leere Array
    },
    // Scrollt zum Ende des Chatbereichs
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.chatContainer; // Referenz auf den Chat-Container
        container.scrollTop = container.scrollHeight; // Scrollt nach unten
      });
    },
    // Passt das Layout des Chats an
    adjustChatLayout() {
      const container = this.$refs.chatContainer; // Referenz auf den Chat-Container
      container.style.paddingBottom = this.$refs.inputArea.clientHeight + "px"; // Setzt Padding
    },
    // Fokussiert das Eingabefeld
    focusMessageInput() {
      this.$nextTick(() => {
        this.$refs.messageInput.focus(); // Fokussiert das Nachrichteneingabefeld
      });
    },
    // Behandelt die Tasteneingabe für das Senden der Nachricht
    handleKeyPress(event) {
      if (
        event.key === "Enter" && // Wenn die Enter-Taste gedrückt wird
        !this.showAudioRecorder && // wenn kein Audio-Rekorder offen ist
        !this.isSettingsOpen && // und keine Einstellungen offen sind
        !this.isSendDisabled // und die Sendefunktion nicht deaktiviert ist
      ) {
        this.sendMessage(); // Sende die Nachricht
      }
    },
  },
  mounted() {
    const savedURL = loadWebhookURL(); // Lade die gespeicherte URL
    if (savedURL) {
      this.webhookURL = savedURL; // Setze die Webhook-URL
    }
    this.$nextTick(() => {
      this.scrollToBottom(); // Scrolle zum Ende
      this.adjustChatLayout(); // Passe das Layout an
    });
    document.addEventListener("keypress", this.handleKeyPress); // Füge Eventlistener für Tasteneingabe hinzu
  },
  beforeDestroy() {
    document.removeEventListener("keypress", this.handleKeyPress); // Entferne den Eventlistener
  },
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
  background-color: #eee7ee; /* Hintergrund der App-Oberfläche bleibt weiß */
}

/* Stile für den Chatinhalt */
.chat-content {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100%;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column-reverse;
  scroll-behavior: smooth;
}

/* Stile für Chatblasen */
.chat-bubble {
  background-color: #ddcfde; /* Korrekte Chat Bubble Hintergrundfarbe */
  border-radius: 20px;
  padding: 10px 15px;
  max-width: 80%;
  margin: 10px 0;
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
  background-color: #eee7ee;
  border-top: solid 1px rgba(0, 0, 0, 0.125);
  z-index: 1;
}

.input-area .form-control {
  border-radius: 50px;
  outline: none; /* Entferne Standard-Outline */
  transition: outline-color 0.3s, border-color 0.3s; /* Glatter Übergang */
}

/* Fokuszustand für das Nachrichteneingabefeld */
.input-area .form-control:focus {
  outline-color: var(--focus-color);
  border-color: var(--focus-color);
  box-shadow: 0 0 0 0.2rem rgba(86, 19, 90, 0.25);
}

/* Send-Button-Stile */
.button-send {
  padding: 10px 20px; /* Pill shape */
  border-radius: 50px; /* Pill shape */
  background-color: var(--send-button-active);
  border: none;
  cursor: pointer;
  transition: background-color 0.25s;
}

.button-send:disabled {
  background-color: var(--send-button-inactive);
  cursor: not-allowed;
}

/* Button-Transition bei Aktivierung */
button {
  transition: var(--btn-transition);
  border: none; /* Entfernt den Rahmen von Buttons */
}

button:active {
  transform: scale(var(--btn-active-scale));
  opacity: var(--btn-active-opacity);
}

.button-delete-audio {
  color: #dc3545;
  background: transparent;
  border: 1px solid #dc3545;
  border-radius: 20px;
  padding: 0.6em 1.2em;
  margin: 5px;
  font-size: 1em;
  cursor: pointer;
  transition: background-color 0.25s;
}

.button-delete-audio:hover {
  background-color: #f8d7da;
}

.input-area:focus-within .form-control {
  outline-color: var(--focus-color);
}
</style>