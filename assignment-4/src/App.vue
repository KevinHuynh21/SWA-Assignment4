<template>
  <nav>
    <div v-if="!loggedIn">
    <router-link to="/login">Login</router-link>
    <router-link to="/signup">Signup</router-link>
  </div>
  <div  v-if="loggedIn">
    <router-link to="/play">Play</router-link>
    <router-link to="/scores">Scores</router-link>
    <router-link to="/profile">Profile</router-link> 
  </div>
  </nav>
  <router-view/>
</template>
<script >
import {authentication, checkAuthentication } from './services/auth.service'
export default {
    data() {
      return {
        loggedIn: false,
      }
    },
    beforeMount() {
      authentication.getState().subscribe((state) => {
          this.loggedIn = state;
      });
      checkAuthentication();
    },
  }
</script>

<style>
#app {
  text-align: center;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
  padding: 10px;
}

</style>
