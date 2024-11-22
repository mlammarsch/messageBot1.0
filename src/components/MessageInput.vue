<template>
  <div class="message-input-container">
    <input
      type="text"
      v-model="localMessage"
      @input="emitInput"
      placeholder="Type a message..."
      class="form-control message-input rounded-circle"
      aria-label="Type a message..."
    />
  </div>
</template>

<script>
export default {
  props: {
    modelValue: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      localMessage: this.modelValue
    };
  },
  watch: {
    modelValue(newVal) {
      this.localMessage = newVal;
    }
  },
  methods: {
    /**
     * Emitiert das aktualisierte Nachrichtenmodell.
     */
    emitInput() {
      this.$emit('update:modelValue', this.localMessage);
    }
  }
};
</script>

<style scoped>
.message-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 50px; /* Abgerundete Ecken hinzugefügt */
  outline: none;
  transition: border-color 0.3s;
}

.message-input:focus {
  border-color: #007BFF;
}

.message-input::placeholder {
  color: #ccc;
}
</style>