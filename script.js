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
