function changePageEventListener() {
  const path = window.location.pathname;
  const parts = path.split('/');
  const attractionId = parts[parts.length - 1]; 
  fetchSingleAttraction(attractionId);
};

async function fetchSingleAttraction(attractionId) {
  try {
      const response = await fetch(`/api/attraction/${attractionId}`, {
          method: 'GET',
          headers: {
              'Accept': 'application/json'
          }
      });
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }

      const attraction = await response.json();

      displayAttractionDetails(attraction.data); 

  } catch (error) {
      console.error('Fetch error:', error);
  }
}

function displayAttractionDetails(data) {
  displayBasicInfo(data);
  setupSlideshow(data.images);
}

function displayBasicInfo(data) {
  const titleElement = document.querySelector('.book-attraction-title');
  titleElement.textContent = data.name;

  const subtitleElement = document.querySelector('.book-attraction-subtitle');
  subtitleElement.textContent = `${data.category} at ${data.mrt}`;

  const descriptionElement = document.querySelector('.attraction-description');
  descriptionElement.textContent = data.description;

  const addressElement = document.querySelector(".address-content");
  addressElement.textContent = data.address;

  const transportElement = document.querySelector(".transport-content");
  transportElement.textContent = data.transport;
}

function setupSlideshow(images) {
  const imagesContainer = document.querySelector('.slides-group');
  const circlesContainer = document.querySelector('.circle-group');
  let slideIndex = 1;

  images.forEach((src, index) => {
    let img = document.createElement('img');
    img.className = 'attraction-slide';  
    img.src = src;
    img.alt = "Image";
    imagesContainer.appendChild(img);

    let circle = document.createElement('button');
    circle.className = 'circle';
    circle.addEventListener('click', () => currentSlide(index + 1));
    circlesContainer.appendChild(circle);
  });

  setupNavigation();
  showSlides(slideIndex); 
}

function setupNavigation() {
  document.querySelector('.arrow.left').addEventListener('click', () => plusSlides(-1));
  document.querySelector('.arrow.right').addEventListener('click', () => plusSlides(1));
}

function showSlides(n) {
  let slides = document.querySelectorAll(".attraction-slide");
  let circles = document.querySelectorAll(".circle");
  let numText = document.querySelector(".number-text");
  let totalSlides = slides.length;

  if (n > slides.length) slideIndex = 1;
  else if (n < 1) slideIndex = slides.length;
  else slideIndex = n;
  
  slides.forEach(slide => {
    slide.classList.remove("active");
  });

  slides[slideIndex - 1].classList.add("active");

  circles.forEach(circle => {
    circle.classList.remove("active");
  });
  circles[slideIndex - 1].classList.add("active");

  if (numText) {
      numText.textContent = `${slideIndex} / ${totalSlides}`;
  }
}


function plusSlides(n) {
  showSlides(slideIndex += n);
}

function currentSlide(n) {
  showSlides(slideIndex = n);
}

function timeOptionsChangeListener() {
  const timeOptions = document.querySelectorAll('input[name="book-time"]');
  timeOptions.forEach(option => {
    option.addEventListener('change', function() {
      const tourCostElement = document.getElementById('tour-cost'); 
      if (this.value === 'morning') {
        tourCostElement.textContent = '新台幣 2000 元'; 
      } else if (this.value === 'afternoon') {
        tourCostElement.textContent = '新台幣 2500 元'; 
      }
    });
  });
}

function checkBookingButtonListener(){
  const bookButton = document.getElementById('book-button');
  const bookDate = document.getElementById('book-date');

  bookButton.addEventListener('click', function(event) {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const currentDateString = currentDate.toISOString().split('T')[0];

    if (!bookDate.value) {
      alert('尚未選擇日期！');
      event.preventDefault(); 
      return; 
    }else if (bookDate.value <= currentDateString) {
      alert('選擇日期有誤！請選擇未來的日期。');
      event.preventDefault();
      return;
    }

    const timeOptions = document.querySelectorAll('input[name="book-time"]');
    const isSelected = Array.from(timeOptions).some(option => option.checked);

    if (!isSelected) {
      alert('尚未選擇時間!');
      event.preventDefault();
    }
  });
}

function init() {
  changePageEventListener(),
  timeOptionsChangeListener(),
  checkBookingButtonListener()
}

window.onload = init;