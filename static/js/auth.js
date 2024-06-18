function addModalEventListener() {
    // const overlay = document.createElement('div');
    // overlay.className = 'overlay';
    // document.body.appendChild(overlay);

    document.getElementById('menu-items').addEventListener('click', function(event) {
        event.preventDefault();
        const action = event.target.getAttribute('data-action');
        if (action === 'signin') {
            toggleModal('signin-modal');
        }
    });
        
    document.querySelectorAll('.close-button').forEach(function(button) {
        button.addEventListener('click', function() {
            const modal = button.closest('.modal');
            if (modal) {
                toggleModal(modal.id);
            }
        });
    });

    document.getElementById('switch-to-signup').addEventListener('click', function(event) {
        event.preventDefault();
        switchModals('signin-modal', 'signup-modal');
    });

    document.getElementById('switch-to-signin').addEventListener('click', function(event) {
        event.preventDefault();
        switchModals('signup-modal', 'signin-modal');
    });

    // overlay.addEventListener('click', function() {
    //     document.querySelectorAll('.modal.show').forEach(function(modal) {
    //         toggleModal(modal.id);
    //     });
    // });
}

function toggleModal(modalId) {
    const modal = document.getElementById(modalId);

    modal.classList.toggle('show');
    modal.style.display = modal.classList.contains('show') ? 'block' : 'none';
    // overlay.style.display = modal.classList.contains('show') ? 'block' : 'none';
    // console.log(overlay.style.display)
}

function switchModals(currentModalId, newModalId) {
    toggleModal(currentModalId); 
    toggleModal(newModalId); 
}

function addButtonEventListener(buttonId, actionFunction) {
    const button = document.getElementById(buttonId);
    if (button) {  
        button.addEventListener('click', function() {
            actionFunction();  
        });
    } else {
        console.warn(`Button with ID '${buttonId}' does not exist.`);
    }
}

async function signup() {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    const signupButton = document.getElementById('signup-button');
    let messageContainer = document.querySelector('.message');
    const signupModal = document.getElementById('signup-modal');

    if (!messageContainer) {
        messageContainer = document.createElement('div');
        signupButton.insertAdjacentElement('afterend', messageContainer);
    }

    messageContainer.textContent = '';

    if (!name || !email || !password) {
        messageContainer.textContent = '所有欄位都是必填';
        messageContainer.className = 'message error-message'; 
        signupModal.style.height = '357px';
        return;
    }

    if (!validateEmail(email)) {
        messageContainer.textContent = 'Email 格式不正確';
        messageContainer.className = 'message error-message';
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
        messageContainer.textContent = '註冊成功，請登入系統';
        messageContainer.className = 'message success-message';
    } catch (error) {
        console.error('Fetch error:', error);

        messageContainer.textContent = error.message || 'Error during sign up'; 
        messageContainer.className = 'message error-message'; 
        signupModal.style.height = '357px';
    }
}


async function signin() {
    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value.trim();
    const signinButton = document.getElementById('signin-button');
    let messageContainer = document.querySelector('.message');
    const signinModal = document.getElementById('signin-modal');

    if (!messageContainer) {
        messageContainer = document.createElement('div');
        signinButton.insertAdjacentElement('afterend', messageContainer);
    }

    messageContainer.textContent = '';

    if (!email || !password) {
        messageContainer.textContent = '所有欄位都是必填';
        messageContainer.className = 'message error-message'; 
        signinModal.style.height = '300px';
        return;
    }

    if (!validateEmail(email)) {
        messageContainer.textContent = 'Email 格式不正確';
        messageContainer.className = 'message error-message';
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
        console.log('Success:', responseData);
    } catch (error) {
        console.error('Fetch error:', error);

        messageContainer.textContent = error.message || 'Error during sign in'; 
        messageContainer.className = 'message error-message'; 
        signinModal.style.height = '300px';
    }
}

function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

document.addEventListener('DOMContentLoaded', function() {
    addModalEventListener(),
    addButtonEventListener('signup-button', signup),
    addButtonEventListener('signin-button', signin)
});

