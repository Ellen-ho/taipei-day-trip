async function loadLanguageOnPageLoad() {
  const elementsToTranslate = document.querySelectorAll('[data-key]');
  let currentLanguage = localStorage.getItem('preferredLanguage') || 'zh';

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
      });
  }

  loadLanguage(currentLanguage);
}
