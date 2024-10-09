let userData;

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
    if (currentPage === '/booking' || currentPage.startsWith('/thankyou')) {
      window.location.href = '/';
    }
    return;
  }
  if (isTokenExpired(token)) {
    localStorage.removeItem('token');
    localStorage.setItem('expiredSession', 'true');
    window.location.href = '/';
    return;
  }

  try {
    const response = await fetch('/api/user/auth', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
          localStorage.removeItem('token');
          window.location.href = '/';
        default:
          renderSignIn();
          break;
      }
    }
  } catch (error) {
    console.error('Fetch error:', error);
    renderSignIn();
  }
}

function getPageTranslations(language) {
  const translations = {
    zh: {
      signin_link: '登入/註冊',
      signout_link: '登出系統',
      signin_modal_title: '登入會員帳號',
      signup_modal_title: '註冊會員帳號',
      required_fields: '所有欄位都是必填',
      invalid_email: 'Email 格式不正確',
      signup_success: '註冊成功，請登入系統',
      signup_error: '註冊過程中發生錯誤',
      signin_error: '電子郵件或密碼錯誤',
      signin_required: '所有欄位都是必填',
      email_registered: 'Email 已經註冊帳戶',
    },
    en: {
      signin_link: 'Sign In/Sign Up',
      signout_link: 'Sign Out',
      signin_modal_title: 'Sign In Your Account',
      signup_modal_title: 'Register a New Account',
      required_fields: 'All fields are required',
      invalid_email: 'Invalid email format',
      signup_success: 'Registration successful, please log in',
      signup_error: 'Registration failed',
      signin_error: 'Incorrect email or password',
      email_registered: 'This email is already registered',
      signin_required: 'All fields are required',
    },
  };

  return translations[language];
}

function renderSignIn() {
  const language = localStorage.getItem('preferredLanguage') || 'zh';
  const translations = getPageTranslations(language);
  const signinLink = document.getElementById('signin-link');
  const signoutLink = document.getElementById('signout-link');
  const signinLinkMobile = document.getElementById('signin-link-mobile');
  const signoutLinkMobile = document.getElementById('signout-link-mobile');

  signinLink.style.display = 'block';
  signoutLink.style.display = 'none';
  signinLink.textContent = translations.signin_link;

  signinLinkMobile.style.display = 'block';
  signoutLinkMobile.style.display = 'none';
  signinLinkMobile.textContent = translations.signin_link;
}

function renderSignOut() {
  const language = localStorage.getItem('preferredLanguage') || 'zh';
  const translations = getPageTranslations(language);
  const signinLink = document.getElementById('signin-link');
  const signoutLink = document.getElementById('signout-link');
  const signinLinkMobile = document.getElementById('signin-link-mobile');
  const signoutLinkMobile = document.getElementById('signout-link-mobile');

  signinLink.style.display = 'none';
  signoutLink.style.display = 'block';
  signoutLink.textContent = translations.signout_link;

  signinLinkMobile.style.display = 'none';
  signoutLinkMobile.style.display = 'block';
  signoutLinkMobile.textContent = translations.signout_link;
}

function setupEventListeners() {
  const signinLink = document.getElementById('signin-link');
  const signoutLink = document.getElementById('signout-link');
  const bookLink = document.getElementById('book-link');
  const searchLink = document.getElementById('search-link');

  const bookLinkMobile = document.getElementById('book-link-mobile');
  const searchLinkMobile = document.getElementById('search-link-mobile');
  const signinLinkMobile = document.getElementById('signin-link-mobile');
  const signoutLinkMobile = document.getElementById('signout-link-mobile');

  const hamburgerMenu = document.getElementById('hamburger-menu');
  const menuDropdown = document.getElementById('menu-dropdown');
  const menuItems = document.getElementById('menu-items');

  if (hamburgerMenu) {
    hamburgerMenu.addEventListener('click', function () {
      menuDropdown.style.display =
        menuDropdown.style.display === 'block' ? 'none' : 'block';
    });
  }

  window.addEventListener('resize', function () {
    if (window.innerWidth > 600) {
      menuDropdown.style.display = 'none';
      hamburgerMenu.style.display = 'none';
      menuItems.style.display = 'flex';
    } else {
      hamburgerMenu.style.display = 'block';
      menuItems.style.display = 'none';
    }
  });

  if (signinLink) {
    signinLink.addEventListener('click', () => toggleModal('signin-modal'));
  }

  if (signoutLink) {
    signoutLink.addEventListener('click', signout);
  }

  bookLink.addEventListener('click', handleBookingClick);
  searchLink.addEventListener('click', handleSearchClick);

  if (signinLinkMobile) {
    signinLinkMobile.addEventListener('click', () =>
      toggleModal('signin-modal'),
    );
  }

  if (signoutLinkMobile) {
    signoutLinkMobile.addEventListener('click', signout);
  }

  bookLinkMobile.addEventListener('click', handleBookingClick);
  searchLinkMobile.addEventListener('click', handleSearchClick);

  document.querySelectorAll('.close-button').forEach((button) => {
    button.addEventListener('click', handleCloseButtonClick);
  });

  const switchToSignup = document.getElementById('switch-to-signup');
  const switchToSignin = document.getElementById('switch-to-signin');
  if (switchToSignup && switchToSignin) {
    switchToSignup.addEventListener('click', () =>
      switchModals('signin-modal', 'signup-modal'),
    );
    switchToSignin.addEventListener('click', () =>
      switchModals('signup-modal', 'signin-modal'),
    );
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

function handleSearchClick(event) {
  event.preventDefault();
  const token = localStorage.getItem('token');

  if (!token || isTokenExpired(token)) {
    toggleModal('signin-modal');
    return;
  }
  window.location.href = '/search';
}

function handleCloseButtonClick(event) {
  const modal = event.currentTarget.closest('.modal');
  const signinModal = document.getElementById('signin-modal');
  const signupModal = document.getElementById('signup-modal');
  if (modal) {
    toggleModal(modal.id);

    const inputs = modal.querySelectorAll('input');
    inputs.forEach((input) => {
      if (input.type !== 'button') {
        input.value = '';
      }
    });

    const modalPrefix = modal.id.split('-')[0];
    if (modalPrefix === 'signin') {
      clearMessage(modalPrefix + '-message-container');
      signinModal.style.height = '275px';
    }

    if (modalPrefix === 'signup') {
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
    inputs.forEach((input) => {
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
    inputs.forEach((input) => {
      input.value = '';
    });

    const modalPrefix = currentModalId.split('-')[0];
    if (modalPrefix === 'signin') {
      clearMessage(modalPrefix + '-message-container');
      signinModal.style.height = '275px';
    }
    if (modalPrefix === 'signup') {
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
  const button = document.getElementById(
    containerId.replace('message-container', 'button'),
  );

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
  console.log(container.style.display);
}

async function signup() {
  const language = localStorage.getItem('preferredLanguage') || 'zh';
  const translations = getPageTranslations(language);
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value.trim();
  const signupModal = document.getElementById('signup-modal');

  console.log('Translations:', translations);
  console.log('Selected language:', language);

  if (!name || !email || !password) {
    showMessage(
      'signup-message-container',
      translations.required_fields,
      'error-message',
    );
    signupModal.style.height = '357px';
    return;
  }

  if (!validateEmail(email)) {
    showMessage(
      'signup-message-container',
      translations.invalid_email,
      'error-message',
    );
    signupModal.style.height = '357px';
    return;
  }
  const userData = {
    name: name,
    email: email,
    password: password,
  };

  try {
    const response = await fetch('/api/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const responseData = await response.json();

    if (!response.ok || !responseData.ok) {
      const errorMessage =
        responseData.message || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    showMessage(
      'signup-message-container',
      translations.signup_success,
      'success-message',
    );
    signupModal.style.height = '357px';
  } catch (error) {
    console.log('Error message:', error.message);

    let errorMessage = error.message;

    if (language === 'en') {
      if (error.message === 'Email 已經註冊帳戶') {
        console.log('Email 已經註冊帳戶: ', translations.email_registered);
        errorMessage = translations.email_registered;
      } else if (error.message === '註冊失敗') {
        errorMessage = translations.signup_error;
      } else {
        errorMessage = translations.signup_error || 'Error during sign up';
      }
    }

    showMessage('signup-message-container', errorMessage, 'error-message');
    signupModal.style.height = '357px';
  }
}

async function signin() {
  const language = localStorage.getItem('preferredLanguage') || 'zh';
  const translations = getPageTranslations(language);
  const email = document.getElementById('signin-email').value.trim();
  const password = document.getElementById('signin-password').value.trim();
  const signinModal = document.getElementById('signin-modal');

  if (!email || !password) {
    console.log(translations.required_fields);
    showMessage(
      'signin-message-container',
      translations.required_fields,
      'error-message',
    );
    signinModal.style.height = '300px';
    return;
  }

  if (!validateEmail(email)) {
    showMessage(
      'signin-message-container',
      translations.invalid_email,
      'error-message',
    );
    signinModal.style.height = '300px';
    return;
  }

  const signinData = {
    email: email,
    password: password,
  };

  try {
    const response = await fetch('/api/user/auth', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signinData),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorMessage =
        responseData.message || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    localStorage.setItem('token', responseData.token);
    renderSignOut();
    closeModal('signin-modal');
  } catch (error) {
    const errorMessage =
      language === 'zh'
        ? error.message
        : translations.signin_error || 'Error during sign in';

    showMessage('signin-message-container', errorMessage, 'error-message');
    signinModal.style.height = '300px';
  }
}

function signout() {
  localStorage.removeItem('token');
  renderSignIn();
}

async function auth() {
  setupEventListeners();
  checkTokenExpiredAndShowModal();
  await fetchUserStatus();
}

window.addEventListener('pageshow', function (event) {
  if (event.persisted) {
    fetchUserStatus();
  }
});
