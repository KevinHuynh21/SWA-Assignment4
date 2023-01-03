<template>
  <div>
  <h4>Profile</h4>

    <form @submit.prevent="editUser">
      <div class="containerr">
          <label for="username">Username</label>
          <input v-model="username" type="text" placeholder="Username" class="username">
        </div>
          
        <div class="containerr">
          <label for="password">Old password</label>
          <input v-model="oldPassword" type="password" placeholder="Old password" class="password">
          <small class="text-danger" v-if="oldPassword.length && oldPasswordInvalid">Password should be between 3 - 12 letters</small>
        </div>

        <div class="containerr">
          <label for="password">New password</label>
          <input v-model="newPassword" type="password" placeholder="New password" class="password">
          <small class="text-danger" v-if="newPassword.length && newPasswordInvalid">Password should be between 3 - 12 letters</small>
        </div>
          
        <div class="containerr">
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>

        <div class="containerr">
          <button @click="Logout()"  type="submit" class="btn btn-secondary">Logout</button>
        </div>
        
       
        <div v-if="error" class="text-danger">An error occurred</div>

        <div v-if="authenticationError" class="text-danger">Invalid password</div>


<!-- 
      <div class="form-group mt-4">
        <div>Username</div>
        <input v-model="username" type="text" :disabled="disabled" class="form-control mt-1">
      </div>
      <div class="form-group mt-4">
        <div>Old Password</div>
        <input v-model="oldPassword" type="password" class="form-control mt-1">
        <small class="text-danger" v-if="oldPassword.length && oldPasswordInvalid">Password should be between 3 - 12 letters</small>
      </div>
      <div class="form-group mt-4">
        <div>New Password</div>
        <input v-model="newPassword" type="password" class="form-control mt-1">
        <small class="text-danger" v-if="newPassword.length && newPasswordInvalid">Password should be between 3 - 12 letters</small>
      </div>
      <button type="submit" class="btn btn-primary"
      >Save Changes</button>
      <button @click="Logout()"  type="submit" class="btn btn-small">Logout</button>

      <div v-if="error" class="alert alert-danger">
        Error occured. Try again later.
      </div>

      <div v-if="passwordMismatch" class="alert alert-danger">
        Old password is incorrect!
      </div>

      <div v-if="success" class="alert alert-success">
        Account updated successfully!
      </div> -->
    </form>
  </div>

</template>

<script>
import { getUser, updateAccount, logout} from '../services/auth.service';

export default {
  data() {
    return {
      username: '',
      oldPassword: '',
      oldPasswordForAPI: ``,
      newPassword: '',
      error: undefined,
      success: undefined,
      number: 0,
      disabled: true,
      userId: undefined,

      oldPasswordInvalid: true,
      newPasswordInvalid: true,
      passwordMismatch: false,
    }
  },
  watch: {
    newPassword() {
      if(this.newPassword.length < 3 || this.newPassword.length > 12) {
        this.newPasswordInvalid = true;
        return;
      }
      this.newPasswordInvalid = false;
    },
    oldPassword() {
      if(this.oldPassword.length < 3 || this.oldPassword.length > 12) {
        this.oldPasswordInvalid = true;
        return;
      }
      this.oldPasswordInvalid = false;
    }
  },
  methods: {
    Logout() {
        logout();
        this.$router.replace({path: "/login"})
      },
    editUser() {
      this.error = false;
      this.success = false;
      this.passwordInvalid = false;
      this.passwordMismatch = false;

      if (this.oldPassword !== this.oldPasswordForAPI) {
        this.passwordMismatch = true;
        return;
      }

      updateAccount(this.userId, {
        password: this.newPassword,
      }).then(() => {
        this.success = true;
      }).catch(() => {
        this.error = true;
      })
    },
  }, 
  beforeMount() {
       if (localStorage.getItem(`user`)) {
        this.userId = parseInt(JSON.parse(localStorage.getItem(`user`)).userId, 10);
        getUser(this.userId).then((response) => {
          this.username = response.username;
          this.oldPasswordForAPI = response.password;
        });
      }
    },
  
}
</script>

<style>
.text-left {
  text-align: left;
}
.w-35 {
  width: 35%;
}
.containerr{
  padding: 10px;
}
</style>
