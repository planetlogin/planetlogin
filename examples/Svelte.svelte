<!-- PlanetLogin in Svelte. npm i planetlogin -->
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { createPlanetLogin, type PlanetLogin, type PlanetLocale } from 'planetlogin';

  export let accent = '#f6a13c';
  export let onlocale: (l: PlanetLocale) => void = () => {};

  let el: HTMLElement;
  let globe: PlanetLogin | undefined;

  $: if (el && !globe) {
    globe = createPlanetLogin(el, { accent, onLocale: onlocale });
  }
  onDestroy(() => globe?.destroy());
</script>

<div bind:this={el} style="width: 100%; height: 480px"></div>

<!-- Usage: <Svelte onlocale={(l) => (locale = l)} /> -->
