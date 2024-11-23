<!-- components/SendButton.vue -->
<template>
  <!-- Senden-Button -->
  <button
    @click="handleSend"
    class="send-button"
    :disabled="isLoading"
    aria-label="Send Message"
  >
    <span v-if="isLoading" class="loader" aria-label="Sending..."></span>
    <img v-else src="../assets/send-icon.png" alt="Send" class="icon" />
  </button>
</template>

<script>
export default {
  props: {
    message: {
      type: String,
      default: "",
    },
    audio: {
      type: Object,
      default: null,
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    /**
     * Emitiert das Send-Event mit den aktuellen Nachrichten- und Audio-Daten.
     */
    handleSend() {
      if (this.isLoading) return; // Verhindert das Senden während des laufenden Sendevorgangs

      if (this.message.trim() === "" && !this.audio) {
        // Keine Daten zum Senden
        this.$emit("send", {});
      } else {
        this.$emit("send", {
          message: this.message,
          audio: this.audio,
        });
      }
    },
  },
};
</script>

<style scoped>
.send-button {
  padding: 15px;
  border: none;
  background-color: #28a745;
  border-radius: 50%; /* Button bleibt rund */
  cursor: pointer;
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.send-button:disabled {
  background-color: #94d3a2;
  cursor: not-allowed;
}

.icon {
  width: 24px;
  height: 24px;
}

.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #fff;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 2s linear infinite;
  margin: auto;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
