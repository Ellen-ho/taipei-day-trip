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
  const imagesContainer = document.querySelector('.slideshow-container');
  const circlesContainer = document.querySelector('.circle-group');
  let slideIndex = 1;

  images.forEach((src, index) => {
      let slide = document.createElement('div');
      slide.className = 'attraction-slide';
      slide.innerHTML = `<img src="${src}" alt="Image">`;
      imagesContainer.appendChild(slide);

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
  slides[slideIndex - 1].scrollIntoView({ behavior: 'smooth' });

  slides.forEach(slide => slide.style.display = "none");
  circles.forEach(circle => circle.classList.remove("active"));

  slides[slideIndex - 1].style.display = "block";
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

document.querySelectorAll('.toggle-switch input[type="radio"]').forEach(radio => {
  radio.addEventListener('change', function() {
    console.log(this.value); 
  });
});

// function calendarEventListener() { 
//   var calendarIcon = document.getElementById('calendar-icon');
//     var dateInput = document.getElementById('book-date');

//     calendarIcon.addEventListener('click', function() {
//         console.log('Calendar icon clicked.'); 

//         var event = new MouseEvent('click', {
//             bubbles: true,
//             cancelable: true,
//             view: window
//         });

//         dateInput.dispatchEvent(event);
//         console.log('Click event dispatched on date input.'); 
//     });
// };

function init() {
    changePageEventListener()
    // calendarEventListener() 
}

window.onload = init;