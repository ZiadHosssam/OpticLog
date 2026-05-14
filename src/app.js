import {config} from './config.js';
let countdownInterval;

const apiKey = import.meta.env.VITE_RESEND_API_KEY;
const supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseKey);

const loginModal = document.getElementById('login-modal');
const signupModal = document.getElementById('signup-modal');
const profileMenu = document.getElementById('profile-menu');
const heroSection = document.getElementById('hero');
const dashboardArea = document.getElementById('dashboard-area');
const profileBtn = document.querySelector('.profile-icon');
const loginNavBtn = document.getElementById('login-nav-btn');
const signupNavBtn = document.getElementById('signup-nav-btn');

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
// Adding Data

window.openRecordModal = function() {
    document.getElementById('record-modal').style.display = 'flex';
};

window.closeRecordModal = function() {
    document.getElementById('record-modal').style.display = 'none';
};

document.getElementById('full-record-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    const newRecord = {
        user_id: user.id,
        date: document.getElementById('record-date').value,
        // Right Eye Data
        r_sph: parseFloat(document.getElementById('r-sph').value),
        r_cyl: parseFloat(document.getElementById('r-cyl').value),
        r_axis: parseInt(document.getElementById('r-axis').value),
        // Left Eye Data
        l_sph: parseFloat(document.getElementById('l-sph').value),
        l_cyl: parseFloat(document.getElementById('l-cyl').value),
        l_axis: parseInt(document.getElementById('l-axis').value),
    };

    const { error } = await supabaseClient.from('prescriptions').insert([newRecord]);
    
    if (error) {
        alert("Error Saving!! " + error.message);
    } else {
        document.getElementById('full-record-form').reset();
        closeRecordModal();
        checkUser();
    }
});

window.deletePrescription = async function(id) {
    if (!confirm("Are Sure Brother?")) return;

    const{error} = await supabaseClient.from('prescriptions').delete().eq('id',id);
    if (error){
        alert("Error Deleting!! " + error.message);
    }
    else {
        const{data:{user}} = await supabaseClient.auth.getUser();
        loadPrescriptionHistory(user.id);
    }
};
// Countdown Timer
function startCountdown(targetDate) {
    const timerDisplay = document.getElementById('countdown-timer');

    if (countdownInterval) clearInterval(countdownInterval);

    timerDisplay.style.color = "#00ff41";
    timerDisplay.style.fontSize = "2.5rem";
    function updateTimer(){
        const now = new Date().getTime();
        const distance = new Date(targetDate).getTime() - now;

        if (distance < 0) {
            timerDisplay.innerHTML = "DEADLINE ARRIVED";
            timerDisplay.style.color = "#ff4b2b";
            timerDisplay.style.fontSize = "3rem";
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
    countdownInterval = setInterval(updateTimer, 1000)
}

async function sendCheckupReminder(userEmail, userName) {
    try {
        const { data, error } = await supabaseClient.functions.invoke('send-reminder', {
            body: { userEmail, userName },
        });

        if (error) throw error;
        console.log("Reminder email dispatched via Supabase Edge Function.");
    } catch (err) {
        console.error("Function invocation failed:", err.message);
    }
}
// Controling Landing Page

async function checkUser() {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        if (error) throw error;
        if (user) {
            heroSection.style.display = 'none';
            dashboardArea.style.display = 'block';
            profileBtn.style.display = 'flex';
            loginNavBtn.style.display = 'none';
            signupNavBtn.style.display = 'none';
            const today = new Date();
            const history = await loadPrescriptionHistory(user.id);
            if (history && history.length > 0){
                const latestDate  = new Date(history[0].date);
                const nextCheckup = new Date(latestDate);
                nextCheckup.setMonth(nextCheckup.getMonth() + 3);
                startCountdown(nextCheckup);
                const diffTime = Math.abs(today - latestDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays >= 90) {
                    sendCheckupReminder(user.email, 'Valued Member');
                }
            }
            else {
                const timerDisplay = document.getElementById('countdown-timer');
                timerDisplay.innerHTML = "DEADLINE ARRIVED";
                timerDisplay.style.color = "#ff4b2b";
            }
            if (typeof loadProfileData === "function") {
                await loadProfileData(user.id);
            }
        } else {
            heroSection.style.display = 'flex';
            dashboardArea.style.display = 'none';
            profileBtn.style.display = 'none';
            loginNavBtn.style.display = 'block';
            signupNavBtn.style.display = 'block';
            const defaultTargetDate = new Date();
            defaultTargetDate.setMonth(defaultTargetDate.getMonth() + 3);
            startCountdown(defaultTargetDate);
        }
    } catch (err) {
        console.error("Authentication check failed:", err.message);
        heroSection.style.display = 'flex';
        dashboardArea.style.display = 'none';
    }
}

checkUser();

// Fetching Data

async function loadPrescriptionHistory(userId) {
    const { data, error } = await supabaseClient
        .from('prescriptions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching history:', error);
        return;
    }

    const grid = document.getElementById('history-grid');
    if (!grid) return;
    
    grid.innerHTML = '';

    if (data.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No records found in the archive.</p>';
        return;
    }

    data.forEach((entry, index) => {
        const recordNum = (data.length - index).toString().padStart(2, '0');

        const card = `
            <div class="folder-card">
                <div class="prescription-number">#${recordNum}</div>
                <div class="folder-date">DATE: ${entry.date}</div>
                <div class="folder-content">
                    <div class="eye-data">
                        <h4>RIGHT (OD)</h4>
                        <p>SPH: ${entry.r_sph}</p>
                        <p>CYL: ${entry.r_cyl}</p>
                        <p>AXIS: ${entry.r_axis}</p>
                    </div>
                    <div class="eye-data">
                        <h4>LEFT (OS)</h4>
                        <p>SPH: ${entry.l_sph}</p>
                        <p>CYL: ${entry.l_cyl}</p>
                        <p>AXIS: ${entry.l_axis}</p>
                    </div>
                </div>
                <button class="delete-folder-btn" onclick="deletePrescription('${entry.id}')">
                    <i class="fas fa-trash-alt"></i> PURGE_FILE
                </button>
            </div>
        `;
        grid.insertAdjacentHTML('beforeend', card);
    });
    return data;
}
async function loadProfileData(userId) {
    console.log("Loading profile for user:", userId);
}
