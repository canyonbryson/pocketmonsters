<template>
  <div>
    <NuxtLoadingIndicator :height="4" color="var(--color-accent)" />
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
