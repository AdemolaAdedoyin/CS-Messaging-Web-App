<template>
  <div class="container" style="margin-bottom: 30px">
    <form @submit.prevent="createMessage">
      <div class="form-group">
        <input
          type="text"
          class="form-control"
          name="message"
          placeholder="Enter message ....."
          autocomplete="off"
          v-model="newMessage"
        />
        <p class="text-danger" v-if="errorText">{{ errorText }}</p>
      </div>
      <button class="btn btn-primary margin" type="submit" name="action">
        Submit
      </button>
    </form>
  </div>
</template>

<script>
import fb from "@/firebase/init";
export default {
  name: "CreateMessage",
  props: ["name"],
  data() {
    return { newMessage: null, errorText: null };
  },
  methods: {
    createMessage() {
      if (this.newMessage) {
        fb.writeMessage(this.name, this.name, this.newMessage);
        this.newMessage = null;
        this.errorText = null;
      } else {
        this.errorText = "A message must be entered";
      }
    },
  },
};
</script>
<style scoped>
.margin {
  margin-bottom: 5%;
  margin-top: 3%;
  margin-left: 3%;
  margin-right: 3%;
}
</style>
