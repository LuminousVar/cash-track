<script>
	import { page } from '$app/state';
	import Icon from './Icon.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import { NAV, isActive } from '$lib/nav.js';

	/** @type {{ user?: string | null }} */
	let { user = null } = $props();
</script>

<aside class="flex h-full w-60 shrink-0 flex-col border-r border-line bg-surface">
	<a href="/" class="flex h-14 items-center gap-2 px-5 text-[15px] font-semibold tracking-tight">
		<span class="grid size-6 place-items-center rounded-md bg-accent text-accent-fg">
			<Icon name="receipt" size={14} strokeWidth={2} />
		</span>
		cashtrack
	</a>

	<nav aria-label="Navigasi utama" class="flex-1 px-3 py-2">
		<ul class="space-y-0.5">
			{#each NAV as item}
				{@const active = isActive(page.url.pathname, item.href)}
				<li>
					<a
						href={item.href}
						aria-current={active ? 'page' : undefined}
						class="flex h-9 items-center gap-3 rounded-lg px-3 text-sm transition-colors
							{active ? 'bg-subtle font-medium text-ink' : 'text-ink-soft hover:bg-subtle hover:text-ink'}"
					>
						<Icon name={item.icon} class={active ? 'text-accent' : ''} />
						{item.label}
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	<div class="space-y-3 border-t border-line p-3">
		<ThemeToggle compact />
		{#if user}
			<div class="flex items-center gap-2 px-1">
				<span class="min-w-0 flex-1 truncate text-sm text-ink-soft" title={user}>{user}</span>
				<form method="POST" action="/logout">
					<button class="btn btn-ghost btn-icon h-8 w-8" aria-label="Keluar" title="Keluar">
						<Icon name="logout" />
					</button>
				</form>
			</div>
		{/if}
	</div>
</aside>
