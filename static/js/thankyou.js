let translations = {};
async function checkUrlAndFetchOrderDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const number = urlParams.get('number');

  if (number) {
    await fetchOrderDetails(number);
  } else {
    console.error('No order number provided');
    window.location.href = '/';
  }
}

async function fetchOrderDetails(number) {
  const url = `/api/order/${encodeURIComponent(number)}`;
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept-Language': preferredLanguage,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch order details');
    }

    const result = await response.json();
    if (result && result.data) {
      displayOrderDetails(result.data);
    } else {
      console.error('No order data available');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

function displayOrderDetails(orderDetails) {
  const successOrderNumberDiv = document.getElementById('success-order-number');
  const failureOrderNumberDiv = document.getElementById('failure-order-number');

  const successWrapper = document.querySelector('.thankyou-greet.success');
  const failureWrapper = document.querySelector('.thankyou-greet.failure');

  if (orderDetails.status === 'PAID') {
    successOrderNumberDiv.textContent = orderDetails.number;
    successWrapper.style.display = 'block';
    failureWrapper.style.display = 'none';
  } else {
    failureOrderNumberDiv.textContent = orderDetails.number;
    successWrapper.style.display = 'none';
    failureWrapper.style.display = 'block';

    document
      .getElementById('pay-unpaid-order')
      .addEventListener('click', function () {
        window.location.href = `/booking?orderNumber=${encodeURIComponent(orderDetails.number)}`;
      });
  }

  const totalPriceDiv = document.getElementById('total-price');
  totalPriceDiv.textContent = `${translations[preferredLanguage].currency} ${orderDetails.totalPrice} ${translations[preferredLanguage].currency_suffix}`;

  const totalCountDiv = document.getElementById('total-count');
  const itemCountKey =
    orderDetails.totalBookings > 1
      ? 'item_count_multiple'
      : 'item_count_single';
  totalCountDiv.textContent = `${orderDetails.totalBookings} ${translations[preferredLanguage][itemCountKey]}`;

  const orderItemsGroup = document.getElementById('order-items-group');
  orderItemsGroup.innerHTML = '';

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
                <span class="info-bold-content">${translations[preferredLanguage].trip_price}</span>
                <span class="selected-items">${translations[preferredLanguage].currency} ${booking.price} ${translations[preferredLanguage].currency_suffix}</span>
              </div>
              <div class="order-row">
                <span class="info-bold-content">${translations[preferredLanguage].trip_date}</span>
                <span class="selected-items">${booking.date}</span>
             </div>
              <div class="order-row">
                <span class="info-bold-content">${translations[preferredLanguage].trip_time}</span>
                <span class="selected-items">${formattedTime}</span>
              </div>
              <div class="order-row">
                <span class="info-bold-content">${translations[preferredLanguage].contact_name_label}</span>
                <span class="selected-items">${orderDetails.contact.name}</span>
              </div>
              <div class="order-row">
                <span class="info-bold-content">${translations[preferredLanguage].contact_email_label}</span>
                <span class="selected-items">${orderDetails.contact.email}</span>
              </div>
              <div class="order-row">
                <span class="info-bold-content">${translations[preferredLanguage].contact_phone_label}</span>
                <span class="selected-items">${orderDetails.contact.phone}</span>
              </div>
            </div>
        `;

    orderContainer.appendChild(imageDiv);
    orderContainer.appendChild(infoDiv);
    orderItemsGroup.appendChild(orderContainer);
  });
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

    applyTranslations();
  } catch (error) {
    console.error('無法加載翻譯文件:', error);
  }
}

function applyTranslations() {
  const elements = document.querySelectorAll('[data-key]');

  elements.forEach((element) => {
    const key = element.getAttribute('data-key');

    if (
      translations[preferredLanguage] &&
      translations[preferredLanguage][key]
    ) {
      element.innerHTML = translations[preferredLanguage][key];
    }
  });
}

function copyOrderNumber() {
  const successOrderNumberDiv = document.getElementById('success-order-number');
  const failureOrderNumberDiv = document.getElementById('failure-order-number');

  let orderNumber = '';

  if (successOrderNumberDiv && successOrderNumberDiv.textContent.trim()) {
    orderNumber = successOrderNumberDiv.textContent.trim();
  } else if (
    failureOrderNumberDiv &&
    failureOrderNumberDiv.textContent.trim()
  ) {
    orderNumber = failureOrderNumberDiv.textContent.trim();
  }

  if (orderNumber) {
    navigator.clipboard
      .writeText(orderNumber)
      .then(() => {
        alert(translations[preferredLanguage].copy_success);
      })
      .catch((err) => {
        console.error('複製失敗: ', err);
        alert(translations[preferredLanguage].copy_failure);
      });
  } else {
    console.error('無法找到有效的訂單號碼');
  }
}

document.addEventListener('DOMContentLoaded', async function () {
  await auth();
  await loadTranslations();
  checkUrlAndFetchOrderDetails();
});
