let nextPage = 0;
let isLoading = false;

async function fetchAttractions(keyword = '') {
  isLoading = true;

  try {
    const preferredLanguage = localStorage.getItem('preferredLanguage') || 'zh';

    const apiPath =
      preferredLanguage === 'en' ? '/api/attractions_en' : '/api/attractions';

    const url = new URL(apiPath, window.location.origin);
    url.searchParams.append('page', nextPage);
    if (keyword) {
      url.searchParams.append('keyword', keyword);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    console.log(result);
    if (nextPage === 0) {
      document.getElementById('attraction-list').innerHTML = '';
    }
    displayAttractions(result.data);
    nextPage = result.nextPage;
    isLoading = false;
  } catch (error) {
    console.error('Fetch error:', error);
    isLoading = false;
  }
}

function displayAttractions(attractions) {
  const language = localStorage.getItem('preferredLanguage') || 'zh';
  const translations = {
    zh: {
      no_data_message: '找不到相符合資料!',
      no_data_link: '點擊 👉 到首頁繼續探索吧！',
    },
    en: {
      no_data_message: 'No matching data found!',
      no_data_link: 'Click 👉 to go back to the homepage and explore!',
    },
  };
  const attractionsList = document.getElementById('attraction-list');

  if (attractions.length === 0) {
    const noDataDiv = document.createElement('div');
    noDataDiv.className = 'no-data';

    const messageSpan = document.createElement('span');
    messageSpan.textContent = translations[language].no_data_message;
    noDataDiv.appendChild(messageSpan);

    const linkSpan = document.createElement('span');
    linkSpan.className = 'no-data-link';
    linkSpan.textContent = translations[language].no_data_link;
    linkSpan.onclick = () => {
      window.location.href = '/';
    };
    noDataDiv.appendChild(linkSpan);

    attractionsList.appendChild(noDataDiv);
  } else {
    attractions.forEach((attraction) => {
      const card = document.createElement('div');
      card.className = 'attraction-card';

      card.dataset.id = attraction.id;
      card.onclick = handleCardClick;

      const nameContainer = document.createElement('div');
      nameContainer.className = 'name-container';
      const attractionName = document.createElement('span');
      attractionName.textContent = attraction.name;
      nameContainer.appendChild(attractionName);

      const infoContainer = document.createElement('div');
      infoContainer.className = 'info-container';
      const attractionCategory = document.createElement('span');
      attractionCategory.textContent = attraction.category;
      const attractionMRT = document.createElement('span');
      attractionMRT.textContent = attraction.mrt;
      infoContainer.appendChild(attractionMRT);
      infoContainer.appendChild(attractionCategory);

      card.innerHTML = `<img src="${attraction.images[0]}" alt="${attraction.name}">`;
      card.appendChild(nameContainer);
      card.appendChild(infoContainer);

      attractionsList.appendChild(card);
    });
  }
}

function handleSearchInput(keyword) {
  currentKeyword = keyword;
  nextPage = 0;
  fetchAttractions(currentKeyword);
}

function addSearchInputListener() {
  const button = document.getElementById('search-button');
  const input = document.getElementById('search-input');

  button.addEventListener('click', function () {
    const keyword = input.value.trim();
    handleSearchInput(keyword);
  });
}

function setupInfiniteScroll() {
  function handleScroll() {
    const distanceToBottom =
      document.documentElement.scrollHeight -
      window.innerHeight -
      window.scrollY;
    const nearBottom = distanceToBottom < 250;

    if (nearBottom && !isLoading && nextPage !== null) {
      fetchAttractions(currentKeyword);
    }
  }

  window.addEventListener('scroll', handleScroll);
  fetchAttractions(currentKeyword);
}

async function fetchMRTData() {
  try {
    const response = await fetch('/api/mrts', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Accept-Language': currentLanguage,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    displayMRTs(result.data);
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

function handleCardClick() {
  const attractionId = this.dataset.id;
  window.location.href = `/attraction/${attractionId}`;
}

function displayMRTs(data) {
  const mrtItemsContainer = document.querySelector('.mrt-items');
  mrtItemsContainer.innerHTML = '';
  data.forEach((mrt) => {
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = mrt;
    link.className = 'mrt-link shadow-animation';
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const input = document.getElementById('search-input');
      input.value = mrt;
      handleSearchInput(mrt);
    });
    mrtItemsContainer.appendChild(link);
  });
}

function addLoadMrtsEventListener() {
  const mrtItemsContainer = document.querySelector('.mrt-items');
  const arrowLeft = document.querySelector('.arrow.left');
  const arrowRight = document.querySelector('.arrow.right');

  arrowLeft.addEventListener('click', () => {
    mrtItemsContainer.scrollBy({
      left: -mrtItemsContainer.offsetWidth * 0.8,
      behavior: 'smooth',
    });
  });

  arrowRight.addEventListener('click', () => {
    mrtItemsContainer.scrollBy({
      left: mrtItemsContainer.offsetWidth * 0.8,
      behavior: 'smooth',
    });
  });

  fetchMRTData();
}

document.addEventListener('DOMContentLoaded', async function () {
  await auth();
  await initLanguageToggle();
  setupInfiniteScroll();
  addLoadMrtsEventListener();
  addSearchInputListener();
});
