"use strict";

/* =========================================================
   NEXUS FAUCET
   FRONTEND JAVASCRIPT
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
let referralCount;


/* =========================================================
   START
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  getElements();

  setupButtons();

  setupReferralFromUrl();

  setupWithdrawalInput();

  setupKeyboardActions();

  protectButtons();

  updateAccountUI();

  const token = getSessionToken();

  if (token) {
    loadAccount();
  } else {
    resetDashboard();
  }

  console.log("Nexus Faucet JavaScript loaded successfully.");

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
    document.getElementById("referralCopyButton")
    || document.getElementById("copyReferralButton");

  referralEarnings =
    document.getElementById("referralEarnings");

  referralCount =
    document.getElementById("referralCount");
}


/* =========================================================
   BUTTON SETUP
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


  if (!email) {
    showMessage("Please enter your email.");
    return;
  }


  if (!password || password.length < 6) {
    showMessage(
      "Password must be at least 6 characters."
    );
    return;
  }


  if (registerButton) {
    registerButton.disabled = true;
    registerButton.textContent = "CREATING...";
  }


  try {

    const response =
      await apiPost({
        action: "register",
        email: email,
        password: password,
        referralId: referral
      });


    if (!response.success) {
      throw new Error(
        response.error || "Registration failed."
      );
    }


    showMessage(
      "Registration successful. You can now login."
    );


    if (registerEmail) {
      registerEmail.value = "";
    }

    if (registerPassword) {
      registerPassword.value = "";
    }

    if (registerReferral) {
      registerReferral.value = "";
    }


    showLogin();


  } catch (error) {

    showMessage(
      error.message || "Registration failed."
    );

  } finally {

    if (registerButton) {
      registerButton.disabled = false;
      registerButton.textContent = "REGISTER";
    }

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


  if (!email) {
    showMessage("Please enter your email.");
    return;
  }


  if (!password) {
    showMessage("Please enter your password.");
    return;
  }


  if (loginButton) {
    loginButton.disabled = true;
    loginButton.textContent = "LOGGING IN...";
  }


  try {

    const response =
      await apiPost({
        action: "login",
        email: email,
        password: password
      });


    if (
      !response.success ||
      !response.token
    ) {
      throw new Error(
        response.error || "Login failed."
      );
    }


    saveSessionToken(response.token);


    currentUser =
      response.user || null;


    currentBalance =
      Number(response.balance || 0);


    displayUser(currentUser);

    displayBalance(currentBalance);

    updateAccountUI();


    if (loginPassword) {
      loginPassword.value = "";
    }


    await loadAccount();


    showMessage("Login successful.");


  } catch (error) {

    removeSessionToken();

    currentUser = null;

    currentBalance = 0;

    resetDashboard();


    showMessage(
      error.message || "Login failed."
    );


  } finally {

    if (loginButton) {
      loginButton.disabled = false;
      loginButton.textContent = "LOGIN";
    }

  }
}
/* =========================================================
   LOAD ACCOUNT
========================================================= */

async function loadAccount() {

  const token = getSessionToken();

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


    if (!response.success) {
      throw new Error(
        response.error || "Unable to load account."
      );
    }


    currentUser =
      response.user || null;


    currentBalance =
      Number(response.balance || 0);


    displayUser(currentUser);

    displayBalance(currentBalance);

    updateAccountUI();


    const remaining =
      Number(
        response.remainingClaimSeconds || 0
      );


    if (remaining > 0) {

      startClaimTimer(remaining);

    } else {

      enableClaimButton();

    }


  } catch (error) {

    console.error(
      "Account loading error:",
      error
    );


    removeSessionToken();

    currentUser = null;

    currentBalance = 0;

    resetDashboard();


    showMessage(
      error.message || "Session expired. Please login again."
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

    faucetEmail.textContent =
      user.email || "";

  }


  if (referralLink) {

    let link =
      user.referralLink || "";


    if (!link && user.referralId) {

      link =
        window.location.origin +
        window.location.pathname +
        "?ref=" +
        encodeURIComponent(
          user.referralId
        );

    }


    referralLink.value = link;

  }


  if (referralEarnings) {

    referralEarnings.textContent =
      Number(
        user.referralEarnings || 0
      ).toFixed(DECIMALS);

  }


  if (referralCount) {

    referralCount.textContent =
      Number(
        user.referralCount || 0
      );

  }
}


/* =========================================================
   DISPLAY BALANCE
========================================================= */

function displayBalance(amount) {

  currentBalance =
    Number(amount || 0);


  if (balanceElement) {

    balanceElement.textContent =
      currentBalance.toFixed(
        DECIMALS
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


  /*
   * REGISTER
   */

  if (registerSection) {

    registerSection.style.display =
      loggedIn
        ? "none"
        : "";

  }


  /*
   * LOGIN
   */

  if (loginSection) {

    loginSection.style.display =
      loggedIn
        ? "none"
        : "";

  }


  /*
   * ACCOUNT
   */

  if (accountSection) {

    accountSection.style.display =
      loggedIn
        ? "block"
        : "none";

  }


  /*
   * LOGOUT
   */

  if (logoutButton) {

    logoutButton.style.display =
      loggedIn
        ? ""
        : "none";

  }


  /*
   * CLAIM BUTTON
   */

  if (claimButton && !loggedIn) {

    claimButton.disabled = true;

    claimButton.textContent =
      "LOGIN TO CLAIM";

  }


  /*
   * REFERRAL COPY BUTTON
   */

  if (referralCopyButton) {

    if (loggedIn) {

      referralCopyButton.disabled =
        false;

      referralCopyButton.textContent =
        "COPY";

    } else {

      referralCopyButton.disabled =
        true;

      referralCopyButton.textContent =
        "LOGIN TO COPY";

    }

  }


  /*
   * WITHDRAW BUTTON
   */

  updateWithdrawButton();
}


/* =========================================================
   WITHDRAW BUTTON
========================================================= */

function updateWithdrawButton() {

  if (!withdrawButton) {
    return;
  }


  const loggedIn =
    !!getSessionToken();


  /*
   * USER NOT LOGGED IN
   */

  if (!loggedIn) {

    withdrawButton.disabled =
      true;

    withdrawButton.textContent =
      "LOGIN TO WITHDRAW";

    return;
  }


  /*
   * GET AMOUNT
   */

  const amount =
    withdrawAmount
      ? Number(
          withdrawAmount.value || 0
        )
      : 0;


  /*
   * CHECK AMOUNT
   */

  const validAmount =
    Number.isFinite(amount) &&
    amount >= MIN_WITHDRAWAL &&
    amount <= currentBalance;


  /*
   * BUTTON STATE
   */

  withdrawButton.disabled =
    !validAmount;


  /*
   * BUTTON TEXT
   */

  withdrawButton.textContent =
    validAmount
      ? "WITHDRAW"
      : "ENTER VALID AMOUNT";
}


/* =========================================================
   SHOW LOGIN
========================================================= */

function showLogin() {

  if (registerSection) {
    registerSection.style.display = "none";
  }


  if (loginSection) {
    loginSection.style.display = "";
  }


  if (accountSection) {
    accountSection.style.display = "none";
  }
}


/* =========================================================
   SHOW REGISTER
========================================================= */

function showRegister() {

  if (registerSection) {
    registerSection.style.display = "";
  }


  if (loginSection) {
    loginSection.style.display = "none";
  }


  if (accountSection) {
    accountSection.style.display = "none";
  }
}


/* =========================================================
   CLAIM REWARD
========================================================= */

async function claimReward() {

  const token =
    getSessionToken();


  if (!token) {

    showMessage(
      "Please login before claiming."
    );

    return;

  }


  if (
    claimButton &&
    claimButton.disabled
  ) {
    return;
  }


  if (claimButton) {

    claimButton.disabled = true;

    claimButton.textContent =
      "CLAIMING...";

  }


  try {

    const response =
      await apiPost({
        action: "claim",
        token: token
      });


    if (!response.success) {

      throw new Error(
        response.error ||
        "Claim failed."
      );

    }


    currentBalance =
      Number(
        response.balance || 0
      );


    displayBalance(
      currentBalance
    );


    if (
      response.referralEarnings !==
      undefined &&
      referralEarnings
    ) {

      referralEarnings.textContent =
        Number(
          response.referralEarnings
        ).toFixed(
          DECIMALS
        );

    }


    showMessage(
      "Claim successful! +" +
      REWARD.toFixed(DECIMALS) +
      " USDT"
    );


    startClaimTimer(
      CLAIM_INTERVAL
    );


  } catch (error) {

    showMessage(
      error.message ||
      "Claim failed."
    );


    await loadAccount();

  }
}
