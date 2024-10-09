let attractionId;
function changePageEventListener() {
  const path = window.location.pathname;
  const parts = path.split('/');
  attractionId = parts[parts.length - 1];
  const preferredLanguage = localStorage.getItem('preferredLanguage') || 'zh';
  const apiPath =
    preferredLanguage === 'en' ? '/api/attraction_en/' : '/api/attraction/';

  fetchSingleAttraction(apiPath, attractionId);
}

async function fetchSingleAttraction(apiPath, attractionId) {
  try {
    const response = await fetch(`${apiPath}${attractionId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
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
  const titleElement = document.querySelector('.attraction-detail-title');
  titleElement.textContent = data.name;

  const subtitleElement = document.querySelector('.attraction-detail-subtitle');
  subtitleElement.textContent = `${data.category} at ${data.mrt}`;

  const descriptionElement = document.querySelector('.attraction-description');
  descriptionElement.textContent = data.description.replace(/\s+/g, ' ').trim();

  const addressElement = document.querySelector('.address-content');
  addressElement.textContent = data.address.replace(/\s+/g, ' ').trim();

  const transportElement = document.querySelector('.transport-content');
  transportElement.textContent = data.transport.replace(/\s+/g, ' ').trim();
}

function setupSlideshow(images) {
  const imagesContainer = document.querySelector('.slides-group');
  const circlesContainer = document.querySelector('.circle-group');
  let slideIndex = 1;

  images.forEach((src, index) => {
    let img = document.createElement('img');
    img.className = 'attraction-slide';
    img.src = src;
    img.alt = 'Image';
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
  document
    .querySelector('.arrow.left')
    .addEventListener('click', () => plusSlides(-1));
  document
    .querySelector('.arrow.right')
    .addEventListener('click', () => plusSlides(1));
}

function showSlides(n) {
  let slides = document.querySelectorAll('.attraction-slide');
  let circles = document.querySelectorAll('.circle');
  let numText = document.querySelector('.number-text');
  let totalSlides = slides.length;

  if (n > slides.length) slideIndex = 1;
  else if (n < 1) slideIndex = slides.length;
  else slideIndex = n;

  slides.forEach((slide) => {
    slide.classList.remove('active');
  });

  slides[slideIndex - 1].classList.add('active');

  circles.forEach((circle) => {
    circle.classList.remove('active');
  });
  circles[slideIndex - 1].classList.add('active');

  if (numText) {
    numText.textContent = `${slideIndex} / ${totalSlides}`;
  }
}

function plusSlides(n) {
  showSlides((slideIndex += n));
}

function currentSlide(n) {
  showSlides((slideIndex = n));
}

function timeOptionsChangeListener() {
  const timeOptions = document.querySelectorAll('input[name="tour-time"]');
  const preferredLanguage = localStorage.getItem('preferredLanguage') || 'zh';

  fetch('/static/languages.json')
    .then((response) => response.json())
    .then((data) => {
      const translations = data[preferredLanguage];

      timeOptions.forEach((option) => {
        option.addEventListener('change', function () {
          const tourCostElement = document.getElementById('tour-cost');
          if (this.value === 'morning') {
            tourCostElement.textContent = translations.morning_cost;
          } else if (this.value === 'afternoon') {
            tourCostElement.textContent = translations.afternoon_cost;
          }
        });
      });
    })
    .catch((error) => console.error('Error loading translations:', error));
}

function checkBookingButtonListener() {
  const bookButton = document.getElementById('book-button');
  const bookDate = document.getElementById('tour-date');
  const preferredLanguage = localStorage.getItem('preferredLanguage') || 'zh';
  let translations;

  fetch('/static/languages.json')
    .then((response) => response.json())
    .then((data) => {
      translations = data[preferredLanguage];

      bookButton.addEventListener('click', async function (event) {
        const token = localStorage.getItem('token');

        if (!token || isTokenExpired(token)) {
          toggleModal('signin-modal');
          return;
        }

        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        const currentDateString = currentDate.toISOString().split('T')[0];

        if (!bookDate.value) {
          alert(translations.date_error);
          event.preventDefault();
          return;
        } else if (bookDate.value <= currentDateString) {
          alert(translations.future_date_error);
          event.preventDefault();
          return;
        }

        const timeOptions = document.querySelectorAll(
          'input[name="tour-time"]',
        );
        const isSelected = Array.from(timeOptions).some(
          (option) => option.checked,
        );

        if (!isSelected) {
          alert(translations.time_error);
          event.preventDefault();
          return;
        }

        const selectedTime = document.querySelector(
          'input[name="tour-time"]:checked',
        ).value;
        const costElement = document.getElementById('tour-cost');
        const matches = costElement.textContent.match(/\d+/);
        if (!matches) {
          return;
        }
        const cost = parseInt(matches[0], 10);

        const bookingData = {
          date: bookDate.value,
          time: selectedTime,
          price: cost,
        };

        if (preferredLanguage === 'en') {
          bookingData.attractionEnId = parseInt(attractionId);
        } else {
          bookingData.attractionId = parseInt(attractionId);
        }

        try {
          const response = await fetch('/api/booking', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingData),
          });

          if (!response.ok) {
            if (response.status === 403) {
              toggleModal('signin-modal');
            }
            if (response.status === 409) {
              toggleModal('conflict-modal');
            }
            return;
          }
          resetBookingForm();
          window.location.href = '/booking';
        } catch (error) {
          alert(translations.booking_error);
          console.error('Error:', error);
        }
      });
    })
    .catch((error) => console.error('Error loading translations:', error));
}

function resetBookingForm() {
  const dateInput = document.getElementById('tour-date');
  if (dateInput) {
    dateInput.value = '';
  }

  const timeOptions = document.querySelectorAll('input[name="tour-time"]');
  if (timeOptions.length > 0) {
    timeOptions.forEach((option) => {
      option.checked = false;
    });
  }

  const costElement = document.getElementById('tour-cost');
  if (costElement) {
    costElement.textContent = '';
  }
}

document.addEventListener('DOMContentLoaded', async function () {
  await auth();
  await loadLanguageOnPageLoad();
  changePageEventListener();
  timeOptionsChangeListener();
  checkBookingButtonListener();
});

window.addEventListener('pageshow', function (event) {
  if (event.persisted) {
    resetBookingForm();
  }
});
