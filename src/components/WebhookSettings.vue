<template>
  <div class="modal fade show" style="display: block;" v-if="isOpen" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="webhook-settings-title">
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h4 id="webhook-settings-title" class="modal-title">Webhook Settings</h4>
          <button type="button" class="btn-close" aria-label="Close" @click="$emit('close-settings')"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label for="webhookUrl" class="form-label">Webhook-Link</label>
            <input 
              type="text" 
              id="webhookUrl"
              v-model="url" 
              placeholder="Enter Webhook URL" 
              class="form-control mb-2 rounded-pill" 
              aria-label="Webhook URL eingeben"
            />
            <div v-if="urlError" class="text-danger mb-2">{{ urlError }}</div>
            <div class="button-group d-flex justify-content-between">
              <button 
                class="btn btn-success rounded-pill flex-grow-1 mx-1" 
                @click="saveWebhook" 
                aria-label="Webhook URL speichern"
              >
                Save
              </button>
              <button 
                class="btn btn-outline-secondary rounded-pill flex-grow-1 mx-1" 
                @click="$emit('close-settings')" 
                aria-label="Einstellungen abbrechen"
              >
                Cancel
              </button>
              <button 
                class="btn btn-outline-danger rounded-pill flex-grow-1 mx-1" 
                @click="confirmClearWebhook" 
                aria-label="Webhook URL löschen"
              >
                Clear
              </button>
            </div>
          </div>
          <hr class="my-4">
          <div class="mt-4">
            <button 
              class="btn btn-danger w-100 rounded-pill" 
              @click="clearChatMessages" 
              aria-label="Chatverlauf löschen"
            >
              Clear Chat Messages
            </button>
          </div>
        </div>
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
  mounted() {
    this.url = this.currentUrl;
    if (this.isOpen) {
      document.addEventListener('keypress', this.handleKeyPress);
    }
  },
  beforeDestroy() {
    document.removeEventListener('keypress', this.handleKeyPress);
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
    },
    handleKeyPress(event) {
      if (event.key === 'Enter') {
        this.saveWebhook();
      }
    }
  },
  watch: {
    currentUrl(newVal) {
      this.url = newVal || '';
    },
    isOpen(newVal) {
      if (newVal) {
        document.addEventListener('keypress', this.handleKeyPress);
      } else {
        document.removeEventListener('keypress', this.handleKeyPress);
      }
    }
  }
};
</script>

<style scoped>
.button-group {
  margin-top: 1rem;
}

.mt-4 {
  margin-top: 4rem;
}
</style>