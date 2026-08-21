<script lang="ts">
  import { page } from "$app/stores";
  import { base } from "$app/paths";
</script>

<div class="err">
  <h1>{$page.status}</h1>
  <p>{$page.error?.message ?? "Something went wrong"}</p>
  <a href="{base}/">← Back to sign in</a>
</div>

<style>
  .err { min-height: 100vh; display: grid; place-items: center; text-align: center; color: #eef2fb; font-family: system-ui, sans-serif; }
  h1 { font-size: 4rem; margin: 0; color: var(--pl-accent, #f6a13c); }
  p { color: #9aa7bd; margin: .5rem 0 1.5rem; }
  a { color: #9aa7bd; text-decoration: none; font-size: .9rem; }
  a:hover { color: var(--pl-accent, #f6a13c); }
</style>
