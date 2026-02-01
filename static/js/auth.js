// ========== SUPABASE CLIENT ========== 
const SUPABASE_URL = 'https://icyrucuuitdxivcpyhlg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljeXJ1Y3V1aXRkeGl2Y3B5aGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NjM0NzAsImV4cCI6MjA4NTIzOTQ3MH0.96egdfcPHnI7hW64-5rvr4IsSfoZ9YZVtBgtVY2Pwf4';

// Initialize Supabase client (frontend-safe, uses anon key)
let supabaseClient = null;

// Wait for Supabase library to load
function initSupabase() {
    if (window.supabase && window.supabase.createClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return true;
    }
    return false;
}

// ========== AUTH STATE MANAGEMENT ========== 
let currentUser = null;
let currentSession = null;

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Supabase first
    if (!initSupabase()) {
        console.error('Supabase library not loaded');
        return;
    }

    // Set up form handlers
    setupFormHandlers();

    // Initialize auth state
    await initializeAuth();
});

async function initializeAuth() {
    try {
        // Get current session
        const { data: { session }, error } = await supabaseClient.auth.getSession();

        if (error) {
            console.error('Auth error:', error);
            redirectToLogin();
            return;
        }

        if (!session) {
            // No session, redirect to login
            if (!isLoginPage()) {
                redirectToLogin();
            }
            return;
        }

        // Session exists, set user info
        currentSession = session;
        currentUser = session.user;

        // Update UI with user email
        updateUserDisplay();

        // Set up logout buttons
        setupLogoutButtons();

    } catch (error) {
        console.error('Initialization error:', error);
        redirectToLogin();
    }
}

function isLoginPage() {
    return window.location.pathname === '/login' || window.location.pathname.includes('login');
}

function updateUserDisplay() {
    const userEmailElements = document.querySelectorAll('#userEmail');
    if (userEmailElements.length > 0 && currentUser) {
        userEmailElements.forEach(el => {
            el.textContent = currentUser.email;
        });
    }
}

function setupLogoutButtons() {
    const logoutBtns = document.querySelectorAll('#logoutBtn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', logout);
    });
}

function redirectToLogin() {
    if (!isLoginPage()) {
        window.location.href = '/login';
    }
}

// ========== AUTH FORMS ========== 
function setupFormHandlers() {
    // Login/Signup tab switching
    const authTabs = document.querySelectorAll('.auth-tab');
    if (authTabs.length > 0) {
        authTabs.forEach(tab => {
            tab.addEventListener('click', switchTab);
        });
    }

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
}

function switchTab(e) {
    const tabName = e.target.dataset.tab;
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');

    tabs.forEach(t => t.classList.remove('active'));
    forms.forEach(f => f.classList.remove('active'));

    e.target.classList.add('active');
    document.getElementById(tabName + 'Form').classList.add('active');
}

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('authError');
    const loadingDiv = document.getElementById('authLoading');

    errorDiv.classList.add('hidden');
    loadingDiv.classList.remove('hidden');

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw error;
        }

        if (data.session) {
            currentSession = data.session;
            currentUser = data.user;
            window.location.href = '/';
        }

    } catch (error) {
        errorDiv.textContent = '❌ ' + (error.message || 'Login failed');
        errorDiv.classList.remove('hidden');
        loadingDiv.classList.add('hidden');
    }
}

async function handleSignup(e) {
    e.preventDefault();

    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorDiv = document.getElementById('authError');
    const loadingDiv = document.getElementById('authLoading');

    if (password !== confirmPassword) {
        errorDiv.textContent = '❌ Passwords do not match';
        errorDiv.classList.remove('hidden');
        return;
    }

    if (password.length < 6) {
        errorDiv.textContent = '❌ Password must be at least 6 characters';
        errorDiv.classList.remove('hidden');
        return;
    }

    errorDiv.classList.add('hidden');
    loadingDiv.classList.remove('hidden');

    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password
        });

        if (error) {
            throw error;
        }

        if (data.user) {
            // Account created but needs email verification
            // Auto-sign in for demo purposes
            const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (signInError) {
                throw signInError;
            }

            currentSession = signInData.session;
            currentUser = signInData.user;
            window.location.href = '/';
        }

    } catch (error) {
        errorDiv.textContent = '❌ ' + (error.message || 'Signup failed');
        errorDiv.classList.remove('hidden');
        loadingDiv.classList.add('hidden');
    }
}

async function logout() {
    try {
        const { error } = await supabaseClient.auth.signOut();

        if (error) {
            throw error;
        }

        currentUser = null;
        currentSession = null;
        window.location.href = '/login';

    } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed: ' + error.message);
    }
}

// ========== HELPER: GET AUTH TOKEN ========== 
async function getAuthToken() {
    if (!currentSession) {
        // Try to get session from Supabase
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            redirectToLogin();
            return null;
        }
        currentSession = session;
    }
    return currentSession.access_token;
}
