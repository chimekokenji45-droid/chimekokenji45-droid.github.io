"use strict";

/* =========================================================
   NEXUS FAUCET — FRONTEND JAVASCRIPT
   PART 1 OF 2
========================================================= */


/* =========================================================
   BACKEND URL
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

const SESSION_KEY = "nexus_session_token";


/* =========================================================
   APP STATE
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
   START APPLICATION
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    getElements();

    setupButtons();

    setupReferralFromUrl();

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
   REGISTER USER
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
            "Registration response:",
            response
        );


        if (!response || response.success !== true) {

            throw new Error(
                response && response.message
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
            "Registration error:",
            error
        );


        showMessage(
            error.message ||
            "Registration failed. Please try again."
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
   LOGIN USER
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


        if (!response || response.success !== true) {

            throw new Error(
                response && response.message
                    ? response.message
                    : "Login failed."
            );

        }


        if (!response.token) {

            throw new Error(
                "No login session was returned."
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
            "Login error:",
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


        if (!response || response.success !== true) {

            throw new Error(
                response && response.message
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
            "Account error:",
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


    if (accountEmail) {

        accountEmail.textContent =
            user.email || "";

    }


    if (faucetEmail) {

        faucetEmail.value =
            user.email || "";

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
   SESSION
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


    /* ==========================================
       UPDATE BALANCE
    ========================================== */

    currentBalance =
      Number(response.balance || 0);

    displayBalance(currentBalance);


    /* ==========================================
       UPDATE REFERRAL EARNINGS
    ========================================== */

    if (currentUser) {

      currentUser.referralEarnings =
        response.referralEarnings ||
        currentUser.referralEarnings ||
        0;

      displayUser(currentUser);
    }


    /* ==========================================
       SUCCESS MESSAGE
    ========================================== */

    showMessage(
      response.message ||
      "Reward claimed successfully!"
    );


    /* ==========================================
       START COUNTDOWN
       
       The server remains the authority for
       the actual claim restriction.
    ========================================== */

    let seconds =
      Number(response.secondsUntilClaim);

    /*
       If the backend does not return the
       countdown value, use the configured
       30-minute interval.
    */

    if (
      !Number.isFinite(seconds) ||
      seconds <= 0
    ) {
      seconds = CLAIM_INTERVAL;
    }

    startClaimTimer(seconds);

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
       Reload account information from the
       backend so the balance and timer are
       synchronized with the server.
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
   CLAIM TIMER
========================================================= */

function startClaimTimer(seconds) {

  /*
     Stop any old timer first.
  */

  if (claimTimer) {
    clearInterval(claimTimer);
    claimTimer = null;
  }


  /*
     Convert the server value into a
     whole number of seconds.
  */

  let remaining =
    Math.max(
      0,
      Math.floor(
        Number(seconds) || 0
      )
    );


  /*
     Show the initial time immediately.
  */

  updateClaimTimer(remaining);


  /*
     If the timer is already finished,
     enable the claim button.
  */

  if (remaining <= 0) {
    enableClaimButton();
    return;
  }


  /*
     Disable the button while waiting.
  */

  if (claimButton) {
    claimButton.disabled = true;
    claimButton.textContent = "PLEASE WAIT";
  }


  /*
     Count down every second.
  */

  claimTimer = setInterval(
    function () {

      remaining--;

      updateClaimTimer(remaining);


      /*
         When the countdown reaches zero,
         stop the timer and enable claiming.
      */

      if (remaining <= 0) {

        clearInterval(claimTimer);
        claimTimer = null;

        enableClaimButton();
      }

    },
    1000
  );
}


/* =========================================================
   UPDATE CLAIM TIMER DISPLAY
========================================================= */

function updateClaimTimer(seconds) {

  const remaining =
    Math.max(
      0,
      Math.floor(
        Number(seconds) || 0
      )
    );


  if (!countdownElement) {
    return;
  }


  /*
     Timer finished.
  */

  if (remaining <= 0) {

    countdownElement.textContent =
      "READY TO CLAIM";

    return;
  }


  /*
     Calculate hours.
  */

  const hours =
    Math.floor(
      remaining / 3600
    );


  /*
     Calculate minutes.
  */

  const minutes =
    Math.floor(
      (remaining % 3600) / 60
    );


  /*
     Calculate seconds.
  */

  const secs =
    remaining % 60;


  /*
     Always display two digits.
     
     Example:
     00:29:59
     00:29:58
     00:29:57
  */

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


  /*
     User must still be logged in.
  */

  if (!getSessionToken()) {

    claimButton.disabled = true;

    claimButton.textContent =
      "LOGIN TO CLAIM";

    return;
  }


  /*
     Timer finished.
  */

  claimButton.disabled = false;

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


  const amount =
    withdrawAmount
      ? Number(
          withdrawAmount.value || 0
        )
      : 0;


  const loggedIn =
    !!getSessionToken();


  const validAmount =
    Number.isFinite(amount) &&
    amount >= MIN_WITHDRAWAL &&
    amount <= currentBalance;


  withdrawButton.disabled =
    !loggedIn ||
    !validAmount;
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
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    showMessage(
      "Please enter a valid withdrawal amount."
    );

    return;
  }


  if (amount < MIN_WITHDRAWAL) {

    showMessage(
      "Minimum withdrawal is " +
      formatAmount(
        MIN_WITHDRAWAL
      ) +
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


  /*
     Prevent double-clicking.
  */

  if (withdrawButton) {

    withdrawButton.disabled = true;

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
        response && response.message
          ? response.message
          : "Withdrawal failed."
      );
    }


    /*
       Update balance returned by
       the server.
    */

    currentBalance =
      Number(
        response.balance || 0
      );


    displayBalance(
      currentBalance
    );


    /*
       Clear withdrawal field.
    */

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
