"use strict";

/* =========================================================
   NEXUS FAUCET — FRONTEND JAVASCRIPT
   PART 1 OF 4
========================================================= */

const API_URL =
  "https://script.google.com/macros/s/AKfycbxkoS7x7Rd8w2yUYN7-Ly1Uy2hGfSaeCSzi8YlEHmEKeAy4R7qjVpKuY93xY1DbfdB4Qg/exec";

const REWARD = 0.00002500;
const MIN_WITHDRAWAL = 0.00050000;
const CLAIM_INTERVAL = 1800;
const DECIMALS = 8;
const SESSION_KEY = "nexus_session_token";

let currentUser = null;
let currentBalance = 0;

let claimTimer = null;
let nexusClaimEndTime = 0;

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
   START APPLICATION
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    getElements();

    setupButtons();

    setupReferralFromUrl();

    setupWithdrawalInput();

    setupKeyboardActions();

    protectButtons();

    updateAccountUI();

    const token =
      getSessionToken();

    if (token) {

      loadAccount();

    } else {

      resetDashboard();
    }

    console.log(
      "Nexus Faucet JavaScript loaded successfully."
    );
  }
);


/* =========================================================
   GET HTML ELEMENTS
========================================================= */

function getElements() {

  registerEmail =
    document.getElementById("registerEmail");

  registerPassword =
    document.getElementById("registerPassword");

  registerReferral =
    document.getElementById("registerReferral");

  registerButton =
    document.getElementById("registerButton");


  loginEmail =
    document.getElementById("loginEmail");

  loginPassword =
    document.getElementById("loginPassword");

  loginButton =
    document.getElementById("loginButton");


  logoutButton =
    document.getElementById("logoutButton");


  showLoginButton =
    document.getElementById("showLoginButton");

  showRegisterButton =
    document.getElementById("showRegisterButton");


  registerSection =
    document.getElementById("registerSection");

  loginSection =
    document.getElementById("loginSection");

  accountSection =
    document.getElementById("accountSection");


  accountEmail =
    document.getElementById("accountEmail");

  faucetEmail =
    document.getElementById("faucetEmail");


  balanceElement =
    document.getElementById("balance");


  claimButton =
    document.getElementById("claimButton");

  countdownElement =
    document.getElementById("countdown");


  withdrawAmount =
    document.getElementById("withdrawAmount");

  withdrawButton =
    document.getElementById("withdrawButton");


  referralLink =
    document.getElementById("referralLink");

  referralCopyButton =
    document.getElementById("referralCopyButton");

  referralEarnings =
    document.getElementById("referralEarnings");
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

    registerButton.disabled = true;

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

    loginButton.disabled = true;

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
        "The server did not return a session token."
      );
    }


    saveSessionToken(
      response.token
    );


    currentUser =
      response.user ||
      null;


    if (
      response.balance !== undefined
    ) {

      currentBalance =
        Number(
          response.balance || 0
        );

    } else if (
      currentUser &&
      currentUser.balance !== undefined
    ) {

      currentBalance =
        Number(
          currentUser.balance || 0
        );

    } else {

      currentBalance =
        0;
    }


    displayUser(
      currentUser
    );


    displayBalance(
      currentBalance
    );


    updateAccountUI();


    showMessage(
      response.message ||
      "Login successful!"
    );


    if (loginPassword) {

      loginPassword.value =
        "";
    }


    /*
      Load the latest server data.
      This also restores the claim timer
      if the user has already claimed.
    */

    await loadAccount();


  } catch (error) {

    console.error(
      "LOGIN ERROR:",
      error
    );


    removeSessionToken();

    currentUser = null;

    currentBalance = 0;


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
      response.user ||
      null;


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


    /*
      Restore the timer from the server.

      The backend sends the remaining
      cooldown time. The frontend then
      counts down once every second.
    */

    const remaining =
      Number(
        response.remainingClaimSeconds || 0
      );


    if (
      remaining > 0
    ) {

      startClaimTimer(
        remaining
      );

    } else {

      enableClaimButton();

    }


  } catch (error) {

    console.error(
      "LOAD ACCOUNT ERROR:",
      error
    );


    /*
      If the session is no longer valid,
      remove it and return to login.
    */

    removeSessionToken();

    currentUser = null;

    currentBalance = 0;

    resetDashboard();


    showMessage(

      error.message ||

      "Your session has expired. Please log in again."

    );
  }
}


/* =========================================================
   DISPLAY USER
========================================================= */

function displayUser(user) {

  if (!user) {
    return;
  }


  if (accountEmail) {

    accountEmail.textContent =
      user.email || "";

  }


  if (faucetEmail) {

    faucetEmail.value =
      user.email || "";

  }


  if (referralLink) {

    if (user.referralLink) {

      referralLink.value =
        user.referralLink;

    } else if (user.referralId) {

      referralLink.value =
        window.location.origin +
        window.location.pathname +
        "?ref=" +
        encodeURIComponent(
          user.referralId
        );

    } else {

      referralLink.value =
        "";
    }
  }


  if (referralEarnings) {

    referralEarnings.textContent =
      formatAmount(
        Number(
          user.referralEarnings || 0
        )
      ) +
      " USDT";
  }
}


/* =========================================================
   DISPLAY BALANCE
========================================================= */

function displayBalance(amount) {

  const numericAmount =
    Number(amount || 0);


  currentBalance =
    numericAmount;


  if (balanceElement) {

    balanceElement.textContent =
      formatAmount(
        numericAmount
      ) +
      " USDT";
  }


  updateWithdrawButton();
}


/* =========================================================
   UPDATE ACCOUNT UI
========================================================= */

function updateAccountUI() {

  const loggedIn =
    !!getSessionToken();


  if (registerSection) {

    registerSection.style.display =
      loggedIn
        ? "none"
        : registerSection.style.display;
  }


  if (loginSection) {

    loginSection.style.display =
      loggedIn
        ? "none"
        : loginSection.style.display;
  }


  if (accountSection) {

    accountSection.style.display =
      loggedIn
        ? "block"
        : "none";
  }


  if (logoutButton) {

    logoutButton.style.display =
      loggedIn
        ? ""
        : "none";
  }


  if (claimButton) {

    if (!loggedIn) {

      claimButton.disabled =
        true;

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

  if (claimTimer) {

    clearInterval(
      claimTimer
    );

    claimTimer = null;
  }


  nexusClaimEndTime = 0;


  currentUser =
    null;

  currentBalance =
    0;


  if (balanceElement) {

    balanceElement.textContent =
      "0.00000000 USDT";
  }


  if (accountEmail) {

    accountEmail.textContent =
      "";
  }


  if (faucetEmail) {

    faucetEmail.value =
      "";
  }


  if (referralLink) {

    referralLink.value =
      "";
  }


  if (referralEarnings) {

    referralEarnings.textContent =
      "0.00000000 USDT";
  }


  if (countdownElement) {

    countdownElement.textContent =
      "LOGIN TO CLAIM";
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
      "block";
  }


  if (accountSection) {

    accountSection.style.display =
      "none";
  }
}


/* =========================================================
   SHOW REGISTER
========================================================= */

function showRegister() {

  if (registerSection) {

    registerSection.style.display =
      "block";
  }


  if (loginSection) {

    loginSection.style.display =
      "none";
  }


  if (accountSection) {

    accountSection.style.display =
      "none";
  }
}


/* =========================================================
   SAVE SESSION TOKEN
========================================================= */

function saveSessionToken(token) {

  if (!token) {
    return;
  }


  try {

    localStorage.setItem(
      SESSION_KEY,
      token
    );

  } catch (error) {

    console.error(
      "SESSION SAVE ERROR:",
      error
    );
  }
}


/* =========================================================
   GET SESSION TOKEN
========================================================= */

function getSessionToken() {

  try {

    return localStorage.getItem(
      SESSION_KEY
    );

  } catch (error) {

    console.error(
      "SESSION READ ERROR:",
      error
    );

    return null;
  }
}


/* =========================================================
   REMOVE SESSION TOKEN
========================================================= */

function removeSessionToken() {

  try {

    localStorage.removeItem(
      SESSION_KEY
    );

  } catch (error) {

    console.error(
      "SESSION REMOVE ERROR:",
      error
    );
  }
  }
/* =========================================================
   NEXUS FAUCET — FRONTEND JAVASCRIPT
   PART 3 OF 4
========================================================= */


/* =========================================================
   LOGOUT
========================================================= */

async function logoutUser() {

  const token =
    getSessionToken();


  try {

    if (token) {

      await apiPost({

        action: "logout",

        token: token

      });
    }

  } catch (error) {

    console.error(
      "LOGOUT ERROR:",
      error
    );
  }


  removeSessionToken();


  if (claimTimer) {

    clearInterval(
      claimTimer
    );

    claimTimer = null;
  }


  nexusClaimEndTime =
    0;


  currentUser =
    null;

  currentBalance =
    0;


  resetDashboard();


  showMessage(
    "You have been logged out."
  );
}


/* =========================================================
   CLAIM REWARD
========================================================= */

async function claimReward() {

  const token =
    getSessionToken();


  if (!token) {

    showMessage(
      "Please log in before claiming."
    );

    return;
  }


  /*
    Prevent accidental double-clicks.
  */

  if (
    claimButton &&
    claimButton.disabled
  ) {

    return;
  }


  if (claimButton) {

    claimButton.disabled =
      true;

    claimButton.textContent =
      "CLAIMING...";
  }


  try {

    const response =
      await apiPost({

        action: "claim",

        token: token

      });


    console.log(
      "CLAIM RESPONSE:",
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

          : "Claim failed."

      );
    }


    /*
      Update balance immediately.
    */

    currentBalance =
      Number(
        response.balance || 0
      );


    displayBalance(
      currentBalance
    );


    /*
      Update referral earnings.
    */

    if (currentUser) {

      currentUser.referralEarnings =
        Number(
          response.referralEarnings ||
          currentUser.referralEarnings ||
          0
        );


      displayUser(
        currentUser
      );
    }


    showMessage(

      response.message ||

      "Reward claimed successfully!"

    );


    /*
      START THE 30-MINUTE TIMER.

      This is the important part:
      the timer uses a real end time instead
      of simply subtracting numbers.
    */

    startClaimTimer(
      CLAIM_INTERVAL
    );


  } catch (error) {

    console.error(
      "CLAIM ERROR:",
      error
    );


    showMessage(

      error.message ||

      "Claim failed. Please try again."

    );


    /*
      Reload the account so the frontend
      matches the real server state.
    */

    try {

      await loadAccount();

    } catch (reloadError) {

      console.error(
        "ACCOUNT RELOAD ERROR:",
        reloadError
      );
    }
  }
}


/* =========================================================
   START CLAIM TIMER
========================================================= */

function startClaimTimer(seconds) {

  /*
    Stop any old timer first.
  */

  if (claimTimer) {

    clearInterval(
      claimTimer
    );

    claimTimer =
      null;
  }


  let totalSeconds =
    Math.floor(
      Number(seconds)
    );


  /*
    Safety check.
  */

  if (
    !Number.isFinite(
      totalSeconds
    ) ||
    totalSeconds <= 0
  ) {

    totalSeconds =
      CLAIM_INTERVAL;
  }


  /*
    Store the exact time when
    the countdown should finish.
  */

  nexusClaimEndTime =
    Date.now() +
    (
      totalSeconds *
      1000
    );


  /*
    Display immediately.
  */

  updateClaimTimer();


  if (claimButton) {

    claimButton.disabled =
      true;

    claimButton.textContent =
      "PLEASE WAIT";
  }


  /*
    Update once every second.
  */

  claimTimer =
    setInterval(

      function () {

        updateClaimTimer();

      },

      1000
    );
}


/* =========================================================
   UPDATE CLAIM TIMER
========================================================= */

function updateClaimTimer() {

  if (
    !nexusClaimEndTime
  ) {

    return;
  }


  const millisecondsRemaining =
    nexusClaimEndTime -
    Date.now();


  const remaining =
    Math.max(

      0,

      Math.ceil(
        millisecondsRemaining /
        1000
      )

    );


  if (countdownElement) {

    if (remaining <= 0) {

      countdownElement.textContent =
        "READY TO CLAIM";

    } else {

      const hours =
        Math.floor(
          remaining /
          3600
        );


      const minutes =
        Math.floor(

          (
            remaining %
            3600
          ) /
          60

        );


      const seconds =
        remaining %
        60;


      countdownElement.textContent =

        String(hours)
          .padStart(2, "0")

        + ":" +

        String(minutes)
          .padStart(2, "0")

        + ":" +

        String(seconds)
          .padStart(2, "0");
    }
  }


  /*
    When the timer reaches zero,
    stop the interval and enable CLAIM NOW.
  */

  if (remaining <= 0) {

    if (claimTimer) {

      clearInterval(
        claimTimer
      );

      claimTimer =
        null;
    }


    nexusClaimEndTime =
      0;


    enableClaimButton();
  }
}


/* =========================================================
   ENABLE CLAIM BUTTON
========================================================= */

function enableClaimButton() {

  if (!claimButton) {
    return;
  }


  if (!getSessionToken()) {

    claimButton.disabled =
      true;

    claimButton.textContent =
      "LOGIN TO CLAIM";

    return;
  }


  claimButton.disabled =
    false;

  claimButton.textContent =
    "CLAIM NOW";


  if (countdownElement) {

    countdownElement.textContent =
      "READY TO CLAIM";
  }
}


/* =========================================================
   UPDATE WITHDRAW BUTTON
========================================================= */

function updateWithdrawButton() {

  if (!withdrawButton) {
    return;
  }

  const loggedIn =
    !!getSessionToken();

  if (!loggedIn) {

    withdrawButton.disabled = true;
    withdrawButton.textContent = "LOGIN TO WITHDRAW";

    return;
  }

  const amount =
    withdrawAmount
      ? Number(withdrawAmount.value || 0)
      : 0;

  const validAmount =
    Number.isFinite(amount) &&
    amount >= MIN_WITHDRAWAL &&
    amount <= currentBalance;

  withdrawButton.disabled = !validAmount;

  withdrawButton.textContent = "WITHDRAW";
}


/* =========================================================
   REQUEST WITHDRAWAL
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

      ? Number(
         withdrawAmount.value
        )

      : 0;


  if (
    !Number.isFinite(
      amount
    ) ||
    amount <= 0
  ) {

    showMessage(
      "Please enter a valid withdrawal amount."
    );

    return;
  }


  if (
    amount <
    MIN_WITHDRAWAL
  ) {

    showMessage(

      "Minimum withdrawal is " +

      formatAmount(
        MIN_WITHDRAWAL
      ) +

      " USDT."

    );

    return;
  }


  if (
    amount >
    currentBalance
  ) {

    showMessage(
      "You do not have enough balance."
    );

    return;
  }


  if (withdrawButton) {

    withdrawButton.disabled =
      true;

    withdrawButton.textContent =
      "PROCESSING...";
  }


  try {

    const response =
      await apiPost({

        action: "withdraw",

        token: token,

        amount: amount

      });


    console.log(
      "WITHDRAW RESPONSE:",
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

          : "Withdrawal failed."

      );
    }


    /*
      Update the displayed balance.
    */

    currentBalance =
      Number(
        response.balance || 0
      );


    displayBalance(
      currentBalance
    );


    if (withdrawAmount) {

      withdrawAmount.value =
        "";
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
   WITHDRAWAL INPUT
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
   NEXUS FAUCET — FRONTEND JAVASCRIPT
   PART 4 OF 4
========================================================= */


/* =========================================================
   REFERRAL FROM URL
========================================================= */

function setupReferralFromUrl() {

  if (!registerReferral) {
    return;
  }


  try {

    const params =
      new URLSearchParams(
        window.location.search
      );


    const referral =
      params.get("ref");


    if (referral) {

      registerReferral.value =
        referral;
    }

  } catch (error) {

    console.error(
      "REFERRAL URL ERROR:",
      error
    );
  }
}


/* =========================================================
   COPY REFERRAL LINK
========================================================= */

async function copyReferralLink() {

  if (!referralLink) {

    showMessage(
      "Referral link is not available."
    );

    return;
  }


  const link =
    referralLink.value.trim();


  if (!link) {

    showMessage(
      "Referral link is not available."
    );

    return;
  }


  try {

    await navigator.clipboard.writeText(
      link
    );


    showMessage(
      "Referral link copied!"
    );


  } catch (error) {

    console.error(
      "COPY ERROR:",
      error
    );


    /*
      Fallback for browsers that
      block navigator.clipboard.
    */

    try {

      referralLink.focus();

      referralLink.select();

      document.execCommand(
        "copy"
      );


      showMessage(
        "Referral link copied!"
      );


    } catch (fallbackError) {

      showMessage(
        "Please copy the referral link manually."
      );
    }
  }
}


/* =========================================================
   API REQUEST
========================================================= */

async function apiPost(data) {

  if (!API_URL) {

    throw new Error(
      "Backend API URL is missing."
    );
  }


  let response;


  try {

    response =
      await fetch(

        API_URL,

        {

          method: "POST",

          redirect: "follow",

          headers: {

            /*
              Google Apps Script works more
              reliably with text/plain here.
            */

            "Content-Type":
              "text/plain;charset=utf-8"

          },

          body:
            JSON.stringify(
              data
            )
        }

      );

  } catch (error) {

    console.error(
      "NETWORK ERROR:",
      error
    );


    throw new Error(

      "Unable to connect to the server. " +
      "Please check your internet connection."

    );
  }


  if (!response.ok) {

    throw new Error(

      "Server error: " +
      response.status

    );
  }


  const text =
    await response.text();


  if (!text) {

    throw new Error(
      "The server returned an empty response."
    );
  }


  let result;


  try {

    result =
      JSON.parse(
        text
      );

  } catch (error) {

    console.error(
      "INVALID SERVER RESPONSE:",
      text
    );


    throw new Error(

      "The server returned an invalid response."

    );
  }


  return result;
}


/* =========================================================
   EMAIL VALIDATION
========================================================= */

function validEmail(email) {

  if (!email) {
    return false;
  }


  /*
    Basic email validation.

    Example:
    user@example.com
  */

  const pattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


  return pattern.test(
    email
  );
}


/* =========================================================
   FORMAT AMOUNT
========================================================= */

function formatAmount(amount) {

  const number =
    Number(
      amount || 0
    );


  if (
    !Number.isFinite(
      number
    )
  ) {

    return "0.00000000";
  }


  return number.toFixed(
    DECIMALS
  );
}


/* =========================================================
   SHOW MESSAGE
========================================================= */

function showMessage(message) {

  const text =
    String(
      message ||
      "Something went wrong."
    );


  console.log(
    "NEXUS MESSAGE:",
    text
  );


  /*
    First try to use an existing
    message element if the HTML has one.
  */

  const messageElement =
    document.getElementById(
      "message"
    );


  if (messageElement) {

    messageElement.textContent =
      text;


    messageElement.style.display =
      "block";


    /*
      Automatically hide after
      5 seconds.
    */

    clearTimeout(
      messageElement._nexusTimeout
    );


    messageElement._nexusTimeout =
      setTimeout(

        function () {

          messageElement.style.display =
            "none";

        },

        5000
      );


    return;
  }


  /*
    If the page does not have a
    message element, use alert.
  */

  alert(
    text
  );
}


/* =========================================================
   KEYBOARD ACTIONS
========================================================= */

function setupKeyboardActions() {

  /*
    Pressing Enter in the registration
    form will create the account.
  */

  if (registerEmail) {

    registerEmail.addEventListener(

      "keydown",

      function (event) {

        if (
          event.key === "Enter"
        ) {

          event.preventDefault();

          registerUser();
        }
      }
    );
  }


  if (registerPassword) {

    registerPassword.addEventListener(

      "keydown",

      function (event) {

        if (
          event.key === "Enter"
        ) {

          event.preventDefault();

          registerUser();
        }
      }
    );
  }


  /*
    Pressing Enter in the login
    form will log the user in.
  */

  if (loginEmail) {

    loginEmail.addEventListener(

      "keydown",

      function (event) {

        if (
          event.key === "Enter"
        ) {

          event.preventDefault();

          loginUser();
        }
      }
    );
  }


  if (loginPassword) {

    loginPassword.addEventListener(

      "keydown",

      function (event) {

        if (
          event.key === "Enter"
        ) {

          event.preventDefault();

          loginUser();
        }
      }
    );
  }
}


/* =========================================================
   BUTTON SAFETY
========================================================= */

function protectButtons() {

  /*
    Prevent forms from accidentally
    submitting/reloading the page.
  */

  const forms =
    document.querySelectorAll(
      "form"
    );


  forms.forEach(

    function (form) {

      form.addEventListener(

        "submit",

        function (event) {

          event.preventDefault();

        }

      );

    }

  );
}


/* =========================================================
   FINAL STARTUP CHECK
========================================================= */

console.log(
  "Nexus Faucet frontend script loaded."
);
