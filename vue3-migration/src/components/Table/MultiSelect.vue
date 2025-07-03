<template>
  <label :class="`${prefixCls}-wrapper`">
    <span :class="checkboxClass">
      <span :class="`${prefixCls}__inner`" @click="toggle"></span>
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  disabled?: boolean,
  status?: { indeterminate: boolean, allCheck: boolean }
}>()
const emit = defineEmits<{ (e: 'onChange', checked: boolean): void }>()

const prefixCls = 'mh-checkbox'

const checkboxClass = computed(() => [
  `${prefixCls}`,
  {
    [`${prefixCls}--disabled`]: props.disabled,
    [`${prefixCls}--checked`]: props.status?.allCheck,
    [`${prefixCls}--indeterminate`]: props.status?.indeterminate
  }
])

function toggle() {
  if (props.disabled) return
  const value = !props.status?.allCheck
  emit('onChange', value)
}
</script>

<style scoped>
.mh-checkbox-wrapper {
  display: block;
  position: relative;
  vertical-align: middle;
  white-space: nowrap;
  margin-bottom: 0;
}
.mh-checkbox {
  display: inline-block;
  position: relative;
  line-height: 1;
  white-space: nowrap;
  vertical-align: middle;
  cursor: pointer;
  outline: none;
}
.mh-checkbox:hover .mh-checkbox__inner {
  border-color: #bcbcbc;
}
.mh-checkbox__inner {
  display: inline-block;
  width: 14px;
  height: 14px;
  position: relative;
  top: 0;
  left: 0;
  border: 1px solid #dddee1;
  border-radius: 2px;
  background-color: #ffffff;
}
.mh-checkbox__inner::after {
  content: "";
  display: block;
  width: 4px;
  height: 8px;
  position: absolute;
  top: 1px;
  left: 4px;
  border: 2px solid #fff;
  border-top: 0;
  border-left: 0;
  transform: rotate(45deg) scale(0);
  transition: all 0.01s ease-in-out;
}
.mh-checkbox--indeterminate .mh-checkbox__inner {
  border-color: #00a9ff;
  background-color: #00a9ff;
}
.mh-checkbox--indeterminate .mh-checkbox__inner::after {
  content: "";
  width: 8px;
  height: 1px;
  transform: scale(1);
  position: absolute;
  left: 2px;
  top: 5px;
}
.mh-checkbox--indeterminate:hover .mh-checkbox__inner {
  border-color: #00a9ff;
}
.mh-checkbox--checked .mh-checkbox__inner {
  border-color: #00a9ff;
  background-color: #00a9ff;
}
.mh-checkbox--checked .mh-checkbox__inner::after {
  content: "";
  display: block;
  width: 4px;
  height: 8px;
  position: absolute;
  top: 1px;
  left: 4px;
  border: 2px solid #ffffff;
  border-top: 0;
  border-left: 0;
  transform: rotate(45deg) scale(1);
}
.mh-checkbox--checked:hover .mh-checkbox__inner {
  border-color: #2d8cf0;
}
.mh-checkbox--disabled {
  cursor: not-allowed;
}
.mh-checkbox--disabled .mh-checkbox__inner {
  background-color: #f3f3f3;
  border-color: #dddee1;
}
.mh-checkbox--disabled .mh-checkbox__inner::after {
  animation-name: none;
  border-color: #ccc;
}
.mh-checkbox--disabled:hover .mh-checkbox__inner {
  border-color: #dddee1;
}
</style> 