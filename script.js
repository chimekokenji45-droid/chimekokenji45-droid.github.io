// ==========================================
// CYBERSTRIKE
// SCRIPT.JS
// PART 1 OF 4
// SETUP, STATE & AUTHENTICATION
// ==========================================


// ==========================================
// 1. SUPABASE CONFIGURATION
// ==========================================

const SUPABASE_URL =
  "https://btugwhcoypxtlgmsxqci.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable__DjyCoKhrV9vpmAUY-T3lg_0f-Ji2-h";


// ==========================================
// 2. CREATE SUPABASE CLIENT
// ==========================================

let supabaseClient = null;

if (
  typeof window.supabase !== "undefined" &&
  SUPABASE_URL &&
  SUPABASE_ANON_KEY
) {
  supabaseClient =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );
}


// ==========================================
// 3. CYBERSTRIKE STATE
// ==========================================

const state = {
  user: null,
  balance: 0.00,
  wins: 0,
  claimedMilestones: []
};


// ==========================================
// 4. PAGE INITIALIZATION
// ==========================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    console.log(
      "CYBERSTRIKE: Initializing..."
    );

    if (!supabaseClient) {

      console.error(
        "CYBERSTRIKE: Supabase client failed."
      );

      showAuthError(
        "SYSTEM CONNECTION ERROR. PLEASE REFRESH THE PAGE."
      );

      return;
    }

    console.log(
      "CYBERSTRIKE: Supabase connected."
    );

    setupEventListeners();

    await checkExistingSession();

    updateUI();
  }
);


// ==========================================
// 5. EVENT LISTENERS
// ==========================================

function setupEventListeners() {

  const claim20Btn =
    document.getElementById(
      "claim20Btn"
    );

  const claim50Btn =
    document.getElementById(
      "claim50Btn"
    );

  const claim100Btn =
    document.getElementById(
      "claim100Btn"
    );

  const claim1000Btn =
    document.getElementById(
      "claim1000Btn"
    );


  if (claim20Btn) {

    claim20Btn.addEventListener(
      "click",
      () => claimMilestone(20, 2.00)
    );
  }


  if (claim50Btn) {

    claim50Btn.addEventListener(
      "click",
      () => claimMilestone(50, 5.00)
    );
  }


  if (claim100Btn) {

    claim100Btn.addEventListener(
      "click",
      () => claimMilestone(100, 10.00)
    );
  }


  if (claim1000Btn) {

    claim1000Btn.addEventListener(
      "click",
      () => claimMilestone(1000, 100.00)
    );
  }
}


// ==========================================
// 6. CHECK EXISTING SESSION
// ==========================================

async function checkExistingSession() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.getSession();


    if (error) {

      console.error(
        "CYBERSTRIKE session error:",
        error
      );

      return;
    }


    const session =
      data?.session;


    if (!session) {

      console.log(
        "CYBERSTRIKE: No active session."
      );

      return;
    }


    console.log(
      "CYBERSTRIKE: Existing session found."
    );


    state.user =
      session.user;


    await loadUserProfile(
      state.user
    );


    enterArena();


  } catch (error) {

    console.error(
      "CYBERSTRIKE session check failed:",
      error
    );
  }
}


// ==========================================
// 7. LOGIN
// ==========================================

async function handleLogin() {

  const emailInput =
    document
      .getElementById("loginEmail")
      ?.value
      .trim();

  const passwordInput =
    document
      .getElementById("loginPassword")
      ?.value;

  const authMsg =
    document.getElementById(
      "authMessage"
    );

  const loginBtn =
    document.getElementById(
      "loginButton"
    );


  // ----------------------------------------
  // VALIDATION
  // ----------------------------------------

  if (!emailInput) {

    showAuthError(
      "PLEASE ENTER YOUR EMAIL ADDRESS."
    );

    return;
  }


  if (!passwordInput) {

    showAuthError(
      "PLEASE ENTER YOUR PASSWORD."
    );

    return;
  }


  if (!supabaseClient) {

    showAuthError(
      "SUPABASE CONNECTION IS NOT READY."
    );

    return;
  }


  // ----------------------------------------
  // CLEAR ERROR
  // ----------------------------------------

  if (authMsg) {

    authMsg.classList.add(
      "hidden"
    );

    authMsg.innerText = "";
  }


  // ----------------------------------------
  // LOGIN BUTTON
  // ----------------------------------------

  if (loginBtn) {

    loginBtn.disabled = true;

    loginBtn.innerText =
      "AUTHENTICATING...";
  }


  try {

    console.log(
      "CYBERSTRIKE: Login attempt:",
      emailInput
    );


    // --------------------------------------
    // SUPABASE LOGIN
    // --------------------------------------

    const {
      data,
      error
    } =
      await supabaseClient.auth
        .signInWithPassword({

          email:
            emailInput,

          password:
            passwordInput

        });


    if (error) {

      console.error(
        "CYBERSTRIKE login error:",
        error
      );

      throw error;
    }


    if (!data?.user) {

      throw new Error(
        "LOGIN FAILED. NO USER ACCOUNT WAS RETURNED."
      );
    }


    // --------------------------------------
    // SAVE USER
    // --------------------------------------

    state.user =
      data.user;


    console.log(
      "CYBERSTRIKE: Login successful.",
      state.user.id
    );


    // --------------------------------------
    // LOAD PLAYER PROFILE
    // --------------------------------------

    await loadUserProfile(
      state.user
    );


    // --------------------------------------
    // ENTER ARENA
    // --------------------------------------

    enterArena();


  } catch (error) {

    console.error(
      "CYBERSTRIKE authentication failed:",
      error
    );


    let message =
      error?.message ||
      "LOGIN FAILED. PLEASE CHECK YOUR EMAIL AND PASSWORD.";


    if (
      message
        .toLowerCase()
        .includes(
          "invalid login credentials"
        )
    ) {

      message =
        "INVALID EMAIL OR PASSWORD.";
    }


    showAuthError(
      message
    );


  } finally {

    if (loginBtn) {

      loginBtn.disabled =
        false;

      loginBtn.innerText =
        "LOGIN / ENTER ARENA";
    }
  }
}


// ==========================================
// 8. LOAD PLAYER PROFILE
// ==========================================

async function loadUserProfile(
  user
) {

  if (!user) {
    return;
  }


  console.log(
    "CYBERSTRIKE: Loading player profile..."
  );


  const {
    data: profile,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select(
        "id, balance, wins"
      )
      .eq(
        "id",
        user.id
      )
      .maybeSingle();


  if (error) {

    console.error(
      "CYBERSTRIKE profile error:",
      error
    );

    throw error;
  }


  // ----------------------------------------
  // NO PROFILE YET
  // ----------------------------------------

  if (!profile) {

    console.log(
      "CYBERSTRIKE: Creating player profile..."
    );


    const {
      data: newProfile,
      error: createError
    } =
      await supabaseClient
        .from("profiles")
        .insert({

          id:
            user.id,

          balance:
            0,

          wins:
            0

        })
        .select(
          "id, balance, wins"
        )
        .single();


    if (createError) {

      console.error(
        "CYBERSTRIKE profile creation error:",
        createError
      );

      throw createError;
    }


    state.balance =
      parseFloat(
        newProfile.balance
      ) || 0;


    state.wins =
      parseInt(
        newProfile.wins,
        10
      ) || 0;


    state.claimedMilestones =
      [];


    return;
  }


  // ----------------------------------------
  // EXISTING PROFILE
  // ----------------------------------------

  state.balance =
    parseFloat(
      profile.balance
    ) || 0;


  state.wins =
    parseInt(
      profile.wins,
      10
    ) || 0;


  state.claimedMilestones =
    [];


  console.log(
    "CYBERSTRIKE profile loaded:",
    state.balance,
    state.wins
  );
}


// ==========================================
// 9. ENTER ARENA
// ==========================================

function enterArena() {

  const authGate =
    document.getElementById(
      "authGate"
    );

  const appContainer =
    document.getElementById(
      "appContainer"
    );


  if (authGate) {

    authGate.classList.add(
      "hidden"
    );
  }


  if (appContainer) {

    appContainer.classList.remove(
      "hidden"
    );
  }


  // ----------------------------------------
  // USER ID
  // ----------------------------------------

  const depositUserId =
    document.getElementById(
      "depositUserId"
    );


  if (
    depositUserId &&
    state.user
  ) {

    depositUserId.value =
      state.user.id;
  }


  // ----------------------------------------
  // USER EMAIL
  // ----------------------------------------

  const withdrawEmail =
    document.getElementById(
      "withdrawEmail"
    );


  if (
    withdrawEmail &&
    state.user
  ) {

    withdrawEmail.value =
      state.user.email || "";
  }


  updateUI();


  console.log(
    "CYBERSTRIKE: Connected to arena."
  );
}


// ==========================================
// 10. LOGOUT
// ==========================================

async function logout() {

  try {

    if (supabaseClient) {

      await supabaseClient.auth
        .signOut();
    }

  } catch (error) {

    console.error(
      "CYBERSTRIKE logout error:",
      error
    );

  } finally {

    state.user = null;

    state.balance = 0;

    state.wins = 0;

    state.claimedMilestones = [];


    const authGate =
      document.getElementById(
        "authGate"
      );

    const appContainer =
      document.getElementById(
        "appContainer"
      );


    if (appContainer) {

      appContainer.classList.add(
        "hidden"
      );
    }


    if (authGate) {

      authGate.classList.remove(
        "hidden"
      );
    }


    const loginEmail =
      document.getElementById(
        "loginEmail"
      );

    const loginPassword =
      document.getElementById(
        "loginPassword"
      );


    if (loginEmail) {

      loginEmail.value = "";
    }


    if (loginPassword) {

      loginPassword.value = "";
    }


    updateUI();
  }
}


// ==========================================
// 11. AUTH ERROR
// ==========================================

function showAuthError(
  msg
) {

  const authMsg =
    document.getElementById(
      "authMessage"
    );


  if (!authMsg) {

    console.error(
      "CYBERSTRIKE AUTH ERROR:",
      msg
    );

    return;
  }


  authMsg.innerText =
    msg;


  authMsg.classList.remove(
    "hidden"
  );
}


// ==========================================
// 12. SUPABASE AUTH STATE
// ==========================================

if (
  supabaseClient
) {

  supabaseClient.auth
    .onAuthStateChange(
      (event, session) => {

        console.log(
          "CYBERSTRIKE AUTH EVENT:",
          event
        );


        if (
          event ===
          "SIGNED_OUT"
        ) {

          state.user = null;

          state.balance = 0;

          state.wins = 0;

          state.claimedMilestones = [];
        }
      }
    );
}// ==========================================
// CYBERSTRIKE
// SCRIPT.JS
// PART 2 OF 4
// UI, MILESTONES & ALERT SYSTEM
// ==========================================


// ==========================================
// 13. MILESTONE REWARD LOGIC
// ==========================================

async function claimMilestone(
  winsRequired,
  rewardAmount
) {

  // ----------------------------------------
  // CHECK LOGIN
  // ----------------------------------------

  if (!state.user) {

    showCyberAlert(
      "LOGIN REQUIRED",
      "PLEASE LOGIN BEFORE CLAIMING A MILESTONE.",
      "fa-lock"
    );

    return;
  }


  // ----------------------------------------
  // CHECK WIN REQUIREMENT
  // ----------------------------------------

  if (
    state.wins <
    winsRequired
  ) {

    showCyberAlert(
      "MILESTONE LOCKED",
      `YOU NEED ${winsRequired} WINS TO CLAIM THIS REWARD.`,
      "fa-lock"
    );

    return;
  }


  // ----------------------------------------
  // CHECK ALREADY CLAIMED
  // ----------------------------------------

  if (
    state.claimedMilestones.includes(
      winsRequired
    )
  ) {

    showCyberAlert(
      "ALREADY CLAIMED",
      "THIS MILESTONE HAS ALREADY BEEN CLAIMED.",
      "fa-circle-check"
    );

    return;
  }


  // ----------------------------------------
  // DISABLE BUTTON
  // ----------------------------------------

  const buttonId =
    getMilestoneButtonId(
      winsRequired
    );

  const button =
    document.getElementById(
      buttonId
    );


  if (button) {

    button.disabled =
      true;

    button.innerText =
      "PROCESSING...";
  }


  try {

    // --------------------------------------
    // ADD REWARD LOCALLY
    // --------------------------------------

    const newBalance =
      state.balance +
      rewardAmount;


    // --------------------------------------
    // UPDATE SUPABASE
    // --------------------------------------

    const {
      data,
      error
    } =
      await supabaseClient
        .from("profiles")
        .update({

          balance:
            newBalance

        })
        .eq(
          "id",
          state.user.id
        )
        .select(
          "balance"
        )
        .single();


    if (error) {

      console.error(
        "Milestone update error:",
        error
      );

      throw error;
    }


    // --------------------------------------
    // SAVE SUCCESSFUL RESULT
    // --------------------------------------

    state.balance =
      parseFloat(
        data.balance
      ) || newBalance;


    state.claimedMilestones.push(
      winsRequired
    );


    updateUI();


    showCyberAlert(
      "REWARD CLAIMED!",
      `YOU RECEIVED ${rewardAmount.toFixed(2)} USDT FOR REACHING ${winsRequired} WINS.`,
      "fa-gift"
    );


  } catch (error) {

    console.error(
      "CYBERSTRIKE milestone error:",
      error
    );


    showCyberAlert(
      "REWARD ERROR",
      error?.message ||
        "THE MILESTONE COULD NOT BE CLAIMED.",
      "fa-triangle-exclamation"
    );


    updateUI();
  }
}


// ==========================================
// 14. GET MILESTONE BUTTON ID
// ==========================================

function getMilestoneButtonId(
  winsRequired
) {

  if (
    winsRequired === 20
  ) {

    return "claim20Btn";
  }


  if (
    winsRequired === 50
  ) {

    return "claim50Btn";
  }


  if (
    winsRequired === 100
  ) {

    return "claim100Btn";
  }


  if (
    winsRequired === 1000
  ) {

    return "claim1000Btn";
  }


  return "";
}


// ==========================================
// 15. UPDATE ENTIRE UI
// ==========================================

function updateUI() {

  // ----------------------------------------
  // BALANCE
  // ----------------------------------------

  const balanceDisplay =
    document.getElementById(
      "userBalanceDisplay"
    );


  if (balanceDisplay) {

    balanceDisplay.innerText =
      state.balance.toFixed(2);
  }


  // ----------------------------------------
  // WITHDRAW BALANCE
  // ----------------------------------------

  const withdrawBalanceDisplay =
    document.getElementById(
      "withdrawBalanceDisplay"
    );


  if (withdrawBalanceDisplay) {

    withdrawBalanceDisplay.innerText =
      `${state.balance.toFixed(2)} USDT`;
  }


  // ----------------------------------------
  // WINS
  // ----------------------------------------

  const winsDisplay =
    document.getElementById(
      "userWinsDisplay"
    );


  if (winsDisplay) {

    winsDisplay.innerText =
      state.wins;
  }


  // ----------------------------------------
  // SPRINT
  // ----------------------------------------

  updateSprintSection();


  // ----------------------------------------
  // MILESTONE BUTTONS
  // ----------------------------------------

  checkMilestoneBtn(
    "claim20Btn",
    20
  );

  checkMilestoneBtn(
    "claim50Btn",
    50
  );

  checkMilestoneBtn(
    "claim100Btn",
    100
  );

  checkMilestoneBtn(
    "claim1000Btn",
    1000
  );
}


// ==========================================
// 16. WEEKLY SPRINT UI
// ==========================================

function updateSprintSection() {

  const rewardLabel =
    document.getElementById(
      "nextRewardLabel"
    );


  const progressBar =
    document.getElementById(
      "sprintProgressBar"
    );


  const winsDisplay =
    document.getElementById(
      "sprintWinsDisplay"
    );


  // ----------------------------------------
  // WINS
  // ----------------------------------------

  if (winsDisplay) {

    winsDisplay.innerText =
      state.wins;
  }


  // ----------------------------------------
  // DETERMINE NEXT REWARD
  // ----------------------------------------

  let nextReward =
    "NEXT REWARD: 2.00 USDT";

  let targetWins =
    20;


  if (
    state.wins >= 20 &&
    state.wins < 50
  ) {

    nextReward =
      "NEXT REWARD: 5.00 USDT";

    targetWins =
      50;
  }


  else if (
    state.wins >= 50 &&
    state.wins < 100
  ) {

    nextReward =
      "NEXT REWARD: 10.00 USDT";

    targetWins =
      100;
  }


  else if (
    state.wins >= 100
  ) {

    nextReward =
      "NEXT REWARD: 100.00 USDT";

    targetWins =
      1000;
  }


  if (rewardLabel) {

    rewardLabel.innerText =
      nextReward;
  }


  // ----------------------------------------
  // PROGRESS BAR
  // ----------------------------------------

  if (progressBar) {

    const progress =
      Math.min(
        100,
        Math.floor(
          (
            state.wins /
            targetWins
          ) * 100
        )
      );


    progressBar.style.width =
      `${progress}%`;
  }
}


// ==========================================
// 17. MILESTONE BUTTON STATE
// ==========================================

function checkMilestoneBtn(
  buttonId,
  requiredWins
) {

  const button =
    document.getElementById(
      buttonId
    );


  if (!button) {
    return;
  }


  // ----------------------------------------
  // ALREADY CLAIMED
  // ----------------------------------------

  if (
    state.claimedMilestones.includes(
      requiredWins
    )
  ) {

    button.innerText =
      "CLAIMED";

    button.disabled =
      true;

    button.className =
      "px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-[9px] font-bold text-slate-600 cursor-not-allowed";

    return;
  }


  // ----------------------------------------
  // CAN CLAIM
  // ----------------------------------------

  if (
    state.wins >=
    requiredWins
  ) {

    button.innerText =
      "CLAIM";

    button.disabled =
      false;

    button.className =
      "px-3 py-1.5 rounded-lg border border-cyan-500 bg-cyan-500/20 text-[9px] font-bold text-cyan-400 hover:bg-cyan-500/30 cursor-pointer animate-pulse";

    return;
  }


  // ----------------------------------------
  // LOCKED
  // ----------------------------------------

  button.innerText =
    "LOCKED";

  button.disabled =
    true;

  button.className =
    "px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/50 text-[9px] font-bold text-slate-600 cursor-not-allowed";
}


// ==========================================
// 18. ALERT MODAL
// ==========================================

function showCyberAlert(
  title,
  message,
  iconClass = "fa-circle-info"
) {

  const modal =
    document.getElementById(
      "cyberAlertModal"
    );


  const modalTitle =
    document.getElementById(
      "cyberAlertTitle"
    );


  const modalMessage =
    document.getElementById(
      "cyberAlertMessage"
    );


  const modalIcon =
    document.getElementById(
      "cyberAlertIcon"
    );


  // ----------------------------------------
  // FALLBACK
  // ----------------------------------------

  if (!modal) {

    alert(
      `${title}\n\n${message}`
    );

    return;
  }


  // ----------------------------------------
  // SET CONTENT
  // ----------------------------------------

  if (modalTitle) {

    modalTitle.innerText =
      title;
  }


  if (modalMessage) {

    modalMessage.innerText =
      message;
  }


  if (modalIcon) {

    modalIcon.className =
      `fa-solid ${iconClass}`;
  }


  // ----------------------------------------
  // SHOW MODAL
  // ----------------------------------------

  modal.classList.remove(
    "hidden"
  );
}


// ==========================================
// 19. HIDE ALERT
// ==========================================

function hideCyberAlert() {

  const modal =
    document.getElementById(
      "cyberAlertModal"
    );


  if (modal) {

    modal.classList.add(
      "hidden"
    );
  }
}


// ==========================================
// 20. MODAL HELPERS
// ==========================================

function openModal(
  modalId
) {

  const modal =
    document.getElementById(
      modalId
    );


  if (!modal) {
    return;
  }


  modal.classList.remove(
    "hidden"
  );
}


function closeModal(
  modalId
) {

  const modal =
    document.getElementById(
      modalId
    );


  if (!modal) {
    return;
  }


  modal.classList.add(
    "hidden"
  );
      }// ==========================================
// CYBERSTRIKE
// SCRIPT.JS
// PART 3 OF 4
// SPRINT SYSTEM, DEPOSIT & WITHDRAWAL
// ==========================================


// ==========================================
// SPRINT SYSTEM
// ==========================================

let sprintTimer = null;

function startSprintCountdown() {

  if (sprintTimer) {
    clearInterval(sprintTimer);
  }

  let remainingSeconds = 30;

  const countdown =
    document.getElementById(
      "sprintCountdown"
    );

  function renderCountdown() {

    if (!countdown) {
      return;
    }

    const minutes =
      Math.floor(
        remainingSeconds / 60
      );

    const seconds =
      remainingSeconds % 60;

    countdown.innerText =
      `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")`;
  }

  renderCountdown();

  sprintTimer =
    setInterval(() => {

      remainingSeconds--;

      renderCountdown();

      if (remainingSeconds <= 0) {

        clearInterval(
          sprintTimer
        );

        sprintTimer = null;

        finishSprint();
      }

    }, 1000);
}


// ==========================================
// FINISH SPRINT
// ==========================================

async function finishSprint() {

  if (!state.user) {
    return;
  }

  /*
   * CYBERSTRIKE DEMO SPRINT RESULT
   *
   * For now, every completed sprint
   * records one win.
   *
   * The balance is NOT automatically
   * increased here.
   *
   * Milestone rewards are claimed
   * separately.
   */

  state.wins += 1;

  const winsDisplay =
    document.getElementById(
      "sprintWinsDisplay"
    );

  if (winsDisplay) {
    winsDisplay.innerText =
      state.wins;
  }

  updateUI();

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("profiles")
        .update({
          wins: state.wins
        })
        .eq(
          "id",
          state.user.id
        )
        .select(
          "wins"
        )
        .single();

    if (error) {
      console.error(
        "CYBERSTRIKE sprint save error:",
        error
      );

      showCyberAlert(
        "SAVE ERROR",
        "YOUR WIN COULD NOT BE SAVED TO THE SERVER.",
        "fa-triangle-exclamation"
      );

      return;
    }

    state.wins =
      parseInt(
        data.wins,
        10
      ) || state.wins;

    updateUI();

  } catch (error) {

    console.error(
      "CYBERSTRIKE sprint error:",
      error
    );

    showCyberAlert(
      "SYSTEM ERROR",
      "THE SPRINT RESULT COULD NOT BE SAVED.",
      "fa-triangle-exclamation"
    );

    return;
  }

  showCyberAlert(
    "SPRINT COMPLETE!",
    `YOU WON THE SPRINT. TOTAL WINS: ${state.wins}`,
    "fa-trophy"
  );

  startSprintCountdown();
}


// ==========================================
// START SPRINT
// ==========================================

function startSprint() {

  if (!state.user) {

    showCyberAlert(
      "LOGIN REQUIRED",
      "PLEASE LOGIN BEFORE ENTERING A SPRINT.",
      "fa-lock"
    );

    return;
  }

  if (sprintTimer) {
    return;
  }

  showCyberAlert(
    "SPRINT STARTED",
    "YOUR CYBERSTRIKE SPRINT HAS BEGUN.",
    "fa-bolt"
  );

  startSprintCountdown();
}


// ==========================================
// DEPOSIT MODAL
// ==========================================

function openDepositModal() {

  if (!state.user) {

    showCyberAlert(
      "LOGIN REQUIRED",
      "PLEASE LOGIN BEFORE MAKING A DEPOSIT.",
      "fa-lock"
    );

    return;
  }

  const depositUserId =
    document.getElementById(
      "depositUserId"
    );

  if (
    depositUserId &&
    state.user
  ) {
    depositUserId.value =
      state.user.id;
  }

  const depositAmount =
    document.getElementById(
      "depositAmount"
    );

  const depositAmountDisplay =
    document.getElementById(
      "depositAmountDisplay"
    );

  if (
    depositAmount &&
    depositAmountDisplay
  ) {

    depositAmountDisplay.innerText =
      `${depositAmount.value || "0.00"} USDT`;

  }

  openModal(
    "depositModal"
  );
}


// ==========================================
// CLOSE DEPOSIT
// ==========================================

function closeDepositModal() {

  closeModal(
    "depositModal"
  );
}


// ==========================================
// UPDATE DEPOSIT DISPLAY
// ==========================================

function updateDepositDisplay() {

  const amountInput =
    document.getElementById(
      "depositAmount"
    );

  const amountDisplay =
    document.getElementById(
      "depositAmountDisplay"
    );

  if (
    !amountInput ||
    !amountDisplay
  ) {
    return;
  }

  const amount =
    parseFloat(
      amountInput.value
    ) || 0;

  amountDisplay.innerText =
    `${amount.toFixed(2)} USDT`;
}


// ==========================================
// SUBMIT DEPOSIT
// ==========================================

async function submitDeposit() {

  if (!state.user) {

    showCyberAlert(
      "LOGIN REQUIRED",
      "PLEASE LOGIN BEFORE MAKING A DEPOSIT.",
      "fa-lock"
    );

    return;
  }

  const amountInput =
    document.getElementById(
      "depositAmount"
    );

  const amount =
    parseFloat(
      amountInput?.value
    );

  if (
    !amount ||
    amount <= 0
  ) {

    showCyberAlert(
      "INVALID AMOUNT",
      "PLEASE ENTER A VALID DEPOSIT AMOUNT.",
      "fa-triangle-exclamation"
    );

    return;
  }

  /*
   * IMPORTANT:
   *
   * We do NOT directly add the deposit
   * to the user's balance here.
   *
   * A real deposit must be verified
   * from the payment/transaction system
   * before the balance is credited.
   */

  showCyberAlert(
    "DEPOSIT REQUEST",
    `DEPOSIT REQUEST RECEIVED FOR ${amount.toFixed(2)} USDT. PAYMENT VERIFICATION IS REQUIRED BEFORE YOUR BALANCE IS CREDITED.`,
    "fa-wallet"
  );
}


// ==========================================
// WITHDRAW MODAL
// ==========================================

function openWithdrawModal() {

  if (!state.user) {

    showCyberAlert(
      "LOGIN REQUIRED",
      "PLEASE LOGIN BEFORE MAKING A WITHDRAWAL.",
      "fa-lock"
    );

    return;
  }

  const withdrawEmail =
    document.getElementById(
      "withdrawEmail"
    );

  if (
    withdrawEmail &&
    state.user
  ) {
    withdrawEmail.value =
      state.user.email || "";
  }

  const balanceDisplay =
    document.getElementById(
      "withdrawBalanceDisplay"
    );

  if (balanceDisplay) {
    balanceDisplay.innerText =
      `${state.balance.toFixed(2)} USDT`;
  }

  openModal(
    "withdrawModal"
  );
}


// ==========================================
// CLOSE WITHDRAW
// ==========================================

function closeWithdrawModal() {

  closeModal(
    "withdrawModal"
  );
}


// ==========================================
// SUBMIT WITHDRAWAL
// ==========================================

async function submitWithdrawal() {

  if (!state.user) {

    showCyberAlert(
      "LOGIN REQUIRED",
      "PLEASE LOGIN BEFORE MAKING A WITHDRAWAL.",
      "fa-lock"
    );

    return;
  }

  const amountInput =
    document.getElementById(
      "withdrawAmount"
    );

  const amount =
    parseFloat(
      amountInput?.value
    );

  if (
    !amount ||
    amount <= 0
  ) {

    showCyberAlert(
      "INVALID AMOUNT",
      "PLEASE ENTER A VALID WITHDRAWAL AMOUNT.",
      "fa-triangle-exclamation"
    );

    return;
  }

  if (
    amount >
    state.balance
  ) {

    showCyberAlert(
      "INSUFFICIENT BALANCE",
      "YOU DO NOT HAVE ENOUGH USDT IN YOUR CYBERSTRIKE BALANCE.",
      "fa-wallet"
    );

    return;
  }

  /*
   * No balance deduction is performed yet.
   *
   * This protects the user's funds until
   * the withdrawal backend is connected.
   */

  showCyberAlert(
    "WITHDRAWAL REQUEST",
    `YOUR REQUEST TO WITHDRAW ${amount.toFixed(2)} USDT HAS BEEN RECEIVED. WITHDRAWAL PROCESSING WILL BE HANDLED BY THE CYBERSTRIKE BACKEND.`,
    "fa-money-bill-transfer"
  );
}


// ==========================================
// INPUT LISTENERS
// ==========================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const depositAmount =
      document.getElementById(
        "depositAmount"
      );

    if (depositAmount) {

      depositAmount.addEventListener(
        "input",
        updateDepositDisplay
      );

    }

    const withdrawAmount =
      document.getElementById(
        "withdrawAmount"
      );

    if (withdrawAmount) {

      withdrawAmount.addEventListener(
        "input",
        () => {

          const value =
            parseFloat(
              withdrawAmount.value
            ) || 0;

          const display =
            document.getElementById(
              "withdrawBalanceDisplay"
            );

          if (display) {

            display.innerText =
              `${state.balance.toFixed(2)} USDT`;

          }

        }
      );

    }

  }
);// ==========================================
// CYBERSTRIKE
// SCRIPT.JS
// PART 4 OF 4
// FINAL CONTROLS, HELPERS & INITIALIZATION
// ==========================================


// ==========================================
// LOGOUT BUTTON SUPPORT
// ==========================================

function handleLogout() {

  logout();
}


// ==========================================
// REFRESH PLAYER DATA
// ==========================================

async function refreshPlayerData() {

  if (
    !state.user ||
    !supabaseClient
  ) {
    return;
  }

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("profiles")
        .select(
          "id, balance, wins"
        )
        .eq(
          "id",
          state.user.id
        )
        .maybeSingle();

    if (error) {
      console.error(
        "CYBERSTRIKE refresh error:",
        error
      );
      return;
    }

    if (!data) {
      return;
    }

    state.balance =
      parseFloat(
        data.balance
      ) || 0;

    state.wins =
      parseInt(
        data.wins,
        10
      ) || 0;

    updateUI();

  } catch (error) {

    console.error(
      "CYBERSTRIKE refresh failed:",
      error
    );

  }
}


// ==========================================
// AUTO REFRESH PLAYER DATA
// ==========================================

let playerRefreshTimer = null;

function startPlayerRefresh() {

  if (playerRefreshTimer) {
    clearInterval(
      playerRefreshTimer
    );
  }

  playerRefreshTimer =
    setInterval(
      () => {

        if (state.user) {
          refreshPlayerData();
        }

      },
      15000
    );
}


// ==========================================
// STOP PLAYER REFRESH
// ==========================================

function stopPlayerRefresh() {

  if (playerRefreshTimer) {

    clearInterval(
      playerRefreshTimer
    );

    playerRefreshTimer =
      null;
  }
}


// ==========================================
// UPDATE PLAYER EMAIL FIELDS
// ==========================================

function updatePlayerFields() {

  if (!state.user) {
    return;
  }

  const email =
    state.user.email || "";

  const withdrawEmail =
    document.getElementById(
      "withdrawEmail"
    );

  if (withdrawEmail) {
    withdrawEmail.value =
      email;
  }

  const depositUserId =
    document.getElementById(
      "depositUserId"
    );

  if (depositUserId) {
    depositUserId.value =
      state.user.id;
  }
}


// ==========================================
// CONNECTION STATUS
// ==========================================

function updateConnectionStatus() {

  const connectionElements =
    document.querySelectorAll(
      "[data-cyber-connection]"
    );

  connectionElements.forEach(
    (element) => {

      if (supabaseClient) {

        element.innerText =
          "CONNECTED TO CYBERSTRIKE";

        element.classList.remove(
          "text-red-500",
          "text-red-400"
        );

        element.classList.add(
          "text-green-400"
        );

      } else {

        element.innerText =
          "CONNECTION ERROR";

        element.classList.remove(
          "text-green-400"
        );

        element.classList.add(
          "text-red-500"
        );

      }

    }
  );
}


// ==========================================
// CLOSE MODALS WHEN CLICKING OUTSIDE
// ==========================================

document.addEventListener(
  "click",
  (event) => {

    const depositModal =
      document.getElementById(
        "depositModal"
      );

    const withdrawModal =
      document.getElementById(
        "withdrawModal"
      );

    const alertModal =
      document.getElementById(
        "cyberAlertModal"
      );

    if (
      event.target ===
      depositModal
    ) {

      closeDepositModal();

    }

    if (
      event.target ===
      withdrawModal
    ) {

      closeWithdrawModal();

    }

    if (
      event.target ===
      alertModal
    ) {

      hideCyberAlert();

    }

  }
);


// ==========================================
// ESC KEY CLOSES MODALS
// ==========================================

document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key !==
      "Escape"
    ) {
      return;
    }

    closeDepositModal();
    closeWithdrawModal();
    hideCyberAlert();

  }
);


// ==========================================
// SUPABASE AUTH LISTENER
// ==========================================

if (supabaseClient) {

  supabaseClient.auth
    .onAuthStateChange(
      async (
        event,
        session
      ) => {

        console.log(
          "CYBERSTRIKE AUTH EVENT:",
          event
        );

        if (
          event ===
          "SIGNED_IN"
        ) {

          if (
            session?.user
          ) {

            state.user =
              session.user;

            try {

              await loadUserProfile(
                state.user
              );

              enterArena();

              updatePlayerFields();

              startPlayerRefresh();

            } catch (error) {

              console.error(
                "CYBERSTRIKE sign-in profile error:",
                error
              );

            }

          }

        }

        if (
          event ===
          "SIGNED_OUT"
        ) {

          stopPlayerRefresh();

          state.user =
            null;

          state.balance =
            0;

          state.wins =
            0;

          state.claimedMilestones =
            [];

          updateUI();

        }

      }
    );

}


// ==========================================
// FINAL INITIALIZATION
// ==========================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    updateConnectionStatus();

    const sprintButton =
      document.getElementById(
        "startSprintBtn"
      );

    if (sprintButton) {

      sprintButton.addEventListener(
        "click",
        startSprint
      );

    }

    updatePlayerFields();

  }
);


// ==========================================
// GLOBAL CYBERSTRIKE FUNCTIONS
// ==========================================
//
// These assignments make sure the HTML
// inline onclick buttons can access the
// functions correctly.
// ==========================================

window.handleLogin =
  handleLogin;

window.handleLogout =
  handleLogout;

window.logout =
  logout;

window.startSprint =
  startSprint;

window.claimMilestone =
  claimMilestone;

window.openDepositModal =
  openDepositModal;

window.closeDepositModal =
  closeDepositModal;

window.submitDeposit =
  submitDeposit;

window.openWithdrawModal =
  openWithdrawModal;

window.closeWithdrawModal =
  closeWithdrawModal;

window.submitWithdrawal =
  submitWithdrawal;

window.showCyberAlert =
  showCyberAlert;

window.hideCyberAlert =
  hideCyberAlert;

window.openModal =
  openModal;

window.closeModal =
  closeModal;

window.updateDepositDisplay =
  updateDepositDisplay;


// ==========================================
// CYBERSTRIKE SCRIPT LOADED
// ==========================================

console.log(
  "=========================================="
);

console.log(
  "CYBERSTRIKE SCRIPT LOADED SUCCESSFULLY"
);

console.log(
  "SUPABASE:",
  supabaseClient
    ? "CONNECTED"
    : "NOT CONNECTED"
);

console.log(
  "=========================================="
);
