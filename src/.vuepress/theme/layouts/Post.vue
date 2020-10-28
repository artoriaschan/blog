<template>
  <div id="vuepress-theme-blog__post-layout">
    <article
      class="vuepress-blog-theme-content"
      itemscope
      itemtype="https://schema.org/BlogPosting"
    >
      <header>
        <h1 class="post-title" :class="{'with-subtitle': hasSubtitle}" itemprop="name headline">
          {{ $frontmatter.title }}
        </h1>
        <div class="post-title__sub" v-if="hasSubtitle">
          {{ $frontmatter.subtitle }}
        </div>
        <PostMeta
          :tags="$frontmatter.tags"
          :author="$frontmatter.author"
          :date="$frontmatter.date"
          :location="$frontmatter.location"
        />
      </header>
      <Content itemprop="articleBody" />
      <footer>
        <Newsletter v-if="$service.email.enabled" />
        <hr />
        <Comment />
      </footer>
    </article>
    <Toc />
  </div>
</template>

<script>
import Toc from '@theme/components/Toc.vue'
import PostMeta from '@theme/components/PostMeta.vue'
import { Comment } from '@vuepress/plugin-blog/lib/client/components'

export default {
  computed:{
    hasSubtitle(){
      return this.$frontmatter.subtitle && this.$frontmatter.subtitle !== ""
    }
  },
  components: {
    Toc,
    PostMeta,
    Comment,
    Newsletter: () => import('@theme/components/Newsletter.vue'),
  },
}
</script>
<style lang="stylus">
.with-subtitle
  margin-bottom 0

.post-title
  &__sub
    font-size 20px
    color #999999
    margin-bottom 20px
</style>