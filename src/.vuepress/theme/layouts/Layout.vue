<template>
  <div>
    <BaseListLayout v-if="$pagination" />
    <Content v-else />
  </div>
</template>
<script>
import BaseListLayout from "@theme/components/BaseListLayout.vue"
export default {
  components: {
    BaseListLayout
  },
}
</script>