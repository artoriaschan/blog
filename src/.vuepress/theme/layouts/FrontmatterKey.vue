<template>
  <div id="vuepress-theme-blog__tags-layout">
    <BlogTags :tags="$frontmatterKey.list" />
  </div>
</template>
<script>
import BlogTags from "@theme/components/BlogTags.vue"
export default {
  components: {BlogTags}
}
</script>