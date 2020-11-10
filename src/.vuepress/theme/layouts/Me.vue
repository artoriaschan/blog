<template>
  <div class="about">
    <img class="about-avator" src="~@assets/avator.jpeg"/>
    <div class="about-content">
      <Content />
    </div>
  </div>
</template>
<style lang="stylus" scoped>
.about {
  display: flex;
  &-avator {
    width: 200px;
    height: 200px;
  }
  &-content {
    flex: 1;
    padding-left: 40px;
  }
}
</style>