<template>
  <div></div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

// Redirect to content-creation page on load
const router = useRouter()

onMounted(() => {
  router.replace('/content-creation')
})
</script>
