<template>
  <div class="app-shell">
    <header>
      <div class="app-header__inner">
        <NuxtLink to="/" class="brand-link">
          <span class="brand-link__title">PocketMonsters</span>
        </NuxtLink>
      </div>
    </header>

    <main class="app-main">
      <slot />
    </main>
  </div>
</template>
