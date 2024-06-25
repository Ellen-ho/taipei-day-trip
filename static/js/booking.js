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
        console.log(result)
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

function displayBookingDetails(bookings) {
    const bookingInfoContainer = document.getElementById('booking-group-container');
    bookingInfoContainer.innerHTML = ''
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
          <button class="delete-button"><img src="/static/images/delete-button.png" alt="Delete"></button>
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

function formatTime(timeText) {
    switch(timeText) {
        case "morning":
            return '早上 9 點到中午 12 點';
        case "afternoon":
            return '下午 1 點到下午 4 點';
        default:
            return timeText; 
    }
}

async function deleteBooking(bookingId, bookingContainer) {
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
        alert('已成功刪除該筆預定');
        if (data.ok) {
            bookingContainer.remove();
            if (document.querySelectorAll('.booking-container').length === 0) {
                hideBookingElements(); 
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('刪除失敗，請重試');
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
        if (footer) footer.style.height = '865px'; 
        if (content) content.style.minHeight = '0px';
    } else {
        if (footer) footer.style.height = '104px'; 
        if (content) content.style.minHeight = '786px';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    fetchBookingDetails(),
    setupBookingEventListeners()
  });