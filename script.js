"use strict";

/*

NEXUS FAUCET

AD-BLOCK DETECTION ADDED

IMPORTANT:
Ad-block detection cannot force a browser to disable
its ad blocker. It can only detect likely blocking and
ask the user to disable it.

*/

/* =====================================================
SETTINGS
===================================================== */

const CLAIM_REWARD = 0.000025;

const MIN_WITHDRAWAL = 0.0005;

const CLAIM_INTERVAL = 1800;

const REFERRAL_COMMISSION = 0.20;

/* =====================================================
ELEMENTS
===================================================== */

const emailInput =
document.getElementById("faucetEmail");

const balanceElement =
document.getElementById("balance");

const timerElement =
document.getElementById("timer");

const claimButton =
document.getElementById("claimButton");

const withdrawAmount =
document.getElementById("withdrawAmount");

const withdrawButton =
document.getElementById("withdrawButton");

const messageElement =
document.getElementById("message");

const referralLink =
document.getElementById("referralLink");

const copyReferralButton =
document.getElementById("copyReferralButton");

const referralCountElement =
document.getElementById("referralCount");

const referralEarningsElement =
document.getElementById("referralEarnings");

/* =====================================================
AD-BLOCK ELEMENT
===================================================== */

let adBlockWarning =
document.getElementById("adBlockWarning");

/*
If the warning element doesn't already exist in
index.html, create it automatically.
*/

if (!adBlockWarning) {

adBlockWarning =
document.createElement("div");

adBlockWarning.id =
"adBlockWarning";

adBlockWarning.innerHTML = `
<div class="adblock-box">
<strong>⚠️ Ad Blocker Detected</strong>

  <p>
    Please disable your ad blocker for
    Nexus Faucet before claiming.
  </p>

  <button id="adBlockRetry">
    I Disabled My Ad Blocker
  </button>
</div>

`;

document.body.prepend(
adBlockWarning
);
}

/* =====================================================
AD-BLOCK STYLING
===================================================== */

const adBlockStyle =
document.createElement("style");

adBlockStyle.textContent = `

#adBlockWarning {
display: none;
width: 100%;
box-sizing: border-box;
padding: 15px;
text-align: center;
}

#adBlockWarning .adblock-box {
max-width: 500px;
margin: 10px auto;
padding: 20px;
border-radius: 12px;
border: 1px solid #ff4444;
background: #241010;
color: white;
box-sizing: border-box;
}

#adBlockWarning strong {
display: block;
font-size: 18px;
margin-bottom: 8px;
}

#adBlockWarning p {
margin: 10px 0 15px;
line-height: 1.5;
}

#adBlockRetry {
border: none;
border-radius: 8px;
padding: 10px 18px;
cursor: pointer;
font-weight: bold;
}

#adBlockRetry:hover {
opacity: 0.9;
}

`;

document.head.appendChild(
adBlockStyle
);

/* =====================================================
AD-BLOCK STATE
===================================================== */

let adBlockDetected = false;

/* =====================================================
LOCAL DATA

PROTOTYPE ONLY
===================================================== */

let balance =
Number(
localStorage.getItem(
"nexusBalance"
) || "0"
);

let claimTimer =
Number(
localStorage.getItem(
"nexusClaimTimer"
) || "0"
);

let referralCount =
Number(
localStorage.getItem(
"nexusReferralCount"
) || "0"
);

let referralEarnings =
Number(
localStorage.getItem(
"nexusReferralEarnings"
) || "0"
);

/* =====================================================
SAVE DATA
===================================================== */

function saveData() {

localStorage.setItem(
"nexusBalance",
balance.toFixed(8)
);

localStorage.setItem(
"nexusClaimTimer",
String(claimTimer)
);

localStorage.setItem(
"nexusReferralCount",
String(referralCount)
);

localStorage.setItem(
"nexusReferralEarnings",
referralEarnings.toFixed(8)
);

}

/* =====================================================
UPDATE BALANCE
===================================================== */

function updateBalance() {

if (balanceElement) {

balanceElement.textContent =
  balance.toFixed(8);

}

}

/* =====================================================
UPDATE REFERRALS
===================================================== */

function updateReferralStats() {

if (referralCountElement) {

referralCountElement.textContent =
  referralCount;

}

if (referralEarningsElement) {

referralEarningsElement.textContent =
  referralEarnings.toFixed(8);

}

}

/* =====================================================
MESSAGE
===================================================== */

function showMessage(
text,
type = "success"
) {

if (!messageElement) return;

messageElement.textContent =
text;

messageElement.className =
"message " + type;

}

/* =====================================================
FORMAT TIME
===================================================== */

function formatTime(
seconds
) {

const minutes =
Math.floor(seconds / 60);

const remainingSeconds =
seconds % 60;

return (
String(minutes).padStart(2, "0") +
":" +
String(remainingSeconds).padStart(2, "0")
);

}

/* =====================================================
UPDATE CLAIM BUTTON
===================================================== */

function updateClaimButton() {

if (!claimButton) return;

if (claimTimer <= 0) {

if (timerElement) {

  timerElement.textContent =
    "00:00";

}

/*
IMPORTANT:
Don't enable claim if ad blocker
is detected.
*/

if (adBlockDetected) {

  claimButton.disabled =
    true;

  claimButton.textContent =
    "DISABLE AD BLOCKER";

}

else {

  claimButton.disabled =
    false;

  claimButton.textContent =
    "CLAIM NOW";

}

}

else {

if (timerElement) {

  timerElement.textContent =
    formatTime(claimTimer);

}

claimButton.disabled =
  true;

claimButton.textContent =
  "PLEASE WAIT";

}

}

/* =====================================================
TIMER
===================================================== */

function runTimer() {

updateClaimButton();

setInterval(
function () {

  if (claimTimer > 0) {

    claimTimer--;

    saveData();

    updateClaimButton();

  }

},
1000

);

}

/* =====================================================
EMAIL VALIDATION
===================================================== */

function validEmail(
email
) {

return /^[^\s@]+@[^\s@]+.[^\s@]+$/.test(
email
);

}

/* =====================================================
AD-BLOCK DETECTION
===================================================== */

function checkAdBlock() {

/*
Create an element using common ad-related
class/id names.

Many ad blockers hide elements containing
these names.
*/

const bait =
document.createElement("div");

bait.className =
"adsbox ad-banner ad-unit adsbygoogle";

bait.id =
"ad-banner";

bait.style.position =
"absolute";

bait.style.left =
"-9999px";

bait.style.width =
"1px";

bait.style.height =
"1px";

bait.style.display =
"block";

document.body.appendChild(
bait
);

/*
Give the browser a moment to let
content blockers act.
*/

setTimeout(
function () {

  const blocked =
    bait.offsetHeight === 0 ||
    bait.offsetWidth === 0 ||
    getComputedStyle(bait).display === "none" ||
    getComputedStyle(bait).visibility === "hidden";


  adBlockDetected =
    blocked;


  bait.remove();


  updateAdBlockUI();

  updateClaimButton();

},
500

);

}

/* =====================================================
UPDATE AD-BLOCK UI
===================================================== */

function updateAdBlockUI() {

if (!adBlockWarning) return;

if (adBlockDetected) {

adBlockWarning.style.display =
  "block";

showMessage(
  "Please disable your ad blocker before claiming.",
  "error"
);

}

else {

adBlockWarning.style.display =
  "none";

}

}

/* =====================================================
RETRY AD DETECTION
===================================================== */

const adBlockRetry =
document.getElementById(
"adBlockRetry"
);

if (adBlockRetry) {

adBlockRetry.addEventListener(
"click",
function () {

  showMessage(
    "Checking your browser...",
    "success"
  );


  adBlockDetected =
    false;


  updateClaimButton();


  checkAdBlock();

}

);

}

/* =====================================================
PERIODIC AD-BLOCK CHECK
===================================================== */

setInterval(
function () {

checkAdBlock();

},
10000
);

/* =====================================================
CLAIM
===================================================== */

if (claimButton) {

claimButton.addEventListener(
"click",
function () {

  /*
  CHECK AD BLOCKER
  */

  if (adBlockDetected) {

    showMessage(
      "Please disable your ad blocker before claiming.",
      "error"
    );

    return;

  }


  const email =
    emailInput.value.trim();


  /* -----------------------------------------------
     CHECK EMAIL
  ------------------------------------------------ */

  if (!validEmail(email)) {

    showMessage(
      "Enter your valid FaucetPay email first.",
      "error"
    );

    emailInput.focus();

    return;

  }


  /* -----------------------------------------------
     CHECK TIMER
  ------------------------------------------------ */

  if (claimTimer > 0) {

    showMessage(
      "Your next claim is not ready yet.",
      "error"
    );

    return;

  }


  /* -----------------------------------------------
     ADD REWARD
  ------------------------------------------------ */

  balance =
    Number(
      (
        balance +
        CLAIM_REWARD
      ).toFixed(8)
    );


  /* -----------------------------------------------
     START TIMER
  ------------------------------------------------ */

  claimTimer =
    CLAIM_INTERVAL;


  /* -----------------------------------------------
     SAVE
  ------------------------------------------------ */

  saveData();


  /* -----------------------------------------------
     UPDATE DISPLAY
  ------------------------------------------------ */

  updateBalance();

  updateClaimButton();


  /* -----------------------------------------------
     SUCCESS MESSAGE
  ------------------------------------------------ */

  showMessage(
    "Claim successful! +" +
    CLAIM_REWARD.toFixed(8) +
    " USDT",
    "success"
  );

}

);

}

/* =====================================================
WITHDRAW
===================================================== */

if (withdrawButton) {

withdrawButton.addEventListener(
"click",
function () {

  const email =
    emailInput.value.trim();


  const amount =
    Number(
      withdrawAmount.value
    );


  /* -----------------------------------------------
     CHECK EMAIL
  ------------------------------------------------ */

  if (!validEmail(email)) {

    showMessage(
      "Enter your valid FaucetPay email first.",
      "error"
    );

    emailInput.focus();

    return;

  }


  /* -----------------------------------------------
     CHECK AMOUNT
  ------------------------------------------------ */

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    showMessage(
      "Enter a valid withdrawal amount.",
      "error"
    );

    return;

  }


  /* -----------------------------------------------
     CHECK MINIMUM
  ------------------------------------------------ */

  if (amount < MIN_WITHDRAWAL) {

    showMessage(
      "Minimum withdrawal is " +
      MIN_WITHDRAWAL.toFixed(8) +
      " USDT.",
      "error"
    );

    return;

  }


  /* -----------------------------------------------
     CHECK BALANCE
  ------------------------------------------------ */

  if (amount > balance) {

    showMessage(
      "Insufficient balance.",
      "error"
    );

    return;

  }


  /* -----------------------------------------------
     BACKEND NOT CONNECTED
  ------------------------------------------------ */

  showMessage(
    "Withdrawal is not connected yet. " +
    "The secure backend must be connected before real payouts.",
    "error"
  );

}

);

}

/* =====================================================
REFERRAL ID
===================================================== */

let referralId =
localStorage.getItem(
"nexusReferralId"
);

if (!referralId) {

referralId =
"NEXUS-" +
Math.random()
.toString(36)
.substring(
2,
10
)
.toUpperCase();

localStorage.setItem(
"nexusReferralId",
referralId
);

}

/* =====================================================
REFERRAL LINK
===================================================== */

if (referralLink) {

const currentUrl =
window.location.origin +
window.location.pathname;

referralLink.value =
currentUrl +
"?ref=" +
encodeURIComponent(
referralId
);

}

/* =====================================================
READ REFERRAL FROM URL
===================================================== */

const urlParams =
new URLSearchParams(
window.location.search
);

const incomingReferral =
urlParams.get("ref");

if (
incomingReferral &&
incomingReferral !== referralId
) {

localStorage.setItem(
"nexusIncomingReferral",
incomingReferral
);

}

/* =====================================================
COPY REFERRAL LINK
===================================================== */

if (copyReferralButton) {

copyReferralButton.addEventListener(
"click",
async function () {

  try {

    await navigator.clipboard.writeText(
      referralLink.value
    );


    copyReferralButton.textContent =
      "COPIED";


    setTimeout(
      function () {

        copyReferralButton.textContent =
          "COPY";

      },
      2000
    );

  }

  catch (error) {

    referralLink.select();

    document.execCommand(
      "copy"
    );

    copyReferralButton.textContent =
      "COPIED";

  }

}

);

}

/* =====================================================
REFERRAL COMMISSION
===================================================== */

function calculateReferralCommission(
claimReward
) {

return Number(
(
claimReward *
REFERRAL_COMMISSION
).toFixed(8)
);

}

/* =====================================================
INITIALIZE
===================================================== */

updateBalance();

updateReferralStats();

updateClaimButton();

runTimer();

/*
Start ad-block detection after
the page has loaded.
*/

if (
document.readyState === "loading"
) {

document.addEventListener(
"DOMContentLoaded",
function () {

  checkAdBlock();

}

);

}

else {

checkAdBlock();

}
