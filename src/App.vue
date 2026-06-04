<script setup>
import { RouterLink, RouterView } from "vue-router";
</script>

<template>
  <RouterView />
</template>

<style lang="scss">
@use "./assets/scss/variables.scss" as *;

body {
  width: 100%;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: $text-color-primary;
  background-color: $bg-color-base;
}
</style>
