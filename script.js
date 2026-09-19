/* ==========================================================================
   CYBERSTRIKE | 1v1 Arena Core Script
   Supabase-connected version
   No demo user
   No demo money
   ========================================================================== */


/* ==========================================================================
   1. SUPABASE CONFIGURATION
   ========================================================================== */

const SUPABASE_URL = "https://btugwhcoypxtlgmsxqci.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable__DjyCoKhrV9vpmAUY-T3lg_0f-Ji2-h";

let supabaseClient = null;


/* ==========================================================================
   2. GLOBAL STATE
   ========================================================================== */

const state = {
  user: null,

  // No demo/fake balance.
  // null means balance has not been loaded from Supabase yet.
  balance: null,

  wins: 0,

  currentStake: 0.50,

  isMatchmaking: false,

  isPlaying: false,

  claimedMilestones: [],

  sprintEndTime:
    Date.now() +
    (5 * 24 * 60 * 60 * 1000) +
    (18 * 60 * 60 * 1000)
};


/* ==========================================================================
   3. STAKE CONFIGURATION
   ========================================================================== */

const STAKE_CONFIGS = {
  0.50: {
    stake: 0.50,
    payout: 0.80
  },

  1.00: {
    stake: 1.00,
    payout: 1.60
  },

  5.00: {
    stake: 5.00,
    payout: 8.00
  }
};


/* ==========================================================================
   4. CANVAS VARIABLES
   ========================================================================== */

let canvas = null;
let ctx = null;

let animationFrameId = null;

let gameObject = null;


/* ==========================================================================
   5. SUPABASE INITIALIZATION
   ========================================================================== */

function initializeSupabase() {

  if (typeof supabase === "undefined") {

    console.error(
      "Supabase SDK was not loaded."
    );

    return false;
  }

  if (
    !SUPABASE_URL ||
    !SUPABASE_ANON_KEY ||
    SUPABASE_URL === "YOUR_CYBERSTRIKE_SUPABASE_URL" ||
    SUPABASE_ANON_KEY === "YOUR_CYBERSTRIKE_SUPABASE_ANON_KEY"
  ) {

    console.error(
      "CyberStrike Supabase credentials have not been configured."
    );

    return false;
  }

  try {

    supabaseClient =
      supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
      );

    console.log(
      "CyberStrike Supabase initialized."
    );

    return true;

  } catch (error) {

    console.error(
      "Supabase initialization failed:",
      error
    );

    supabaseClient = null;

    return false;
  }
}


/* ==========================================================================
   6. PAGE INITIALIZATION
   ========================================================================== */

document.addEventListener(
  "DOMContentLoaded",
  async function () {

    console.log(
      "CYBERSTRIKE SCRIPT IS RUNNING."
    );

    initializeSupabase();

    setupCanvas();

    setupDepositInput();

    startSprintTimer();

    await restoreExistingSession();
  }
);


/* ==========================================================================
   7. CANVAS SETUP
   ========================================================================== */

function setupCanvas() {

  canvas =
    document.getElementById(
      "gameCanvas"
    );

  if (!canvas) {

    console.error(
      "gameCanvas element was not found."
    );

    return;
  }

  ctx =
    canvas.getContext("2d");

  if (!ctx) {

    console.error(
      "Could not create canvas context."
    );

    return;
  }

  canvas.addEventListener(
    "click",
    handleCanvasClick
  );

  drawCanvasStandby();
}


/* ==========================================================================
   8. DEPOSIT INPUT
   ========================================================================== */

function setupDepositInput() {

  const depositInput =
    document.getElementById(
      "depositAmount"
    );

  const depositDisplay =
    document.getElementById(
      "depositAmountDisplay"
    );

  if (!depositInput || !depositDisplay) {
    return;
  }

  depositInput.addEventListener(
    "input",
    function (event) {

      const value =
        parseFloat(
          event.target.value
        );

      if (
        Number.isFinite(value)
      ) {

        depositDisplay.innerText =
          `${value.toFixed(2)} USDT`;

      } else {

        depositDisplay.innerText =
          "0.00 USDT";
      }
    }
  );
}


/* ==========================================================================
   9. RESTORE EXISTING SESSION
   ========================================================================== */

async function restoreExistingSession() {

  if (!supabaseClient) {

    console.warn(
      "Supabase is not configured. Session cannot be restored."
    );

    return;
  }

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.getSession();

    if (error) {
      throw error;
    }

    const session =
      data?.session;

    if (!session?.user) {

      console.log(
        "No active CyberStrike session."
      );

      return;
    }

    state.user =
      session.user;

    const loaded =
      await loadUserProfile();

    if (!loaded) {

      await supabaseClient.auth.signOut();

      state.user = null;

      showAuthError(
        "Your account profile could not be loaded."
      );

      return;
    }

    showApplication();

  } catch (error) {

    console.error(
      "Session restoration failed:",
      error
    );
  }
}


/* ==========================================================================
   10. LOGIN
   ========================================================================== */

async function handleLogin() {

  const emailElement =
    document.getElementById(
      "loginEmail"
    );

  const passwordElement =
    document.getElementById(
      "loginPassword"
    );

  const authMsg =
    document.getElementById(
      "authMessage"
    );

  const loginBtn =
    document.getElementById(
      "loginButton"
    );

  if (!emailElement || !passwordElement) {

    console.error(
      "Login fields were not found."
    );

    return;
  }

  const email =
    emailElement.value.trim();

  const password =
    passwordElement.value;

  if (!email || !password) {

    showAuthError(
      "Please enter your email and password."
    );

    return;
  }

  if (!supabaseClient) {

    showAuthError(
      "CYBERSTRIKE is not connected to Supabase yet."
    );

    console.error(
      "Supabase client is not initialized."
    );

    return;
  }

  if (authMsg) {
    authMsg.classList.add("hidden");
  }

  if (loginBtn) {

    loginBtn.innerText =
      "AUTHENTICATING...";

    loginBtn.disabled = true;
  }

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
      });

    if (error) {
      throw error;
    }

    if (!data?.user) {

      throw new Error(
        "Login succeeded but no user account was returned."
      );
    }

    state.user =
      data.user;

    const profileLoaded =
      await loadUserProfile();

    if (!profileLoaded) {

      throw new Error(
        "Login succeeded, but your CyberStrike profile could not be loaded."
      );
    }

    showApplication();

  } catch (error) {

    console.error(
      "CyberStrike login error:",
      error
    );

    showAuthError(
      error?.message ||
      "Login failed. Please check your credentials."
    );

  } finally {

    if (loginBtn) {

      loginBtn.innerText =
        "LOGIN / ENTER ARENA";

      loginBtn.disabled = false;
    }
  }
}


/* ==========================================================================
   11. LOAD USER PROFILE FROM SUPABASE
   ========================================================================== */

async function loadUserProfile() {

  if (!supabaseClient) {
    return false;
  }

  if (!state.user?.id) {
    return false;
  }

  try {

    const {
      data: profile,
      error
    } =
      await supabaseClient
        .from("profiles")
        .select(
          "id,balance,wins"
        )
        .eq(
          "id",
          state.user.id
        )
        .maybeSingle();

    if (error) {

      console.error(
        "Profile query failed:",
        error
      );

      return false;
    }

    if (!profile) {

      console.error(
        "No CyberStrike profile was found for this account."
      );

      return false;
    }

    const databaseBalance =
      Number(profile.balance);

    if (!Number.isFinite(databaseBalance)) {

      console.error(
        "Invalid balance returned by Supabase."
      );

      return false;
    }

    state.balance =
      databaseBalance;

    state.wins =
      Number.isFinite(
        Number(profile.wins)
      )
        ? Number(profile.wins)
        : 0;

    console.log(
      "CyberStrike profile loaded:",
      {
        id: profile.id,
        balance: state.balance,
        wins: state.wins
      }
    );

    updateUI();

    return true;

  } catch (error) {

    console.error(
      "loadUserProfile error:",
      error
    );

    return false;
  }
}


/* ==========================================================================
   12. SHOW APPLICATION
   ========================================================================== */

function showApplication() {

  const authGate =
    document.getElementById(
      "authGate"
    );

  const appContainer =
    document.getElementById(
      "appContainer"
    );

  if (authGate) {
    authGate.classList.add("hidden");
  }

  if (appContainer) {
    appContainer.classList.remove("hidden");
  }

  const depositUserId =
    document.getElementById(
      "depositUserId"
    );

  const withdrawEmail =
    document.getElementById(
      "withdrawEmail"
    );

  if (depositUserId) {

    depositUserId.value =
      state.user?.id || "";
  }

  if (withdrawEmail) {

    withdrawEmail.value =
      state.user?.email || "";

    withdrawEmail.readOnly = true;
  }

  updateUI();
}


/* ==========================================================================
   13. AUTH ERROR
   ========================================================================== */

function showAuthError(message) {

  const authMsg =
    document.getElementById(
      "authMessage"
    );

  if (!authMsg) {
    return;
  }

  authMsg.innerText =
    message;

  authMsg.classList.remove(
    "hidden"
  );
}/* ==========================================================================
   CYBERSTRIKE | PART 2 OF 4
   UI, BALANCE, STAKES, MODALS & LOGOUT
   ========================================================================== */


/* ==========================================================================
   14. UPDATE USER INTERFACE
   ========================================================================== */

function updateUI() {

  const balanceDisplay =
    document.getElementById(
      "userBalanceDisplay"
    );

  const withdrawBalanceDisplay =
    document.getElementById(
      "withdrawBalanceDisplay"
    );

  const sprintWinsDisplay =
    document.getElementById(
      "sprintWinsDisplay"
    );

  const nextRewardLabel =
    document.getElementById(
      "nextRewardLabel"
    );

  if (state.balance === null) {

    if (balanceDisplay) {
      balanceDisplay.innerText = "—";
    }

    if (withdrawBalanceDisplay) {
      withdrawBalanceDisplay.innerText =
        "— USDT";
    }

  } else {

    if (balanceDisplay) {

      balanceDisplay.innerText =
        state.balance.toFixed(2);
    }

    if (withdrawBalanceDisplay) {

      withdrawBalanceDisplay.innerText =
        `${state.balance.toFixed(2)} USDT`;
    }
  }


  if (sprintWinsDisplay) {

    sprintWinsDisplay.innerText =
      state.wins.toString();
  }


  updateSprintRewardLabel(
    nextRewardLabel
  );


  updateSprintProgress();
}


/* ==========================================================================
   15. UPDATE SPRINT REWARD LABEL
   ========================================================================== */

function updateSprintRewardLabel(
  element
) {

  if (!element) {
    return;
  }

  if (state.wins < 20) {

    element.innerText =
      "Next Reward: 20 Wins — 5 USDT";

    return;
  }

  if (state.wins < 50) {

    element.innerText =
      "Next Reward: 50 Wins — 15 USDT";

    return;
  }

  if (state.wins < 100) {

    element.innerText =
      "Next Reward: 100 Wins — 40 USDT";

    return;
  }

  if (state.wins < 1000) {

    element.innerText =
      "Next Reward: 1,000 Wins — 500 USDT";

    return;
  }

  element.innerText =
    "All Sprint Milestones Reached";
}


/* ==========================================================================
   16. UPDATE SPRINT PROGRESS
   ========================================================================== */

function updateSprintProgress() {

  const progressBar =
    document.getElementById(
      "sprintProgressBar"
    );

  if (!progressBar) {
    return;
  }

  let progress = 0;

  if (state.wins < 20) {

    progress =
      (state.wins / 20) * 25;

  } else if (state.wins < 50) {

    progress =
      25 +
      ((state.wins - 20) / 30) * 25;

  } else if (state.wins < 100) {

    progress =
      50 +
      ((state.wins - 50) / 50) * 25;

  } else {

    progress =
      75 +
      Math.min(
        ((state.wins - 100) / 900) * 25,
        25
      );
  }

  progress =
    Math.max(
      0,
      Math.min(
        100,
        progress
      )
    );

  progressBar.style.width =
    `${progress}%`;
}


/* ==========================================================================
   17. SELECT STAKE TIER
   ========================================================================== */

function selectStakeTier(
  amount
) {

  const numericAmount =
    Number(amount);

  if (
    !Number.isFinite(
      numericAmount
    )
  ) {

    return;
  }

  if (
    !STAKE_CONFIGS[
      numericAmount.toFixed(2)
    ]
  ) {

    showCyberAlert(
      "INVALID STAKE",
      "This stake tier is not available.",
      "⚠️"
    );

    return;
  }

  state.currentStake =
    numericAmount;


  const buttons =
    document.querySelectorAll(
      ".stake-tier-btn"
    );

  buttons.forEach(
    function (button) {

      button.classList.remove(
        "active"
      );
    }
  );


  const selectedButton =
    document.getElementById(
      `stakeTier-${numericAmount.toFixed(1)}`
    );

  if (selectedButton) {

    selectedButton.classList.add(
      "active"
    );
  }


  const selectedConfig =
    STAKE_CONFIGS[
      numericAmount.toFixed(2)
    ];

  const matchDesc =
    document.getElementById(
      "matchOverlayDesc"
    );

  if (matchDesc) {

    matchDesc.innerText =
      `Stake ${numericAmount.toFixed(2)} USDT • Winner receives ${selectedConfig.payout.toFixed(2)} USDT`;
  }
}


/* ==========================================================================
   18. OPEN MODAL
   ========================================================================== */

function openModal(
  modalId
) {

  const modal =
    document.getElementById(
      modalId
    );

  if (!modal) {

    console.error(
      `Modal not found: ${modalId}`
    );

    return;
  }

  modal.classList.remove(
    "hidden"
  );


  if (modalId === "withdrawModal") {

    const amountInput =
      document.getElementById(
        "withdrawAmount"
      );

    const emailInput =
      document.getElementById(
        "withdrawEmail"
      );

    if (amountInput) {

      amountInput.value =
        "";
    }

    if (emailInput) {

      emailInput.value =
        state.user?.email || "";

      emailInput.readOnly = true;
    }

    updateUI();
  }


  if (modalId === "depositModal") {

    const userIdInput =
      document.getElementById(
        "depositUserId"
      );

    if (userIdInput) {

      userIdInput.value =
        state.user?.id || "";
    }
  }
}


/* ==========================================================================
   19. CLOSE MODAL
   ========================================================================== */

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
}


/* ==========================================================================
   20. CLOSE MODAL WHEN CLICKING BACKDROP
   ========================================================================== */

document.addEventListener(
  "click",
  function (event) {

    const target =
      event.target;

    if (
      target &&
      target.classList &&
      target.classList.contains(
        "modal"
      )
    ) {

      target.classList.add(
        "hidden"
      );
    }
  }
);


/* ==========================================================================
   21. LOGOUT
   ========================================================================== */

async function logout() {

  try {

    if (supabaseClient) {

      const {
        error
      } =
        await supabaseClient.auth.signOut();

      if (error) {

        console.error(
          "Supabase logout error:",
          error
        );
      }
    }

  } catch (error) {

    console.error(
      "Logout failed:",
      error
    );
  }


  state.user = null;

  state.balance = null;

  state.wins = 0;

  state.currentStake =
    0.50;

  state.isMatchmaking =
    false;

  state.isPlaying =
    false;

  state.claimedMilestones =
    [];


  const appContainer =
    document.getElementById(
      "appContainer"
    );

  const authGate =
    document.getElementById(
      "authGate"
    );

  const loginEmail =
    document.getElementById(
      "loginEmail"
    );

  const loginPassword =
    document.getElementById(
      "loginPassword"
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

  if (loginEmail) {

    loginEmail.value =
      "";
  }

  if (loginPassword) {

    loginPassword.value =
      "";
  }


  updateUI();


  showCyberAlert(
    "LOGGED OUT",
    "Your CyberStrike session has been closed.",
    "✓"
  );
}


/* ==========================================================================
   22. CYBER ALERT MODAL
   ========================================================================== */

function showCyberAlert(
  title,
  message,
  icon
) {

  const modal =
    document.getElementById(
      "cyberAlertModal"
    );

  const titleElement =
    document.getElementById(
      "cyberAlertTitle"
    );

  const messageElement =
    document.getElementById(
      "cyberAlertMessage"
    );

  const iconElement =
    document.getElementById(
      "cyberAlertIcon"
    );


  if (!modal) {

    alert(
      `${title}\n\n${message}`
    );

    return;
  }


  if (titleElement) {

    titleElement.innerText =
      title || "CYBERSTRIKE";
  }

  if (messageElement) {

    messageElement.innerText =
      message || "";
  }

  if (iconElement) {

    iconElement.innerText =
      icon || "⚡";
  }


  modal.classList.remove(
    "hidden"
  );
}


/* ==========================================================================
   23. CLOSE CYBER ALERT
   ========================================================================== */

function closeCyberAlert() {

  const modal =
    document.getElementById(
      "cyberAlertModal"
    );

  if (!modal) {
    return;
  }

  modal.classList.add(
    "hidden"
  );
}


/* ==========================================================================
   24. ESC KEY CLOSES MODALS
   ========================================================================== */

document.addEventListener(
  "keydown",
  function (event) {

    if (
      event.key !== "Escape"
    ) {

      return;
    }


    const modalIds = [
      "depositModal",
      "withdrawModal",
      "cyberAlertModal"
    ];


    modalIds.forEach(
      function (modalId) {

        const modal =
          document.getElementById(
            modalId
          );

        if (
          modal &&
          !modal.classList.contains(
            "hidden"
          )
        ) {

          modal.classList.add(
            "hidden"
          );
        }
      }
    );
  }
);


/* ==========================================================================
   25. PREVENT FAKE BALANCE DISPLAY
   ========================================================================== */

function getCurrentBalance() {

  if (
    state.balance === null ||
    !Number.isFinite(
      Number(state.balance)
    )
  ) {

    return null;
  }

  return Number(
    state.balance
  );
}


/* ==========================================================================
   26. BALANCE CHECK
   ========================================================================== */

function hasEnoughBalance(
  amount
) {

  const balance =
    getCurrentBalance();

  if (balance === null) {

    return false;
  }

  return balance >= Number(amount);
}


/* ==========================================================================
   27. FORMAT USDT
   ========================================================================== */

function formatUSDT(
  amount
) {

  const numericAmount =
    Number(amount);

  if (
    !Number.isFinite(
      numericAmount
    )
  ) {

    return "0.00 USDT";
  }

  return `${numericAmount.toFixed(2)} USDT`;
}


/* ==========================================================================
   28. DEFAULT STAKE
   ========================================================================== */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    selectStakeTier(
      0.50
    );
  }
);/* ==========================================================================
   CYBERSTRIKE | PART 3 OF 4
   MATCHMAKING, GAMEPLAY & SUPABASE BALANCE UPDATES
   ========================================================================== */


/* ==========================================================================
   29. START MATCHMAKING
   ========================================================================== */

async function startMatchmaking() {

  if (!state.user) {

    showCyberAlert(
      "LOGIN REQUIRED",
      "Please log in before entering the arena.",
      "🔒"
    );

    return;
  }


  if (state.balance === null) {

    showCyberAlert(
      "BALANCE UNAVAILABLE",
      "Your account balance has not been loaded from Supabase.",
      "⚠️"
    );

    return;
  }


  const stake =
    Number(
      state.currentStake
    );


  if (!Number.isFinite(stake)) {

    showCyberAlert(
      "INVALID STAKE",
      "Please select a valid stake tier.",
      "⚠️"
    );

    return;
  }


  if (!hasEnoughBalance(stake)) {

    showCyberAlert(
      "INSUFFICIENT BALANCE",
      `You need ${stake.toFixed(2)} USDT to enter this match.`,
      "💰"
    );

    return;
  }


  if (state.isMatchmaking) {
    return;
  }


  if (state.isPlaying) {
    return;
  }


  state.isMatchmaking =
    true;


  const overlay =
    document.getElementById(
      "canvasOverlay"
    );

  const description =
    document.getElementById(
      "matchOverlayDesc"
    );


  if (overlay) {

    overlay.classList.remove(
      "hidden"
    );
  }


  if (description) {

    description.innerText =
      "SEARCHING FOR OPPONENT...";
  }


  try {

    /*
     * IMPORTANT:
     *
     * The stake is NOT deducted locally.
     *
     * The final balance must come from Supabase.
     *
     * This prevents fake/demo money from being
     * created inside the browser.
     */

    const success =
      await chargeMatchStake(
        stake
      );


    if (!success) {

      state.isMatchmaking =
        false;

      if (overlay) {

        overlay.classList.add(
          "hidden"
        );
      }

      return;
    }


    if (description) {

      description.innerText =
        "OPPONENT FOUND • PREPARING ARENA...";
    }


    setTimeout(
      function () {

        beginArenaMatch();

      },
      1800
    );


  } catch (error) {

    console.error(
      "Matchmaking error:",
      error
    );

    state.isMatchmaking =
      false;

    if (overlay) {

      overlay.classList.add(
        "hidden"
      );
    }

    showCyberAlert(
      "MATCHMAKING ERROR",
      error?.message ||
      "Unable to enter the arena.",
      "⚠️"
    );
  }
}


/* ==========================================================================
   30. CHARGE MATCH STAKE
   ========================================================================== */

async function chargeMatchStake(
  stake
) {

  if (!supabaseClient) {

    showCyberAlert(
      "SUPABASE NOT CONNECTED",
      "CyberStrike cannot process the match without Supabase.",
      "⚠️"
    );

    return false;
  }


  if (!state.user?.id) {

    showCyberAlert(
      "SESSION ERROR",
      "Your CyberStrike login session is missing.",
      "🔒"
    );

    return false;
  }


  try {

    /*
     * Expected Supabase RPC:
     *
     * cyberstrike_enter_match(p_user_id, p_stake)
     *
     * The SQL function should verify the balance,
     * deduct the stake and return the new balance.
     *
     * We do NOT modify state.balance ourselves.
     */

    const {
      data,
      error
    } =
      await supabaseClient.rpc(
        "cyberstrike_enter_match",
        {
          p_user_id:
            state.user.id,

          p_stake:
            stake
        }
      );


    if (error) {

      console.error(
        "Match stake RPC error:",
        error
      );

      showCyberAlert(
        "ENTRY FAILED",
        error.message ||
        "The match entry could not be processed.",
        "⚠️"
      );

      return false;
    }


    /*
     * Refresh the balance from Supabase
     * after the server processes the stake.
     */

    const refreshed =
      await loadUserProfile();


    if (!refreshed) {

      showCyberAlert(
        "BALANCE ERROR",
        "The match was processed, but the updated balance could not be loaded.",
        "⚠️"
      );

      return false;
    }


    return true;

  } catch (error) {

    console.error(
      "chargeMatchStake error:",
      error
    );

    showCyberAlert(
      "ENTRY ERROR",
      error?.message ||
      "Unable to process match entry.",
      "⚠️"
    );

    return false;
  }
}


/* ==========================================================================
   31. BEGIN ARENA MATCH
   ========================================================================== */

function beginArenaMatch() {

  state.isMatchmaking =
    false;

  state.isPlaying =
    true;


  const overlay =
    document.getElementById(
      "canvasOverlay"
    );


  if (overlay) {

    overlay.classList.add(
      "hidden"
    );
  }


  createGameObject();

  startGameLoop();


  showCyberAlert(
    "OPPONENT FOUND",
    "The arena is live. Defeat your opponent.",
    "⚔️"
  );
}


/* ==========================================================================
   32. CREATE GAME OBJECT
   ========================================================================== */

function createGameObject() {

  if (!canvas) {

    setupCanvas();
  }


  if (!canvas) {
    return;
  }


  gameObject = {

    player: {
      x: canvas.width / 2 - 40,
      y: canvas.height - 80,
      width: 40,
      height: 40,
      speed: 5
    },

    opponent: {
      x: canvas.width / 2 + 40,
      y: 40,
      width: 40,
      height: 40,
      speed: 2
    },

    startTime:
      Date.now(),

    duration:
      15000,

    playerScore:
      0,

    opponentScore:
      0,

    finished:
      false
  };
}


/* ==========================================================================
   33. START GAME LOOP
   ========================================================================== */

function startGameLoop() {

  if (!ctx || !canvas) {
    return;
  }


  if (animationFrameId) {

    cancelAnimationFrame(
      animationFrameId
    );
  }


  gameLoop();
}


/* ==========================================================================
   34. GAME LOOP
   ========================================================================== */

function gameLoop() {

  if (
    !state.isPlaying ||
    !gameObject
  ) {

    return;
  }


  updateGame();

  drawGame();


  animationFrameId =
    requestAnimationFrame(
      gameLoop
    );
}


/* ==========================================================================
   35. UPDATE GAME
   ========================================================================== */

function updateGame() {

  if (!gameObject) {
    return;
  }


  const elapsed =
    Date.now() -
    gameObject.startTime;


  /*
   * Simple opponent movement.
   */

  const player =
    gameObject.player;

  const opponent =
    gameObject.opponent;


  if (
    opponent.x <
    player.x
  ) {

    opponent.x +=
      opponent.speed;

  } else {

    opponent.x -=
      opponent.speed;
  }


  /*
   * Keep opponent inside canvas.
   */

  opponent.x =
    Math.max(
      0,
      Math.min(
        canvas.width -
          opponent.width,
        opponent.x
      )
    );


  /*
   * Match automatically ends
   * after the configured duration.
   */

  if (
    elapsed >=
    gameObject.duration
  ) {

    finishArenaMatch();

    return;
  }


  /*
   * Very simple gameplay scoring.
   *
   * Clicking the opponent gives the player
   * a point.
   */
}


/* ==========================================================================
   36. DRAW GAME
   ========================================================================== */

function drawGame() {

  if (!ctx || !canvas || !gameObject) {
    return;
  }


  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  /*
   * Arena background.
   */

  ctx.fillStyle =
    "#020617";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  /*
   * Grid.
   */

  ctx.strokeStyle =
    "rgba(6,182,212,0.15)";

  ctx.lineWidth =
    1;


  const gridSize =
    40;


  for (
    let x = 0;
    x < canvas.width;
    x += gridSize
  ) {

    ctx.beginPath();

    ctx.moveTo(
      x,
      0
    );

    ctx.lineTo(
      x,
      canvas.height
    );

    ctx.stroke();
  }


  for (
    let y = 0;
    y < canvas.height;
    y += gridSize
  ) {

    ctx.beginPath();

    ctx.moveTo(
      0,
      y
    );

    ctx.lineTo(
      canvas.width,
      y
    );

    ctx.stroke();
  }


  /*
   * Player.
   */

  const player =
    gameObject.player;


  ctx.fillStyle =
    "#22d3ee";

  ctx.fillRect(
    player.x,
    player.y,
    player.width,
    player.height
  );


  /*
   * Opponent.
   */

  const opponent =
    gameObject.opponent;


  ctx.fillStyle =
    "#f43f5e";

  ctx.fillRect(
    opponent.x,
    opponent.y,
    opponent.width,
    opponent.height
  );


  /*
   * Score.
   */

  ctx.fillStyle =
    "#ffffff";

  ctx.font =
    "bold 16px Arial";

  ctx.textAlign =
    "center";


  ctx.fillText(
    `YOU: ${gameObject.playerScore}`,
    canvas.width / 2 - 80,
    25
  );


  ctx.fillText(
    `OPPONENT: ${gameObject.opponentScore}`,
    canvas.width / 2 + 80,
    25
  );
}


/* ==========================================================================
   37. CANVAS CLICK
   ========================================================================== */

function handleCanvasClick(
  event
) {

  if (
    !state.isPlaying ||
    !gameObject ||
    !canvas
  ) {

    return;
  }


  const rect =
    canvas.getBoundingClientRect();


  const scaleX =
    canvas.width /
    rect.width;


  const scaleY =
    canvas.height /
    rect.height;


  const clickX =
    (event.clientX -
      rect.left) *
    scaleX;


  const clickY =
    (event.clientY -
      rect.top) *
    scaleY;


  const opponent =
    gameObject.opponent;


  const hit =
    clickX >= opponent.x &&
    clickX <=
      opponent.x +
        opponent.width &&
    clickY >= opponent.y &&
    clickY <=
      opponent.y +
        opponent.height;


  if (hit) {

    gameObject.playerScore++;

    /*
     * Move opponent after a hit.
     */

    opponent.x =
      Math.random() *
      Math.max(
        1,
        canvas.width -
          opponent.width
      );

    opponent.y =
      40 +
      Math.random() *
      Math.max(
        1,
        canvas.height -
          100
      );


    /*
     * First player to 5 points wins.
     */

    if (
      gameObject.playerScore >= 5
    ) {

      finishArenaMatch(
        true
      );
    }
  }
}


/* ==========================================================================
   38. DRAW STANDBY SCREEN
   ========================================================================== */

function drawCanvasStandby() {

  if (!ctx || !canvas) {
    return;
  }


  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  ctx.fillStyle =
    "#020617";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  ctx.fillStyle =
    "rgba(6,182,212,0.8)";

  ctx.font =
    "bold 18px Arial";

  ctx.textAlign =
    "center";


  ctx.fillText(
    "CYBERSTRIKE ARENA",
    canvas.width / 2,
    canvas.height / 2 - 10
  );


  ctx.fillStyle =
    "rgba(148,163,184,0.8)";

  ctx.font =
    "13px Arial";


  ctx.fillText(
    "Select a stake and enter matchmaking",
    canvas.width / 2,
    canvas.height / 2 + 20
  );
}


/* ==========================================================================
   39. FINISH ARENA MATCH
   ========================================================================== */

async function finishArenaMatch(
  forcedPlayerWin = false
) {

  if (
    !state.isPlaying ||
    !gameObject ||
    gameObject.finished
  ) {

    return;
  }


  gameObject.finished =
    true;

  state.isPlaying =
    false;


  if (animationFrameId) {

    cancelAnimationFrame(
      animationFrameId
    );

    animationFrameId =
      null;
  }


  const playerWon =
    forcedPlayerWin ||
    gameObject.playerScore >
      gameObject.opponentScore;


  const stake =
    Number(
      state.currentStake
    );


  if (playerWon) {

    await processMatchResult(
      true,
      stake
    );

  } else {

    await processMatchResult(
      false,
      stake
    );
  }
}


/* ==========================================================================
   40. PROCESS MATCH RESULT
   ========================================================================== */

async function processMatchResult(
  playerWon,
  stake
) {

  if (!supabaseClient) {

    showCyberAlert(
      "RESULT ERROR",
      "Supabase is not connected.",
      "⚠️"
    );

    return;
  }


  if (!state.user?.id) {

    showCyberAlert(
      "SESSION ERROR",
      "Your account session is missing.",
      "🔒"
    );

    return;
  }


  const config =
    STAKE_CONFIGS[
      Number(stake).toFixed(2)
    ];


  if (!config) {

    showCyberAlert(
      "STAKE ERROR",
      "The selected stake configuration is invalid.",
      "⚠️"
    );

    return;
  }


  try {

    /*
     * The server determines the final result.
     *
     * No local balance addition is performed.
     */

    const {
      data,
      error
    } =
      await supabaseClient.rpc(
        "cyberstrike_match_result",
        {
          p_user_id:
            state.user.id,

          p_stake:
            stake,

          p_player_won:
            playerWon
        }
      );


    if (error) {

      console.error(
        "Match result RPC error:",
        error
      );

      showCyberAlert(
        "RESULT ERROR",
        error.message ||
        "The match result could not be processed.",
        "⚠️"
      );

      return;
    }


    /*
     * Reload everything from Supabase.
     */

    await loadUserProfile();


    if (playerWon) {

      showCyberAlert(
        "VICTORY",
        `You won the ${stake.toFixed(2)} USDT match.`,
        "🏆"
      );

    } else {

      showCyberAlert(
        "MATCH COMPLETE",
        `You lost the ${stake.toFixed(2)} USDT match.`,
        "⚔️"
      );
    }


    drawCanvasStandby();


  } catch (error) {

    console.error(
      "processMatchResult error:",
      error
    );

    showCyberAlert(
      "RESULT ERROR",
      error?.message ||
      "Unable to process the match result.",
      "⚠️"
    );
  }
}/* ==========================================================================
   CYBERSTRIKE | PART 4 OF 4
   WITHDRAWALS, SPRINT MILESTONES, TIMER & FINAL HELPERS
   ========================================================================== */


/* ==========================================================================
   41. CONFIRM WITHDRAWAL
   ========================================================================== */

async function confirmWithdrawal() {

  if (!state.user?.id) {

    showCyberAlert(
      "LOGIN REQUIRED",
      "Please log in before requesting a withdrawal.",
      "🔒"
    );

    return;
  }


  if (state.balance === null) {

    showCyberAlert(
      "BALANCE UNAVAILABLE",
      "Your current balance could not be loaded.",
      "⚠️"
    );

    return;
  }


  const amountInput =
    document.getElementById(
      "withdrawAmount"
    );

  const emailInput =
    document.getElementById(
      "withdrawEmail"
    );


  if (!amountInput) {
    return;
  }


  const amount =
    Number(
      amountInput.value
    );


  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    showCyberAlert(
      "INVALID AMOUNT",
      "Please enter a valid withdrawal amount.",
      "⚠️"
    );

    return;
  }


  /*
   * Minimum withdrawal:
   * 0.50 USDT
   */

  if (amount < 0.50) {

    showCyberAlert(
      "MINIMUM WITHDRAWAL",
      "The minimum withdrawal amount is 0.50 USDT.",
      "⚠️"
    );

    return;
  }


  if (amount > state.balance) {

    showCyberAlert(
      "INSUFFICIENT BALANCE",
      "You do not have enough USDT for this withdrawal.",
      "💰"
    );

    return;
  }


  const email =
    emailInput?.value.trim() ||
    state.user.email ||
    "";


  if (!email) {

    showCyberAlert(
      "EMAIL REQUIRED",
      "Your account email could not be found.",
      "⚠️"
    );

    return;
  }


  try {

    /*
     * IMPORTANT:
     *
     * No local balance deduction happens here.
     *
     * Supabase must process the withdrawal and
     * update the real database balance.
     */

    if (!supabaseClient) {

      throw new Error(
        "Supabase is not connected."
      );
    }


    const {
      data,
      error
    } =
      await supabaseClient.rpc(
        "cyberstrike_withdraw",
        {
          p_user_id:
            state.user.id,

          p_amount:
            amount,

          p_email:
            email
        }
      );


    if (error) {

      console.error(
        "Withdrawal RPC error:",
        error
      );

      throw error;
    }


    /*
     * Reload the real balance from Supabase.
     */

    const refreshed =
      await loadUserProfile();


    if (!refreshed) {

      throw new Error(
        "Withdrawal was processed, but the updated balance could not be loaded."
      );
    }


    closeModal(
      "withdrawModal"
    );


    amountInput.value =
      "";


    showCyberAlert(
      "WITHDRAWAL REQUESTED",
      `${amount.toFixed(2)} USDT withdrawal request submitted successfully.`,
      "✓"
    );


  } catch (error) {

    console.error(
      "confirmWithdrawal error:",
      error
    );

    showCyberAlert(
      "WITHDRAWAL FAILED",
      error?.message ||
      "Your withdrawal request could not be processed.",
      "⚠️"
    );
  }
}


/* ==========================================================================
   42. START SPRINT TIMER
   ========================================================================== */

function startSprintTimer() {

  updateSprintTimer();


  setInterval(
    function () {

      updateSprintTimer();

    },
    1000
  );
}


/* ==========================================================================
   43. UPDATE SPRINT TIMER
   ========================================================================== */

function updateSprintTimer() {

  const countdown =
    document.getElementById(
      "sprintCountdown"
    );

  if (!countdown) {
    return;
  }


  let remaining =
    state.sprintEndTime -
    Date.now();


  if (remaining <= 0) {

    remaining = 0;
  }


  const totalSeconds =
    Math.floor(
      remaining / 1000
    );


  const days =
    Math.floor(
      totalSeconds /
      86400
    );


  const hours =
    Math.floor(
      (totalSeconds %
        86400) /
      3600
    );


  const minutes =
    Math.floor(
      (totalSeconds %
        3600) /
      60
    );


  const seconds =
    totalSeconds %
    60;


  countdown.innerText =
    `${String(days).padStart(2, "0")}D ` +
    `${String(hours).padStart(2, "0")}H ` +
    `${String(minutes).padStart(2, "0")}M ` +
    `${String(seconds).padStart(2, "0")}S`;
}


/* ==========================================================================
   44. CLAIM SPRINT MILESTONE
   ========================================================================== */

async function claimMilestone(
  winsRequired,
  rewardAmount
) {

  if (!state.user?.id) {

    showCyberAlert(
      "LOGIN REQUIRED",
      "Please log in before claiming a sprint reward.",
      "🔒"
    );

    return;
  }


  if (state.balance === null) {

    showCyberAlert(
      "BALANCE UNAVAILABLE",
      "Your account balance has not been loaded.",
      "⚠️"
    );

    return;
  }


  const requiredWins =
    Number(
      winsRequired
    );


  const reward =
    Number(
      rewardAmount
    );


  if (
    !Number.isFinite(
      requiredWins
    ) ||
    !Number.isFinite(
      reward
    )
  ) {

    showCyberAlert(
      "INVALID REWARD",
      "This sprint reward configuration is invalid.",
      "⚠️"
    );

    return;
  }


  if (
    state.wins <
    requiredWins
  ) {

    showCyberAlert(
      "MILESTONE LOCKED",
      `You need ${requiredWins} wins to claim this reward.`,
      "🔒"
    );

    return;
  }


  if (
    state.claimedMilestones.includes(
      requiredWins
    )
  ) {

    showCyberAlert(
      "ALREADY CLAIMED",
      "You have already claimed this milestone.",
      "✓"
    );

    return;
  }


  try {

    if (!supabaseClient) {

      throw new Error(
        "Supabase is not connected."
      );
    }


    /*
     * The server checks:
     *
     * - authenticated user
     * - required wins
     * - whether reward was already claimed
     * - reward amount
     *
     * The browser never creates the money itself.
     */

    const {
      data,
      error
    } =
      await supabaseClient.rpc(
        "cyberstrike_claim_milestone",
        {
          p_user_id:
            state.user.id,

          p_wins_required:
            requiredWins,

          p_reward:
            reward
        }
      );


    if (error) {

      console.error(
        "Milestone RPC error:",
        error
      );

      throw error;
    }


    state.claimedMilestones.push(
      requiredWins
    );


    /*
     * Reload real balance and wins.
     */

    await loadUserProfile();


    showCyberAlert(
      "REWARD CLAIMED",
      `${reward.toFixed(2)} USDT has been added to your CyberStrike balance.`,
      "🏆"
    );


    updateMilestoneButtons();


  } catch (error) {

    console.error(
      "claimMilestone error:",
      error
    );

    showCyberAlert(
      "CLAIM FAILED",
      error?.message ||
      "The milestone reward could not be claimed.",
      "⚠️"
    );
  }
}


/* ==========================================================================
   45. UPDATE MILESTONE BUTTONS
   ========================================================================== */

function updateMilestoneButtons() {

  const milestoneButtons = [
    {
      id: "claim20Btn",
      wins: 20
    },

    {
      id: "claim50Btn",
      wins: 50
    },

    {
      id: "claim100Btn",
      wins: 100
    },

    {
      id: "claim1000Btn",
      wins: 1000
    }
  ];


  milestoneButtons.forEach(
    function (item) {

      const button =
        document.getElementById(
          item.id
        );


      if (!button) {
        return;
      }


      const claimed =
        state.claimedMilestones.includes(
          item.wins
        );


      if (claimed) {

        button.disabled =
          true;

        button.innerText =
          "CLAIMED";

        return;
      }


      if (
        state.wins >=
        item.wins
      ) {

        button.disabled =
          false;

        return;
      }


      button.disabled =
        true;
    }
  );
}


/* ==========================================================================
   46. REFRESH PROFILE DATA
   ========================================================================== */

async function refreshCyberStrikeProfile() {

  if (!state.user?.id) {
    return false;
  }


  const success =
    await loadUserProfile();


  if (success) {

    updateMilestoneButtons();
  }


  return success;
}


/* ==========================================================================
   47. AUTO REFRESH PROFILE
   ========================================================================== */

setInterval(
  async function () {

    /*
     * Only refresh when the user is logged in.
     */

    if (!state.user?.id) {
      return;
    }


    /*
     * Do not interfere while matchmaking
     * or playing a match.
     */

    if (
      state.isMatchmaking ||
      state.isPlaying
    ) {

      return;
    }


    await refreshCyberStrikeProfile();

  },
  30000
);


/* ==========================================================================
   48. INITIAL UI REFRESH
   ========================================================================== */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    updateUI();

    updateMilestoneButtons();
  }
);


/* ==========================================================================
   49. PREVENT FORM SUBMISSION RELOAD
   ========================================================================== */

document.addEventListener(
  "submit",
  function (event) {

    event.preventDefault();
  }
);


/* ==========================================================================
   50. WINDOW ERROR LOGGER
   ========================================================================== */

window.addEventListener(
  "error",
  function (event) {

    console.error(
      "CYBERSTRIKE JAVASCRIPT ERROR:",
      event.message,
      event.filename,
      event.lineno,
      event.colno
    );
  }
);


/* ==========================================================================
   51. UNHANDLED PROMISE LOGGER
   ========================================================================== */

window.addEventListener(
  "unhandledrejection",
  function (event) {

    console.error(
      "CYBERSTRIKE UNHANDLED PROMISE ERROR:",
      event.reason
    );
  }
);


/* ==========================================================================
   52. FINAL STARTUP MESSAGE
   ========================================================================== */

console.log(
  "================================================"
);

console.log(
  "CYBERSTRIKE SCRIPT LOADED SUCCESSFULLY"
);

console.log(
  "No demo balance is enabled."
);

console.log(
  "Balance must come from Supabase."
);

console.log(
  "================================================"
);
