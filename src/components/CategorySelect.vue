<template>
  <div
    v-if="isVisible && categories.length"
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
              v-for="(category, index) in categories"
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
    };
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
      const length = this.categories.length;
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
          this.categories[this.currentIndex],
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
  },
  watch: {
    isVisible(newValue) {
      if (newValue) {
        this.currentIndex = -1;
        this.$nextTick(() => {
          this.$refs.modalBody.focus(); // Fokussiere modalBody nach dem Öffnen
        });
      }
    },
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
