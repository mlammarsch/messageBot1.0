<template>
  <div class="modal-overlay" v-if="isOpen" role="dialog" aria-modal="true" aria-labelledby="webhook-settings-title">
    <div class="modal-content">
      <h4 id="webhook-settings-title">Webhook Settings</h4>
      <input 
        type="text" 
        v-model="url" 
        placeholder="Enter Webhook URL" 
        class="form-control mb-2" 
        aria-label="Webhook URL eingeben"
        @keyup.enter="saveWebhook"
      />
      <div v-if="urlError" class="text-danger mb-2">{{ urlError }}</div>
      <div class="button-group">
        <button 
          class="btn btn-success" 
          @click="saveWebhook" 
          aria-label="Webhook URL speichern"
          role="button"
        >
          Save
        </button>
        <button 
          class="btn btn-secondary" 
          @click="$emit('close-settings')" 
          aria-label="Einstellungen abbrechen"
          role="button"
        >
          Cancel
        </button>
        <button 
          class="btn btn-danger" 
          @click="confirmClearWebhook" 
          aria-label="Webhook URL löschen"
          role="button"
        >
          Clear
        </button>
      </div>
      <div class="mt-3">
        <button 
          class="btn btn-danger" 
          @click="clearChatMessages" 
          aria-label="Chatverlauf löschen"
          role="button"
        >
          Clear Chat Messages
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['isOpen', 'currentUrl'],
  data() {
    return {
      url: this.currentUrl || '',
      urlError: ''
    };
  },
  methods: {
    saveWebhook() {
      if (!this.validURL(this.url)) {
        this.urlError = "Invalid URL. Please enter a valid Webhook URL.";
        return;
      }
      this.urlError = '';
      this.$emit('webhook-updated', this.url);
      this.$emit('close-settings');
    },
    confirmClearWebhook() {
      this.url = '';
      this.urlError = '';
      this.$emit('webhook-cleared');
    },
    validURL(str) {
      const pattern = new RegExp('^(https?:\\/\\/)?'+ 
        '((([a-z\\d]([-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ 
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ 
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ 
        '(\\?[;&a-z\\d%_.~+=-]*)?'+ 
        '(\\#[-a-z\\d_]*)?$','i');
      return !!pattern.test(str);
    },
    clearChatMessages() {
      this.$emit('clear-messages');
      this.$emit('close-settings');
    }
  },
  watch: {
    currentUrl(newVal) {
      this.url = newVal || '';
    }
  },
  mounted() {
    this.url = this.currentUrl;
  }
};
</script>

<style scoped>
/* Overlay für das Modal zur Verwaltung der Position und Hintergrundtransparenz */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--modal-background); /* Verwenden der CSS-Variable für Hintergrund */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

/* Inhalt des Modals mit Styling */
.modal-content {
  background-color: var(--modal-content-background); /* Verwenden der CSS-Variable für Hintergrund */
  padding: 20px;
  border-radius: 10px; /* Abgerundete Ecken */
  box-shadow: var(--modal-shadow); /* Verwenden der CSS-Variable für Schatten */
  width: 90%;
  max-width: 400px; /* Maximale Breite des Modals */
}

/* Abstand zwischen Titel und Eingabefeld */
h4 {
  margin-bottom: 10px;
}

/* Styling für alle Buttons innerhalb der Komponente */
button {
  margin: 5px 0; /* Vertikaler Abstand zwischen Buttons */
  transition: var(--btn-transition); /* Verwenden der CSS-Variable für Transition */
}

button:active {
  transform: scale(var(--btn-active-scale)); /* Verwenden der CSS-Variable für Scale */
  opacity: var(--btn-active-opacity); /* Verwenden der CSS-Variable für Opazität */
}

/* Gruppe von Buttons nebeneinander */
.button-group {
  display: flex;
  justify-content: space-between;
}

/* Zusätzlicher Abstand für den Bereich unter den Buttons */
.mt-3 {
  margin-top: 1rem;
}
</style>