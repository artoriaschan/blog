<template>
  <div class="home">
    <h1 class="title">拾光</h1>
    <h3 class="poem">{{poem}}</h3>
  </div>
</template>

<script>
  import {load} from "@/lib/jinrishici";
  export default {
    data () {
      return {
        poem: ""
      }
    },
    mounted(){
      load(result => {
        const {status, data} = result;
        if(status === "success") {
          this.poem = data.content
        }else{
          console.log("诗词获取失败")
        }
      });
    },
    components: {

    }
  }
</script>
<style lang="stylus" scoped>
.home {
  position: absolute;
  left: 0;
  right: 0;
  top: $headerHeight;
  bottom: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.title {
  color: #000;
  font-weight: bold;
  font-family: PT Serif, Serif;
}
.title {
  color: #000;
  font-weight: bold;
  font-family: PT Serif, Serif;
}
</style>