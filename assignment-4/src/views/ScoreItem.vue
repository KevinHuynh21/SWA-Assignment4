<template>
    <div class="container">
        <div>Game number: {{score.id}}</div>
        <div>Score: {{score.score}}</div>
    </div>
</template>
  
  <script>

  export default {
    data(){
      return{
        
      }
    },
    methods:{},
    props: {
        score: undefined,
    }
  }
  </script>
  
<style>
.container{
    padding: 20px;
    border: 1px solid black;
    border-radius: 5px;
    width: 200px;
}
</style>
  