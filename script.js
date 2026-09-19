// ==========================================
// PART 1: SETUP, STATE & AUTHENTICATION
// ==========================================

// 1. INITIALIZATION & STATE MANAGEMENT
const SUPABASE_URL = "https://btugwhcoypxtlgmsxqci.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable__DjyCoKhrV9vpmAUY-T3lg_0f-Ji2-h";

let supabaseClient = null;
if (typeof supabase !== "undefined" && SUPABASE_URL !== "YOUR_SUPABASE_URL_HERE") {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const state = {
  user: null,
  balance: 0.00,
  wins: 0,
  claimedMilestones: []
};

// 2. DOM CONTENT LOADED & INITIAL SETUP
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  updateUI();
});

function setupEventListeners() {
  // Auth Form Submit
  const authForm = document.getElementById("authForm");
  if (authForm) {
    authForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleLogin();
    });
  }

  // Login Button Click
  const loginBtn = document.getElementById("loginButton");
  if (loginBtn) {
    loginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleLogin();
    });
  }

  // Auth Toggle Buttons
  const showLoginBtn = document.getElementById("showLoginBtn");
  const showSignupBtn = document.getElementById("showSignupBtn");
  if (showLoginBtn) showLoginBtn.addEventListener("click", () => toggleAuthMode("login"));
  if (showSignupBtn) showSignupBtn.addEventListener("click", () => toggleAuthMode("signup"));

  // Milestone Claim Buttons
  const claim20Btn = document.getElementById("claim20Btn");
  const claim50Btn = document.getElementById("claim50Btn");
  const claim100Btn = document.getElementById("claim100Btn");
  const claim1000Btn = document.getElementById("claim1000Btn");

  if (claim20Btn) claim20Btn.addEventListener("click", () => claimMilestone(20, 2.00));
  if (claim50Btn) claim50Btn.addEventListener("click", () => claimMilestone(50, 5.00));
  if (claim100Btn) claim100Btn.addEventListener("click", () => claimMilestone(100, 10.00));
  if (claim1000Btn) claim1000Btn.addEventListener("click", () => claimMilestone(1000, 100.00));

  // Modal Close Button
  const closeAlertBtn = document.getElementById("closeAlertBtn");
  if (closeAlertBtn) {
    closeAlertBtn.addEventListener("click", hideCyberAlert);
  }
}

// 3. AUTHENTICATION HANDLERS
function toggleAuthMode(mode) {
  const submitBtn = document.getElementById("loginButton");
  const authTitle = document.getElementById("authTitle");
  const authMessage = document.getElementById("authMessage");
  
  if (authMessage) authMessage.classList.add("hidden");

  if (mode === "signup") {
    if (submitBtn) {
      submitBtn.innerText = "CREATE ACCOUNT";
      submitBtn.onclick = (e) => { e.preventDefault(); handleSignUp(); };
    }
    if (authTitle) authTitle.innerText = "REGISTER ACCOUNT";
  } else {
    if (submitBtn) {
      submitBtn.innerText = "LOGIN / ENTER ARENA";
      submitBtn.onclick = (e) => { e.preventDefault(); handleLogin(); };
    }
    if (authTitle) authTitle.innerText = "AUTHENTICATION";
  }
}

async function handleLogin() {
  const emailInput = document.getElementById("loginEmail")?.value.trim();
  const passwordInput = document.getElementById("loginPassword")?.value;
  const authMsg = document.getElementById("authMessage");
  const loginBtn = document.getElementById("loginButton");

  if (!emailInput || !passwordInput) {
    showAuthError("Please fill in all required fields.");
    return;
  }

  if (authMsg) authMsg.classList.add("hidden");
  if (loginBtn) {
    loginBtn.innerText = "AUTHENTICATING...";
    loginBtn.disabled = true;
  }

  try {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: emailInput,
        password: passwordInput
      });

      if (error) throw error;
      state.user = data.user;

      // Fetch user profile stats
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('balance, wins, claimed_milestones')
        .eq('id', state.user.id)
        .single();

      if (profile) {
        state.balance = parseFloat(profile.balance) || 0.00;
        state.wins = profile.wins || 0;
        state.claimedMilestones = profile.claimed_milestones || [];
      }
    } else {
      // Offline / Demo Mode Fallback
      await new Promise(res => setTimeout(res, 800));
      state.user = { id: "usr_" + Math.random().toString(36).substr(2, 9), email: emailInput };
      state.balance = 0.00;
      state.wins = 0;
      state.claimedMilestones = [];
    }

    // Switch Screens
    const authGate = document.getElementById("authGate");
    const appContainer = document.getElementById("appContainer");
    if (authGate) authGate.classList.add("hidden");
    if (appContainer) appContainer.classList.remove("hidden");

    // Populate user details in forms
    const depositUserId = document.getElementById("depositUserId");
    const withdrawEmail = document.getElementById("withdrawEmail");
    if (depositUserId) depositUserId.value = state.user.id;
    if (withdrawEmail) withdrawEmail.value = state.user.email;

    updateUI();
  } catch (err) {
    showAuthError(err.message || "Failed to log in. Check credentials.");
  } finally {
    if (loginBtn) {
      loginBtn.innerText = "LOGIN / ENTER ARENA";
      loginBtn.disabled = false;
    }
  }
}

async function handleSignUp() {
  const emailInput = document.getElementById("loginEmail")?.value.trim();
  const passwordInput = document.getElementById("loginPassword")?.value;
  const authMsg = document.getElementById("authMessage");
  const loginBtn = document.getElementById("loginButton");

  if (!emailInput || !passwordInput) {
    showAuthError("Please fill in all required fields.");
    return;
  }

  if (authMsg) authMsg.classList.add("hidden");
  if (loginBtn) {
    loginBtn.innerText = "CREATING ACCOUNT...";
    loginBtn.disabled = true;
  }

  try {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.auth.signUp({
        email: emailInput,
        password: passwordInput
      });

      if (error) throw error;
      showCyberAlert("ACCOUNT CREATED!", "Please check your email to verify your account or log in.", "fa-user-check");
    } else {
      await new Promise(res => setTimeout(res, 800));
      showCyberAlert("DEMO MODE", "Account created in Demo Mode! You can now log in.", "fa-user-check");
    }
  } catch (err) {
    showAuthError(err.message || "Failed to create account.");
  } finally {
    if (loginBtn) {
      loginBtn.innerText = "CREATE ACCOUNT";
      loginBtn.disabled = false;
    }
  }
}

function showAuthError(msg) {
  const authMsg = document.getElementById("authMessage");
  if (authMsg) {
    authMsg.innerText = msg;
    authMsg.classList.remove("hidden");
  }
         }
// ==========================================
// PART 2: MILESTONES, UI UPDATES & MODAL
// ==========================================

// 4. MILESTONE & REWARD LOGIC
function claimMilestone(winsReq, amount) {
  if (state.wins < winsReq || state.claimedMilestones.includes(winsReq)) return;

  state.claimedMilestones.push(winsReq);
  state.balance += amount;
  
  updateUI();
  showCyberAlert(
    "REWARD CLAIMED!",
    `You have claimed +$${amount.toFixed(2)} USDT bonus for reaching ${winsReq} wins!`,
    "fa-gift"
  );

  // Sync with Supabase database if connected
  if (supabaseClient && state.user) {
    supabaseClient
      .from('profiles')
      .update({
        balance: state.balance,
        claimed_milestones: state.claimedMilestones
      })
      .eq('id', state.user.id)
      .then();
  }
}

// 5. UI UPDATE FUNCTIONS
function updateUI() {
  // Balance Display
  const balanceDisplay = document.getElementById("userBalanceDisplay");
  if (balanceDisplay) {
    balanceDisplay.innerText = `$${state.balance.toFixed(2)} USDT`;
  }

  // Wins Display
  const winsDisplay = document.getElementById("userWinsDisplay");
  if (winsDisplay) {
    winsDisplay.innerText = state.wins;
  }

  updateSprintSection();

  // Update Milestone Claim Buttons
  checkMilestoneBtn("claim20Btn", 20);
  checkMilestoneBtn("claim50Btn", 50);
  checkMilestoneBtn("claim100Btn", 100);
  checkMilestoneBtn("claim1000Btn", 1000);
}

function updateSprintSection() {
  const nextRewardTextEl = document.getElementById("nextRewardText");
  const sprintProgressBarEl = document.getElementById("sprintProgressBar");

  let nextRewardText = "NEXT REWARD: 2.00 USDT";
  let maxWins = 20;

  if (state.wins < 20) {
    nextRewardText = "NEXT REWARD: 2.00 USDT";
    maxWins = 20;
  } else if (state.wins < 50) {
    nextRewardText = "NEXT REWARD: 5.00 USDT";
    maxWins = 50;
  } else if (state.wins < 100) {
    nextRewardText = "NEXT REWARD: 10.00 USDT";
    maxWins = 100;
  } else {
    nextRewardText = "MAX REWARD REACHED";
    maxWins = 1000;
  }

  if (nextRewardTextEl) nextRewardTextEl.innerText = nextRewardText;

  if (sprintProgressBarEl) {
    const progressPercent = Math.min(100, Math.floor((state.wins / maxWins) * 100));
    sprintProgressBarEl.style.width = `${progressPercent}%`;
  }
}

function checkMilestoneBtn(btnId, requiredWins) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  if (state.claimedMilestones.includes(requiredWins)) {
    btn.innerText = "CLAIMED";
    btn.disabled = true;
    btn.className = "px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-[9px] font-bold text-slate-600 cursor-not-allowed";
  } else if (state.wins >= requiredWins) {
    btn.innerText = "CLAIM";
    btn.disabled = false;
    btn.className = "px-3 py-1.5 rounded-lg border border-cyan-500 bg-cyan-500/20 text-[9px] font-bold text-cyan-400 hover:bg-cyan-500/30 cursor-pointer animate-pulse";
  } else {
    btn.innerText = "LOCKED";
    btn.disabled = true;
    btn.className = "px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/50 text-[9px] font-bold text-slate-600 cursor-not-allowed";
  }
}

// 6. MODAL & ALERT SYSTEM
function showCyberAlert(title, message, iconClass = "fa-info-circle") {
  const modal = document.getElementById("cyberModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalMessage = document.getElementById("modalMessage");
  const modalIcon = document.getElementById("modalIcon");

  if (!modal) {
    alert(`${title}\n\n${message}`);
    return;
  }

  if (modalTitle) modalTitle.innerText = title;
  if (modalMessage) modalMessage.innerText = message;
  if (modalIcon) modalIcon.className = `fas ${iconClass} text-cyan-400 text-2xl`;

  modal.classList.remove("hidden");
}

function hideCyberAlert() {
  const modal = document.getElementById("cyberModal");
  if (modal) modal.classList.add("hidden");
}
