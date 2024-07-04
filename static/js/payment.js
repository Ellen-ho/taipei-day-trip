TPDirect.setupSDK()
const currentUrl = window.location.href;
const url = new URL(currentUrl);
const queryParams = new URLSearchParams(url.search);
const orderNumber = queryParams.get('orderNumber');

let fields = {
    number: {
        element: '#card-number',
        placeholder: '**** **** **** ****'
    },
    expirationDate: {
        element: document.getElementById('card-expiration-date'),
        placeholder: 'MM / YY'
    },
    ccv: {
        element: '#card-ccv',
        placeholder: 'ccv'
    }
}

TPDirect.card.setup({
    fields: fields,
    styles: {
        'input': {
            'color': 'gray'
        },
        'input.ccv': {
            'font-size': '16px'
        },
        'input.expiration-date': {
            'font-size': '16px'
        },
        'input.card-number': {
            'font-size': '16px'
        },
        ':focus': {
            'color': 'black'
        },
        '.valid': {
            'color': 'green'
        },
        '.invalid': {
            'color': 'red'
        },
        '@media screen and (max-width: 400px)': {
            'input': {
                'color': 'orange'
            }
        }
    },
    isMaskCreditCardNumber: true,
    maskCreditCardNumberRange: {
        beginIndex: 6,
        endIndex: 11
    }
})

TPDirect.card.onUpdate(function (update) {
    const submitButton = document.getElementById('confirm-cost');
    if (update.canGetPrime) {
        submitButton.removeAttribute('disabled')
    } else {
        submitButton.setAttribute('disabled', true)
    }
})

function handleConfirmOrder() {
    const confirmButton = document.getElementById('confirm-cost');
    confirmButton.addEventListener('click', async function(event) {
        event.preventDefault();  
        const inputs = document.querySelectorAll('#contact-container input');
        let allFilled = true;

        inputs.forEach(input => {
            if (input.style.display !== 'none') {
                if (input.value.trim() === '') {
                    allFilled = false;  
                }
            }
        });

        if (!allFilled) {
            alert('聯絡資訊皆不可空白');
            return;
        }

        const tappayStatus = TPDirect.card.getTappayFieldsStatus();

        if (tappayStatus.canGetPrime === false) {
            alert('信用卡資訊輸入錯誤');
            return;
        }

        const totalPriceElement = document.getElementById('total-cost');
        if (!totalPriceElement.textContent.trim() || parseInt(totalPriceElement.textContent.trim()) === 0) {
            alert('尚未選擇任何行程');
            return;
        }

        TPDirect.card.getPrime(async (result) => {
            if (result.status !== 0) {
                alert('get prime error: ' + result.msg);
                return;
            }

            let selectedBookings = [];
            const hasCheckbox = document.querySelector('.booking-checkbox');
            if (hasCheckbox) {
                document.querySelectorAll('.booking-checkbox:checked').forEach(box => {
                    selectedBookings.push(parseInt(box.closest('.booking-container').dataset.bookingId, 10));
                });
            } else {
                document.querySelectorAll('.booking-container').forEach(container => {
                    selectedBookings.push(parseInt(container.dataset.bookingId, 10));
                });
            }
            
            const contact = {
                name: document.getElementById('contact-name').value.trim(),
                email: document.getElementById('contact-email').value.trim(),
                phone: document.getElementById('contact-phone').value.trim()
            };

            const totalCostElement = document.getElementById('total-cost');
            const totalCost = parseFloat(totalCostElement.textContent.replace(/新台幣\s|元/g, '').trim());

            const token = localStorage.getItem('token');

            if (hasCheckbox) {
                const postRequestData = {
                    "prime": result.card.prime,
                    "order": {
                        totalPrice: totalCost,
                        trip: selectedBookings.map(id => ({ booking_id: id })),
                        contact: contact
                    }
                }
                try {
                    response = await fetch('/api/orders', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(postRequestData)
                    });
            
                    if (!response.ok) {
                        throw new Error(`訂單提交失敗! status: ${response.status}`);
                    }
            
                    responseData = await response.json();
                    const url = `/thankyou?number=${encodeURIComponent(responseData.data.number)}`;
                    window.location.href = url;
                } catch (error) {
                    console.error('提交訂單錯誤:', error);
                    alert('訂單建立失敗，請確認填寫的資訊或稍後再試');
                }
            } else {
                const putRequestData = {
                    "prime": result.card.prime
                }

                try {
                    response = await fetch(`/api/order/${orderNumber}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(putRequestData)
                    });
            
                    if (!response.ok) {
                        throw new Error(`訂單更新失敗! status: ${response.status}`);
                    }
            
                    responseData = await response.json();
                    const url = `/thankyou?number=${encodeURIComponent(responseData.data.number)}`;
                    window.location.href = url;
                } catch (error) {
                    console.error('更新訂單錯誤:', error);
                    alert('訂單更新失敗，請確認填寫的資訊或稍後再試');
                }
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', async function() {
    await auth();
    checkUrlAndFetchDetails(),
    setupBookingEventListeners();
    handleConfirmOrder()
  });