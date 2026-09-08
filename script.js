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
