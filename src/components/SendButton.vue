<template>
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
    handleSend() {
      if (this.isLoading) return;
      if (this.message.trim() === "" && !this.audio) {
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