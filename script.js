/* =========================================================
   NEXUS FAUCET
   FRONTEND JAVASCRIPT
   PART 1 OF 2
========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
========================================================= */

const REWARD = 0.00002500;
const MIN_WITHDRAWAL = 0.00050000;
const CLAIM_INTERVAL = 30 * 60;
const DECIMALS = 8;

const SESSION_KEY = "nexus_session_token";


/* =========================================================
   GOOGLE APPS SCRIPT BACKEND
========================================================= */

const NEXUS_API_URL =
  "https://script.google.com/macros/s/AKfycbzwwwX_JW1YjccTPtc2xEQu2Lehu-IXzalvCQSoMrL6rCEmWeAcp-sx3HKSms-G6SyP/exec";


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser = null;
let currentBalance = 0;
let claimTimer = null;


/* =========================================================
   DOM ELEMENTS
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
   PAGE START
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  getElements();

  setupReferralFromUrl();

  setupButtons();

  updateAccountUI();

  const token = getSessionToken();

  if (token) {
    loadAccount();
  } else {
    resetDashboard();
  }

});


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


  setButtonLoading(
    registerButton,
    true,
    "Creating..."
  );


  try {

    const response = await apiPost({

      action: "register",

      email: email,

      password: password,

      referral: referral

    });


    if (!response.success) {

      throw new Error(
        response.message ||
        "Registration failed."
      );

    }


    showMessage(
      "Account created successfully. You can now log in."
    );


    if (registerEmail) {
      registerEmail.value = email;
    }


    if (loginEmail) {
      loginEmail.value = email;
    }


    if (registerPassword) {
      registerPassword.value = "";
    }


    if (registerReferral) {
      registerReferral.value = "";
    }


    showLogin();


  } catch (error) {

    console.error(
      "Registration error:",
      error
    );

    showMessage(
      error.message ||
      "An error occurred. Please try again later."
    );

  } finally {

    setButtonLoading(
      registerButton,
      false,
      "CREATE ACCOUNT"
    );

  }

}


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


  setButtonLoading(
    loginButton,
    true,
    "Logging in..."
  );


  try {

    const response = await apiPost({

      action: "login",

      email: email,

      password: password

    });


    if (!response.success) {

      throw new Error(
        response.message ||
        "Login failed."
      );

    }


    if (!response.token) {

      throw new Error(
        "Login succeeded but no session was returned."
      );

    }


    saveSessionToken(
      response.token
    );


    currentUser =
      response.user || null;


    showMessage(
      "Login successful."
    );


    if (loginPassword) {
      loginPassword.value = "";
    }


    updateAccountUI();


    await loadAccount();


  } catch (error) {

    console.error(
      "Login error:",
      error
    );

    showMessage(
      error.message ||
      "An error occurred. Please try again later."
    );

  } finally {

    setButtonLoading(
      loginButton,
      false,
      "LOGIN"
    );

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

    const response = await apiPost({

      action: "status",

      token: token

    });


    if (!response.success) {

      throw new Error(
        response.message ||
        "Unable to load account."
      );

    }


    currentUser =
      response.user || null;


    currentBalance =
      Number(
        response.balance ||
        0
      );


    displayUser(
      currentUser
    );


    displayBalance(
      currentBalance
    );


    updateAccountUI();


    startClaimTimer(
      response.secondsUntilClaim ||
      0
    );


  } catch (error) {

    console.error(
      "Account loading error:",
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
    accountEmail.textContent = email;
  }


  if (faucetEmail) {
    faucetEmail.value = email;
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
      loggedIn ? "none" : "";

  }


  if (loginSection) {

    loginSection.style.display =
      loggedIn ? "none" : "";

  }


  if (accountSection) {

    accountSection.style.display =
      loggedIn ? "" : "none";

  }


  if (logoutButton) {

    logoutButton.style.display =
      loggedIn ? "" : "none";

  }


  if (claimButton) {

    claimButton.disabled =
      !loggedIn;

  }


  updateWithdrawButton();

}


/* =========================================================
   RESET DASHBOARD
========================================================= */

function resetDashboard() {

  currentUser = null;

  currentBalance = 0;


  displayBalance(0);


  if (accountEmail) {
    accountEmail.textContent =
      "Not logged in";
  }


  if (faucetEmail) {
    faucetEmail.value = "";
  }


  if (referralEarnings) {
    referralEarnings.textContent =
      "0.00000000";
  }


  if (referralLink) {
    referralLink.value = "";
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
   LOGOUT
========================================================= */

async function logoutUser() {

  const token =
    getSessionToken();


  if (token) {

    try {

      await apiPost({

        action: "logout",

        token: token

      });

    } catch (error) {

      console.warn(
        "Logout request failed:",
        error
      );

    }

  }


  removeSessionToken();

  currentUser = null;

  currentBalance = 0;


  if (claimTimer) {

    clearInterval(
      claimTimer
    );

    claimTimer = null;

  }


  resetDashboard();


  showLogin();


  showMessage(
    "You have been logged out."
  );

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


  if (claimButton) {

    claimButton.disabled =
      true;

    claimButton.textContent =
      "CLAIMING...";

  }


  try {

    const response = await apiPost({

      action: "claim",

      token: token

    });


    if (!response.success) {

      throw new Error(
        response.message ||
        "Claim failed."
      );

    }


    currentBalance =
      Number(
        response.balance ||
        0
      );


    displayBalance(
      currentBalance
    );


    startClaimTimer(
      response.secondsUntilClaim ||
      CLAIM_INTERVAL
    );


    showMessage(
      "Claim successful! +" +
      formatAmount(REWARD) +
      " USDT"
    );


  } catch (error) {

    console.error(
      "Claim error:",
      error
    );


    showMessage(
      error.message ||
      "Unable to claim right now."
    );


    await loadAccount();

  }

}


/* =========================================================
   CLAIM TIMER
========================================================= */

function startClaimTimer(seconds) {

  if (claimTimer) {

    clearInterval(
      claimTimer
    );

    claimTimer = null;

  }


  let remaining =
    Math.max(
      0,
      Math.floor(
        Number(seconds) || 0
      )
    );


  updateClaimTimer(
    remaining
  );


  if (remaining <= 0) {

    enableClaimButton();

    return;

  }


  if (claimButton) {

    claimButton.disabled =
      true;

    claimButton.textContent =
      "PLEASE WAIT";

  }


  claimTimer =
    setInterval(
      function () {

        remaining--;

        updateClaimTimer(
          remaining
        );


        if (remaining <= 0) {

          clearInterval(
            claimTimer
          );

          claimTimer = null;

          enableClaimButton();

        }

      },
      1000
    );

}


/* =========================================================
   UPDATE CLAIM TIMER
========================================================= */

function updateClaimTimer(seconds) {

  if (!countdownElement) {
    return;
  }


  if (seconds <= 0) {

    countdownElement.textContent =
      "Ready to claim!";

    return;

  }


  const hours =
    Math.floor(
      seconds / 3600
    );


  const minutes =
    Math.floor(
      (seconds % 3600) / 60
    );


  const secs =
    seconds % 60;


  countdownElement.textContent =
    pad(hours) +
    ":" +
    pad(minutes) +
    ":" +
    pad(secs);

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

}


/* =========================================================
   PAD NUMBER
========================================================= */

function pad(number) {

  return String(
    number
  ).padStart(
    2,
    "0"
  );

}


/* =========================================================
   WITHDRAW BUTTON STATE
========================================================= */

function updateWithdrawButton() {

  if (!withdrawButton) {
    return;
  }


  const amount =
    Number(
      withdrawAmount
        ? withdrawAmount.value
        : 0
    ) || 0;


  const loggedIn =
    !!getSessionToken();


  withdrawButton.disabled =
    !loggedIn ||
    amount < MIN_WITHDRAWAL ||
    amount > currentBalance;

}
/* =========================================================
   NEXUS FAUCET
   FRONTEND JAVASCRIPT
   PART 2 OF 2
========================================================= */


/* =========================================================
   WITHDRAWAL INPUT
========================================================= */

if (withdrawAmount) {

  withdrawAmount.addEventListener(
    "input",
    updateWithdrawButton
  );

}


/* =========================================================
   REQUEST WITHDRAWAL
========================================================= */

async function requestWithdrawal() {

  const token =
    getSessionToken();

  if (!token) {

    showMessage(
      "Please log in before requesting a withdrawal."
    );

    return;
  }


  const amount =
    Number(
      withdrawAmount
        ? withdrawAmount.value
        : 0
    );


  if (!Number.isFinite(amount)) {

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


  if (!confirm(
    "Withdraw " +
    formatAmount(amount) +
    " USDT to your registered FaucetPay email?"
  )) {

    return;
  }


  setButtonLoading(
    withdrawButton,
    true,
    "PROCESSING..."
  );


  try {

    const response =
      await apiPost({

        action: "withdraw",

        token: token,

        amount: amount

      });


    if (!response.success) {

      throw new Error(
        response.message ||
        "Withdrawal failed."
      );

    }


    currentBalance =
      Number(
        response.balance ||
        0
      );


    displayBalance(
      currentBalance
    );


    if (withdrawAmount) {
      withdrawAmount.value = "";
    }


    showMessage(
      response.message ||
      "Withdrawal submitted successfully."
    );


    updateWithdrawButton();


  } catch (error) {

    console.error(
      "Withdrawal error:",
      error
    );


    showMessage(
      error.message ||
      "Withdrawal failed. Please try again later."
    );


    await loadAccount();

  } finally {

    setButtonLoading(
      withdrawButton,
      false,
      "WITHDRAW"
    );

  }

}


/* =========================================================
   REFERRAL URL
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


    if (
      referral &&
      referral.trim()
    ) {

      registerReferral.value =
        referral.trim();

    }

  } catch (error) {

    console.warn(
      "Unable to read referral URL:",
      error
    );

  }

}


/* =========================================================
   COPY REFERRAL LINK
========================================================= */

async function copyReferralLink() {

  if (!referralLink) {
    return;
  }


  const text =
    referralLink.value ||
    referralLink.textContent ||
    "";


  if (!text) {

    showMessage(
      "Your referral link is not available yet."
    );

    return;
  }


  try {

    await navigator.clipboard.writeText(
      text
    );


    showMessage(
      "Referral link copied!"
    );


  } catch (error) {

    console.warn(
      "Clipboard API failed:",
      error
    );


    try {

      referralLink.select();

      document.execCommand(
        "copy"
      );


      showMessage(
        "Referral link copied!"
      );

    } catch (copyError) {

      showMessage(
        "Unable to copy the referral link."
      );

    }

  }

}


/* =========================================================
   API REQUEST
========================================================= */

async function apiPost(data) {

  if (!NEXUS_API_URL) {

    throw new Error(
      "Backend URL is not configured."
    );

  }


  const response =
    await fetch(
      NEXUS_API_URL,
      {

        method: "POST",

        headers: {
          "Content-Type":
            "text/plain;charset=utf-8"
        },

        body:
          JSON.stringify(data)

      }
    );


  if (!response.ok) {

    throw new Error(
      "Server error: " +
      response.status
    );

  }


  const text =
    await response.text();


  let result;


  try {

    result =
      JSON.parse(text);

  } catch (error) {

    console.error(
      "Invalid server response:",
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

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );

}


/* =========================================================
   FORMAT AMOUNT
========================================================= */

function formatAmount(amount) {

  const value =
    Number(amount);


  if (!Number.isFinite(value)) {
    return "0.00000000";
  }


  return value.toFixed(
    DECIMALS
  );

}


/* =========================================================
   BUTTON LOADING
========================================================= */

function setButtonLoading(
  button,
  loading,
  text
) {

  if (!button) {
    return;
  }


  if (loading) {

    button.disabled =
      true;

    button.dataset.originalText =
      button.textContent;


    button.textContent =
      text;

  } else {

    button.disabled =
      false;


    button.textContent =
      button.dataset.originalText ||
      text;

  }

}


/* =========================================================
   MESSAGE SYSTEM
========================================================= */

function showMessage(message) {

  console.log(
    "Nexus Faucet:",
    message
  );


  /*
   * If your HTML has an element with
   * id="message", it will be used.
   */

  const messageElement =
    document.getElementById(
      "message"
    );


  if (messageElement) {

    messageElement.textContent =
      message;


    messageElement.style.display =
      "block";


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
   * Fallback if there is no message
   * element in the HTML.
   */

  alert(message);

}


/* =========================================================
   PREVENT NEGATIVE WITHDRAWAL VALUES
========================================================= */

if (withdrawAmount) {

  withdrawAmount.addEventListener(
    "input",
    function () {

      let value =
        Number(
          withdrawAmount.value
        );


      if (
        !Number.isFinite(value) ||
        value < 0
      ) {

        withdrawAmount.value =
          "";

      }


      updateWithdrawButton();

    }
  );

}


/* =========================================================
   PREVENT FORM RELOAD
========================================================= */

document.addEventListener(
  "submit",
  function (event) {

    /*
     * Prevent normal HTML form submission
     * because the JavaScript handles it.
     */

    event.preventDefault();

  }
);


/* =========================================================
   HANDLE ENTER KEY FOR LOGIN
========================================================= */

