<template>
  <div class="container">
    <div class="card login">
      <div class="card-body">
        <h2 class="card-title text-center">Login</h2>
        <form @submit.prevent="login" class="text-center">
          <div class="form-group margin">
            <input
              type="text"
              class="form-control"
              placeholder="Please enter your name"
              name="name"
              v-model="name"
              autocomplete="off"
            />
          </div>
          <div class="form-group margin">
            <select name="role" id="role" class="form-control" v-model="role">
              <option value="null" disabled>Please select your role</option>
              <option v-for="option in roleList" v-bind:key="option.text">
                {{ option.text }}
              </option>
            </select>
          </div>
          <p v-if="errorText" class="text-danger margin">{{ errorText }}</p>
          <button id="submit" type="submit" class="btn btn-primary margin">
            Log In
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import fb from "@/firebase/init";

export default {
  name: "Login",
  data() {
    return {
      name: "",
      errorText: null,
      role: null,
      roleList: [
        { value: "customer", text: "Customer" },
        { value: "customerRepresentative", text: "Customer Representative" },
      ],
    };
  },
  methods: {
    async login() {
      const button = document.getElementById("submit");
      this.errorText = null;

      if (this.name && this.role) {
        button.disabled = true;

        // this.name = this.name.toLowerCase();

        const user = await fb.userProcess(
          this.role + "s",
          this.name,
          this.role
        );

        if (user && this.role === "Customer") {
          this.$router.push({
            name: "chat",
            params: { name: this.name },
          });
        } else if (user && this.role === "Customer Representative") {
          this.$router.push({
            name: "rep-chat",
            params: { repName: this.name },
          });
        } else {
          this.errorText = "Something went wrong.";
          button.disabled = true;
        }
      } else this.errorText = "Please fill all fields";
    },
  },
};
</script>

<style scoped>
.login {
  max-width: 450px;
  margin-top: 50px;
  display: block;
  margin-left: auto;
  margin-right: auto;
}
.margin {
  margin-bottom: 5%;
  margin-top: 3%;
  margin-left: 3%;
  margin-right: 3%;
}
</style>
