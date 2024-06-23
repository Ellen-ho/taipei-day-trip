function fetchBookingDetails() {
    const url = "/api/booking"; 
    const token = localStorage.getItem('token'); 
    fetch(url, {
        method: "GET",
        headers: {
            'Authorization': `Bearer ${token}`
            // "Content-Type": "application/json"
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch booking details');
        }
        return response.json();  
    })
    .then(data => {
        displayBookingDetails(data.data);  
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function displayBookingDetails(data) {
    document.querySelector(".selected-date").textContent = data.date;
    document.querySelector(".selected-time").textContent = data.time;
    document.querySelector(".selected-cost").textContent = '新台幣 ' + data.price + ' 元'; 
    document.querySelector(".selected-address").textContent = data.attraction.address;
}

document.addEventListener('DOMContentLoaded', function() {
    fetchBookingDetails()
  });