<!-- components/ResponseDisplay.vue -->
<template>
    <!-- Anzeige der Serverantwort -->
    <transition name="fade">
      <div v-if="responseMessage" :class="responseClass" class="response-display">
        {{ responseMessage }}
      </div>
    </transition>
  </template>
  
  <script>
  export default {
    props: {
      responseMessage: {
        type: String,
        required: true
      }
    },
    watch: {
      responseMessage(newMessage) {
        if (newMessage) {
          // Automatisches Ausblenden der Meldung nach 5 Sekunden
          setTimeout(() => {
            this.$emit('clear-response');
          }, 5000);
        }
      }
    },
    computed: {
      /**
       * Bestimmt die CSS-Klasse basierend auf der Art der Nachricht (Erfolg oder Fehler).
       */
      responseClass() {
        if (this.responseMessage.startsWith("Success")) {
          return 'text-green-600';
        } else if (this.responseMessage.startsWith("Error")) {
          return 'text-red-600';
        }
        return '';
      }
    }
  };
  </script>
  
  <style scoped>
  .response-display {
    text-align: center;
    padding: 10px;
    font-size: 1.2em;
    transition: opacity 0.5s ease-in-out;
    margin-bottom: 10px;
    border-radius: 5px;
    width: 100%;
    max-width: 600px;
  }
  
  .text-green-600 {
    color: #28a745;
    background-color: #d4edda;
    border: 1px solid #c3e6cb;
  }
  
  .text-red-600 {
    color: #dc3545;
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
  }
  
  /* Fade Transition */
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.5s;
  }
  .fade-enter-from, .fade-leave-to {
    opacity: 0;
  }
  </style>