<template>
  <div class="container-fluid h-100">
    <template v-if="showModal" type="text/x-template" id="modal-template">
      <transition name="modal">
        <div class="modal-mask">
          <div class="modal-wrapper">
            <div class="modal-container">
              <div class="modal-header"></div>

              <div class="modal-body">
                <div class="modal-body-content">
                  <div class="modal-body-item">
                    <p class="modal-body-item-lead">Name:</p>
                    <p>
                      <b> {{ active }} </b>
                    </p>
                  </div>
                  <div class="modal-body-item">
                    <p class="modal-body-item-lead">Email:</p>
                    <p>
                      <b>{{ filteredChatRoom[active].email }}</b>
                    </p>
                  </div>
                  <div class="modal-body-item">
                    <p class="modal-body-item-lead">Number:</p>
                    <p>
                      <b> {{ filteredChatRoom[active].phoneNumber }} </b>
                    </p>
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <slot name="footer">
                  <button class="btn btn-primary" @click="toggleShowModal">
                    Cancel
                  </button>
                </slot>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </template>
    <div class="row justify-content-center h-100">
      <div class="col-md-4 col-xl-3 chat">
        <div class="card mb-sm-3 mb-md-0 contacts_card">
          <div class="card-header">
            <div class="input-group">
              <input
                type="text"
                placeholder="Search..."
                name=""
                class="form-control search"
                v-model="search"
                v-on:change="filter"
              />
              <div class="input-group-prepend">
                <span class="input-group-text search_btn"
                  ><i class="fas fa-search"></i
                ></span>
              </div>
            </div>
          </div>
          <div class="card-body contacts_body" v-if="loading">
            <ul class="contacts">
              <li>
                <div class="d-flex bd-highlight">
                  <div class="img_cont"></div>
                  <div class="user_info">
                    <span>LOADING !!!!!!!! </span>
                  </div>
                </div>
              </li>
            </ul>
          </div>
          <div class="card-body contacts_body" v-else-if="chatsAvailable">
            <ul
              class="contacts"
              v-for="room in Object.keys(filteredChatRoom)"
              v-bind:key="room"
              :id="room"
              style="cursor: pointer"
              @click="makeActive(room)"
            >
              <li>
                <div class="d-flex bd-highlight">
                  <div class="img_cont">
                    <img
                      src="https://static.turbosquid.com/Preview/001292/481/WV/_D.jpg"
                      class="rounded-circle user_img"
                    />
                    <span class="online_icon"></span>
                  </div>
                  <div class="user_info">
                    <span>{{ room.toUpperCase() }}</span>
                    <p>
                      {{
                        filteredChatRoom[room].messages[
                          filteredChatRoom[room].messages.length - 1
                        ].message
                      }}
                    </p>
                  </div>
                </div>
              </li>
            </ul>
          </div>
          <div class="card-body contacts_body" v-else>
            <ul class="contacts">
              <li>
                <div class="d-flex bd-highlight">
                  <div class="img_cont"></div>
                  <div class="user_info">
                    <span>NO MESSAGES </span>
                    <p>!!!!!!!!!!!!!!!!</p>
                  </div>
                </div>
              </li>
            </ul>
          </div>
          <div class="card-footer"></div>
        </div>
      </div>
      <div class="col-md-8 col-xl-6 chat">
        <div class="card">
          <div class="card-header msg_head" v-if="active && chatsAvailable">
            <div class="d-flex bd-highlight">
              <div class="img_cont">
                <img
                  src="https://static.turbosquid.com/Preview/001292/481/WV/_D.jpg"
                  class="rounded-circle user_img"
                />
                <span class="online_icon"></span>
              </div>
              <div class="user_info">
                <span>Chat with {{ active }}</span>
                <p>{{ filteredChatRoom[active].messages.length }} Message(s)</p>
              </div>
              <div class="video_cam">
                <span><i class="fas fa-video"></i></span>
                <span><i class="fas fa-phone"></i></span>
              </div>
            </div>
            <span @click="actionButton" id="action_menu_btn"
              ><i class="fas fa-ellipsis-v"></i
            ></span>
            <div class="action_menu">
              <ul>
                <li @click="toggleShowModal">
                  <i class="fas fa-user-circle"></i> View profile
                </li>
                <li><i class="fas fa-users"></i> Add to close friends</li>
                <li><i class="fas fa-plus"></i> Add to group</li>
                <li><i class="fas fa-ban"></i> Block</li>
              </ul>
            </div>
          </div>
          <div
            id="messages"
            class="card-body msg_card_body"
            v-if="active && chatsAvailable"
          >
            <div
              v-for="message in filteredChatRoom[active].messages"
              v-bind:key="message.id"
            >
              <div
                v-if="message.name === active"
                class="d-flex justify-content-start mb-4"
              >
                <div class="img_cont_msg">
                  <img
                    src="https://static.turbosquid.com/Preview/001292/481/WV/_D.jpg"
                    class="rounded-circle user_img_msg"
                  />
                </div>
                <div class="msg_cotainer">
                  {{ message.message }}
                  <span class="msg_time">{{ message.timestamp }} </span>
                </div>
              </div>
              <div v-else class="d-flex justify-content-end mb-4">
                <div class="msg_cotainer_send">
                  {{ message.message }}
                  <span class="msg_time_send">{{ message.timestamp }}</span>
                </div>
                <div class="img_cont_msg">
                  <img
                    src="https://bootdey.com/img/Content/avatar/avatar1.png"
                    class="rounded-circle user_img_msg"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="card-footer" v-if="active && chatsAvailable">
            <div class="input-group">
              <div class="input-group-append">
                <span class="input-group-text attach_btn"
                  ><i class="fas fa-paperclip"></i
                ></span>
              </div>
              <textarea
                name=""
                class="form-control type_msg"
                placeholder="Type your message..."
                v-model="message"
              ></textarea>
              <div class="input-group-append" @click="sendMessage">
                <span class="input-group-text send_btn"
                  ><i class="fas fa-location-arrow"></i
                ></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import $ from "jquery";
import fb from "@/firebase/init";
import moment from "moment";

export default {
  name: "cs-chat",
  props: ["repName"],
  data() {
    return {
      showModal: false,
      chatRoom: {},
      roomObj: {},
      filteredChatRoom: {},
      newMessages: {},
      chatsAvailable: false,
      message: "",
      active: "", // active room
      previousActive: "",
      loading: true,
      search: "",
    };
  },
  watch: {},
  created() {
    this.listenToRoomChange(); // to listen for when new rooms are created
  },
  methods: {
    toggleShowModal() {
      this.showModal = !this.showModal;
    },
    priority() {
      // this gets the priority messages. Currently only checks for loans, by checking the last two messages in each chat
      const priorityObj = {};
      for (const room in this.chatRoom) {
        const current = this.chatRoom[room];
        for (
          let message = current.messages.length - 2;
          message < current.messages.length;
          message++
        ) {
          if (current.messages[message]?.message.includes("loan"))
            priorityObj[room] = this.chatRoom[room];
        }
      }
      return priorityObj;
    },
    sort() {
      // this sorts the messages by most recent
      const sortedObj = this.priority();
      const sortable = Object.fromEntries(
        Object.entries(this.roomObj).sort(([, a], [, b]) => b - a)
      );

      for (const item in sortable) {
        if (!Object.keys(sortedObj).includes(item))
          sortedObj[item] = this.chatRoom[item];
      }

      return sortedObj;
    },
    filter() {
      // this method is used to filter the results by name
      if (this.search === "") this.filteredChatRoom = this.sort();
      else {
        this.filteredChatRoom = {};
        Object.keys(this.chatRoom).filter((room) =>
          room.includes(this.search)
            ? (this.filteredChatRoom[room] = this.chatRoom[room])
            : null
        );
        if (!Object.keys(this.filteredChatRoom).includes(this.active))
          this.active = "";
      }
    },
    sendMessage() {
      if (this.message) {
        fb.writeMessage(this.active, this.repName, this.message);
        this.message = null;
        this.autoScroll();
      }
    },
    actionButton() {
      $(".action_menu").toggle();
    },
    listenToRoomChange() {
      try {
        const queryFilter = fb.firebase.query(
          fb.firebase.collection(fb.firebase.firestore, "Rooms"),
          fb.firebase.where("assignedTo", "==", this.repName),
          fb.firebase.orderBy("lastUpdated", "desc")
        );

        fb.firebase.onSnapshot(queryFilter, (docSnapShot) => {
          docSnapShot.docChanges().forEach((change) => {
            if (change.type === "added") {
              console.log(
                "changes to room: ",
                change.doc.data().customerName,
                change.doc.data().lastUpdated
              );
              this.chatRoom[change.doc.data().customerName] = {
                phoneNumber: change.doc.data().phoneNumber,
                email: change.doc.data().email,
                messages: [],
              }; // assign users details to Object
              this.listenToMessageChange([change.doc.data().customerName]);
            }
          });
          this.loading = false;
        });
      } catch (error) {
        console.log(error);
      }
    },
    async listenToMessageChange(rooms) {
      try {
        if (rooms.length === 0) this.loading = false;
        rooms.forEach((room) => {
          const queryFilter = fb.firebase.query(
            fb.firebase.collection(
              fb.firebase.firestore,
              `Rooms/${room}'s Room/messages`
            ),
            fb.firebase.orderBy("timestamp")
          );

          fb.firebase.onSnapshot(queryFilter, (docSnapShot) => {
            docSnapShot.docChanges().forEach((change) => {
              if (change.type === "added") {
                this.newMessages[room] = change.doc;
                this.chatRoom[room].messages.push({
                  id: this.newMessages[room].id,
                  name: this.newMessages[room].data().from,
                  message: this.newMessages[room].data().message,
                  timestamp: moment(
                    this.newMessages[room].data().timestamp
                  ).format("LT"),
                });
                console.log("addition: ", room, change.doc.data().message);
                this.roomObj[room] = this.newMessages[room].data().timestamp;
              }
            });
            this.filter();
            this.autoScroll();
            this.loading = false;
            this.chatsAvailable = true;
          });
        });
      } catch (error) {
        console.log(error);
      }
    },
    makeActive(room) {
      // this is to set an active room
      this.previousActive = this.active;
      this.active = room;
      let element = document.getElementById(this.active);
      let previousElement = document.getElementById(this.previousActive);
      this.message = "";
      if (previousElement) previousElement.classList.remove("active"); // remove previous
      if (element) element.classList.add("active"); // make active
      this.autoScroll();
    },
    autoScroll() {
      setTimeout(() => {
        var element = document.getElementById("messages");
        if (element)
          element.scrollTop = element.scrollHeight - element.clientHeight;
      }, 100);
    },
  },
};
</script>

<style scoped>
body,
html {
  height: 100%;
  margin: 0;
  background: #7f7fd5;
  background: -webkit-linear-gradient(to right, #91eae4, #86a8e7, #7f7fd5);
  background: linear-gradient(to right, #91eae4, #86a8e7, #7f7fd5);
}

.chat {
  margin-top: auto;
  margin-bottom: auto;
}
.card {
  height: 500px;
  border-radius: 15px !important;
  background-color: rgba(0, 0, 0, 0.4) !important;
}
.contacts_body {
  padding: 0.75rem 0 !important;
  overflow-y: auto;
  white-space: nowrap;
}
.msg_card_body {
  overflow-y: auto;
}
.card-header {
  border-radius: 15px 15px 0 0 !important;
  border-bottom: 0 !important;
}
.card-footer {
  border-radius: 0 0 15px 15px !important;
  border-top: 0 !important;
}
.container {
  align-content: center;
}
.search {
  border-radius: 15px 0 0 15px !important;
  background-color: rgba(0, 0, 0, 0.3) !important;
  border: 0 !important;
  color: white !important;
}
.search:focus {
  box-shadow: none !important;
  outline: 0px !important;
}
.type_msg {
  background-color: rgba(0, 0, 0, 0.3) !important;
  border: 0 !important;
  color: white !important;
  height: 60px !important;
  overflow-y: auto;
}
.type_msg:focus {
  box-shadow: none !important;
  outline: 0px !important;
}
.attach_btn {
  border-radius: 15px 0 0 15px !important;
  background-color: rgba(0, 0, 0, 0.3) !important;
  border: 0 !important;
  color: white !important;
  cursor: pointer;
}
.send_btn {
  border-radius: 0 15px 15px 0 !important;
  background-color: rgba(0, 0, 0, 0.3) !important;
  border: 0 !important;
  color: white !important;
  cursor: pointer;
}
.search_btn {
  border-radius: 0 15px 15px 0 !important;
  background-color: rgba(0, 0, 0, 0.3) !important;
  border: 0 !important;
  color: white !important;
  cursor: pointer;
}
.contacts {
  list-style: none;
  padding: 0;
}
.contacts li {
  width: 100% !important;
  padding: 1px 10px;
  margin-bottom: 15px !important;
}
.active {
  background-color: rgba(0, 0, 0, 0.3);
}
.user_img {
  height: 70px;
  width: 70px;
  border: 1.5px solid #f5f6fa;
}
.user_img_msg {
  height: 40px;
  width: 40px;
  border: 1.5px solid #f5f6fa;
}
.img_cont {
  position: relative;
  height: 70px;
  width: 70px;
}
.img_cont_msg {
  height: 40px;
  width: 40px;
}
.online_icon {
  position: absolute;
  height: 15px;
  width: 15px;
  background-color: #4cd137;
  border-radius: 50%;
  bottom: 0.2em;
  right: 0.4em;
  border: 1.5px solid white;
}
.offline {
  background-color: #c23616 !important;
}
.user_info {
  margin-top: auto;
  margin-bottom: auto;
  margin-left: 15px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
}
.user_info span {
  font-size: 20px;
  color: white;
}
.user_info p {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
}
.video_cam {
  margin-left: 50px;
  margin-top: 5px;
}
.video_cam span {
  color: white;
  font-size: 20px;
  cursor: pointer;
  margin-right: 20px;
}
.msg_cotainer {
  margin-top: auto;
  margin-bottom: auto;
  margin-left: 10px;
  border-radius: 25px;
  background-color: #82ccdd;
  padding: 10px;
  position: relative;
}
.msg_cotainer_send {
  margin-top: auto;
  margin-bottom: auto;
  margin-right: 10px;
  border-radius: 25px;
  background-color: #78e08f;
  padding: 10px;
  position: relative;
}
.msg_time {
  position: absolute;
  left: 0;
  bottom: -15px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 10px;
}
.msg_time_send {
  position: absolute;
  right: 0;
  bottom: -15px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 10px;
}
.msg_head {
  position: relative;
}
#action_menu_btn {
  position: absolute;
  right: 10px;
  top: 10px;
  color: white;
  cursor: pointer;
  font-size: 20px;
}
.action_menu {
  z-index: 1;
  position: absolute;
  padding: 15px 0;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 15px;
  top: 30px;
  right: 15px;
  display: none;
}
.action_menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.action_menu ul li {
  width: 100%;
  padding: 10px 15px;
  margin-bottom: 5px;
}
.action_menu ul li i {
  padding-right: 10px;
}
.action_menu ul li:hover {
  cursor: pointer;
  background-color: rgba(0, 0, 0, 0.2);
}
@media (max-width: 576px) {
  .contacts_card {
    margin-bottom: 15px !important;
  }
}
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: table;
  transition: opacity 0.3s ease;
}

.modal-wrapper {
  display: table-cell;
  vertical-align: middle;
}

.modal-container {
  width: 300px;
  margin: 0px auto;
  padding: 20px 30px;
  background-color: #fff;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  transition: all 0.3s ease;
  font-family: Helvetica, Arial, sans-serif;
}

.modal-header h3 {
  margin-top: 0;
  color: #42b983;
}

.modal-body {
  margin: 20px 0;
}

.modal-default-button {
  float: right;
}

/*
 * The following styles are auto-applied to elements with
 * transition="modal" when their visibility is toggled
 * by Vue.js.
 *
 * You can easily play with the modal transition by editing
 * these styles.
 */

.modal-enter {
  opacity: 0;
}

.modal-leave-active {
  opacity: 0;
}

.modal-enter .modal-container,
.modal-leave-active .modal-container {
  -webkit-transform: scale(1.1);
  transform: scale(1.1);
}

.modal-header-text {
  font-weight: 300;
  font-size: 20px;
}

.modal-body-item {
  width: 100%;
  display: flex;
}

.modal-body-item-lead {
  margin-right: 10px;
}
</style>
