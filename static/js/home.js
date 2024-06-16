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
        noDataDiv.className = 'no-data';
      
        const messageSpan = document.createElement('span');
        messageSpan.textContent = '找不到相符合資料!';
        noDataDiv.appendChild(messageSpan);
      
        const linkSpan = document.createElement('span');
        linkSpan.className = 'no-data-link';
        linkSpan.textContent = '點擊 👉 到首頁繼續探索吧！';
        linkSpan.onclick = () => {
          window.location.href = '/';
        };
        noDataDiv.appendChild(linkSpan);
      
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

function signup() {
    const username = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();

    if (!username || !email || !password) {
        console.error('All fields are required');
        alert('所有欄位都是必填。');
        return;  
    }

    console.log(username)
    console.log(email)
    console.log(password)

    const userData = {
        username: username,
        email: email,
        password: password
    };

    fetch('/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'  
        },
        body: JSON.stringify(userData)  
    })
    .then(response => response.json())  
    .then(data => {
        console.log('Success:', data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function signin() {
    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value.trim();

    if (!email || !password) {
        console.error('All fields are required');
        alert('所有欄位都是必填。');
        return;  
    }

    console.log(email);
    console.log(password);

    const signinData = {
        email: email,
        password: password
    };

    fetch('/signin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'  
        },
        body: JSON.stringify(signinData)  
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function init() {
    setupInfiniteScroll(),
    addLoadMrtsEventListener(),
    addSearchInputListener(),
    addModalEventListener(),
    addButtonEventListener('signup-button', signup),
    addButtonEventListener('signin-button', signin)
}

window.onload = init;