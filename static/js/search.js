let translations = {};

function checkSearchButtonListener() {
  const searchButton = document.getElementById('search-order-button');
  const orderNumberInput = document.getElementById('order-number-input');
  const orderDetailsContainer = document.getElementById(
    'order-details-container',
  );
  const separator = document.querySelector('.separator');
  const orderItemsGroup = document.getElementById('order-items-group');

  searchButton.addEventListener('click', async function () {
    const orderNumber = orderNumberInput.value.trim();

    const previousMessage = document.getElementById('order-message');
    if (previousMessage) {
      previousMessage.remove();
    }

    if (!orderNumber) {
      const errorMessage = `
        <p id="order-message" style="color: red; padding: 0 110px;">${translations[preferredLanguage]['enter_order_number']}</p>`;
      separator.insertAdjacentHTML('beforebegin', errorMessage);
      orderDetailsContainer.style.display = 'none';
      separator.style.display = 'none';
      orderItemsGroup.innerHTML = '';
      return;
    }

    try {
      const response = await fetch(
        `/api/order/${encodeURIComponent(orderNumber)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
            'Accept-Language': preferredLanguage,
          },
        },
      );

      if (!response.ok) {
        const errorMessage = `
         <p id="order-message" style="color: red; padding: 0 110px;">${translations[preferredLanguage]['order_not_found']}</p>`;
        separator.insertAdjacentHTML('beforebegin', errorMessage);
        orderDetailsContainer.style.display = 'none';
        separator.style.display = 'none';
        orderItemsGroup.innerHTML = '';
        return;
      }

      const data = await response.json();
      if (!data) {
        const errorMessage = `
          <p id="order-message" style="color: red; padding: 0 110px;">${translations[preferredLanguage]['order_not_found']}</p>`;
        separator.insertAdjacentHTML('beforebegin', errorMessage);
        orderDetailsContainer.style.display = 'none';
        separator.style.display = 'none';
        orderItemsGroup.innerHTML = '';
        return;
      }

      displayOrderDetails(data.data);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = `
       <p id="order-message" style="color: red; padding: 0 110px;">${translations[preferredLanguage]['query_failed']}：${error.message}</p>`;
      separator.insertAdjacentHTML('beforebegin', errorMessage);
      orderDetailsContainer.style.display = 'none';
      separator.style.display = 'none';
      orderItemsGroup.innerHTML = '';
    }
  });
}

function displayOrderDetails(orderDetails) {
  const totalPriceDiv = document.getElementById('total-price');
  const totalCountDiv = document.getElementById('total-count');
  const orderItemsGroup = document.getElementById('order-items-group');
  const orderDetailsContainer = document.getElementById(
    'order-details-container',
  );
  const separator = document.querySelector('.separator');

  orderDetailsContainer.style.display = 'flex';
  separator.style.display = 'block';

  orderItemsGroup.innerHTML = '';

  const now = new Date();

  let messageColor = 'red';
  let message = '';

  const hasExpiredBooking = orderDetails.bookings.some((booking) => {
    const bookingDate = new Date(booking.date);
    return bookingDate < now;
  });

  if (orderDetails.status === 'UNPAID') {
    if (hasExpiredBooking) {
      message = `
        <div id="order-message" style="padding: 0 110px;">
          <p style="color: ${messageColor};">${translations[preferredLanguage]['unpaid_order_with_expired']}</p>
        </div>`;
    } else {
      message = `
        <div id="order-message" style="padding: 0 110px;">
          <p style="color: ${messageColor};">${translations[preferredLanguage]['unpaid_order']}</p>
          <button id="pay-unpaid-order" style="padding: 10px;">${translations[preferredLanguage]['pay_now']}</button>
        </div>`;
    }
  } else if (orderDetails.status === 'PAID') {
    messageColor = '#4CAF50';
    message = `
      <div id="order-message" style="padding: 0 110px;">
       <p style="color: ${messageColor};">${translations[preferredLanguage]['order_paid']}</p>
      </div>`;
  }

  separator.insertAdjacentHTML('beforebegin', message);

  const itemCountKey =
    orderDetails.totalBookings > 1
      ? 'item_count_multiple'
      : 'item_count_single';

  totalPriceDiv.textContent = `${translations[preferredLanguage]['currency']} ${orderDetails.totalPrice} ${translations[preferredLanguage]['currency_suffix']}`;
  totalCountDiv.textContent = `${orderDetails.totalBookings} ${translations[preferredLanguage][itemCountKey]}`;

  orderDetails.bookings.forEach((booking) => {
    const orderContainer = document.createElement('div');
    orderContainer.className = 'order-item-container';
    orderContainer.dataset.orderId = booking.id;

    const imageDiv = document.createElement('div');
    imageDiv.className = 'order-attraction-image';
    const img = document.createElement('img');
    img.src = booking.attraction.image;
    img.alt = booking.attraction.name;
    imageDiv.appendChild(img);

    const infoDiv = document.createElement('div');
    infoDiv.className = 'order-info';
    const formattedTime = formatTime(booking.time);

    infoDiv.innerHTML = `
      <div class="name-container">
        <div class="order-attraction-name">${booking.attraction.name}</div>
        <div class="order-attraction-address">${booking.attraction.address}</div>
      </div>
      <div class="order-list-container">
        <div class="order-row">
        <span class="info-bold-content">${translations[preferredLanguage]['trip_price']}</span>
          <span class="selected-items">${translations[preferredLanguage]['currency']} ${booking.price} ${translations[preferredLanguage]['currency_suffix']}</span>
        </div>
        <div class="order-row">
         <span class="info-bold-content">${translations[preferredLanguage]['trip_date']}</span>
          <span class="selected-items">${booking.date}</span>
        </div>
        <div class="order-row">
          <span class="info-bold-content">${translations[preferredLanguage]['trip_time']}</span>
          <span class="selected-items">${formattedTime}</span>
        </div>
        <div class="order-row">
           <span class="info-bold-content">${translations[preferredLanguage]['contact_name_label']}</span>
          <span class="selected-items">${orderDetails.contact.name}</span>
        </div>
        <div class="order-row">
         <span class="info-bold-content">${translations[preferredLanguage]['contact_email_label']}</span>
          <span class="selected-items">${orderDetails.contact.email}</span>
        </div>
        <div class="order-row">
          <span class="info-bold-content">${translations[preferredLanguage]['contact_phone_label']}</span>
          <span class="selected-items">${orderDetails.contact.phone}</span>
        </div>
      </div>
    `;

    orderContainer.appendChild(imageDiv);
    orderContainer.appendChild(infoDiv);
    orderItemsGroup.appendChild(orderContainer);
  });

  const payButton = document.getElementById('pay-unpaid-order');
  if (payButton) {
    payButton.addEventListener('click', function () {
      window.location.href = `/booking?orderNumber=${encodeURIComponent(orderDetails.number)}`;
    });
  }
}

function formatTime(timeText) {
  const preferredLanguage = localStorage.getItem('preferredLanguage') || 'zh';

  const translations = {
    zh: {
      morning: '早上 9 點到下午 4 點',
      afternoon: '下午 2 點到晚上 9 點',
    },
    en: {
      morning: '9:00 AM to 4:00 PM',
      afternoon: '2:00 PM to 9:00 PM',
    },
  };

  const translation = translations[preferredLanguage];

  switch (timeText) {
    case 'morning':
      return translation.morning;
    case 'afternoon':
      return translation.afternoon;
    default:
      return timeText;
  }
}

const preferredLanguage = localStorage.getItem('preferredLanguage') || 'zh';

async function loadTranslations() {
  try {
    const response = await fetch('/static/languages.json');
    translations = await response.json();

    applyTranslations(translations);
  } catch (error) {
    console.error('無法加載翻譯文件:', error);
  }
}

function applyTranslations(translations) {
  const elements = document.querySelectorAll('[data-key]');

  elements.forEach((element) => {
    const key = element.getAttribute('data-key');

    if (
      element.tagName.toLowerCase() === 'input' &&
      element.hasAttribute('placeholder')
    ) {
      if (
        translations[preferredLanguage] &&
        translations[preferredLanguage][key]
      ) {
        element.setAttribute(
          'placeholder',
          translations[preferredLanguage][key],
        );
      }
    } else if (key === 'search_greeting') {
      if (userData && userData.data) {
        const userName = userData.data.name;

        if (
          translations[preferredLanguage] &&
          translations[preferredLanguage][key]
        ) {
          const message = translations[preferredLanguage][key].replace(
            '{name}',
            `<span id="user-name">${userName}</span>`,
          );
          element.innerHTML = message;
        }
      }
    } else if (
      translations[preferredLanguage] &&
      translations[preferredLanguage][key]
    ) {
      element.innerHTML = translations[preferredLanguage][key];
    }
  });
}

document.addEventListener('DOMContentLoaded', async function () {
  await auth();
  await loadTranslations();
  checkSearchButtonListener();
});

function resetInputRow() {
  const orderNumberInput = document.getElementById('order-number-input');
  if (orderNumberInput) {
    orderNumberInput.value = '';
  }

  const orderDetailsContainer = document.getElementById(
    'order-details-container',
  );
  const separator = document.querySelector('.separator');
  const orderItemsGroup = document.getElementById('order-items-group');

  if (orderDetailsContainer && separator && orderItemsGroup) {
    orderDetailsContainer.style.display = 'none';
    separator.style.display = 'none';
    orderItemsGroup.innerHTML = '';
  }

  const orderMessage = document.getElementById('order-message');
  if (orderMessage) {
    orderMessage.remove();
  }

  const payButton = document.getElementById('pay-unpaid-order');
  if (payButton) {
    payButton.remove();
  }
}

window.addEventListener('pageshow', function (event) {
  if (event.persisted) {
    resetInputRow();
  }
});
