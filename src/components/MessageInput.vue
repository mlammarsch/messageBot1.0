<template>
  <!-- Container für die Eingabe der Nachricht -->
  <div class="message-input-container">
    <!-- Eingabefeld für die Nachricht -->
    <input
      type="text"
      v-model="localMessage"
      <!--
      Bindet
      das
      lokale
      Nachrichtenmodell
      --
    />
    @input="emitInput"
    <!-- Ruft die Methode `emitInput` bei jeder Eingabe auf -->
    placeholder="Type a message..." class="form-control message-input
    rounded-circle"
    <!-- Stile für das Eingabefeld -->
    aria-label="Type a message..."
    <!-- Zugänglichkeit: Beschreibung für Screenreader -->
    />
  </div>
</template>

<script>
export default {
  props: {
    modelValue: {
      // Prop zur Bindung des Nachrichtenwerts
      type: String, // Datentyp des Props
      default: "", // Standardwert
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
      this.$emit("update:modelValue", this.localMessage); // Emitte das lokale Nachrichtenmodell zurück an den Parent
    },
  },
};
</script>

<style scoped>
.message-input {
  flex: 1; /* Nimmt den verfügbaren Platz ein */
  padding: 10px; /* Innenabstand */
  border: 1px solid #ccc; /* Rahmenfarbe */
  border-radius: 50px; /* Abgerundete Ecken */
  outline: none; /* Entfernt den Standardrahmen bei Fokussierung */
  transition: border-color 0.3s; /* Sanfte Übergangsanimation für die Rahmenfarbe */
}

.message-input:focus {
  border-color: #007bff; /* Farbe des Rahmens bei Fokussierung */
}

.message-input::placeholder {
  color: #ccc; /* Farbe des Platzhaltertextes */
}
</style>
