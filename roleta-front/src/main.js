/**
 * @typedef {import("./roulette").Roulette} Roulette
 * @typedef {"red" | "green" | "black"} Color
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import "../index.css";
import { auth, db } from "./firebase";
import { setupRoulette } from "./roulette";
import { doc, getDoc, setDoc } from "firebase/firestore";

let userToken = null;
let authPage = "login";

const userInfo = document.querySelector("#user-info");
const authModal = document.querySelector("#auth-modal");

const loginForm = document.querySelector("#login-form");

const loginAnchor = document.querySelector("#login-anchor");
const registerAnchor = document.querySelector("#register-anchor");

function setUIBalance(callback) {
  const balance = document.querySelector("#balance");
  const value = callback(parseInt(balance.textContent));

  balance.textContent = value;
}

function setAuthPageToLogin() {
  authPage = "login";
  loginForm.querySelector("button").textContent = "Login";
  loginForm.querySelector("h2").textContent = "Login";

  loginForm.querySelector("#login-anchor").classList.add("hidden");
  loginForm.querySelector("#register-anchor").classList.remove("hidden");

  loginForm.reset();
}

function setAuthPageToRegister() {
  authPage = "register";

  loginForm.querySelector("button").textContent = "Registrar";
  loginForm.querySelector("h2").textContent = "Registrar";

  loginForm.querySelector("#login-anchor").classList.remove("hidden");
  loginForm.querySelector("#register-anchor").classList.add("hidden");

  loginForm.reset();
}

loginAnchor.addEventListener("click", setAuthPageToLogin);
registerAnchor.addEventListener("click", setAuthPageToRegister);

const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = emailInput.value;
  const password = passwordInput.value;

  if (authPage === "register") {
    console.log("registering", { email, password });
    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
          balance: 10000,
        });

        authModal.classList.add("hidden");
      })
      .catch((error) => {
        console.error(error);
        loginForm.reset();
      });
  } else {
    console.log("login", { email, password });
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        authModal.classList.add("hidden");
      })
      .catch((error) => {
        console.error(error);
        loginForm.reset();
      });
  }
});

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    authModal.classList.remove("hidden");
    userInfo.classList.add("hidden");
  } else {
    const userData = await getDoc(doc(db, "users", user.uid));

    setUIBalance(() => userData.data().balance);

    const userEmailEl = document.getElementById("user-email");
    userEmailEl.textContent = user.email;

    authModal.classList.add("hidden");
    userInfo.classList.remove("hidden");

    user.getIdToken().then((token) => {
      userToken = token;
    });

    userInfo.appendChild(logoutButton);
  }
});

const logoutButton = document.getElementById("logout");

logoutButton.addEventListener("click", () => {
  auth.signOut();
});

const spinButton = document.querySelector("#spin");
const rouletteEl = document.querySelector("#roulette");

const defaultBetPots = {
  green: 0,
  red: 0,
  black: 0,
};

const betPots = { ...defaultBetPots };

/**
 *
 * @param {Color} color
 * @param {number} amount
 * @returns
 */
async function placeBet(color, amount) {
  if (amount <= 0) return;

  setUIBalance((balance) => balance - amount);

  betPots[color] = amount;
  const valueSpan = document.querySelector(
    `.bet-value-span[data-color="${color}"]`
  );
  valueSpan.textContent = amount;
}

/**
 *
 * @param {Color} color
 */
function clearBet(color) {
  setUIBalance((balance) => balance + betPots[color]);

  const input = document.querySelector(`.bet-input[data-color="${color}"]`);

  input.value = null;
  betPots[color] = 0;

  const valueSpan = document.querySelector(
    `.bet-value-span[data-color="${color}"]`
  );
  valueSpan.textContent = "";
}

const betBtns = document.querySelectorAll(".bet-btn");

betBtns.forEach((btn) => {
  const color = btn.dataset.color;

  btn.addEventListener("click", async () => {
    const input = document.querySelector(`.bet-input[data-color="${color}"]`);
    const amount = parseInt(input.value);

    if (betPots[color] > 0) {
      clearBet(color);

      btn.textContent = `Apostar (${color === "green" ? "14" : "2"}x)`;
      input.value = null;
      return;
    }

    if (amount <= 0 || isNaN(amount)) return;

    const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    if (userDoc.data().balance < amount) return;

    await placeBet(color, amount);
    input.value = null;
    btn.textContent = "Limpar";
  });
});

let randomNumber = null;

const roulette = setupRoulette(rouletteEl, async () => {
  const colors = Object.keys(betPots);

  const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
  setUIBalance(() => userDoc.data().balance);

  colors.forEach((color) => {
    betPots[color] = 0;

    const input = document.querySelector(`.bet-input[data-color="${color}"]`);
    input.value = null;

    const btn = document.querySelector(`.bet-btn[data-color="${color}"]`);
    btn.textContent = `Apostar (${color === "green" ? "14" : "2"}x)`;

    const valueSpan = document.querySelector(
      `.bet-value-span[data-color="${color}"]`
    );

    valueSpan.textContent = "";
  });
});

spinButton.addEventListener("click", () => {
  if (Object.values(betPots).every((pot) => pot === 0)) {
    console.log("no bets placed");
    return;
  }

  if (!userToken) {
    console.error("User not logged in");
    return;
  }

  fetch("http://localhost:3000/bet", {
    headers: {
      Authorization: `Bearer ${userToken}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(betPots),
  })
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      randomNumber = data.number;
      roulette.spin(randomNumber);
    })
    .catch((error) => {
      console.error(error);
      clearBet("green");
      clearBet("red");
      clearBet("black");

      setUIBalance(
        async () =>
          (await getDoc(doc(db, "users", auth.currentUser.uid))).data().balance
      );
    });
});
