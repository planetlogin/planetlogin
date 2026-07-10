<script lang="ts">
	import type { Snippet } from 'svelte';
	interface NavLink {
		href: string;
		label: string;
	}
	interface Brand {
		label: string;
		href: string;
	}
	// Portable, self-contained top nav shared across apps (barcinet.com + the
	// PlanetLogin portal). Zero global-CSS / AuthNav dependency: theme via the
	// --snav-* CSS vars and pass the right-side content (auth or back link) as a
	// snippet. Canonical copy lives here; synced to the portal by scripts/sync-ui.sh.
	let {
		brand,
		links = [],
		over = false,
		right
	}: { brand: Brand; links?: NavLink[]; over?: boolean; right?: Snippet } = $props();
	let open = $state(false);
</script>

<header class="snav" class:over class:open>
	<div class="snav-in">
		<a class="snav-brand" href={brand.href}>{brand.label}<span class="snav-dot">.</span></a>
		<nav class="snav-links">
			{#each links as l (l.href)}<a href={l.href}>{l.label}</a>{/each}
		</nav>
		<div class="snav-right">{@render right?.()}</div>
		<button
			class="snav-burger"
			aria-label="Menú"
			aria-expanded={open}
			onclick={() => (open = !open)}
		>
			<span></span><span></span><span></span>
		</button>
	</div>

	{#if open}
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions, a11y_no_noninteractive_element_interactions -->
		<nav class="snav-sheet" onclick={() => (open = false)}>
			{#each links as l (l.href)}<a href={l.href}>{l.label}</a>{/each}
			<div class="snav-sheet-right">{@render right?.()}</div>
		</nav>
	{/if}
</header>

<style>
	.snav {
		background: var(--snav-bar-bg, var(--snav-bg, #11161b));
		border-bottom: 1px solid var(--snav-border, #30363d);
		box-shadow: 0 1px 14px rgba(0, 0, 0, 0.45);
		font-family: var(--snav-font, inherit);
	}
	/* landing / hero: transparent, overlaid (no bar background) */
	.snav.over {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		z-index: 10;
		border-bottom: none;
		background: transparent;
		box-shadow: none;
	}
	.snav-in {
		max-width: var(--snav-max, 1360px);
		margin: 0 auto;
		padding: 0 1.25rem;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.snav-brand {
		font-weight: 700;
		color: var(--snav-fg, #e6edf3);
		text-decoration: none;
	}
	.snav-dot {
		color: var(--snav-accent, #3fb950);
	}
	.snav-links {
		display: flex;
		align-items: center;
		gap: 1.6rem;
	}
	.snav-links a {
		color: var(--snav-muted, #9aa7bd);
		text-decoration: none;
		font-size: 0.9rem;
		transition: color 0.15s ease;
	}
	.snav-links a:hover {
		color: var(--snav-fg, #e6edf3);
	}
	.snav-right {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	/* over a photo/hero: light text + shadow for legibility */
	.snav.over .snav-brand,
	.snav.over .snav-links a {
		color: #e6edf3;
		text-shadow: 0 1px 8px rgba(0, 0, 0, 0.65);
	}
	.snav.over .snav-links a:hover {
		color: var(--snav-accent, #3fb950);
	}
	.snav-burger {
		display: none;
		flex-direction: column;
		justify-content: space-between;
		width: 30px;
		height: 22px;
		padding: 2px;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--snav-fg, #e6edf3);
	}
	.snav-burger span {
		display: block;
		height: 2px;
		width: 100%;
		background: currentColor;
		border-radius: 2px;
		transition:
			transform 0.25s ease,
			opacity 0.2s ease;
	}
	.snav.open .snav-burger span:nth-child(1) {
		transform: translateY(8px) rotate(45deg);
	}
	.snav.open .snav-burger span:nth-child(2) {
		opacity: 0;
	}
	.snav.open .snav-burger span:nth-child(3) {
		transform: translateY(-8px) rotate(-45deg);
	}
	.snav-sheet {
		display: flex;
		flex-direction: column;
		padding: 0.25rem 1.25rem 1.1rem;
		background: var(--snav-bg, #0b0e11);
		border-top: 1px solid var(--snav-border, #30363d);
	}
	.snav.over .snav-sheet {
		background: rgba(11, 14, 17, 0.97);
		backdrop-filter: blur(6px);
	}
	.snav-sheet a {
		padding: 0.85rem 0.25rem;
		color: var(--snav-fg, #e6edf3);
		text-decoration: none;
		border-bottom: 1px solid var(--snav-border, #30363d);
		font-size: 0.95rem;
	}
	.snav-sheet a:hover {
		color: var(--snav-accent, #3fb950);
	}
	.snav-sheet-right {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		padding-top: 1rem;
	}
	@media (max-width: 820px) {
		.snav-links,
		.snav-right {
			display: none;
		}
		.snav-burger {
			display: flex;
		}
	}
</style>
