function setupEventListeners() {
    const menuItems = document.getElementById('menu-items');
    if (menuItems) {
        console.log(menuItems)
        menuItems.addEventListener('click', handleMenuClick);
    }

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

function handleMenuClick(event) {
    event.preventDefault();
    const action = event.target.getAttribute('data-action');
    if (action === 'signin') {
        toggleModal('signin-modal');
    }
}

function handleCloseButtonClick(event) {
    const modal = event.currentTarget.closest('.modal');
    if (modal) {
        toggleModal(modal.id);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal && modal.classList.contains('show')) {
        toggleModal(modalId); 
    }
}

function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.toggle('show');
    modal.style.display = modal.classList.contains('show') ? 'block' : 'none';
}

function switchModals(currentModalId, newModalId) {
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

function updateNavLink(action) {
    const link = document.querySelector(`a[data-action="${action === 'signout' ? 'signin' : 'signout'}"]`);
    if (link) {
        link.textContent = action === 'signout' ? '登出系统' : '登入/註冊';
        link.setAttribute('data-action', action);
        link.removeEventListener('click', action === 'signout' ? handleSigninClick : handleSignoutClick);
        link.addEventListener('click', action === 'signout' ? handleSignoutClick : handleSigninClick);
    }
}


function handleSignoutClick(event) {
    event.preventDefault();
    localStorage.removeItem('token');
    updateNavLink('signin');  
    window.location.reload(); 
}

function handleSigninClick(event) {
    event.preventDefault();
    toggleModal('signin-modal');
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
}

async function signup() {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    // const signupButton = document.getElementById('signup-button');
    // let messageContainer = document.getElementById('signup-message-container');
    const signupModal = document.getElementById('signup-modal');

    // if (!messageContainer) {
    //     messageContainer = document.createElement('div');
    //     messageContainer.id = 'signup-message-container'; 
    //     signupButton.insertAdjacentElement('afterend', messageContainer);
    // }

    console.log(messageContainer)

    messageContainer.textContent = '';

    console.log(messageContainer.textContent)

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
    // const signinButton = document.getElementById('signin-button');
    // let messageContainer = document.getElementById('signin-message-container');
    const signinModal = document.getElementById('signin-modal');

    // if (!messageContainer) {
    //     messageContainer = document.createElement('div');
    //     messageContainer.id = 'signin-message-container'; 
    //     signinButton.insertAdjacentElement('afterend', messageContainer);
    // }

    // messageContainer.textContent = '';

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
        updateNavLink('signout'); 
        closeModal('signin-modal')
    } catch (error) {
        console.error('Fetch error:', error);

        showMessage('signin-message-container', error.message || 'Error during sign in', 'error-message');
        signinModal.style.height = '300px';
    }
}

function signout() {
    localStorage.removeItem('token');
}

document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
});