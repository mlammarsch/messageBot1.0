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
      message: '',
      audio: null,
      messages: loadMessages() || [],
      webhookURL: loadWebhookURL() || '',
      responseMessage: '',
      isSending: false,
      isSettingsOpen: false,
      showAudioRecorder: false
    };
  },
  computed: {
    audioURL() {
      return this.audio ? URL.createObjectURL(this.audio) : '';
    },
    isSendDisabled() {
      return this.isSending || (!this.message.trim() && !this.audio) || !this.webhookURL;
    }
  },
  methods: {
    async sendMessage() {
      if (!this.webhookURL) {
        this.responseMessage = "Error: No Webhook URL set.";
        return;
      }
      if (this.isSending || (!this.message.trim() && !this.audio)) return;

      this.isSending = true;
      const timestamp = new Date().toISOString();
      const os = this.getOS();
      const browser = this.getBrowser();

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
          this.adjustChatLayout();
        });
      }
    },
    storeMessage(success) {
      const newMessage = {
        timestamp: new Date(),
        success: success,
        text: this.message.trim() || 'n/a',
        hasAudio: Boolean(this.audio)
      };
      this.messages.unshift(newMessage);
    },
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
    getBrowser() {
      const userAgent = window.navigator.userAgent;
      if (/Firefox\//.test(userAgent)) return 'Firefox';
      if (/Chrome\//.test(userAgent) && /Edg\//.test(userAgent)) return 'Edge';
      if (/Chrome\//.test(userAgent)) return 'Chrome';
      if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) return 'Safari';
      return 'Unknown Browser';
    },
    clearInputs() {
      this.message = '';
      this.audio = null;
    },
    openSettings() {
      this.isSettingsOpen = true;
    },
    closeSettings() {
      this.isSettingsOpen = false;
    },
    updateWebhookURL(newURL) {
      this.webhookURL = newURL;
      saveWebhookURL(newURL);
      this.responseMessage = "Webhook URL erfolgreich aktualisiert!";
      setTimeout(() => {
        this.responseMessage = '';
      }, 4000);
    },
    clearWebhookURL() {
      this.webhookURL = '';
      saveWebhookURL('');
      this.responseMessage = "Webhook URL gelöscht!";
      setTimeout(() => {
        this.responseMessage = '';
      }, 4000);
    },
    setAudio(audioBlob) {
      this.audio = audioBlob;
      this.showAudioRecorder = false;
    },
    deleteAudio() {
      this.audio = null;
      this.focusMessageInput();
    },
    setError(error) {
      this.responseMessage = error;
    },
    startRecording() {
      this.showAudioRecorder = true;
    },
    clearMessages() {
      this.messages = [];
      saveMessages(this.messages);
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.chatContainer;
        container.scrollTop = container.scrollHeight;
      });
    },
    adjustChatLayout() {
      const container = this.$refs.chatContainer;
      container.style.paddingBottom = this.$refs.inputArea.clientHeight + 'px';
    },
    focusMessageInput() {
      this.$nextTick(() => {
        this.$refs.messageInput.focus();
      });
    },
    handleKeyPress(event) {
      if (event.key === 'Enter' && !this.showAudioRecorder && !this.isSettingsOpen && !this.isSendDisabled) {
        this.sendMessage();
      }
    }
  },
  mounted() {
    const savedURL = loadWebhookURL();
    if (savedURL) {
      this.webhookURL = savedURL;
    }
    this.$nextTick(() => {
      this.scrollToBottom();
      this.adjustChatLayout();
    });
    document.addEventListener('keypress', this.handleKeyPress);
  },
  beforeDestroy() {
    document.removeEventListener('keypress', this.handleKeyPress);
  }
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

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background-color: #e0f7e9;
}

.chat-content {
  position: absolute;
  top: 0;
  bottom: 60px; /* Höhe der Eingabeleiste beachten */
  width: 100%;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column-reverse;
  scroll-behavior: smooth;
}

.chat-bubble {
  background-color: var(--chat-bubble-background);
  border-radius: var(--chat-bubble-border-radius);
  padding: var(--chat-bubble-padding);
  max-width: 80%;
  margin: var(--chat-bubble-margin) auto;
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