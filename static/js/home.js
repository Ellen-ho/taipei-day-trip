let currentPage = 0;
let nextPage = 0;
let isLoading = false;
let currentKeyword = ""; 

async function fetchAttractions(keyword = "") {
    if (isLoading || nextPage === null) return;
    isLoading = true;

    try {
        const url = new URL('/api/attractions', window.location.origin);
        url.searchParams.append('page', currentPage);
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
        if (currentPage === 0) { 
            document.querySelector('.attraction-list').innerHTML = '';
        }
        displayAttractions(result.data);
        nextPage = result.nextPage; 
        currentPage += 1; 
        isLoading = false;
    } catch (error) {
        console.error('Fetch error:', error);
        isLoading = false;
    }
}

function handleSearchInput(keyword) {
    currentKeyword = keyword; 
    currentPage = 0; 
    nextPage = 0; 
    fetchAttractions(currentKeyword); 
}

function setupInfiniteScroll() {
    function handleScroll() {
       const distanceToBottom = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
       const nearBottom = distanceToBottom < 10;

        if (nearBottom && !isLoading && nextPage !== null) {
            fetchAttractions(currentKeyword);
        }
    }

    window.addEventListener('scroll', handleScroll);
    fetchAttractions(currentKeyword); // 初始加载（无关键词）
}


function addLoadMrtsEventListener() {
    const mrtListContainer = document.querySelector('.mrt-items');
    const arrowLeft = document.querySelector('.arrow.left'); 
    const arrowRight = document.querySelector('.arrow.right'); 
    let currentIndex = 0;
    let data = [];

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
            data = result.data;
            displayMRTs();
        } catch (error) {
            console.error('Fetch error:', error);
        }
    }

    function displayMRTs() {
        mrtListContainer.innerHTML = '';
        const items = data.slice(currentIndex, currentIndex + 12);
        items.forEach((mrt) => {
            const link = document.createElement('a');
            link.href = "#";
            link.textContent = mrt;
            link.className = 'mrt-link';
            link.addEventListener('click', (event) => {
                event.preventDefault();
                fetchAttractions(mrt); 
            });
            mrtListContainer.appendChild(link);
        });
    }

    arrowLeft.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex -= 12;
            displayMRTs();
        }
    });

    arrowRight.addEventListener('click', () => {
        if (currentIndex + 12 < data.length) {
            currentIndex += 12;
            displayMRTs();
        }
    });

    fetchMRTData();
}

// function setupMRTEventListeners() {
//     const mrtListContainer = document.querySelector('.mrt-items');
    
//     mrtListContainer.addEventListener('click', (event) => {
//         if (event.target.className === 'mrt-link') {
//             event.preventDefault();
//             const mrtName = event.target.textContent;  
//             setupInfiniteScroll(); 
//         }
//     })
// }

function displayAttractions(attractions) {
    const attractionsList = document.querySelector('.attraction-list');
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


function init() {
    addLoadMrtsEventListener(),
    // setupMRTEventListeners(),
    setupInfiniteScroll()
}

window.onload = init;