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
        style="
          max-width: 90%;
          background-color: rgba(241, 241, 241, 0.40);
          border-radius: 2rem;
          position: relative;
        "
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
    <div class="input-area p-2 border-top bg-light" ref="inputArea">
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
          class="btn btn-primary btn-send rounded-pill mx-1"
          :class="{ 'btn-disabled': isSendDisabled }"
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
          class="btn btn-outline-danger btn-delete"
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
  margin: 10px 0; /* Abstand oben und unten */
  padding: 10px; /* Innenabstand */
  border-radius: 5px; /* Abgerundete Ecken */
}

/* Farben für alert-Komponenten */
.alert-warning {
  background-color: #ffeb3b; /* Hintergrundfarbe für Warnmeldungen */
  color: #1a1a1a; /* Textfarbe */
}

.alert-info {
  background-color: #cce5ff; /* Hintergrundfarbe für Informationsmeldungen */
  color: #004085; /* Textfarbe */
}

/* Hauptkontainer-Stile */
.app-container {
  display: flex; /* Flexbox-Layout */
  flex-direction: column; /* Spaltenanordnung */
  height: 100vh; /* Höhe: 100% des Viewports */
  overflow: hidden; /* Verhindert Überlauf */
  position: relative; /* Relativen Positionierungskontext */
  background-color: #e0f7e9; /* Hintergrundfarbe */
}

/* Stile für den Chatinhalt */
.chat-content {
  position: absolute; /* Absolute Positionierung */
  top: 0; /* Obere Kante */
  bottom: 0; /* Untere Kante beachten */
  width: 100%; /* Volle Breite */
  overflow-y: auto; /* Vertikaler Überlauf wird scrollbar */
  padding: 10px; /* Innenabstand */
  display: flex; /* Flexbox für den Chatinhalt */
  flex-direction: column-reverse; /* Neue Nachrichten werden unten angezeigt */
  scroll-behavior: smooth; /* Sanfte Scrollbewegung */
}

/* Stile für Chatblasen */
.chat-bubble {
  background-color: var(
    --chat-bubble-background
  ); /* Hintergrundfarbe für Chatblasen */
  border-radius: var(--chat-bubble-border-radius); /* Abgerundete Ecken */
  padding: var(--chat-bubble-padding); /* Innenabstand */
  max-width: 90%; /* Maximale Breite */
  margin-top: var(--chat-bubble-margin); /* Abstand nach oben */
  margin-bottom: 0; /* Entfernt den unteren Abstand */
  align-self: flex-start; /* Ausrichtung nach links */
}

.message-timestamp {
  font-size: 0.8em; /* Schriftgröße für Zeitstempel */
  color: #6c757d; /* Grau für Zeitstempel */
}

.message-status {
  margin-bottom: 5px; /* Abstand unten */
}

.audio-control {
  margin-top: 10px; /* Abstand oben für Audiosteuerung */
  display: flex; /* Flexbox für Audiosteuerung */
  align-items: center; /* Zentrieren der Inhalte */
}

/* Eingabebereich-Stile */
.input-area {
  position: absolute; /* Absolute Positionierung */
  bottom: 0; /* Unten ausrichten */
  width: 100%; /* Volle Breite */
  background-color: #ffffff; /* Hintergrundfarbe */
  border-top: solid 1px rgba(0, 0, 0, 0.125); /* Obere Border */
  z-index: 1; /* Z-Index für Überlagerungen */
}

.settings-button {
  position: absolute; /* Absolute Positionierung */
  top: 10px; /* Abstand oben */
  right: 10px; /* Abstand rechts */
  z-index: 2; /* Z-Index für Überlagerungen */
}

.category-button {
  position: absolute; /* Absolute Positionierung */
  top: 10px; /* Abstand oben */
  left: 10px; /* Abstand links */
  z-index: 2; /* Z-Index für Überlagerungen */
}

/* Button-Transition bei Aktivierung */
button {
  transition: var(--btn-transition); /* Übergangsanimation */
}

button:active {
  transform: scale(var(--btn-active-scale)); /* Verkleinern bei Aktivierung */
  opacity: var(--btn-active-opacity); /* Opazität bei Aktivierung */
}

.btn-primary:disabled,
.btn-disabled {
  background-color: #ccc !important; /* Deaktivierte Hintergrundfarbe */
  cursor: not-allowed; /* Zeigt, dass der Button nicht klickbar ist */
  opacity: 0.5 !important; /* Reduziert die Opazität */
}
</style>
