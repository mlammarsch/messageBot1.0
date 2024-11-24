<template>
  <!-- Container für die Eingabe der Nachricht -->
  <div class="message-input-container">
    <!-- Eingabefeld für die Nachricht -->
    <input
      type="text"
      v-model="localMessage"
      @input="emitInput"
      placeholder="Type a message..."
      class="form-control" 
      aria-label="Type a message..."
    />
  </div>
</template>

<script>
export default {
  props: {
    modelValue: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      localMessage: this.modelValue, // Lokale Nachricht initialisieren mit dem Prop-Wert
    };
  },
  watch: {
    modelValue(newVal) {
      this.localMessage = newVal; // Aktualisiere das lokale Nachrichtenmodell bei Prop-Änderung
    },
  },
  methods: {
    /**
     * Emitiert das aktualisierte Nachrichtenmodell.
     */
    emitInput() {
      this.$emit("update:modelValue", this.localMessage);
    },
  },
};
</script>

<style scoped>
/* Der folgende Style ist entfernt, da Bootstrap form-control bereits notwendige Stile abdeckt */
</style>