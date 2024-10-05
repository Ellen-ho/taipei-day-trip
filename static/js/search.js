function displayGreet() {
  if (userData && userData.data) {
    document.getElementById('user-name').textContent = userData.data.name;
  }
}

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
        <p id="order-message" style="color: red; padding: 0 110px;">請輸入訂單編號</p>`;
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
          },
        },
      );

      if (!response.ok) {
        const errorMessage = `
          <p id="order-message" style="color: red; padding: 0 110px;">找不到該訂單</p>`;
        separator.insertAdjacentHTML('beforebegin', errorMessage);
        orderDetailsContainer.style.display = 'none';
        separator.style.display = 'none';
        orderItemsGroup.innerHTML = '';
        return;
      }

      const data = await response.json();
      if (!data) {
        const errorMessage = `
          <p id="order-message" style="color: red; padding: 0 110px;">找不到該訂單</p>`;
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
        <p id="order-message" style="color: red; padding: 0 110px;">查詢失敗：${error.message}</p>`;
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
          <p style="color: ${messageColor};">該筆訂單未付款，且有行程已逾期</p>
        </div>`;
    } else {
      message = `
        <div id="order-message" style="padding: 0 110px;">
          <p style="color: ${messageColor};">該筆訂單未付款，請點擊下方前往付款</p>
          <button id="pay-unpaid-order" style="padding: 10px;">立即前往付款</button>
        </div>`;
    }
  } else if (orderDetails.status === 'PAID') {
    messageColor = '#4CAF50';
    message = `
      <div id="order-message" style="padding: 0 110px;">
        <p style="color: ${messageColor};">該筆訂單已完成付款</p>
      </div>`;
  }

  separator.insertAdjacentHTML('beforebegin', message);

  totalPriceDiv.textContent = `新台幣 ${orderDetails.totalPrice} 元`;
  totalCountDiv.textContent = `${orderDetails.totalBookings} 筆`;

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
          <span class="info-bold-content">行程價格：</span>
          <span class="selected-items">新台幣 ${booking.price} 元</span>
        </div>
        <div class="order-row">
          <span class="info-bold-content">行程日期：</span>
          <span class="selected-items">${booking.date}</span>
        </div>
        <div class="order-row">
          <span class="info-bold-content">行程時間：</span>
          <span class="selected-items">${formattedTime}</span>
        </div>
        <div class="order-row">
          <span class="info-bold-content">聯絡姓名：</span>
          <span class="selected-items">${orderDetails.contact.name}</span>
        </div>
        <div class="order-row">
          <span class="info-bold-content">聯絡信箱：</span>
          <span class="selected-items">${orderDetails.contact.email}</span>
        </div>
        <div class="order-row">
          <span class="info-bold-content">聯絡手機：</span>
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
  switch (timeText) {
    case 'morning':
      return '早上 9 點到下午 4 點';
    case 'afternoon':
      return '下午 2 點到晚上 9 點';
    default:
      return timeText;
  }
}

document.addEventListener('DOMContentLoaded', async function () {
  await auth();
  displayGreet();
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
