<template>
  <div class="about">
    <div class="about-avator">
      <img class="about-avator-img" src="~@assets/avator.jpeg"/>
    </div>
    <div class="about-content">
      <Content />
    </div>
  </div>
</template>
<style lang="stylus" scoped>
.about {
  display: flex;
  &-avator {
    width: 30%;
    &-img {
      width: 100%;
    }
    &-img::before {
      content: '';
      padding-top: 100%;
      float: left;
    }
    &-img::after {
      content: '';
      display: block;
      clear: both;
    }
  }
  &-content {
    flex: 1;
    padding-left: 40px;
  }
}
</style>