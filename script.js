"use strict";

/* =========================================================
   NEXUS FAUCET — FRONTEND JAVASCRIPT
   PART 1 OF 4
========================================================= */


/* =========================================================
   BACKEND
========================================================= */

const API_URL =
  "https://script.google.com/macros/s/AKfycbzwwwX_JW1YjccTPtc2xEQu2Lehu-IXzalvCQSoMrL6rCEmWeAcp-sx3HKSms-G6SyP/exec";


/* =========================================================
   FAUCET SETTINGS
========================================================= */

const REWARD = 0.00002500;
const MIN_WITHDRAWAL = 0.00050000;
const CLAIM_INTERVAL = 1800;
const DECIMALS = 8;

const SESSION_KEY =
  "nexus_session_token";


/* =========================================================
   APP STATE
========================================================= */

let currentUser = null;
let currentBalance = 0;
let claimTimer = null;


/* =========================================================
   HTML ELEMENTS
========================================================= */

let registerEmail;
let registerPassword;
let registerReferral;
let registerButton;

let loginEmail;
let loginPassword;
let loginButton;

let logoutButton;
let showLoginButton;
let showRegisterButton;

let registerSection;
let loginSection;
let accountSection;

let accountEmail;
let faucetEmail;

let balanceElement;
let claimButton;
let countdownElement;

let withdrawAmount;
let withdrawButton;

let referralLink;
let referralCopyButton;
let referralEarnings;


/* =========================================================
   START
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    getElements();

    setupButtons();

    setupReferralFromUrl();

    updateAccountUI();

    const token =
      getSessionToken();

    if (token) {

      loadAccount();

    } else {

      resetDashboard();

    }

  }
);


/* =========================================================
   FIND HTML ELEMENTS
========================================================= */

function getElements() {

  registerEmail =
    document.getElementById(
      "registerEmail"
    );

  registerPassword =
    document.getElementById(
      "registerPassword"
    );

  registerReferral =
    document.getElementById(
      "registerReferral"
    );

  registerButton =
    document.getElementById(
      "registerButton"
    );


  loginEmail =
    document.getElementById(
      "loginEmail"
    );

  loginPassword =
    document.getElementById(
      "loginPassword"
    );

  loginButton =
    document.getElementById(
      "loginButton"
    );


  logoutButton =
    document.getElementById(
      "logoutButton"
    );

  showLoginButton =
    document.getElementById(
      "showLoginButton"
    );

  showRegisterButton =
    document.getElementById(
      "showRegisterButton"
    );


  registerSection =
    document.getElementById(
      "registerSection"
    );

  loginSection =
    document.getElementById(
      "loginSection"
    );

  accountSection =
    document.getElementById(
      "accountSection"
    );


  accountEmail =
    document.getElementById(
      "accountEmail"
    );

  faucetEmail =
    document.getElementById(
      "faucetEmail"
    );


  balanceElement =
    document.getElementById(
      "balance"
    );

  claimButton =
    document.getElementById(
      "claimButton"
    );

  countdownElement =
    document.getElementById(
      "countdown"
    );


  withdrawAmount =
    document.getElementById(
      "withdrawAmount"
    );

  withdrawButton =
    document.getElementById(
      "withdrawButton"
    );


  referralLink =
    document.getElementById(
      "referralLink"
    );

  referralCopyButton =
    document.getElementById(
      "referralCopyButton"
    );

  referralEarnings =
    document.getElementById(
      "referralEarnings"
    );

}


/* =========================================================
   BUTTON EVENTS
========================================================= */

function setupButtons() {

  if (registerButton) {

    registerButton.addEventListener(
      "click",
      registerUser
    );

  }


  if (loginButton) {

    loginButton.addEventListener(
      "click",
      loginUser
    );

  }


  if (logoutButton) {

    logoutButton.addEventListener(
      "click",
      logoutUser
    );

  }


  if (claimButton) {

    claimButton.addEventListener(
      "click",
      claimReward
    );

  }


  if (withdrawButton) {

    withdrawButton.addEventListener(
      "click",
      requestWithdrawal
    );

  }


  if (showLoginButton) {

    showLoginButton.addEventListener(
      "click",
      showLogin
    );

  }


  if (showRegisterButton) {

    showRegisterButton.addEventListener(
      "click",
      showRegister
    );

  }


  if (referralCopyButton) {

    referralCopyButton.addEventListener(
      "click",
      copyReferralLink
    );

  }

}


/* =========================================================
   REGISTER
========================================================= */

async function registerUser() {

  const email =
    registerEmail
      ? registerEmail.value.trim()
      : "";

  const password =
    registerPassword
      ? registerPassword.value
      : "";

  const referral =
    registerReferral
      ? registerReferral.value.trim()
      : "";


  if (!validEmail(email)) {

    showMessage(
      "Please enter a valid email address."
    );

    return;

  }


  if (password.length < 8) {

    showMessage(
      "Password must be at least 8 characters."
    );

    return;

  }


  if (registerButton) {

    registerButton.disabled =
      true;

    registerButton.textContent =
      "CREATING...";

  }


  try {

    const response =
      await apiPost({

        action: "register",

        email: email,

        password: password,

        referral: referral

      });


    console.log(
      "REGISTER RESPONSE:",
      response
    );


    if (
      !response ||
      response.success !== true
    ) {

      throw new Error(
        response &&
        response.message
          ? response.message
          : "Registration failed."
      );

    }


    showMessage(
      response.message ||
      "Account created successfully!"
    );


    if (loginEmail) {

      loginEmail.value =
        email;

    }


    if (registerPassword) {

      registerPassword.value =
        "";

    }


    if (registerReferral) {

      registerReferral.value =
        "";

    }


    showLogin();


  } catch (error) {

    console.error(
      "REGISTER ERROR:",
      error
    );


    showMessage(
      error.message ||
      "Registration failed."
    );

  } finally {

    if (registerButton) {

      registerButton.disabled =
        false;

      registerButton.textContent =
        "CREATE ACCOUNT";

    }

  }

  }
/* =========================================================
   NEXUS FAUCET — FRONTEND JAVASCRIPT
   PART 2 OF 4
========================================================= */


/* =========================================================
   LOGIN
========================================================= */

async function loginUser() {

  const email =
    loginEmail
      ? loginEmail.value.trim()
      : "";

  const password =
    loginPassword
      ? loginPassword.value
      : "";


  if (!validEmail(email)) {

    showMessage(
      "Please enter a valid email address."
    );

    return;

  }


  if (!password) {

    showMessage(
      "Please enter your password."
    );

    return;

  }


  if (loginButton) {

    loginButton.disabled =
      true;

    loginButton.textContent =
      "LOGGING IN...";

  }


  try {

    const response =
      await apiPost({

        action: "login",

        email: email,

        password: password

      });


    console.log(
      "LOGIN RESPONSE:",
      response
    );


    if (
      !response ||
      response.success !== true
    ) {

      throw new Error(
        response &&
        response.message
          ? response.message
          : "Login failed."
      );

    }


    if (!response.token) {

      throw new Error(
        "No session token was returned."
      );

    }


    saveSessionToken(
      response.token
    );


    currentUser =
      response.user || null;


    showMessage(
      response.message ||
      "Login successful!"
    );


    if (loginPassword) {

      loginPassword.value =
        "";

    }


    updateAccountUI();


    await loadAccount();


  } catch (error) {

    console.error(
      "LOGIN ERROR:",
      error
    );


    showMessage(
      error.message ||
      "Login failed. Please try again."
    );

  } finally {

    if (loginButton) {

      loginButton.disabled =
        false;

      loginButton.textContent =
        "LOGIN";

    }

  }

}


/* =========================================================
   LOAD ACCOUNT
========================================================= */

async function loadAccount() {

  const token =
    getSessionToken();


  if (!token) {

    resetDashboard();

    return;

  }


  try {

    const response =
      await apiPost({

        action: "status",

        token: token

      });


    console.log(
      "STATUS RESPONSE:",
      response
    );


    if (
      !response ||
      response.success !== true
    ) {

      throw new Error(
        response &&
        response.message
          ? response.message
          : "Unable to load account."
      );

    }


    currentUser =
      response.user || null;


    currentBalance =
      Number(
        response.balance || 0
      );


    displayUser(
      currentUser
    );


    displayBalance(
      currentBalance
    );


    updateAccountUI();


    startClaimTimer(
      Number(
        response.secondsUntilClaim || 0
      )
    );


  } catch (error) {

    console.error(
      "LOAD ACCOUNT ERROR:",
      error
    );


    removeSessionToken();

    currentUser = null;

    currentBalance = 0;

    resetDashboard();

  }

}


/* =========================================================
   DISPLAY USER
========================================================= */

function displayUser(user) {

  if (!user) {
    return;
  }


  const email =
    user.email || "";


  if (accountEmail) {

    accountEmail.textContent =
      email;

  }


  if (faucetEmail) {

    faucetEmail.value =
      email;

  }


  if (referralEarnings) {

    referralEarnings.textContent =
      formatAmount(
        user.referralEarnings || 0
      );

  }


  if (referralLink) {

    referralLink.value =
      user.referralLink || "";

  }

}


/* =========================================================
   DISPLAY BALANCE
========================================================= */

function displayBalance(amount) {

  currentBalance =
    Number(amount) || 0;


  if (balanceElement) {

    balanceElement.textContent =
      formatAmount(
        currentBalance
      );

  }


  updateWithdrawButton();

}


/* =========================================================
   ACCOUNT UI
========================================================= */

function updateAccountUI() {

  const loggedIn =
    !!getSessionToken();


  if (registerSection) {

    registerSection.style.display =
      loggedIn
        ? "none"
        : "";

  }


  if (loginSection) {

    loginSection.style.display =
      loggedIn
        ? "none"
        : "";

  }


  if (accountSection) {

    accountSection.style.display =
      loggedIn
        ? ""
        : "none";

  }


  if (logoutButton) {

    logoutButton.style.display =
      loggedIn
        ? ""
        : "none";

  }


  if (claimButton) {

    claimButton.disabled =
      !loggedIn;


    if (!loggedIn) {

      claimButton.textContent =
        "LOGIN TO CLAIM";

    }

  }


  updateWithdrawButton();

}


/* =========================================================
   RESET DASHBOARD
========================================================= */

function resetDashboard() {

  currentUser = null;

  currentBalance = 0;


  if (balanceElement) {

    balanceElement.textContent =
      formatAmount(0);

  }


  if (accountEmail) {

    accountEmail.textContent =
      "Not logged in";

  }


  if (faucetEmail) {

    faucetEmail.value =
      "";

  }


  if (referralEarnings) {

    referralEarnings.textContent =
      formatAmount(0);

  }


  if (referralLink) {

    referralLink.value =
      "";

  }


  if (claimButton) {

    claimButton.disabled =
      true;

    claimButton.textContent =
      "LOGIN TO CLAIM";

  }


  if (countdownElement) {

    countdownElement.textContent =
      "Login to claim";

  }


  updateAccountUI();

}


/* =========================================================
   SHOW LOGIN
========================================================= */

function showLogin() {

  if (registerSection) {

    registerSection.style.display =
      "none";

  }


  if (loginSection) {

    loginSection.style.display =
      "";

  }

}


/* =========================================================
   SHOW REGISTER
========================================================= */

function showRegister() {

  if (loginSection) {

    loginSection.style.display =
      "none";

  }


  if (registerSection) {

    registerSection.style.display =
      "";

  }

}


/* =========================================================
   SESSION STORAGE
========================================================= */

function saveSessionToken(token) {

  if (!token) {
    return;
  }


  sessionStorage.setItem(
    SESSION_KEY,
    token
  );

}


function getSessionToken() {

  return sessionStorage.getItem(
    SESSION_KEY
  );

}


function removeSessionToken() {

  sessionStorage.removeItem(
    SESSION_KEY
  );

       }
/* =========================================================
   NEXUS FAUCET — FRONTEND JAVASCRIPT
   PART 3 OF 4
========================================================= */


/* =========================================================
   LOGOUT
========================================================= */

async function logoutUser() {
  const token = getSessionToken();

  try {
    if (token) {
      await apiPost({
        action: "logout",
        token: token
      });
    }
  } catch (error) {
    console.error("LOGOUT ERROR:", error);
  }

  removeSessionToken();

  if (claimTimer) {
    clearInterval(claimTimer);
    claimTimer = null;
  }

  currentUser = null;
  currentBalance = 0;

  resetDashboard();

  showMessage("You have been logged out.");
}


/* =========================================================
   CLAIM REWARD
========================================================= */

async function claimReward() {
  const token = getSessionToken();

  if (!token) {
    showMessage("Please log in before claiming.");
    return;
  }

  if (claimButton) {
    claimButton.disabled = true;
    claimButton.textContent = "CLAIMING...";
  }

  try {
    const response = await apiPost({
      action: "claim",
      token: token
    });

    console.log("CLAIM RESPONSE:", response);

    if (!response || response.success !== true) {
      throw new Error(
        response && response.message
          ? response.message
          : "Claim failed."
      );
    }

    currentBalance =
      Number(response.balance || 0);

    displayBalance(currentBalance);

    if (currentUser) {
      currentUser.referralEarnings =
        response.referralEarnings ||
        currentUser.referralEarnings ||
        0;

      displayUser(currentUser);
    }

    showMessage(
      response.message ||
      "Reward claimed successfully!"
    );

    startClaimTimer(
      Number(
        response.secondsUntilClaim ||
        CLAIM_INTERVAL
      )
    );

  } catch (error) {
    console.error("CLAIM ERROR:", error);

    showMessage(
      error.message ||
      "Claim failed. Please try again."
    );

    try {
      await loadAccount();
    } catch (reloadError) {
      console.error(
        "ACCOUNT RELOAD ERROR:",
        reloadError
      );
    }

  } finally {
    if (claimButton) {
      claimButton.disabled = true;
    }
  }
}


/* =========================================================
   CLAIM TIMER
========================================================= */

function startClaimTimer(seconds) {

  if (claimTimer) {
    clearInterval(claimTimer);
    claimTimer = null;
  }

  let remaining =
    Math.max(0, Math.floor(Number(seconds) || 0));

  updateClaimTimer(remaining);

  if (remaining <= 0) {
    enableClaimButton();
    return;
  }

  if (claimButton) {
    claimButton.disabled = true;
    claimButton.textContent = "PLEASE WAIT";
  }

  claimTimer = setInterval(function () {

    remaining--;

    updateClaimTimer(remaining);

    if (remaining <= 0) {
      clearInterval(claimTimer);
      claimTimer = null;

      enableClaimButton();
    }

  }, 1000);
}


/* =========================================================
   UPDATE CLAIM TIMER DISPLAY
========================================================= */

function updateClaimTimer(seconds) {

  const remaining =
    Math.max(0, Math.floor(Number(seconds) || 0));

  if (!countdownElement) {
    return;
  }

  if (remaining <= 0) {
    countdownElement.textContent =
      "READY TO CLAIM";

    return;
  }

  const hours =
    Math.floor(remaining / 3600);

  const minutes =
    Math.floor((remaining % 3600) / 60);

  const secs =
    remaining % 60;

  const hourText =
    String(hours).padStart(2, "0");

  const minuteText =
    String(minutes).padStart(2, "0");

  const secondText =
    String(secs).padStart(2, "0");

  countdownElement.textContent =
    hourText +
    ":" +
    minuteText +
    ":" +
    secondText;
}


/* =========================================================
   ENABLE CLAIM BUTTON
========================================================= */

function enableClaimButton() {

  if (!claimButton) {
    return;
  }

  if (!getSessionToken()) {
    claimButton.disabled = true;
    claimButton.textContent =
      "LOGIN TO CLAIM";
    return;
  }

  claimButton.disabled = false;
  claimButton.textContent =
    "CLAIM NOW";

  if (countdownElement) {
    countdownElement.textContent =
      "READY TO CLAIM";
  }
}


/* =========================================================
   WITHDRAW BUTTON
========================================================= */

function updateWithdrawButton() {

  if (!withdrawButton) {
    return;
  }

  const amount =
    withdrawAmount
      ? Number(withdrawAmount.value || 0)
      : 0;

  const loggedIn =
    !!getSessionToken();

  const validAmount =
    Number.isFinite(amount) &&
    amount >= MIN_WITHDRAWAL &&
    amount <= currentBalance;

  withdrawButton.disabled =
    !loggedIn || !validAmount;
}


/* =========================================================
   WITHDRAWAL
========================================================= */

async function requestWithdrawal() {

  const token =
    getSessionToken();

  if (!token) {
    showMessage(
      "Please log in before withdrawing."
    );
    return;
  }

  const amount =
    withdrawAmount
      ? Number(withdrawAmount.value)
      : 0;

  if (!Number.isFinite(amount) || amount <= 0) {
    showMessage(
      "Please enter a valid withdrawal amount."
    );
    return;
  }

  if (amount < MIN_WITHDRAWAL) {
    showMessage(
      "Minimum withdrawal is " +
      formatAmount(MIN_WITHDRAWAL) +
      " USDT."
    );
    return;
  }

  if (amount > currentBalance) {
    showMessage(
      "You do not have enough balance."
    );
    return;
  }

  if (withdrawButton) {
    withdrawButton.disabled = true;
    withdrawButton.textContent =
      "PROCESSING...";
  }

  try {

    const response = await apiPost({
      action: "withdraw",
      token: token,
      amount: amount
    });

    console.log(
      "WITHDRAW RESPONSE:",
      response
    );

    if (!response || response.success !== true) {
      throw new Error(
        response && response.message
          ? response.message
          : "Withdrawal failed."
      );
    }

    currentBalance =
      Number(response.balance || 0);

    displayBalance(currentBalance);

    if (withdrawAmount) {
      withdrawAmount.value = "";
    }

    showMessage(
      response.message ||
      "Withdrawal processed successfully!"
    );

  } catch (error) {

    console.error(
      "WITHDRAW ERROR:",
      error
    );

    showMessage(
      error.message ||
      "Withdrawal failed. Please try again."
    );

  } finally {

    updateWithdrawButton();

    if (withdrawButton) {
      withdrawButton.textContent =
        "WITHDRAW";
    }
  }
}


/* =========================================================
   WITHDRAW AMOUNT INPUT
========================================================= */

function setupWithdrawalInput() {

  if (!withdrawAmount) {
    return;
  }

  withdrawAmount.addEventListener(
    "input",
    function () {
      updateWithdrawButton();
    }
  );
}


/* =========================================================
   INITIALIZE WITHDRAWAL INPUT
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {
    setupWithdrawalInput();
  }
);
