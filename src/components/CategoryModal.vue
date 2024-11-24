<template>
  <!-- Modal für die Kategorieverwaltung -->
  <div class="modal fade show" style="display: block;" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
    <div class="modal-dialog modal-fullscreen-xxl-down" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h4 id="category-modal-title" class="modal-title">Categories</h4>
          <button type="button" class="btn-close" aria-label="Close" @click="closeModal"></button>
        </div>
        <div class="modal-body d-flex flex-column">
          <div class="mb-3">
            <!-- Eingabefeld für neue Kategorie -->
            <input 
              type="text" 
              v-model="newCategory" 
              placeholder="Enter new category" 
              class="form-control mb-2 rounded-pill" 
              ref="categoryInput"
              @keyup.enter="handleEnter"
            />
            <!-- Speichern neu hinzugefügter Kategorie -->
            <button class="btn btn-success rounded-pill w-100" @click="addCategory">Save</button>
            <div v-if="errorMessage" class="alert alert-warning mt-2" role="alert">
              {{ errorMessage }}
            </div>
          </div>
          <ul class="list-group overflow-auto flex-grow-1" ref="categoryList">
            <!-- Auflistung vorhandener Kategorien -->
            <li 
              v-for="category in sortedCategories" 
              :key="category" 
              :class="{'highlight': category === lastAddedCategory}"
              class="list-group-item d-flex justify-content-between align-items-center"
            >
              {{ category }}
              <button class="btn btn-outline-danger btn-sm rounded-pill" @click="confirmDeleteCategory(category)">Delete</button>
            </li>
          </ul>
        </div>
      </div>
    </div>
    
    <!-- Bestätigungsdialog für das Löschen einer Kategorie -->
    <div v-if="deleteDialogVisible" class="modal show" style="display: block;" tabindex="-1" role="dialog" aria-labelledby="delete-confirmation-title" aria-modal="true">
      <div class="modal-dialog modal-dialog-centered" role="document" @keydown.enter="deleteCategory">
        <div class="modal-content">
          <div class="modal-header">
            <h5 id="delete-confirmation-title" class="modal-title">Delete Category</h5>
            <button type="button" class="btn-close" aria-label="Close" @click="cancelDelete"></button>
          </div>
          <div class="modal-body">
            <!-- Bestätigungsnachricht für das Löschen -->
            <p>Are you sure you want to delete this category?</p>
          </div>
          <div class="modal-footer">
            <!-- Auswahlmöglichkeiten für den Bestätigungsdialog -->
            <button type="button" class="btn btn-secondary" @click="cancelDelete">Cancel</button>
            <button type="button" class="btn btn-danger" ref="deleteButton" @click="deleteCategory">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      newCategory: '', // Aktuelle Eingabe für neue Kategorie
      categories: JSON.parse(localStorage.getItem('categories') || '[]'), // Kategorien aus dem Local Storage laden
      errorMessage: '', // Fehlermeldung für Benutzer
      lastAddedCategory: null, // Zuletzt hinzugefügte Kategorie, für Hervorhebung
      deleteDialogVisible: false, // Sichtbarkeit des Löschdialogs
      pendingDeleteCategory: null // Zu löschende Kategorie, die im Bestätigungsdialog angezeigt wird
    };
  },
  computed: {
    sortedCategories() {
      return [...this.categories].sort();
    }
  },
  methods: {
    addCategory() {
      const trimmedCategory = this.newCategory.trim();
      if (!trimmedCategory) {
        this.errorMessage = '';
        this.focusInput();
        return;
      }
      if (this.categories.includes(trimmedCategory)) {
        this.errorMessage = 'This category already exists.';
        this.clearErrorMessage();
        return;
      }
      this.categories.push(trimmedCategory);
      this.saveCategories();
      this.newCategory = '';
      this.errorMessage = '';
      this.highlightNewCategory(trimmedCategory);
      this.focusInput();
    },
    handleEnter() {
      this.addCategory();
    },
    confirmDeleteCategory(category) {
      this.pendingDeleteCategory = category;
      this.deleteDialogVisible = true;
      this.$nextTick(() => {
        this.$refs.deleteButton.focus();
      });
    },
    deleteCategory() {
      if (this.pendingDeleteCategory) {
        this.categories = this.categories.filter(cat => cat !== this.pendingDeleteCategory);
        this.saveCategories();
        this.cancelDelete();
      }
    },
    cancelDelete() {
      this.pendingDeleteCategory = null;
      this.deleteDialogVisible = false;
      this.focusInput();
    },
    saveCategories() {
      localStorage.setItem('categories', JSON.stringify(this.categories));
    },
    focusInput() {
      this.$nextTick(() => {
        this.$refs.categoryInput.focus();
      });
    },
    clearErrorMessage() {
      setTimeout(() => {
        this.errorMessage = '';
        this.newCategory = '';
        this.focusInput();
      }, 2000);
    },
    closeModal() {
      this.$emit('close-modal');
      this.focusInputInApp();
    },
    focusInputInApp() {
      this.$emit('focus-chat-input');
    },
    highlightNewCategory(newCategory) {
      this.lastAddedCategory = newCategory;
      this.scrollToCategory(newCategory);
      setTimeout(() => {
        this.lastAddedCategory = null;
      }, 2000);
    },
    scrollToCategory(category) {
      this.$nextTick(() => {
        const list = this.$refs.categoryList;
        const index = this.sortedCategories.indexOf(category);
        if (index > -1) {
          const listItem = list.children[index];
          listItem.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
        }
      });
    },
    handleEscapeKey(event) {
      if (event.key === 'Escape') {
        if (this.deleteDialogVisible) {
          this.cancelDelete();
        } else {
          this.closeModal();
        }
      }
    }
  },
  mounted() {
    this.focusInput();
    window.addEventListener('keydown', this.handleEscapeKey);
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.handleEscapeKey);
  }
};
</script>

<style scoped>
.modal-content {
  background-color: #eee7ee; 
}

.modal-header, .modal-footer {
  background-color: #bba0bd; 
}

.btn-success, .btn-outline-secondary {
  background-color: #702d71; 
  border-color: #702d71;
  color: #fff; 
}

.btn-success:hover, .btn-outline-secondary:hover {
  background-color: #56135a; 
  border-color: #56135a;
}

/* Fokus-Stile für das Kategorieeingabefeld */
.form-control {
  border-radius: 50px;
  outline: none; /* Entferne Standard-Outline */
  transition: outline-color 0.3s, border-color 0.3s; /* Glatter Übergang */
}

.form-control:focus {
  outline-color: var(--focus-color);
  border-color: var(--focus-color);
  box-shadow: 0 0 0 0.2rem rgba(86, 19, 90, 0.25);
}

/* Cancel-Button als Outline */
button.btn.btn-outline-secondary {
  color: #56135a;
  border-color: #56135a;
  background-color: transparent;
}
button.btn-outline-secondary:hover {
  background-color: #eee7ee;
}

.input-group input, .list-group-item {
  background-color: #ffffff; 
}

.btn-outline-danger {
  color: #dc3545;
  border-color: #dc3545;
}

.btn-outline-danger:hover {
  background-color: #f8d7da;
}

.highlight {
  background-color: #bba0bd;
}
</style>