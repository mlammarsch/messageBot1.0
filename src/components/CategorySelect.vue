<template>
  <div
    v-if="isVisible && filteredCategories.length"
    class="modal fade show d-block"
    aria-modal="true"
    ref="modalDialog"
    tabindex="-1"
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
          tabindex="-1"
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
      keyFilter: "",
      filterTimeout: null,
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
        this.currentIndex =
          this.currentIndex === -1 ? length - 1 : Math.max(this.currentIndex - 1, -1);
      } else if (direction === "down") {
        this.currentIndex =
          this.currentIndex === length - 1 ? -1 : Math.min(this.currentIndex + 1, length - 1);
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
        if (list && list.children && list.children.length > 0) {
          const index = this.currentIndex === -1 ? 0 : this.currentIndex + 1;
          if (index < list.children.length) {
            const selectedItem = list.children[index];
            if (selectedItem) {
              selectedItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
          }
        }
      });
    },
    handleKeyDown(event) {
      switch (event.key) {
        case 'Escape':
          this.close();
          break;
        case 'ArrowUp':
          this.moveSelection('up');
          break;
        case 'ArrowDown':
          this.moveSelection('down');
          break;
        case 'Enter':
          this.confirmSelection();
          break;
        default:
          this.applyKeyFilter(event);
          break;
      }
    },
    applyKeyFilter(event) {
      const key = event.key;
      if (/^[a-zA-Z0-9]$/.test(key)) {
        this.keyFilter = key;

        const hasMatches = this.categories.some((category) =>
          category.toLowerCase().startsWith(this.keyFilter.toLowerCase())
        );

        if (hasMatches) {
          this.currentIndex = -1;

          if (this.filterTimeout) clearTimeout(this.filterTimeout);
          this.filterTimeout = setTimeout(() => {
            this.keyFilter = "";
          }, 2000);
        } else {
          this.keyFilter = "";
        }
      }
    },
    focusModal() {
      this.$nextTick(() => {
        const modalDialog = this.$refs.modalDialog;
        if (modalDialog) {
          modalDialog.focus();
          const modalBody = this.$refs.modalBody;
          if (modalBody) {
            modalBody.focus();
          }
        }
      });
    },
  },
  watch: {
    isVisible(newValue) {
      if (newValue) {
        this.currentIndex = -1;
        this.keyFilter = "";
        this.focusModal();
      }
    },
  },
  mounted() {
    window.addEventListener("keydown", this.handleKeyDown);
  },
  beforeDestroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
    if (this.filterTimeout) clearTimeout(this.filterTimeout);
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
  outline: none;
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