const loginModal = document.getElementById('login-modal');
const signupModal = document.getElementById('signup-modal');
const profileMenu = document.getElementById('profile-menu');



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

window.swtichToSignup = function() {
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
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    const {data, error} = await supabase.auth.signUp({email, password});

    if (error) {
        alert(error.message);
    }
    else {
        alert("Check Your Email For Verification!!");
        closeSignupModal();
    }
}


window.login = async function () {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    const {data, error} = await supabase.auth.signInWithPassword({ email, password});

    if (error) {
        alert(error.message);
    }
    else{
        closeLoginModal();
        checkUser();
    }
}

window.logout = async function() {
    await supabase.auth.signOut;
    location.reload();
}

// Controling Landing Page

async function checkUser() {
    const {data: {user}} = await supabase.auth.getUser();

    if (user) {
        heroSection.style.display = 'none';
        dashboardArea.style.display = 'none';
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
    const {data, error} = await supabase.from('prescriptions').select('*').eq('user_id', userId).order('created_at', {ascending: false});
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

