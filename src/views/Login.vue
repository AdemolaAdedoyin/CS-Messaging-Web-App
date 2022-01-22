<template>
  <div class="container">
    <div class="card login">
      <div class="card-body">
        <h2 class="card-title text-center">
          {{ step === "logIn" ? "Log In" : "Create Account" }}
        </h2>
        <form @submit.prevent="login" class="text-center">
          <div class="form-group margin">
            <input
              type="text"
              class="form-control"
              placeholder="Please enter your name"
              name="name"
              required
              v-model="name"
              autocomplete="off"
            />
          </div>
          <div v-if="step === 'singUp'">
            <div class="form-group margin">
              <input
                type="number"
                class="form-control"
                placeholder="Please enter your phone number"
                name="phoneNumber"
                required
                v-model="phoneNumber"
                autocomplete="off"
              />
            </div>
            <div class="form-group margin">
              <input
                type="email"
                class="form-control"
                placeholder="Please enter your email address"
                name="email"
                required
                v-model="email"
                autocomplete="off"
              />
            </div>
          </div>
          <div class="form-group margin">
            <select
              required
              name="role"
              id="role"
              class="form-control"
              v-model="role"
            >
              <option value="null" disabled>Please select your role</option>
              <option v-for="option in roleList" v-bind:key="option.text">
                {{ option.text }}
              </option>
            </select>
          </div>
          <p v-if="errorText" class="text-danger margin">{{ errorText }}</p>
          <button id="submit" type="submit" class="btn btn-primary margin">
            {{ step === "logIn" ? "Log In" : "Create Account" }}
          </button>
          <p
            @click="changeStep"
            style="color: blue; cursor: pointer"
            class="link"
          >
            {{ step === "logIn" ? "Create Account ?" : "LogIn ?" }}
          </p>
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
      email: "",
      phoneNumber: "",
      errorText: null,
      role: null,
      step: "logIn",
      roleList: [
        { value: "customer", text: "Customer" },
        { value: "customerRepresentative", text: "Customer Representative" },
      ],
    };
  },
  methods: {
    changeStep() {
      this.step = this.step === "logIn" ? "singUp" : "logIn";
    },
    // log in for customers or customer Rep
    async login() {
      const button = document.getElementById("submit");
      this.errorText = null;

      if (this.name && this.role) {
        button.disabled = true;

        this.name = this.name.toLowerCase();

        const user = await fb.userProcess(this.role + "s", {
          name: this.name,
          role: this.role,
          email: this.email,
          phoneNumber: this.phoneNumber,
        });

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
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
