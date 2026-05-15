import {config} from './config.js';
let countdownInterval;
let editingRecordId = null;
let debounceTimer = null;

const apiKey = import.meta.env.VITE_RESEND_API_KEY;
const supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseKey);

// Toast Notification System
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="toast-close">&times;</button>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// Debounce helper
function debounce(func, delay = 300) {
    return function(...args) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func(...args), delay);
    };
}

// Loading indicator
function showLoading(show = true) {
    let loader = document.getElementById('global-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.className = 'global-loader';
        loader.innerHTML = '<div class="loader-spinner"></div>';
        document.body.appendChild(loader);
    }
    loader.style.display = show ? 'flex' : 'none';
}

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
    if (!user) return showToast("Please login first!", 'error');

    const {data: prescriptions, error} = await supabaseClient.from('prescriptions').select('*').eq('user_id', user.id).order('date', { ascending: false });

    if (error || !prescriptions || prescriptions.length === 0) {
        showToast("No records found to export.", 'warning');
        return;
    }

    showLoading(true);
    try {
        const {jsPDF} = window.jspdf;
        const doc = new jsPDF();

        doc.setFont("courier", "bold");
        doc.setFontSize(22);
        doc.setTextColor(0, 255, 136);
        doc.text("Optic-Log: Check-Up History", 14, 20);

        doc.setFontSize(12);
        doc.setTextColor(100);

        const profileName = document.getElementById('user-name').value || user.email || 'User';
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
        showToast('✓ PDF generated successfully', 'success');
    } catch (err) {
        showToast('Error generating PDF: ' + err.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Login & Logout & Signup

window.signUp = async function() {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-password-confirm').value;

    if (password !== confirmPassword) {
        showToast('Passwords do not match!', 'error');
        return;
    }

    showLoading(true);
    try {
        const {data, error} = await supabaseClient.auth.signUp({email, password});

        if (error) throw error;
        showToast('✓ Check your email for verification!', 'success');
        closeSignupModal();
    } catch (err) {
        showToast('Signup error: ' + err.message, 'error');
    } finally {
        showLoading(false);
    }
}


window.login = async function () {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showToast('Please enter email and password', 'warning');
        return;
    }

    showLoading(true);
    try {
        const {data, error} = await supabaseClient.auth.signInWithPassword({ email, password});

        if (error) throw error;
        showToast('✓ Logged in successfully', 'success');
        closeLoginModal();
        checkUser();
    } catch (err) {
        showToast('Login error: ' + err.message, 'error');
    } finally {
        showLoading(false);
    }
}

window.logout = async function() {
    await supabaseClient.auth.signOut();
    location.reload();
}

window.resetAccount = async function() {
    if (!confirm("🔴 WARNING: This will DELETE all your checkup records. This action CANNOT be undone!")) return;
    if (!confirm("Are you ABSOLUTELY sure? Click OK again to proceed")) return;

    showLoading(true);
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return showToast("Please login first!", 'error');

        const { error } = await supabaseClient
            .from('prescriptions')
            .delete()
            .eq('user_id', user.id);

        if (error) throw error;

        showToast("✓ All records have been purged from the system.", 'success');
        await checkUser();
    } catch (err) {
        showToast("Error resetting account: " + err.message, 'error');
    } finally {
        showLoading(false);
    }
}
// Adding Data

window.openRecordModal = function(recordId = null) {
    editingRecordId = recordId;
    if (recordId) {
        document.querySelector('.modal-content h2').textContent = '✏️ Edit Check-Up Log';
        document.querySelector('.modal-btn').textContent = '✓ UPDATE_RECORD';
    } else {
        document.querySelector('.modal-content h2').textContent = '📋 Create New Check-Up Log';
        document.querySelector('.modal-btn').textContent = '✓ COMMIT_TO_DATABASE';
        document.getElementById('full-record-form').reset();
    }
    document.getElementById('record-modal').style.display = 'flex';
};

window.closeRecordModal = function() {
    editingRecordId = null;
    document.getElementById('record-modal').style.display = 'none';
    document.getElementById('full-record-form').reset();
};

document.getElementById('full-record-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading(true);

    try {
        const { data: { user } } = await supabaseClient.auth.getUser();

        const recordData = {
            user_id: user.id,
            date: document.getElementById('record-date').value,
            r_sph: parseFloat(document.getElementById('r-sph').value),
            r_cyl: parseFloat(document.getElementById('r-cyl').value),
            r_axis: parseInt(document.getElementById('r-axis').value),
            l_sph: parseFloat(document.getElementById('l-sph').value),
            l_cyl: parseFloat(document.getElementById('l-cyl').value),
            l_axis: parseInt(document.getElementById('l-axis').value),
        };

        let error;
        if (editingRecordId) {
            ({ error } = await supabaseClient
                .from('prescriptions')
                .update(recordData)
                .eq('id', editingRecordId));
            if (!error) showToast('✓ Checkup updated successfully', 'success');
        } else {
            ({ error } = await supabaseClient
                .from('prescriptions')
                .insert([recordData]));
            if (!error) showToast('✓ Checkup saved successfully', 'success');
        }

        if (error) throw error;

        document.getElementById('full-record-form').reset();
        closeRecordModal();
        await checkUser();
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    } finally {
        showLoading(false);
    }
});

window.deletePrescription = debounce(async function(id) {
    if (!confirm("Are you sure you want to delete this checkup record?")) return;

    showLoading(true);
    try {
        const { error } = await supabaseClient.from('prescriptions').delete().eq('id', id);
        if (error) throw error;
        showToast('✓ Record deleted successfully', 'success');
        await checkUser();
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    } finally {
        showLoading(false);
    }
}, 500);

window.editPrescription = async function(id) {
    try {
        const { data: record, error } = await supabaseClient
            .from('prescriptions')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        document.getElementById('record-date').value = record.date;
        document.getElementById('r-sph').value = record.r_sph;
        document.getElementById('r-cyl').value = record.r_cyl;
        document.getElementById('r-axis').value = record.r_axis;
        document.getElementById('l-sph').value = record.l_sph;
        document.getElementById('l-cyl').value = record.l_cyl;
        document.getElementById('l-axis').value = record.l_axis;

        window.openRecordModal(id);
    } catch (err) {
        showToast('Error loading record: ' + err.message, 'error');
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
                // Add listeners to save profile data
                document.getElementById('user-name')?.addEventListener('blur', () => saveProfileData(user.id));
                document.getElementById('user-age')?.addEventListener('blur', () => saveProfileData(user.id));
                document.getElementById('user-sex')?.addEventListener('change', () => saveProfileData(user.id));
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

// Filter prescriptions
window.filterPrescriptions = async function() {
    const startDate = document.getElementById('filter-start-date')?.value;
    const endDate = document.getElementById('filter-end-date')?.value;
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!startDate || !endDate) {
        showToast('Please select both start and end dates', 'warning');
        return;
    }

    showLoading(true);
    try {
        let query = supabaseClient
            .from('prescriptions')
            .select('*')
            .eq('user_id', user.id);

        if (startDate) query = query.gte('date', startDate);
        if (endDate) query = query.lte('date', endDate);

        const { data, error } = await query.order('date', { ascending: false });
        if (error) throw error;

        displayPrescriptions(data);
    } catch (err) {
        showToast('Error filtering: ' + err.message, 'error');
    } finally {
        showLoading(false);
    }
};

// Clear filter
window.clearFilter = async function() {
    document.getElementById('filter-start-date').value = '';
    document.getElementById('filter-end-date').value = '';
    const { data: { user } } = await supabaseClient.auth.getUser();
    await loadPrescriptionHistory(user.id);
    showToast('Filter cleared', 'info');
};

// Calculate vision analysis
function calculateVisionAnalysis(data) {
    if (data.length < 2) return null;

    const latest = data[0];
    const oldest = data[data.length - 1];

    const rSphChange = latest.r_sph - oldest.r_sph;
    const lSphChange = latest.l_sph - oldest.l_sph;
    const avgChange = (rSphChange + lSphChange) / 2;

    return {
        rightEyeTrend: rSphChange > 0.5 ? 'worsening' : rSphChange < -0.5 ? 'improving' : 'stable',
        leftEyeTrend: lSphChange > 0.5 ? 'worsening' : lSphChange < -0.5 ? 'improving' : 'stable',
        rightChange: rSphChange.toFixed(2),
        leftChange: lSphChange.toFixed(2),
        avgChange: avgChange.toFixed(2),
        records: data.length,
        dateRange: `${oldest.date} to ${latest.date}`
    };
}

// Display analysis
function showVisionAnalysis(data) {
    const analysis = calculateVisionAnalysis(data);
    if (!analysis) {
        document.getElementById('analysis-section').innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Need at least 2 records for analysis</p>';
        return;
    }

    const trendEmoji = {
        worsening: '📉',
        improving: '📈',
        stable: '➡️'
    };

    document.getElementById('analysis-section').innerHTML = `
        <div class="analysis-card">
            <h3>📊 Vision Analysis</h3>
            <div class="analysis-grid">
                <div class="analysis-item">
                    <span class="analysis-label">Right Eye (OD)</span>
                    <span class="analysis-value">${trendEmoji[analysis.rightEyeTrend]} ${analysis.rightEyeTrend.toUpperCase()}</span>
                    <small>${analysis.rightChange > 0 ? '+' : ''}${analysis.rightChange} SPH</small>
                </div>
                <div class="analysis-item">
                    <span class="analysis-label">Left Eye (OS)</span>
                    <span class="analysis-value">${trendEmoji[analysis.leftEyeTrend]} ${analysis.leftEyeTrend.toUpperCase()}</span>
                    <small>${analysis.leftChange > 0 ? '+' : ''}${analysis.leftChange} SPH</small>
                </div>
                <div class="analysis-item">
                    <span class="analysis-label">Records Tracked</span>
                    <span class="analysis-value">${analysis.records}</span>
                    <small>${analysis.dateRange}</small>
                </div>
            </div>
        </div>
    `;
}

// Display prescriptions
function displayPrescriptions(data) {
    const grid = document.getElementById('history-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (data.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No records found.</p>';
        showVisionAnalysis([]);
        return;
    }

    showVisionAnalysis(data);

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
                <div class="card-actions">
                    <button class="action-btn edit-btn" onclick="editPrescription('${entry.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn print-btn" onclick="printPrescription('${entry.id}')">
                        <i class="fas fa-print"></i> Print
                    </button>
                    <button class="action-btn delete-btn" onclick="deletePrescription('${entry.id}')">
                        <i class="fas fa-trash-alt"></i> Delete
                    </button>
                </div>
            </div>
        `;
        grid.insertAdjacentHTML('beforeend', card);
    });
}
// Profile Functions
async function saveProfileData(userId) {
    const name = document.getElementById('user-name').value;
    const age = document.getElementById('user-age').value;
    const sex = document.getElementById('user-sex').value;

    try {
        const { error } = await supabaseClient
            .from('user_profiles')
            .upsert({ user_id: userId, name, age, sex }, { onConflict: 'user_id' });

        if (error) throw error;
        showToast('✓ Profile saved successfully', 'success');
    } catch (err) {
        showToast('Error saving profile: ' + err.message, 'error');
    }
}

async function loadProfileData(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (data) {
            document.getElementById('user-name').value = data.name || '';
            document.getElementById('user-age').value = data.age || '';
            document.getElementById('user-sex').value = data.sex || '';
        }
    } catch (err) {
        console.log('No profile data found, using defaults');
    }
}

// Load prescription history
async function loadPrescriptionHistory(userId) {
    showLoading(true);
    try {
        const { data, error } = await supabaseClient
            .from('prescriptions')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });

        if (error) throw error;
        displayPrescriptions(data);
        return data;
    } catch (err) {
        showToast('Error loading records: ' + err.message, 'error');
        return null;
    } finally {
        showLoading(false);
    }
}

// Print prescription
window.printPrescription = function(recordId) {
    const cards = document.querySelectorAll('.folder-card');
    let cardData = null;

    for (let card of cards) {
        const deleteBtn = card.querySelector('.delete-btn');
        if (deleteBtn && deleteBtn.onclick.toString().includes(recordId)) {
            const date = card.querySelector('.folder-date')?.textContent.replace('DATE: ', '') || 'Unknown';
            const eyeData = card.querySelectorAll('.eye-data');

            if (eyeData.length >= 2) {
                const rightEyeText = eyeData[0].innerText;
                const leftEyeText = eyeData[1].innerText;

                cardData = { date, rightEyeText, leftEyeText };
            }
            break;
        }
    }

    if (!cardData) return showToast('Record not found', 'error');

    const printWindow = window.open('', '', 'width=800,height=600');
    const profileName = document.getElementById('user-name').value || 'User';
    const profileAge = document.getElementById('user-age').value || 'N/A';
    const profileSex = document.getElementById('user-sex').value || 'N/A';

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>OpticLog - Prescription</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Courier New', monospace; background: #0a0a0a; color: #fff; padding: 40px 20px; }
                .container { max-width: 700px; margin: 0 auto; border: 2px solid #00ff41; padding: 30px; background: #1a1a1a; }
                h1 { color: #00ff41; text-shadow: 0 0 10px #00ff41; font-size: 1.8rem; margin-bottom: 20px; }
                .header-info { background: rgba(0,255,65,0.1); padding: 15px; border-left: 3px solid #00ff41; margin-bottom: 20px; }
                .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
                .info-label { color: #999; font-weight: bold; }
                .info-value { color: #00ff41; }
                .eye-section { background: rgba(0,255,65,0.1); padding: 15px; margin: 15px 0; border-left: 3px solid #00ff41; }
                .eye-section h3 { color: #00ff41; margin-bottom: 10px; }
                .eye-data { white-space: pre-line; line-height: 1.8; }
                .footer { text-align: center; margin-top: 30px; color: #999; font-size: 0.85rem; border-top: 1px dashed rgba(0,255,65,0.3); padding-top: 15px; }
                @media print {
                    body { padding: 0; background: white; }
                    .container { border: 1px solid #000; background: white; color: #000; }
                    h1, .info-label, .eye-section h3 { color: #000; }
                    .info-value, .eye-section { color: #000; background: #f5f5f5; border-left-color: #000; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📋 OpticLog - Prescription Report</h1>

                <div class="header-info">
                    <div class="info-row">
                        <span class="info-label">Name:</span>
                        <span class="info-value">${profileName}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Age:</span>
                        <span class="info-value">${profileAge}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Sex:</span>
                        <span class="info-value">${profileSex}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Exam Date:</span>
                        <span class="info-value">${cardData.date}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Generated:</span>
                        <span class="info-value">${new Date().toLocaleDateString()}</span>
                    </div>
                </div>

                <div class="eye-section">
                    <h3>RIGHT EYE (OD)</h3>
                    <div class="eye-data">${cardData.rightEyeText}</div>
                </div>

                <div class="eye-section">
                    <h3>LEFT EYE (OS)</h3>
                    <div class="eye-data">${cardData.leftEyeText}</div>
                </div>

                <div class="footer">
                    This is a personal copy of your eye prescription. For official medical use, consult your optometrist.
                </div>
            </div>
            <script>
                setTimeout(() => { window.print(); }, 100);
                window.onafterprint = () => window.close();
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
};
