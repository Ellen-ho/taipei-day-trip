let nextPage = 0;
let isLoading = false;
let currentKeyword = ""; 

async function fetchAttractions(keyword = "") {
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

    button.addEventListener('click', function() {
        const keyword = input.value.trim(); 
        handleSearchInput(keyword);
    });
}

function setupInfiniteScroll() {
    function handleScroll() {
       const distanceToBottom = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
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

function handleCardClick() {
    const attractionId = this.dataset.id; 
    window.location.href = `/attraction/${attractionId}`; 
}

function displayMRTs(data) {
    const mrtItemsContainer = document.querySelector('.mrt-items');
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

function addLoadMrtsEventListener() {
    const mrtItemsContainer = document.querySelector('.mrt-items');
    const arrowLeft = document.querySelector('.arrow.left'); 
    const arrowRight = document.querySelector('.arrow.right'); 

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

function addModalEventListener() {
    var overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);

    function toggleModal(modalId) {
        var modal = document.getElementById(modalId);
        console.log(modalId)
        if (!modal.classList.contains('show')) {
            adjustModalPosition(modalId); 
        }
        modal.classList.toggle('show');
        modal.style.display = modal.classList.contains('show') ? 'block' : 'none';
        overlay.style.display = modal.classList.contains('show') ? 'block' : 'none';
        console.log(overlay.style.display)
    }

    function switchModals(currentModalId, newModalId) {
        toggleModal(currentModalId); 
        toggleModal(newModalId); 
        adjustModalPosition(newModalId); 
    }

    document.getElementById('menu-items').addEventListener('click', function(event) {
        event.preventDefault();
        var action = event.target.getAttribute('data-action');
        if (action === 'signin') {
            toggleModal('signin-modal');
        }
    });
        
    document.querySelectorAll('.close-button').forEach(function(button) {
        button.addEventListener('click', function() {
            var modal = button.closest('.modal');
            if (modal) {
                toggleModal(modal.id);
            }
        });
    });

    document.getElementById('switch-to-signup').addEventListener('click', function(event) {
        event.preventDefault();
        switchModals('signin-modal', 'signup-modal');
    });

    overlay.addEventListener('click', function() {
        document.querySelectorAll('.modal.show').forEach(function(modal) {
            toggleModal(modal.id);
        });
    });
}

function adjustModalPosition(modalId) {
    const modal = document.getElementById(modalId);
    const banner = document.getElementById('banner');
    const nav = document.getElementById('fixed-top-navbar');

    modal.style.display = 'block';

    const modalTopPosition = (banner.offsetHeight / 2) + nav.offsetHeight - (modal.offsetHeight / 2);

    modal.style.top = `${modalTopPosition}px`;
    console.log(modal.style.top);

    console.log(modal.classList.contains('show'))

    if (!modal.classList.contains('show')) {
        modal.style.display = 'none';
    }
}


function init() {
    setupInfiniteScroll(),
    addLoadMrtsEventListener(),
    addSearchInputListener(),
    addModalEventListener()
}

window.onload = init;