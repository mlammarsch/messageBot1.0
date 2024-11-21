<!-- components/MessageInput.vue -->
<template>
    <!-- Textnachrichteneingabe -->
    <input
      type="text"
      v-model="localMessage"
      @input="emitInput"
      placeholder="Type your message..."
      class="message-input"
      aria-label="Message Input"
    />
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
    border-radius: 5px;
    outline: none;
    transition: border-color 0.3s;
  }
  
  .message-input:focus {
    border-color: #007BFF;
  }
  </style>