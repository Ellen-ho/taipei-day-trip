let nextPage = 0;
let isLoading = false;
let currentKeyword = ""; 

async function fetchAttractions(keyword = "") {
    if (isLoading || nextPage === null) return;
    isLoading = true;

    try {
        const url = new URL('/api/attractions', window.location.origin);
        url.searchParams.append('page', nextPage);
        if (keyword) {
            url.searchParams.append('keyword', keyword);
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
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

function handleSearchInput(keyword) {
    currentKeyword = keyword; 
    nextPage = 0; 
    fetchAttractions(currentKeyword); 
}

function setupInfiniteScroll() {
    function handleScroll() {
       const distanceToBottom = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
       const nearBottom = distanceToBottom < 150;

        if (nearBottom && !isLoading && nextPage !== null) {
            fetchAttractions(currentKeyword);
        }
    }

    window.addEventListener('scroll', handleScroll);
    fetchAttractions(currentKeyword); 
}


function addLoadMrtsEventListener() {
    const mrtItemsContainer = document.querySelector('.mrt-items');
    const arrowLeft = document.querySelector('.arrow.left'); 
    const arrowRight = document.querySelector('.arrow.right'); 

    async function fetchMRTData() {
        try {
            const response = await fetch('/api/mrts', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
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

    function displayMRTs(data) {
        mrtItemsContainer.innerHTML = '';
        data.forEach((mrt) => {
            const link = document.createElement('a');
            link.href = "#";
            link.textContent = mrt;
            link.className = 'mrt-link';
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const input = document.getElementById('search-input');
                input.value = mrt;
                handleSearchInput(mrt);
            });
            mrtItemsContainer.appendChild(link);
        });
    }

    arrowLeft.addEventListener('click', () => {
        mrtItemsContainer.scrollBy({
            left: -mrtItemsContainer.offsetWidth * 0.8,
            behavior: 'smooth'
        });
    });

    arrowRight.addEventListener('click', () => {
        mrtItemsContainer.scrollBy({
            left: mrtItemsContainer.offsetWidth * 0.8,
            behavior: 'smooth'
        });
    });

    fetchMRTData();
}

function addSearchInputListener() {
    const button = document.getElementById('search-button'); 
    const input = document.getElementById('search-input'); 

    button.addEventListener('click', function() {
        const keyword = input.value.trim(); 
        handleSearchInput(keyword);
    });
}

function displayAttractions(attractions) {
    const attractionsList = document.getElementById('attraction-list');

    if (attractions.length === 0) {
        const noDataDiv = document.createElement('div');
        noDataDiv.textContent = '找不到相符合資料!';
        noDataDiv.className = 'no-data';  
        attractionsList.appendChild(noDataDiv);
    } else {
    attractions.forEach(attraction => {
        const card = document.createElement('div');
        card.className = 'attraction-card';

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


function init() {
    setupInfiniteScroll(),
    addLoadMrtsEventListener(),
    addSearchInputListener()
}

window.onload = init;