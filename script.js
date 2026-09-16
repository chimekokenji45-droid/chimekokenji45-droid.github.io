"use strict";

/* =========================================================
   NEXUS FAUCET
   FRONTEND JAVASCRIPT
========================================================= */

const API_URL =
  "https://olzlbbaldfsabvpptyps.supabase.co/functions/v1/nexus-api";

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

  console.log(
    "Nexus Faucet JavaScript loaded successfully."
  );

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
        referral: referral
      });


    if (!response.success) {
      throw new Error(
        response.message ||
        response.error ||
        "Registration failed."
      );
    }


    /*
     * The backend may automatically create
     * a session after registration.
     */

    if (response.token) {

      saveSessionToken(
        response.token
      );

      currentUser =
        response.user || null;

      currentBalance =
        Number(
          response.user?.balance || 0
        );

      displayUser(currentUser);

      displayBalance(currentBalance);

      updateAccountUI();

      await loadAccount();

      showMessage(
        "Registration successful."
      );

    } else {

      showMessage(
        "Registration successful. You can now login."
      );

      showLogin();

    }


    if (registerEmail) {
      registerEmail.value = "";
    }

    if (registerPassword) {
      registerPassword.value = "";
    }

    if (registerReferral) {
      registerReferral.value = "";
    }


  } catch (error) {

    showMessage(
      error.message ||
      "Registration failed."
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

    const response = await apiPost({
      action: "login",
      email: email,
      password: password
    });

    console.log("LOGIN RESPONSE:", response);

    if (!response.success) {
      throw new Error(
        response.message ||
        response.error ||
        "Login failed."
      );
    }

    if (!response.token) {
      throw new Error(
        "Login succeeded but no session token was received."
      );
    }

    /* SAVE SESSION FIRST */

    saveSessionToken(response.token);

    console.log(
      "SESSION SAVED:",
      getSessionToken()
    );

    /* SAVE USER */

    currentUser =
      response.user || null;

    currentBalance =
      Number(
        response.user?.balance || 0
      );

    /* SHOW ACCOUNT IMMEDIATELY */

    displayUser(currentUser);

    displayBalance(currentBalance);

    if (registerSection) {
      registerSection.style.display = "none";
    }

    if (loginSection) {
      loginSection.style.display = "none";
    }

    if (accountSection) {
      accountSection.style.display = "block";
    }

    if (logoutButton) {
      logoutButton.style.display = "";
    }

    /* CLEAR PASSWORD */

    if (loginPassword) {
      loginPassword.value = "";
    }

    /* LOAD REAL ACCOUNT DATA */

    await loadAccount();

    showMessage(
      "Login successful."
    );

  } catch (error) {

    console.error(
      "LOGIN ERROR:",
      error
    );

    removeSessionToken();

    currentUser = null;

    currentBalance = 0;

    resetDashboard();

    showMessage(
      error.message ||
      "Login failed."
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

  console.log("LOAD ACCOUNT TOKEN:", token);

  if (!token) {
    resetDashboard();
    return;
  }

  try {

    const response = await apiPost({
      action: "status",
      token: token
    });

    console.log("STATUS RESPONSE:", response);

    if (!response.success) {

      throw new Error(
        response.message ||
        response.error ||
        "Unable to load account."
      );
    }

    if (!response.user) {

      throw new Error(
        "The server did not return user account data."
      );
    }

    currentUser = response.user;

    currentBalance =
      Number(
        response.user.balance || 0
      );

    displayUser(currentUser);

    displayBalance(currentBalance);

    /* Make sure account is visible */

    if (registerSection) {
      registerSection.style.display = "none";
    }

    if (loginSection) {
      loginSection.style.display = "none";
    }

    if (accountSection) {
      accountSection.style.display = "block";
    }

    if (logoutButton) {
      logoutButton.style.display = "";
    }

    const remaining =
      Number(
        response.user.remaining_claim_seconds || 0
      );

    if (remaining > 0) {

      startClaimTimer(
        remaining
      );

    } else {

      enableClaimButton();

    }

    console.log(
      "ACCOUNT LOADED SUCCESSFULLY:",
      currentUser
    );

  } catch (error) {

    console.error(
      "LOAD ACCOUNT ERROR:",
      error
    );

    /*
     * IMPORTANT:
     * Do NOT delete the session here.
     * We need to see the real error first.
     */

    if (accountSection) {
      accountSection.style.display = "block";
    }

    if (registerSection) {
      registerSection.style.display = "none";
    }

    if (loginSection) {
      loginSection.style.display = "none";
    }

    if (logoutButton) {
      logoutButton.style.display = "";
    }

    const message =
      error.message ||
      "Unable to load your account.";

    console.error(
      "NEXUS ACCOUNT ERROR:",
      message
    );

    alert(
      "Nexus Faucet account error:\n\n" +
      message
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

    const referralId =
      user.referralId ||
      user.referral_id ||
      user.referralCode ||
      user.referral_code ||
      user.referral ||
      "";

    let link =
      user.referralLink ||
      user.referral_link ||
      "";


    if (!link && referralId) {

      link =
        window.location.origin +
        window.location.pathname +
        "?ref=" +
        encodeURIComponent(
          referralId
        );

    }


    if (link) {

      referralLink.value =
        link;

    } else {

      referralLink.value =
        "Referral link unavailable";

    }

  }


  if (referralEarnings) {

    referralEarnings.textContent =
      Number(
        user.referralEarnings ||
        user.referral_earnings ||
        0
      ).toFixed(
        DECIMALS
      );

  }


  if (referralCount) {

    referralCount.textContent =
      Number(
        user.referralCount ||
        user.referral_count ||
        0
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
        ? "block"
        : "none";

  }


  if (logoutButton) {

    logoutButton.style.display =
      loggedIn
        ? ""
        : "none";

  }


  if (claimButton && !loggedIn) {

    claimButton.disabled = true;

    claimButton.textContent =
      "LOGIN TO CLAIM";

  }


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


  if (!loggedIn) {

    withdrawButton.disabled =
      true;

    withdrawButton.textContent =
      "LOGIN TO WITHDRAW";

    return;
  }


  const amount =
    withdrawAmount
      ? Number(
          withdrawAmount.value || 0
        )
      : 0;


  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    withdrawButton.disabled =
      true;

    withdrawButton.textContent =
      "ENTER VALID AMOUNT";

    return;
  }


  if (amount < MIN_WITHDRAWAL) {

    withdrawButton.disabled =
      true;

    withdrawButton.textContent =
      "MINIMUM " +
      MIN_WITHDRAWAL.toFixed(8);

    return;
  }


  if (amount > currentBalance) {

    withdrawButton.disabled =
      true;

    withdrawButton.textContent =
      "INSUFFICIENT BALANCE";

    return;
  }


  withdrawButton.disabled =
    false;

  withdrawButton.textContent =
    "WITHDRAW";
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
      "";
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


    if (!response.success) {

      throw new Error(
        response.message ||
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


    /*
     * Refresh the complete account data
     * after a successful claim.
     */

    await loadAccount();


    showMessage(
      response.message ||
      (
        "Claim successful! +" +
        REWARD.toFixed(DECIMALS) +
        " USDT"
      )
    );


  } catch (error) {

    showMessage(
      error.message ||
      "Claim failed."
    );


    await loadAccount();
  }
}


/* =========================================================
   CLAIM TIMER
========================================================= */

function startClaimTimer(seconds) {

  clearClaimTimer();


  const safeSeconds =
    Math.max(
      0,
      Number(seconds || 0)
    );


  nexusClaimEndTime =
    Date.now() +
    safeSeconds * 1000;


  if (safeSeconds <= 0) {

    enableClaimButton();

    return;
  }


  if (claimButton) {

    claimButton.disabled =
      true;

    claimButton.textContent =
      "PLEASE WAIT";
  }


  updateClaimTimer();


  claimTimer =
    setInterval(
      updateClaimTimer,
      1000
    );
}


/* =========================================================
   UPDATE CLAIM TIMER
========================================================= */

function updateClaimTimer() {

  const remaining =
    Math.max(
      0,
      Math.ceil(
        (
          nexusClaimEndTime -
          Date.now()
        ) / 1000
      )
    );


  if (countdownElement) {

    countdownElement.textContent =
      formatTime(remaining);

  }


  if (remaining <= 0) {

    clearClaimTimer();

    enableClaimButton();

  }
}


/* =========================================================
   FORMAT TIME
========================================================= */

function formatTime(totalSeconds) {

  const seconds =
    Math.max(
      0,
      Number(totalSeconds || 0)
    );


  const hours =
    Math.floor(
      seconds / 3600
    );


  const minutes =
    Math.floor(
      (seconds % 3600) / 60
    );


  const remainingSeconds =
    seconds % 60;


  return (
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0") +
    ":" +
    String(remainingSeconds).padStart(2, "0")
  );
}


/* =========================================================
   CLEAR TIMER
========================================================= */

function clearClaimTimer() {

  if (claimTimer) {

    clearInterval(
      claimTimer
    );

    claimTimer = null;
  }


  nexusClaimEndTime = 0;
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


    if (countdownElement) {

      countdownElement.textContent =
        "LOGIN TO CLAIM";

    }

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
   WITHDRAWAL INPUT
========================================================= */

function setupWithdrawalInput() {

  if (!withdrawAmount) {
    return;
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

    const ref =
      params.get("ref");


    if (ref) {

      registerReferral.value =
        ref;

    }

  } catch (error) {

    console.error(
      "Referral URL error:",
      error
    );

  }
}


/* =========================================================
   COPY REFERRAL LINK
========================================================= */

async function copyReferralLink() {

  if (!getSessionToken()) {

    showMessage(
      "Please login to copy your referral link."
    );

    return;
  }


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
   SESSION STORAGE
========================================================= */

function saveSessionToken(token) {

  if (!token) {
    return;
  }


  localStorage.setItem(
    SESSION_KEY,
    token
  );
}


function getSessionToken() {

  return localStorage.getItem(
    SESSION_KEY
  );
}


function removeSessionToken() {

  localStorage.removeItem(
    SESSION_KEY
  );
}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutUser() {

  const token =
    getSessionToken();


  clearClaimTimer();


  try {

    if (token) {

      await apiPost({
        action: "logout",
        token: token
      });

    }

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

  }


  removeSessionToken();

  currentUser = null;

  currentBalance = 0;


  resetDashboard();


  showMessage(
    "You have been logged out."
  );
}


/* =========================================================
   RESET DASHBOARD
========================================================= */

function resetDashboard() {

  clearClaimTimer();


  currentUser = null;

  currentBalance = 0;


  if (accountEmail) {

    accountEmail.textContent =
      "";

  }


  if (faucetEmail) {

    faucetEmail.value =
      "";

  }


  if (balanceElement) {

    balanceElement.textContent =
      "0.00000000";

  }


  if (referralLink) {

    referralLink.value =
      "";

    referralLink.placeholder =
      "Login to see your referral link";

  }


  if (referralEarnings) {

    referralEarnings.textContent =
      "0.00000000";

  }


  if (referralCount) {

    referralCount.textContent =
      "0";

  }


  if (withdrawAmount) {

    withdrawAmount.value =
      "";

  }


  if (countdownElement) {

    countdownElement.textContent =
      "LOGIN TO CLAIM";

  }


  updateAccountUI();
}


/* =========================================================
   KEYBOARD ACTIONS
========================================================= */

function setupKeyboardActions() {

  if (loginPassword) {

    loginPassword.addEventListener(
      "keydown",
      function (event) {

        if (event.key === "Enter") {

          event.preventDefault();

          loginUser();

        }

      }
    );

  }


  if (registerPassword) {

    registerPassword.addEventListener(
      "keydown",
      function (event) {

        if (event.key === "Enter") {

          event.preventDefault();

          registerUser();

        }

      }
    );

  }
}


/* =========================================================
   PREVENT ACCIDENTAL FORM SUBMISSION
========================================================= */

function protectButtons() {

  document.addEventListener(
    "submit",
    function (event) {

      event.preventDefault();

    }
  );
}


/* =========================================================
   API REQUEST
========================================================= */

async function apiPost(data) {

  const response =
    await fetch(
      API_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(data)
      }
    );


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


  if (!response.ok) {

    throw new Error(
      result.message ||
      result.error ||
      "Server error: " +
      response.status
    );

  }


  return result;
}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(message) {

  console.log(
    "Nexus Faucet:",
    message
  );


  const messageElement =
    document.getElementById(
      "message"
    );


  if (messageElement) {

    messageElement.textContent =
      message;

    messageElement.style.display =
      "block";


    setTimeout(
      function () {

        messageElement.style.display =
          "none";

      },
      5000
    );


    return;
  }


  alert(message);
}


/* =========================================================
   END
========================================================= */

console.log(
  "Nexus Faucet frontend initialized."
);
 
