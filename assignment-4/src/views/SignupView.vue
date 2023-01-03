<template>
  <div>
    <h4>Sign Up</h4>

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
          <button type="submit" class="btn btn-primary" @click="signup()">Sign up</button>
        </div>
       
        <div v-if="error" class="text-danger">An error occurred</div>
        <div v-if="success" class="alert alert-success">
      Account created successfully!
    </div>
      </form>
    </div>
</template>

<script>
  import { createAccount } from '../services/auth.service';
 
  export default {
    data() {
      return {
        username: '',
        password: '',
        error: undefined,
        success: undefined,
        passwordInvalid: true,
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
      signup() {
        this.error = false;
        this.success = false;

        createAccount(this.username, this.password).then(() => {
          this.success = true;
          this.$router.push({path: "/login"})
        }).catch(() => {
          this.error = true;
        })
      }
    }
  }
</script>
<style>
.containerr{
  padding: 10px;
}
</style>