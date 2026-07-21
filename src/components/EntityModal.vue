<script setup>
// Modal genérico de formulario, guiado por un arreglo de campos.
// field = { key, label, type: 'text'|'number'|'select', placeholder?, options?: [{value,label}] }
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  fields: { type: Array, default: () => [] },
  modelValue: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:modelValue', 'save', 'close'])

function set(key, val) {
  emit('update:modelValue', { ...props.modelValue, [key]: val })
}
</script>

<template>
  <div v-if="open" class="gv-modal-overlay" @click="emit('close')">
    <div class="gv-modal" style="width: 460px" @click.stop>
      <div class="gv-modal__header">
        <div class="gv-modal__title">{{ title }}</div>
        <div class="gv-modal__close" @click="emit('close')"><i class="fa-solid fa-xmark"></i></div>
      </div>
      <div class="gv-modal__body">
        <div v-for="f in fields" :key="f.key" class="gv-field">
          <label class="gv-label">{{ f.label }}</label>
          <select
            v-if="f.type === 'select'"
            class="gv-input"
            :value="modelValue[f.key] ?? ''"
            @change="set(f.key, $event.target.value)"
          >
            <option v-for="o in f.options" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
          <input
            v-else-if="f.type === 'number'"
            class="gv-input"
            type="number"
            :value="modelValue[f.key] ?? 0"
            @input="set(f.key, $event.target.value)"
          />
          <input
            v-else-if="f.type === 'date'"
            class="gv-input"
            type="date"
            :value="modelValue[f.key] ?? ''"
            @input="set(f.key, $event.target.value)"
          />
          <textarea
            v-else-if="f.type === 'textarea'"
            class="gv-input"
            style="height:88px;padding:8px;resize:vertical"
            :value="modelValue[f.key] ?? ''"
            :placeholder="f.placeholder || ''"
            @input="set(f.key, $event.target.value)"
          ></textarea>
          <input
            v-else
            class="gv-input"
            :value="modelValue[f.key] ?? ''"
            :placeholder="f.placeholder || ''"
            @input="set(f.key, $event.target.value)"
          />
        </div>
      </div>
      <div class="gv-modal__footer">
        <button class="gv-btn gv-btn--pill gv-btn--tertiary" @click="emit('close')">Cancelar</button>
        <button class="gv-btn gv-btn--pill gv-btn--primary" @click="emit('save')">Guardar</button>
      </div>
    </div>
  </div>
</template>
