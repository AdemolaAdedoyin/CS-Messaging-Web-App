// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import config from "../../config/index";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  getDocs,
  where,
  query,
  orderBy,
  onSnapshot,
  limit,
  updateDoc,
} from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
let functions = {};

const firebaseConfig = config;

// Initialize Firebase
initializeApp(firebaseConfig);
const firestore = getFirestore();

async function createUser(collectionName, obj = {}) {
  try {
    const documentRef = doc(firestore, `${collectionName}/${obj.name}`);

    const userObj = {
      name: obj.name,
      role: obj.role,
      timestamp: new Date(),
    };
    await setDoc(documentRef, userObj);

    return userObj;
  } catch (error) {
    console.log(error);
  }
}

async function logIn(collectionName, obj = {}) {
  try {
    const queryFilter = query(
      collection(firestore, collectionName),
      where("name", "==", obj.name),
      where("role", "==", obj.role)
    );

    const querySnapShot = await getDocs(queryFilter);
    querySnapShot.forEach((snap) => {
      result = snap.data();
    });

    return result;
  } catch (error) {
    console.log(error);
  }
  let result;
}

async function createRoom(obj) {
  try {
    const documentRef = doc(firestore, `Rooms/${obj.name}'s Room`);

    let rep = await getRep("Customer Representatives");
    if (!rep) rep = {};

    await setDoc(documentRef, {
      customerName: obj.name,
      assignedTo: rep?.name || "",
      email: obj.email || "xxxx@gmail.com",
      phoneNumber: obj.phoneNumber || "xxxxxxxxxxx",
    });

    return rep;
  } catch (error) {
    console.log(error);
  }
}

async function getRep(collectionName) {
  try {
    let result;

    const queryFilter = query(
      collection(firestore, collectionName),
      orderBy("timestamp"),
      limit(1)
    );
    const querySnapShot = await getDocs(queryFilter);

    querySnapShot.forEach((snap) => {
      result = snap.data();
    });

    if (result) {
      const documentRef = doc(firestore, `${collectionName}/${result.name}`);
      await updateDoc(documentRef, { timestamp: new Date() });
    }

    return result;
  } catch (error) {
    console.log(error);
  }
}

async function getSingleRoom(name) {
  try {
    let result;

    const queryFilter = query(
      collection(firestore, "Rooms"),
      where("customerName", "==", name)
    );

    const querySnapShot = await getDocs(queryFilter);
    querySnapShot.forEach((snap) => {
      result = snap.data();
    });

    return result;
  } catch (error) {
    console.log(error);
  }
}

// logs in or creates the user
// creates a room if non is found, only for customers
async function userProcess(collectionName, obj = {}) {
  try {
    let user = await logIn(collectionName, obj);
    if (!user) {
      await createUser(collectionName, obj);
      user = { ...obj };
    }

    let room;
    if (obj.role === "Customer Representative") room = true;
    else {
      room = await getSingleRoom(user.name);
      if (!room) {
        const createdRoom = await createRoom(user);
        room = { assignedTo: createdRoom.name, customerName: user.name };
      }
    }

    return user && room ? true : false;
  } catch (error) {
    console.log(error);
  }
}

functions.userProcess = userProcess;

async function writeMessage(customerName, from, message) {
  const docData = {
    from,
    message,
    timestamp: Date.now(),
  };

  try {
    const documentRef = doc(
      firestore,
      `Rooms/${customerName}'s Room/messages/message${docData.timestamp}`
    );
    await setDoc(documentRef, docData, { merge: true }); // add to collection and specific document id
    await setDoc(
      doc(firestore, `Rooms/${customerName}'s Room`),
      {
        lastUpdated: new Date(),
      },
      { merge: true }
    );
  } catch (error) {
    console.log("There was an error", error);
  }

  return true;
}

functions.writeMessage = writeMessage;

functions.firebase = {
  collection,
  orderBy,
  onSnapshot,
  firestore,
  query,
  where,
};

export default functions;
