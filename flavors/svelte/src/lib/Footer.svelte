<script lang="ts">
	interface FLink {
		href: string;
		label: string;
	}
	interface FCol {
		title: string;
		links: FLink[];
	}
	interface Brand {
		label: string;
		href: string;
	}
	// Portable, self-contained footer shared across apps (barcinet.com + the
	// PlanetLogin portal). Data-driven; themed via the --snav-* CSS vars. Canonical
	// copy lives here; synced to the portal by scripts/sync-ui.sh.
	let {
		brand,
		tagline = '',
		mail = '',
		columns = [],
		bottom = '',
		note = ''
	}: {
		brand: Brand;
		tagline?: string;
		mail?: string;
		columns?: FCol[];
		bottom?: string;
		note?: string;
	} = $props();
</script>

<footer class="sfoot">
	<div class="sfoot-grid">
		<div class="sfoot-brand">
			<a class="sfoot-logo" href={brand.href}>{brand.label}<span class="sfoot-dot">.</span></a>
			{#if tagline}<p>{tagline}</p>{/if}
			{#if mail}<a class="sfoot-mail" href={`mailto:${mail}`}>{mail}</a>{/if}
		</div>
		{#each columns as col (col.title)}
			<nav class="sfoot-col">
				<h4>{col.title}</h4>
				{#each col.links as l (l.href + l.label)}<a href={l.href}>{l.label}</a>{/each}
			</nav>
		{/each}
	</div>
	{#if bottom || note}
		<div class="sfoot-bottom">
			{#if bottom}<span>{bottom}</span>{/if}
			{#if note}<span>{note}</span>{/if}
		</div>
	{/if}
</footer>

<style>
	.sfoot {
		border-top: 1px solid var(--snav-border, #232b33);
		background: var(--snav-bg, #0b0e11);
		padding: 3rem 1.5rem 1.5rem;
		font-family: var(--snav-font, inherit);
	}
	.sfoot-grid {
		max-width: 1100px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 1.7fr 1fr 1fr 1fr;
		gap: 2.5rem;
	}
	.sfoot-logo {
		font-weight: 700;
		font-size: 1.15rem;
		color: var(--snav-fg, #e6edf3);
		text-decoration: none;
	}
	.sfoot-dot {
		color: var(--snav-accent, #3fb950);
	}
	.sfoot-brand p {
		color: var(--snav-muted, #8b949e);
		font-size: 0.9rem;
		line-height: 1.55;
		margin: 0.8rem 0;
		max-width: 300px;
	}
	.sfoot-mail {
		font-size: 0.9rem;
		color: var(--snav-accent, #3fb950);
		text-decoration: none;
	}
	.sfoot-col {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}
	.sfoot-col h4 {
		margin: 0 0 0.35rem;
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.09em;
		color: var(--snav-muted, #8b949e);
		font-weight: 600;
	}
	.sfoot-col a {
		color: var(--snav-fg, #cdd6df);
		text-decoration: none;
		font-size: 0.9rem;
		width: fit-content;
	}
	.sfoot-col a:hover {
		color: var(--snav-accent, #3fb950);
	}
	.sfoot-bottom {
		max-width: 1100px;
		margin: 2.5rem auto 0;
		padding-top: 1.3rem;
		border-top: 1px solid var(--snav-border, #232b33);
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.5rem 1.5rem;
		color: var(--snav-muted, #8b949e);
		font-size: 0.82rem;
	}
	@media (max-width: 720px) {
		.sfoot-grid {
			grid-template-columns: 1fr 1fr;
		}
		.sfoot-brand {
			grid-column: 1 / -1;
		}
	}
</style>
