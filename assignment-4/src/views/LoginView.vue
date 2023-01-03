<template>
  <div>
    <h4>Login</h4>

      <form @submit.prevent="signIn">
        <div class="containerr">
          <label for="username">Username</label>
          <input v-model="username" type="text" placeholder="Username" class="username">
        </div>
          
        <div class="containerr">
          <label for="password">Password</label>
          <input v-model="password" type="password" placeholder="Password" class="password">
          <small class="text-danger" v-if="password.length && passwordInvalid">Password should be between 3 - 12 letters</small>
        </div>
          
        <div class="containerr">
          <button type="submit" class="btn btn-primary">Login</button>
        </div>
       
        <div v-if="error" class="text-danger">An error occurred</div>

        <div v-if="authenticationError" class="text-danger">Invalid password</div>
      </form>
    </div>
</template>

<script >
import {login} from '../services/auth.service';

  export default {
    data() {
      return {
        username: '',
        password: '',
        error: undefined,
        success: undefined,
        passwordInvalid: true,
        authenticationError: false,
      }
    },


    watch: {
      password() {
        if(this.password.length < 3 || this.password.length > 12) {
            this.passwordInvalid = true;
            return;
          }
          this.passwordInvalid = false;
      }
    },
    methods: {
      signIn() {
        this.error = false;
        this.authenticationError = false;
        this.success = false;
      

        login(this.username, this.password).then(() => {
           this.success = true;
          this.$router.replace({path: "/game"})
        }).catch((err) => {
          if (err.message.includes('403')) {
            this.authenticationError = true;
            return;
          }

          this.error = true;
        })
      },
    }
  }

</script>

<style>
.containerr{
  padding: 10px;
}
</style>