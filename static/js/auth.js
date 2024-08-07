let userData

function isTokenExpired(token) {
    const payloadBase64 = token.split('.')[1];
    const decodedJson = atob(payloadBase64);
    const decoded = JSON.parse(decodedJson);
    const exp = decoded.exp;
    const currentUnixTime = Math.round(Date.now() / 1000);
    return exp < currentUnixTime;
}

function checkTokenExpiredAndShowModal() {
    if (localStorage.getItem('expiredSession') === 'true') {
        toggleModal('expired-modal'); 
        localStorage.removeItem('expiredSession'); 
    }
}

async function fetchUserStatus() {
    const token = localStorage.getItem('token');
    const currentPage = window.location.pathname;
    if (!token) {
        renderSignIn();
        if (currentPage === '/booking'|| currentPage.startsWith('/thankyou')) {
            window.location.href = '/';
        }
        return;
    }
    if (isTokenExpired(token)) {
        localStorage.removeItem('token')
        localStorage.setItem('expiredSession', 'true'); 
        window.location.href = '/'  
        return;
    }

    try {
        const response = await fetch('/api/user/auth', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            userData = await response.json();
            if (userData) {
                renderSignOut();
            } else {
                renderSignIn();
            }
        } else {
            switch (response.status) {
                case 401:
                    localStorage.removeItem('token') 
                    window.location.href = '/'    
                default:
                    renderSignIn();
                    break;
               }
        }
    }catch (error) {
        console.error('Fetch error:', error);
        renderSignIn();
    
    }
}

function renderSignIn() {
    const signinLink = document.getElementById('signin-link');
    const signoutLink = document.getElementById('signout-link');
    signinLink.style.display = 'block';
    signoutLink.style.display = 'none';
    signinLink.textContent = '登入/註冊';
}

function renderSignOut() {
    const signinLink = document.getElementById('signin-link');
    const signoutLink = document.getElementById('signout-link');
    signinLink.style.display = 'none';
    signoutLink.style.display = 'block';
    signoutLink.textContent = '登出系統';
}

function setupEventListeners() {
    const signinLink = document.getElementById('signin-link');
    const signoutLink = document.getElementById('signout-link');
    const bookLink = document.getElementById('book-link');

    if (signinLink) {
        signinLink.addEventListener('click', () => toggleModal('signin-modal'));
    }

    if (signoutLink) {
        signoutLink.addEventListener('click', signout); 
    }  

    bookLink.addEventListener('click', handleBookingClick)

    document.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', handleCloseButtonClick);
    });

    const switchToSignup = document.getElementById('switch-to-signup');
    const switchToSignin = document.getElementById('switch-to-signin');
    if (switchToSignup && switchToSignin) {
        switchToSignup.addEventListener('click', () => switchModals('signin-modal', 'signup-modal'));
        switchToSignin.addEventListener('click', () => switchModals('signup-modal', 'signin-modal'));
    }

    addButtonEventListener('signup-button', signup);
    addButtonEventListener('signin-button', signin);
}

function handleBookingClick(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    
    if (!token || isTokenExpired(token)) {
        toggleModal('signin-modal'); 
        return;
    }
    window.location.href = '/booking';
}

function handleCloseButtonClick(event) {
    const modal = event.currentTarget.closest('.modal');
    const signinModal = document.getElementById('signin-modal');
    const signupModal = document.getElementById('signup-modal');
    if (modal) {
        toggleModal(modal.id);

        const inputs = modal.querySelectorAll('input');
        inputs.forEach(input => {
            if (input.type !== 'button') {
                input.value = '';
            }
        });

        const modalPrefix = modal.id.split('-')[0]; 
        if(modalPrefix === 'signin'){
            clearMessage(modalPrefix + '-message-container');
            signinModal.style.height = '275px';
        }

        if(modalPrefix === 'signup'){
            clearMessage(modalPrefix + '-message-container');
            signupModal.style.height = '332px';
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal && modal.classList.contains('show')) {
        toggleModal(modalId); 

        const inputs = modal.querySelectorAll('input');
        inputs.forEach(input => {
            if (input.type !== 'button') {
                input.value = '';
            }
        });
    }
}

function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    if (modal.classList.contains('show')) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        backdrop.style.display = 'none'; 
    } else {
        modal.classList.add('show');
        modal.style.display = 'block';
        backdrop.style.display = 'block'; 
    }
}

function switchModals(currentModalId, newModalId) {
    const currentModal = document.getElementById(currentModalId);
    const signinModal = document.getElementById('signin-modal');
    const signupModal = document.getElementById('signup-modal');

    if (currentModal) {
        const inputs = currentModal.querySelectorAll('input');
        inputs.forEach(input => {
            input.value = '';  
        });

        const modalPrefix = currentModalId.split('-')[0]; 
        if(modalPrefix === 'signin'){
            clearMessage(modalPrefix + '-message-container');
            signinModal.style.height = '275px';
        }
        if(modalPrefix === 'signup'){
            clearMessage(modalPrefix + '-message-container');
            signupModal.style.height = '332px';
        }
        
    }

    toggleModal(currentModalId); 
    toggleModal(newModalId); 
}

function addButtonEventListener(buttonId, actionFunction) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.addEventListener('click', actionFunction);
    } else {
        console.warn(`Button with ID '${buttonId}' does not exist.`);
    }
}

function validateEmail(email) {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
}

function clearMessage(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.textContent = ''; 
        container.className = 'message'; 
        container.style.display = 'none';
    }
}

function showMessage(containerId, message, className) {
    clearMessage(containerId); 

    let container = document.getElementById(containerId);
    const button = document.getElementById(containerId.replace('message-container', 'button')); 

    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        if (button) {
            button.insertAdjacentElement('afterend', container);
        }
    }

    container.textContent = message;
    container.className = `message ${className}`; 
    container.style.display = 'block';
}

async function signup() {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    const signupModal = document.getElementById('signup-modal');

    if (!name || !email || !password) {
        showMessage('signup-message-container', '所有欄位都是必填', 'error-message');
        signupModal.style.height = '357px';
        return;
    }

    if (!validateEmail(email)) {
        showMessage('signup-message-container', 'Email 格式不正確', 'error-message');
        signupModal.style.height = '357px';
        return;
    }
    const userData = {
        name: name,
        email: email,
        password: password
    };

    try {
        const response = await fetch('/api/user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'  
            },
            body: JSON.stringify(userData)  
        });

        const responseData = await response.json();

        if (!response.ok || !responseData.ok) {
            const errorMessage = responseData.message || `HTTP error! status: ${response.status}`;
            throw new Error(errorMessage);
        }
        showMessage('signup-message-container', '註冊成功，請登入系統', 'success-message');
        signupModal.style.height = '357px';
    } catch (error) {
        console.error('Fetch error:', error);

        showMessage('signup-message-container', error.message || 'Error during sign up', 'error-message');
        signupModal.style.height = '357px';
    }
}


async function signin() {
    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value.trim();
    const signinModal = document.getElementById('signin-modal');

    if (!email || !password) {
        showMessage('signin-message-container', '所有欄位都是必填', 'error-message');
        signinModal.style.height = '300px';
        return;
    }

    if (!validateEmail(email)) {
        showMessage('signin-message-container', 'Email 格式不正確', 'error-message');
        signinModal.style.height = '300px';
        return;
    }

    const signinData = {
        email: email,
        password: password
    };

    try {
        const response = await fetch('/api/user/auth', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'  
            },
            body: JSON.stringify(signinData)  
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessage = responseData.message || `HTTP error! status: ${response.status}`;
            throw new Error(errorMessage);
        }

        localStorage.setItem('token', responseData.token);
        renderSignOut();
        closeModal('signin-modal')
    } catch (error) {
        console.error('Fetch error:', error);

        showMessage('signin-message-container', error.message || 'Error during sign in', 'error-message');
        signinModal.style.height = '300px';
    }
}

function signout() {
    localStorage.removeItem('token')
    renderSignIn();
}

async function auth() {
    setupEventListeners();
    checkTokenExpiredAndShowModal();
    await fetchUserStatus();
}

window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        fetchUserStatus();  
    }
});


