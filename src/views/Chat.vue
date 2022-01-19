<template>
  <div class="container chat">
    <h2 class="text-primary text-center">CS Messaging App</h2>
    <h5 class="text-secondary text-center">Powered by Vue JS & Firebase</h5>
    <div class="card">
      <div class="card-body">
        <p v-if="messages.length === 0" class="text-secondary nomessages">
          [No messages yet!]
        </p>
        <div id="messages" class="messages">
          <div v-for="message in messages" :key="message.id">
            <span class="text-info"> [{{ message.name }}]: </span>
            <span> {{ message.message }} </span>
            <span class="text-secondary time"> {{ message.timestamp }} </span>
          </div>
        </div>
      </div>
      <div class="card-action">
        <CreateMessage :name="name" />
      </div>
    </div>
  </div>
</template>

<script>
import CreateMessage from "@/components/CreateMessage";
import fb from "@/firebase/init";
import moment from "moment";

let unscribe;

export default {
  name: "Chat",
  props: ["name"],
  components: {
    CreateMessage,
  },
  data() {
    return {
      messages: [],
    };
  },
  created() {
    this.subscribeToMessages();
  },
  methods: {
    subscribeToMessages() {
      try {
        const queryFilter = fb.firebase.query(
          fb.firebase.collection(
            fb.firebase.firestore,
            `Rooms/${this.name}'s Room/messages`
          ),
          fb.firebase.orderBy("timestamp")
        );

        unscribe = fb.firebase.onSnapshot(queryFilter, (docSnapShot) => {
          docSnapShot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const newMessage = change.doc;
              this.messages.push({
                id: newMessage.id,
                name: newMessage.data().from,
                message: newMessage.data().message,
                timestamp: moment(newMessage.data().timestamp).format("LTS"),
              });
              console.log("New change: ", change.doc.data());
            }
          });
        });
      } catch (error) {
        console.log(error);
      }
    },
    cancelListeners() {
      unscribe();
    },
  },
};
</script>

<style scoped>
.chat h2 {
  font-size: 2.6em;
  margin-bottom: 0px;
}

.chat h5 {
  margin-top: 0px;
  margin-bottom: 40px;
}

.chat span {
  font-size: 1.2em;
}

.chat .time {
  display: block;
  font-size: 0.7em;
}

.messages {
  max-height: 300px;
  overflow: auto;
}
</style>
