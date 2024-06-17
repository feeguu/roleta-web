const express = require("express");
const firebase = require("firebase-admin");
const cors = require("cors");

const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = require("../serviceAccount.json");

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
});

const auth = getAuth();
const firestore = getFirestore();

const app = express();

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());

app.post("/bet", async (req, res) => {
  const userToken = req.headers.authorization.split(" ")[1];

  if (!userToken) res.status(400).json({ message: "Invalid token" });

  const { red, green, black } = req.body;

  if (red === undefined || green === undefined || black === undefined) {
    return res.status(400).json({ message: "Missing params" });
  }

  const redNumber = parseInt(red);
  const greenNumber = parseInt(green);
  const blackNumber = parseInt(black);

  if (redNumber < 0 || greenNumber < 0 || blackNumber < 0) {
    return res.status(400).json({ message: "Invalid params: Negative bets" });
  }

  if (isNaN(redNumber) || isNaN(greenNumber) || isNaN(blackNumber)) {
    return res.status(400).json({ message: "Invalid params: Not a number" });
  }

  try {
    const decodedToken = await auth.verifyIdToken(userToken);
    const { uid } = decodedToken;

    const number = Math.floor(Math.random() * 37);

    const userRef = firestore.collection("users").doc(uid);
    const userDoc = await userRef.get();

    const lostedValue = redNumber + greenNumber + blackNumber;

    if (userDoc.data().balance < lostedValue) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    let winValue = 0;

    if (number === 0) {
      winValue = greenNumber * 14;
    } else if (number % 2 === 0) {
      winValue = blackNumber * 2;
    } else {
      winValue = redNumber * 2;
    }

    await userRef.update({
      balance: userDoc.data().balance - lostedValue + winValue,
    });

    return res.status(200).json({ number });
  } catch (e) {
    console.log(e);
    return res.status(400).json({ message: "Invalid token" });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
