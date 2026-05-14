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

window.generatePDF = async function() {
    const {data: { user }} = await supabaseClient.auth.getUser();
    if (!user) return alert("Please Login First!");

    const {data: prescriptions, error} = await supabaseClient.from('prescriptions').select('*').eq('user_id', user.id).order('date', { ascending: false });

    if (error || !prescriptions || prescriptions.length === 0) {
        alert("No records found to export.");
        return;
    }

    const {jsPDF} = window.jspdf;
    const doc = new jsPDF();

    doc.setFont("courier", "bold");
    doc.setFontSize(22);
    doc.setTextColor(0, 255, 136);
    doc.text("Optic-Log: Check-Up History", 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(100);

    const profileName = document.getElementById('user-name').value || user.name || 'N/A';
    const profileAge = document.getElementById('user-age').value || 'N/A';
    const profileSex = document.getElementById('user-sex').value || 'N/A';

    doc.text(`Name: ${profileName}`, 14, 30);
    doc.text(`Age: ${profileAge}`, 14, 37);
    doc.text(`Sex: ${profileSex}`, 14, 44);
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 14, 51);

    let currentY = 60;

    prescriptions.forEach((record, index) => {
        if (currentY > 250) {
            doc.addPage();
            currentY = 20;
        }

        doc.setDrawColor(0, 255, 136);
        doc.setLineWidth(0.5);
        doc.rect(14, currentY, 182, 40);

        doc.setFont("courier", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0, 255, 136);
        doc.text(`Check-Up #${index + 1} - ${record.date}`, 18, currentY + 8);

        doc.setFont("courier", "normal");
        doc.setFontSize(10);
        doc.setTextColor(100);

        doc.text(`RIGHT (OD): SPH ${record.r_sph.toFixed(2)} | CYL ${record.r_cyl.toFixed(2)} | AXIS ${record.r_axis}`, 18, currentY + 18);
        doc.text(`LEFT (OS):  SPH ${record.l_sph.toFixed(2)} | CYL ${record.l_cyl.toFixed(2)} | AXIS ${record.l_axis}`, 18, currentY + 28);

        currentY += 48;
    });

    currentY += 10;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("--- End Of Check-Ups ---", 14, currentY);

    doc.save(`OpticLog_Report_${user.id.substring(0, 5)}.pdf`);
}

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
    } else {
        closeLoginModal();
        checkUser();
    }
}

window.logout = async function() {
    await supabaseClient.auth.signOut();
    location.reload();
}

window.resetAccount = async function() {
    if (!confirm("🔴 WARNING: This will DELETE all your checkup records. This action CANNOT be undone!")) return;
    if (!confirm("Are you ABSOLUTELY sure? Type 'DELETE' to confirm... (Just kidding, click OK again to proceed)")) return;

    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return alert("Please login first!");

        const { error } = await supabaseClient
            .from('prescriptions')
            .delete()
            .eq('user_id', user.id);

        if (error) throw error;

        alert("✓ All records have been purged from the system.");
        checkUser();
    } catch (err) {
        alert("Error resetting account: " + err.message);
    }
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
        r_sph: parseFloat(document.getElementById('r-sph').value),
        r_cyl: parseFloat(document.getElementById('r-cyl').value),
        r_axis: parseInt(document.getElementById('r-axis').value),
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
        await checkUser();
    }
});

window.deletePrescription = async function(id) {
    if (!confirm("Are you sure?")) return;

    const { error } = await supabaseClient.from('prescriptions').delete().eq('id', id);
    if (error) {
        alert("Error Deleting!! " + error.message);
    } else {
        await checkUser();
    }
};
// Countdown Timer
function startCountdown(targetDate) {
    const timerDisplay = document.getElementById('countdown-timer');
    const countdownCard = document.querySelector('.countdown-card');

    if (countdownInterval) clearInterval(countdownInterval);

    function updateTimer(){
        const now = new Date().getTime();
        const distance = new Date(targetDate).getTime() - now;

        let statusText = '';
        let statusColor = '';
        let cardClass = 'status-normal';

        if (distance < 0) {
            const overdueMs = Math.abs(distance);
            const overdueDays = Math.floor(overdueMs / (1000 * 60 * 60 * 24));
            timerDisplay.innerHTML = `${String(overdueDays).padStart(3, '0')}:OVERDUE`;
            statusText = '⚠️ CHECKUP OVERDUE';
            statusColor = '#ff4b2b';
            cardClass = 'status-overdue';
        } else if (distance < 7 * 24 * 60 * 60 * 1000) {
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            const d = String(days).padStart(2, '0');
            const h = String(hours).padStart(2, '0');
            const m = String(minutes).padStart(2, '0');
            const s = String(seconds).padStart(2, '0');

            timerDisplay.innerHTML = `${d}:${h}:${m}:${s}`;
            statusText = '🟡 DUE SOON';
            statusColor = '#ffb700';
            cardClass = 'status-warning';
        } else {
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            const d = String(days).padStart(3, '0');
            const h = String(hours).padStart(2, '0');
            const m = String(minutes).padStart(2, '0');
            const s = String(seconds).padStart(2, '0');

            timerDisplay.innerHTML = `${d}:${h}:${m}:${s}`;
            statusText = '✓ CHECKUP SCHEDULED';
            statusColor = '#00ff41';
            cardClass = 'status-normal';
        }

        timerDisplay.style.color = statusColor;

        if (countdownCard) {
            countdownCard.className = `countdown-card ${cardClass}`;
            const statusDiv = countdownCard.querySelector('.countdown-status') || document.createElement('div');
            if (!countdownCard.querySelector('.countdown-status')) {
                statusDiv.className = 'countdown-status';
                countdownCard.insertBefore(statusDiv, countdownCard.querySelector('p'));
            }
            statusDiv.innerHTML = statusText;
            statusDiv.style.color = statusColor;
        }
    }

    updateTimer();
    countdownInterval = setInterval(updateTimer, 1000);
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
        return null;
    }

    const grid = document.getElementById('history-grid');
    if (!grid) return null;
    
    grid.innerHTML = '';

    if (data.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No records found in the archive.</p>';
        return data;
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
