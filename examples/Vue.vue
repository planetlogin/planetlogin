<!-- PlanetLogin in Vue 3. npm i @planetlogin/planetlogin -->
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { createPlanetLogin, type PlanetLogin, type PlanetLocale } from '@planetlogin/planetlogin';

const props = withDefaults(defineProps<{ accent?: string }>(), { accent: '#f6a13c' });
const emit = defineEmits<{ locale: [PlanetLocale] }>();

const el = ref<HTMLElement>();
let globe: PlanetLogin | undefined;

onMounted(() => {
  globe = createPlanetLogin(el.value!, {
    accent: props.accent,
    onLocale: (l) => emit('locale', l),
  });
});
onBeforeUnmount(() => globe?.destroy());
</script>

<template>
  <div ref="el" style="width: 100%; height: 480px" />
</template>

<!-- Usage: <Vue @locale="(l) => locale = l" /> -->
