async function checkUrlAndFetchOrderDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderNumber = urlParams.get('orderNumber');

    if (orderNumber) {
        await fetchOrderDetails(orderNumber);  
    } else {
        console.error('No order number provided');
    }
}


async function fetchOrderDetails(orderNumber) {
    const url = `/api/order?number=${encodeURIComponent(orderNumber)}`;
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`,
                "Content-Type": "application/json"
            }
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

        document.getElementById('pay-unpaid-order').addEventListener('click', function() {
            window.location.href = `/booking?orderNumber=${encodeURIComponent(orderDetails.number)}`;
        });
    }

    const totalPriceDiv = document.getElementById('total-price');
    totalPriceDiv.textContent = `新台幣 ${orderDetails.totalPrice} 元`;
    const totalCountDiv = document.getElementById('total-count');
    totalCountDiv.textContent = `${orderDetails.totalBookings} 筆`;

    const orderItemsGroup = document.getElementById('order-items-group');
    orderItemsGroup.innerHTML = ''; 

    orderDetails.bookings.forEach(booking => {
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
}

function formatTime(timeText) {
    switch(timeText) {
        case "morning":
            return '早上 9 點到下午 4 點';
        case "afternoon":
            return '下午 2 點到晚上 9 點';
        default:
            return timeText; 
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    await auth();
    checkUrlAndFetchOrderDetails()
  });