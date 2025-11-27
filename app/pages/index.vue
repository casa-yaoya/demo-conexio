<template>
  <div></div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

// Redirect to summary page on load
const router = useRouter()

onMounted(() => {
  router.replace('/summary')
})
</script>
