<template>
  <div
    v-if="isVisible && filteredCategories.length"
    class="modal fade show d-block"
    aria-modal="true"
  >
    <div class="modal-dialog modal-fullscreen-xxl-down" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Wähle eine Kategorie aus</h5>
          <button
            type="button"
            class="btn-close"
            @click="close"
            aria-label="Schließen"
          ></button>
        </div>
        <div
          class="modal-body d-flex flex-column"
          tabindex="0"
          @keydown.up.prevent="moveSelection('up')"
          @keydown.down.prevent="moveSelection('down')"
          @keydown.enter.prevent="confirmSelection"
          @keydown="applyKeyFilter"
          ref="modalBody"
        >
          <ul class="list-group overflow-auto flex-grow-1" ref="categoryList">
            <li
              class="list-group-item d-flex justify-content-between align-items-center"
              @click="handleSpecialItemClick"
              :class="{ selected: currentIndex === -1 }"
            >
              ohne Kategorie
            </li>
            <li
              v-for="(category, index) in filteredCategories"
              :key="category"
              class="list-group-item d-flex justify-content-between align-items-center"
              @click="handleCategoryClick(category, index)"
              :class="{ selected: currentIndex === index }"
            >
              {{ category }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { loadCategories } from "../services/storage.js";

export default {
  props: ["isVisible"],
  data() {
    return {
      categories: loadCategories(),
      currentIndex: -1,
      keyFilter: "", // Zeichenfilter für die Kategorien
    };
  },
  computed: {
    filteredCategories() {
      if (!this.keyFilter) {
        return this.categories;
      }
      const filter = this.keyFilter.toLowerCase();
      return this.categories.filter((category) =>
        category.toLowerCase().startsWith(filter)
      );
    },
  },
  methods: {
    handleSpecialItemClick() {
      this.currentIndex = -1;
      this.selectCategory(null);
    },
    handleCategoryClick(category, index) {
      this.currentIndex = index;
      this.selectCategory(category);
    },
    selectCategory(category) {
      this.$emit("category-selected", category);
      setTimeout(() => {
        this.close();
      }, 500);
    },
    moveSelection(direction) {
      const length = this.filteredCategories.length;
      if (direction === "up") {
        if (this.currentIndex === -1) {
          this.currentIndex = length - 1;
        } else {
          this.currentIndex =
            this.currentIndex > 0 ? this.currentIndex - 1 : -1;
        }
      } else if (direction === "down") {
        if (this.currentIndex === length - 1) {
          this.currentIndex = -1;
        } else {
          this.currentIndex =
            this.currentIndex < length - 1 ? this.currentIndex + 1 : -1;
        }
      }
      this.scrollToSelected();
    },
    confirmSelection() {
      if (this.currentIndex === -1) {
        this.handleSpecialItemClick();
      } else {
        this.handleCategoryClick(
          this.filteredCategories[this.currentIndex],
          this.currentIndex
        );
      }
    },
    close() {
      this.$emit("update:isVisible", false);
    },
    scrollToSelected() {
      this.$nextTick(() => {
        const list = this.$refs.categoryList;
        const selectedItem =
          this.currentIndex === -1
            ? list.children[0]
            : list.children[this.currentIndex + 1];
        if (selectedItem) {
          selectedItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
    },
    handleEscapeKey(event) {
      if (event.key === "Escape") {
        this.close();
      }
    },
    applyKeyFilter(event) {
      const key = event.key;
      if (/^[a-zA-Z0-9]$/.test(key)) {
        this.keyFilter = key;
        this.currentIndex = -1; // Reset selection when filter changes
      }
    },
  },
  watch: {
    isVisible(newValue) {
      if (newValue) {
        this.currentIndex = -1;
        this.keyFilter = ""; // Reset filter when modal opens
        this.$nextTick(() => {
          this.$refs.modalBody.focus(); // Fokussiere modalBody nach dem Öffnen
        });
      }
    },
  },
  mounted() {
    window.addEventListener("keydown", this.handleEscapeKey);
  },
  beforeDestroy() {
    window.removeEventListener("keydown", this.handleEscapeKey);
  },
};
</script>

<style scoped>
.modal-fullscreen-xxl-down .modal-dialog {
  max-width: 1024px;
  margin: auto;
}

.modal-body {
  display: flex;
  flex-direction: column;
  outline: none; /* Entferne den Standard-Fokusrahmen */
}

.list-group {
  flex-grow: 1;
  overflow-y: auto;
}

.list-group-item {
  cursor: pointer;
  transition: background-color 0.3s;
  border-width: 1px;
  border-style: solid;
  border-color: #ccc;
}

.selected {
  background-color: lightgray;
}
</style>
