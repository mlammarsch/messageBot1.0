<template>
  <!-- Modal Dialog, der angezeigt wird, wenn isOpen true ist -->
  <div
    class="modal fade show"
    style="display: block"
    v-if="isOpen"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
    aria-labelledby="webhook-settings-title"
  >
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <!-- Modal Titel -->
          <h4 id="webhook-settings-title" class="modal-title">
            Webhook Settings
          </h4>
          <!-- Schließen-Button für das Modal -->
          <button
            type="button"
            class="btn-close"
            aria-label="Close"
            @click="$emit('close-settings')"
          ></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <!-- Label für das Webhook-URL-Eingabefeld -->
            <label for="webhookUrl" class="form-label">Webhook-Link</label>
            <!-- Eingabefeld für die Webhook-URL -->
            <input
              type="text"
              id="webhookUrl"
              v-model="url"
              placeholder="Enter Webhook URL"
              class="form-control mb-2 rounded-pill"
              aria-label="Webhook URL eingeben"
            />
            <!-- Fehlermeldung angezeigt, wenn die URL ungültig ist -->
            <div v-if="urlError" class="text-danger mb-2">{{ urlError }}</div>
            <!-- Button-Gruppe mit drei Schaltflächen -->
            <div class="button-group d-flex justify-content-between">
              <!-- Save-Button -->
              <button
                class="btn btn-success rounded-pill flex-grow-1 mx-1"
                @click="saveWebhook"
                aria-label="Webhook URL speichern"
              >
                Save
              </button>
              <!-- Cancel-Button -->
              <button
                class="btn btn-outline-secondary rounded-pill flex-grow-1 mx-1"
                @click="$emit('close-settings')"
                aria-label="Einstellungen abbrechen"
              >
                Cancel
              </button>
              <!-- Clear-Button -->
              <button
                class="btn btn-outline-danger rounded-pill flex-grow-1 mx-1"
                @click="confirmClearWebhook"
                aria-label="Webhook URL löschen"
              >
                Clear
              </button>
            </div>
          </div>
          <!-- Horizontaler Trenner zwischen den Abschnitten -->
          <hr class="my-4" />
          <div class="mt-4">
            <!-- Button zum Löschen des Chatverlaufs -->
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
  // props, die von der Elternkomponente übergeben werden
  props: ["isOpen", "currentUrl"],
  data() {
    return {
      url: this.currentUrl || "", // Eingabewert für die URL, initialisiert mit currentUrl
      urlError: "", // Fehlernachricht, falls die URL ungültig ist
    };
  },
  mounted() {
    // Setze die url mit currentUrl, wenn die Komponente gemountet wird
    this.url = this.currentUrl;
    // Ereignislistener hinzufügen, wenn das Modal geöffnet wird
    if (this.isOpen) {
      document.addEventListener("keypress", this.handleKeyPress);
    }
  },
  beforeDestroy() {
    // Entferne den Ereignislistener, wenn die Komponente zerstört wird
    document.removeEventListener("keypress", this.handleKeyPress);
  },
  methods: {
    // Methode zum Speichern der Webhook-URL
    saveWebhook() {
      // Überprüfe, ob die URL gültig ist
      if (!this.validURL(this.url)) {
        // Setze eine Fehlermeldung, falls die URL ungültig ist
        this.urlError = "Invalid URL. Please enter a valid Webhook URL.";
        return;
      }
      // Lösche die Fehlermeldung, wenn die URL gültig ist
      this.urlError = "";
      // Emitiere Event, um die neue URL an die Elternkomponente zu senden
      this.$emit("webhook-updated", this.url);
      // Schließe das Modal
      this.$emit("close-settings");
    },
    // Methode zum Bestätigen und Löschen der Webhook-URL
    confirmClearWebhook() {
      this.url = ""; // Leere die gespeicherte URL
      this.urlError = ""; // Lösche die Fehlermeldung
      this.$emit("webhook-cleared"); // Emitiere Event, dass die URL gelöscht wurde
    },
    // Validierungsmethode für die URL
    validURL(str) {
      // Regex zur Überprüfung der URL-Struktur
      const pattern = new RegExp(
        "^(https?:\\/\\/)?" +
          "((([a-z\\d]([-]*[a-z\\d])*)\\.)+[a-z]{2,}|" +
          "((\\d{1,3}\\.){3}\\d{1,3}))" +
          "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" +
          "(\\?[;&a-z\\d%_.~+=-]*)?" +
          "(\\#[-a-z\\d_]*)?$",
        "i"
      );
      return !!pattern.test(str);
    },
    // Methode zum Löschen von Chat-Nachrichten
    clearChatMessages() {
      this.$emit("clear-messages"); // Emitiere Event, um alle Nachrichten zu löschen
      this.$emit("close-settings"); // Schließe das Modal
    },
    // Ereignislistener für die Eingabetaste
    handleKeyPress(event) {
      if (event.key === "Enter") {
        this.saveWebhook(); // Speichere die URL, wenn die Eingabetaste gedrückt wird
      }
    },
  },
  watch: {
    // Überwache Änderungen an der currentUrl
    currentUrl(newVal) {
      this.url = newVal || ""; // Aktualisiere die url mit dem neuen Wert
    },
    // Überwache das Öffnen/Schließen des Modals
    isOpen(newVal) {
      if (newVal) {
        // Füge Listener hinzu, wenn das Modal geöffnet wird
        document.addEventListener("keypress", this.handleKeyPress);
      } else {
        // Entferne Listener, wenn das Modal geschlossen wird
        document.removeEventListener("keypress", this.handleKeyPress);
      }
    },
  },
};
</script>

<style scoped>
.button-group {
  margin-top: 1rem; /* Abstand oben zur Button-Gruppe */
}

.mt-4 {
  margin-top: 4rem; /* Großer Abstand oben zu bestimmten Elementen */
}
</style>
