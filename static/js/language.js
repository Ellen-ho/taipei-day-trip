let currentLanguage = localStorage.getItem('preferredLanguage') || 'zh';
let currentKeyword = '';

async function initLanguageToggle() {
  const langToggle = document.getElementById('language-toggle');
  const elementsToTranslate = document.querySelectorAll('[data-key]');
  const searchInput = document.getElementById('search-input');

  if (!langToggle) {
    console.error('Language toggle element not found');
    return;
  }

  function setPlaceholder(inputId, translationKey, translations) {
    const inputElement = document.getElementById(inputId);
    if (inputElement && translations[translationKey]) {
      inputElement.setAttribute('placeholder', translations[translationKey]);
    }
  }

  function loadLanguage(lang) {
    fetch('/static/languages.json')
      .then((response) => response.json())
      .then((data) => {
        const translations = data[lang];

        elementsToTranslate.forEach((el) => {
          const key = el.getAttribute('data-key');
          if (translations[key]) {
            el.textContent = translations[key];
          }
        });

        if (searchInput) {
          searchInput.setAttribute(
            'placeholder',
            translations['search_placeholder'],
          );
          searchInput.value = '';
          currentKeyword = '';
        }

        setPlaceholder('signup-name', 'signup_name_placeholder', translations);
        setPlaceholder(
          'signup-email',
          'signup_email_placeholder',
          translations,
        );
        setPlaceholder(
          'signup-password',
          'signup_password_placeholder',
          translations,
        );
        setPlaceholder(
          'signin-email',
          'signin_email_placeholder',
          translations,
        );
        setPlaceholder(
          'signin-password',
          'signin_password_placeholder',
          translations,
        );
      });
  }

  loadLanguage(currentLanguage);

  const selectedLangElement = document.querySelector(
    `#language-toggle a#toggle-${currentLanguage}`,
  );

  if (selectedLangElement) {
    document
      .querySelectorAll('#language-toggle a')
      .forEach((el) => el.classList.remove('selected'));
    selectedLangElement.classList.add('selected');
  }

  langToggle.addEventListener('click', (event) => {
    event.preventDefault();
    const clickedLang = event.target.id === 'toggle-ch' ? 'zh' : 'en';

    if (clickedLang !== currentLanguage) {
      currentLanguage = clickedLang;

      localStorage.setItem('preferredLanguage', currentLanguage);

      loadLanguage(currentLanguage);

      document
        .querySelectorAll('#language-toggle a')
        .forEach((el) => el.classList.remove('selected'));
      event.target.classList.add('selected');

      if (searchInput) {
        searchInput.value = '';
        currentKeyword = '';
      }

      fetchMRTData();

      nextPage = 0;
      fetchAttractions('');
    }
  });
}
