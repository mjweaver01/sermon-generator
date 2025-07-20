<script setup lang="ts">
// No additional logic needed for the main app component
</script>

<template>
  <div id="app">
    <router-view />
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f5f5;
  color: #333;
}

#app {
  min-height: 100vh;
}

/* Shared content styles used by multiple components */
.content {
  padding: 3rem 2rem;
  max-width: 800px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .content {
    padding: 2rem 1rem;
  }
}
</style>
