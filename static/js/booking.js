async function checkUrlAndFetchDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderNumber = urlParams.get('orderNumber');

    if (orderNumber) {
        fetchOrderDetails(orderNumber);
    } else {
        fetchBookingDetails();
    }
}

async function fetchBookingDetails() {
    const url = "/api/booking"; 
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
            throw new Error('Failed to fetch booking details');
        }
        const result = await response.json();
        if(!result){
            if (userData && userData.data) {
                document.getElementById("user-name").textContent = userData.data.name}
           hideBookingElements()
        }else{
           displayBookingDetails(result.data);
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

async function fetchOrderDetails(orderNumber) {
    const token = localStorage.getItem('token');
    const url = `/api/order?number=${encodeURIComponent(orderNumber)}`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        const result = await response.json();
        displayBookingsWithOrderDetails(result.data);
    } catch (error) {
        console.error('Error fetching order details:', error);
    }
}

function displayBookingDetails(bookings) {
    const bookingInfoContainer = document.getElementById('booking-group-container');
    const noBookingMessage = document.getElementById('no-booking-message');
    noBookingMessage.style.display = 'none';

    if (userData && userData.data) {
        document.getElementById("user-name").textContent = userData.data.name;
        document.querySelector('input[name="contact-name"]').value = userData.data.name;
        document.querySelector('input[name="contact-email"]').value = userData.data.email;
    }

    bookings.forEach(booking => {
        const bookingContainer = document.createElement('div');
        bookingContainer.className = 'booking-container';
        bookingContainer.dataset.bookingId = booking.id;

        const checkBoxWrapper = document.createElement('div');
        checkBoxWrapper.className = 'checkbox-wrapper';
    
        const checkBox = document.createElement('input');
        checkBox.type = 'checkbox';
        checkBox.className = 'booking-checkbox';
        checkBox.dataset.price = booking.price;
        checkBoxWrapper.appendChild(checkBox); 

        const imageDiv = document.createElement('div');
        imageDiv.className = 'booking-attraction-image';
        const img = document.createElement('img');
        img.src = booking.attraction.image;
        img.alt = booking.attraction.name;
        imageDiv.appendChild(img);

        const infoDiv = document.createElement('div');
        infoDiv.className = 'booking-info';

        const formattedTime = formatTime(booking.time);
        
        infoDiv.innerHTML = `
          <img class="delete-button shadow-animation" src="/static/images/delete-button.png" alt="Delete">
          <div class="name-container">
            <span>台北一日遊 : ${booking.attraction.name}</span>
          </div>
          <div class="booking-list-container">
            <div class="booking-row">
              <span class="info-bold-content">日期：</span>
              <span class="selected-items">${booking.date}</span>
            </div>
            <div class="booking-row">
              <span class="info-bold-content">時間：</span>
              <span class="selected-items">${formattedTime}</span>
            </div>
            <div class="booking-row">
              <span class="info-bold-content">費用：</span>
              <span class="selected-items">新台幣 ${booking.price} 元</span>
            </div>
            <div class="booking-row">
              <span class="info-bold-content">地點：</span>
              <span class="selected-items">${booking.attraction.address}</span>
            </div>
          </div>
        `;
        bookingContainer.appendChild(checkBoxWrapper);
        bookingContainer.appendChild(imageDiv);
        bookingContainer.appendChild(infoDiv);
        bookingInfoContainer.appendChild(bookingContainer);

        bookingContainer.addEventListener('mouseover', function() {
            this.classList.add('hover-effect');
        });
        bookingContainer.addEventListener('mouseout', function() {
            this.classList.remove('hover-effect');
        });
    });
    setupPriceCalculation();
}

function displayBookingsWithOrderDetails(resultData) {
    const bookingInfoContainer = document.getElementById('booking-group-container');
    const bookingGreetTitle = document.querySelector('.booking-greet.booking-text-title');

    bookingGreetTitle.innerHTML = `您好，<span id="user-name"></span>，以下是您尚未付款的訂單行程：`;

    if (userData && userData.data) {
        document.getElementById("user-name").textContent = userData.data.name;
    }

    if (resultData.contact) {
        document.getElementById('contact-name-display').textContent = resultData.contact.name;
        document.getElementById('contact-email-display').textContent = resultData.contact.email;
        document.getElementById('contact-phone-display').textContent = resultData.contact.phone;
    
        document.getElementById('contact-name').style.display = 'none';
        document.getElementById('contact-email').style.display = 'none';
        document.getElementById('contact-phone').style.display = 'none';
    
        document.getElementById('contact-name-display').style.display = 'inline';
        document.getElementById('contact-email-display').style.display = 'inline';
        document.getElementById('contact-phone-display').style.display = 'inline';
    }

    resultData.bookings.forEach(booking => {
        const bookingContainer = document.createElement('div');
        bookingContainer.className = 'booking-container';
        bookingContainer.dataset.bookingId = booking.id;

        const imageDiv = document.createElement('div');
        imageDiv.className = 'booking-attraction-image';
        const img = document.createElement('img');
        img.src = booking.attraction.image;
        img.alt = booking.attraction.name;
        imageDiv.appendChild(img);

        const infoDiv = document.createElement('div');
        infoDiv.className = 'booking-info';

        const formattedTime = formatTime(booking.time);
        
        infoDiv.innerHTML = `
          <div class="name-container">
            <span>台北一日遊 : ${booking.attraction.name}</span>
          </div>
          <div class="booking-list-container">
            <div class="booking-row">
              <span class="info-bold-content">日期：</span>
              <span class="selected-items">${booking.date}</span>
            </div>
            <div class="booking-row">
              <span class="info-bold-content">時間：</span>
              <span class="selected-items">${formattedTime}</span>
            </div>
            <div class="booking-row">
              <span class="info-bold-content">費用：</span>
              <span class="selected-items">新台幣 ${booking.price} 元</span>
            </div>
            <div class="booking-row">
              <span class="info-bold-content">地點：</span>
              <span class="selected-items">${booking.attraction.address}</span>
            </div>
          </div>
        `;
        bookingContainer.appendChild(imageDiv);
        bookingContainer.appendChild(infoDiv);
        bookingInfoContainer.appendChild(bookingContainer);
    });
    document.getElementById('total-cost').textContent = `新台幣 ${resultData.totalPrice} 元`;
}

function setupBookingEventListeners() {
    const bookingInfoContainer = document.getElementById('booking-group-container');
    bookingInfoContainer.addEventListener('click', function(event) {
        const deleteButton = event.target.closest('.delete-button');
        if (deleteButton) {
            event.preventDefault();
            const bookingContainer = deleteButton.closest('.booking-container');
            const bookingId = bookingContainer.dataset.bookingId; 
            deleteBooking(bookingId, bookingContainer);
        }
    });
}

function setupPriceCalculation() {
    const checkBoxes = document.querySelectorAll('.booking-checkbox');
    checkBoxes.forEach(checkBox => {
        checkBox.addEventListener('change', updateTotalCost);
    });
}

function updateTotalCost() {
    let totalCost = 0;
    const selectedBoxes = document.querySelectorAll('.booking-checkbox:checked');
    selectedBoxes.forEach(box => {
        totalCost += parseFloat(box.dataset.price);
    });
    const totalCostDisplay = document.getElementById('total-cost');
    if (totalCost > 0) {
        totalCostDisplay.textContent = `新台幣 ${totalCost} 元`;
    } else {
        totalCostDisplay.textContent = ''; 
    }
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

async function deleteBooking(bookingId) {
    const token = localStorage.getItem('token');
    if (!token) {
        toggleModal('signin-modal');
        return;
    }

    try {
        const response = await fetch(`/api/booking/${bookingId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error('Failed to delete booking');
        }
        const data = await response.json();
        alert('已成功刪除該筆預訂');
        if (data.ok) {
            window.location.reload();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('刪除失敗，請再試一次');
    }
}

function hideBookingElements() {
    const bookingGroupContainer = document.getElementById('booking-group-container');
    if (bookingGroupContainer) {
        bookingGroupContainer.style.display = 'none';  
    }
    const contactContainer = document.getElementById('contact-container');
    const paymentContainer = document.getElementById('payment-container');
    const totalCostContainer = document.getElementById('total-cost-container');
    const separators = document.querySelectorAll('.separator');
    const noBookingMessage = document.getElementById('no-booking-message'); 
    const footer = document.querySelector('footer');
    const content = document.getElementById('content')

    if (contactContainer) contactContainer.style.display = 'none';
    if (paymentContainer) paymentContainer.style.display = 'none';
    if (totalCostContainer) totalCostContainer.style.display = 'none';


    separators.forEach(separator => {
        if (separator) separator.style.display = 'none';
    });

    if (noBookingMessage) {
        noBookingMessage.style.display = 'block';
        if (footer) {
            footer.style.minHeight = 'calc(100vh - 215px)';
            footer.style.paddingTop = '40px';
            footer.style.alignItems = 'flex-start'}
        if (content) content.style.minHeight = '0px';
    } else {
        if (footer) footer.style.height = '104px'; 
        if (content) content.style.minHeight = '786px';
    }
}

function resetCheckboxes() {
    const checkboxes = document.querySelectorAll('.booking-checkbox');
    checkboxes.forEach(checkbox => checkbox.checked = false);
}

// document.addEventListener('DOMContentLoaded', async function() {
//     await auth();
//     checkUrlAndFetchDetails(),
//     setupBookingEventListeners();
//     // setupBookingInfoInput()
//   });

window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        resetCheckboxes();
    }
});

