<template>
  <div 
    v-if="show"
    class="mh-context-menu"
    :style="{ top: `${top}px`, left: `${left}px` }"
  >
    <ul>
      <li v-for="option in contextMenuOptions" :key="option.text" @click="() => option.action(selectedRow)">
        {{ option.text }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  show: boolean;
  top: number;
  left: number;
  selectedRow: any;
  contextMenuOptions: { text: string; action: (row: any) => void }[];
}>();
</script>

<style scoped>
/* Context menu styles are now imported via core.css */
</style> 