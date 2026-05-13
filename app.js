import {config} from './config.js';
const supabaseClient = supabase.createClient(config.supabaseUrl, config.supabaseKey);

const loginModal = document.getElementById('login-modal');
const signupModal = document.getElementById('signup-modal');
const profileMenu = document.getElementById('profile-menu');
const heroSection = document.getElementById('hero');
const dashboardArea = document.getElementById('dashboard-area');
const profileBtn = document.querySelector('.profile-icon');



// Controling Popus

window.openLoginModal = function() {
    loginModal.style.display = 'flex';
    signupModal.style.display = 'none';
};
window.closeLoginModal = function() {
    loginModal.style.display = 'none';
};
window.openSignupModal = function() {
    signupModal.style.display = 'flex';
    loginModal.style.display = 'none';
};
window.closeSignupModal = function() {
    signupModal.style.display = 'none';
};

window.onclick = function(event) {
    if (event.target === loginModal) {
        closeLoginModal();
    }
    if (event.target === signupModal) {
        closeSignupModal();
    }
};

// Popup Links

window.switchToSignup = function() {
    closeLoginModal();
    openSignupModal();
};

window.switchToLogin = function() {
    closeSignupModal();
    openLoginModal();
};

// Profile
window.toggleProfile = function() {
    if (profileMenu.style.display === 'none' || profileMenu.style.display === '') {
        profileMenu.style.display = 'block';
    }
    else {
        profileMenu.style.display = 'none';
    }
};


window.toggleProfile = function() {
    if (profileMenu.style.display === 'none' || profileMenu.style.display === '') {
        profileMenu.style.display = 'block';
    } else {
        profileMenu.style.display = 'none';
    }
};

// Login & Logout & Signup

window.signUp = async function() {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-password-confirm').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    const {data, error} = await supabaseClient.auth.signUp({email, password});

    if (error) {
        alert(error.message);
    }
    else {
        alert("Check Your Email For Verification!!");
        closeSignupModal();
    }
}


window.login = async function () {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const {data, error} = await supabaseClient.auth.signInWithPassword({ email, password});

    if (error) {
        alert(error.message);
    }
    else{
        closeLoginModal();
        checkUser();
    }
}

window.logout = async function() {
    await supabaseClient.auth.signOut();
    location.reload();
}

// Countdown Timer
function startCountdown(targetDate) {
    const timerDisplay = document.getElementById('countdown-timer');

    function updateTimer(){
        const now = new Date().getTime();
        const distance = new Date(targetDate).getTime() = now;

        if (distance < 0) {
            timerDisplay.innerHTML = "000:00:00:00";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        const d = String(days).padStart(3, '0');
        const h = String(hours).padStart(2, '0');
        const m = String(minutes).padStart(2, '0');
        const s = String(seconds).padStart(2, '0');

        timerDisplay.innerHTML = `${d}:${h}:${m}:${s}`;
    }
    updateTimer();
    setInterval(updateTimer, 1000)
}

// Controling Landing Page

async function checkUser() {
    const {data: {user}} = await supabaseClient.auth.getUser();

    if (user) {
        heroSection.style.display = 'none';
        dashboardArea.style.display = 'block';
        profileBtn.style.display = 'flex';

        loadPrescriptionHistory(user.id);
        loadProfileData(user.id);
    }
    else {
        heroSection.style.display = 'flex';
        dashboardArea.style.display = 'none';
        profileBtn.style.display = 'none';
    }
}

checkUser();

// Fetching Data

async function loadPrescriptionHistory(userId) {
    const {data, error} = await supabaseClient.from('prescriptions').select('*').eq('user_id', userId).order('created_at', {ascending: false});
    if (error) {
        console.error('Error fetching prescription history:', error);
    }

    const tbody = document.getElementById('history-body');
    tbody.innerHTML = '';

    data.forEach(row => {
        tbody.innerHTML += `
            <tr>
                <td>${new Date(row.created_at).toLocaleDateString()}</td>
                <td>${row.eye}</td>
                <td>${row.sph}</td>
                <td>${row.cyl}</td>
                <td>${row.axis}</td>
            </tr>
        `
    });
}

