// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import config from "../../config/index";
import {
  getFirestore,
  doc,
  setDoc,
  addDoc,
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

async function createUser(collectionName, userName, role) {
  try {
    const documentRef = doc(firestore, `${collectionName}/${userName}`);

    const obj = {
      name: userName,
      role,
      timestamp: new Date(),
    };
    await setDoc(documentRef, obj);

    return obj;
  } catch (error) {
    console.log(error);
  }
}

async function logIn(collectionName, name, role) {
  try {
    const queryFilter = query(
      collection(firestore, collectionName),
      where("name", "==", name),
      where("role", "==", role)
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

async function createRoom(customerName) {
  try {
    const documentRef = doc(firestore, `Rooms/${customerName}'s Room`);

    let rep = await getRep("Customer Representatives");
    if (!rep) rep = {};

    await setDoc(documentRef, {
      customerName,
      assignedTo: rep?.name || "",
      //   lastUpdated: new Date(),
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

async function userProcess(collectionName, userName, role) {
  try {
    let user = await logIn(collectionName, userName, role);
    if (!user) {
      await createUser(collectionName, userName, role);
      user = { name: userName, role };
    }

    let room;
    if (role === "Customer Representative") room = true;
    else {
      room = await getSingleRoom(user.name);
      if (!room) {
        const createdRoom = await createRoom(user.name);
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
