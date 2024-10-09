let translations = {};
TPDirect.setupSDK();
const currentUrl = window.location.href;
const url = new URL(currentUrl);
const queryParams = new URLSearchParams(url.search);
const orderNumber = queryParams.get('orderNumber');

let fields = {
  number: {
    element: '#card-number',
    placeholder: '**** **** **** ****',
  },
  expirationDate: {
    element: document.getElementById('card-expiration-date'),
    placeholder: 'MM / YY',
  },
  ccv: {
    element: '#card-ccv',
    placeholder: 'ccv',
  },
};

TPDirect.card.setup({
  fields: fields,
  styles: {
    input: {
      color: 'gray',
    },
    'input.ccv': {
      'font-size': '16px',
    },
    'input.expiration-date': {
      'font-size': '16px',
    },
    'input.card-number': {
      'font-size': '16px',
    },
    ':focus': {
      color: 'black',
    },
    '.valid': {
      color: 'green',
    },
    '.invalid': {
      color: 'red',
    },
    '@media screen and (max-width: 400px)': {
      input: {
        color: 'orange',
      },
    },
  },
  isMaskCreditCardNumber: true,
  maskCreditCardNumberRange: {
    beginIndex: 6,
    endIndex: 11,
  },
});

TPDirect.card.onUpdate(function (update) {
  const submitButton = document.getElementById('confirm-cost');
  if (update.canGetPrime) {
    submitButton.removeAttribute('disabled');
  } else {
    submitButton.setAttribute('disabled', true);
  }
});

const preferredLanguage = localStorage.getItem('preferredLanguage') || 'zh';

function handleConfirmOrder() {
  const confirmButton = document.getElementById('confirm-cost');
  confirmButton.addEventListener('click', async function (event) {
    event.preventDefault();
    const inputs = document.querySelectorAll('#contact-container input');
    let allFilled = true;

    inputs.forEach((input) => {
      if (input.style.display !== 'none') {
        if (input.value.trim() === '') {
          allFilled = false;
        }
      }
    });

    if (!allFilled) {
      alert(translations[preferredLanguage]['contact_info_required']);
      return;
    }

    const tappayStatus = TPDirect.card.getTappayFieldsStatus();

    if (tappayStatus.canGetPrime === false) {
      alert(translations[preferredLanguage]['credit_card_error']);
      return;
    }

    const totalPriceElement = document.getElementById('total-cost');
    if (
      !totalPriceElement.textContent.trim() ||
      parseInt(totalPriceElement.textContent.trim()) === 0
    ) {
      alert(translations[preferredLanguage]['no_booking_selected']);
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
        document
          .querySelectorAll('.booking-checkbox:checked')
          .forEach((box) => {
            selectedBookings.push(
              parseInt(box.closest('.booking-container').dataset.bookingId, 10),
            );
          });
      } else {
        document.querySelectorAll('.booking-container').forEach((container) => {
          selectedBookings.push(parseInt(container.dataset.bookingId, 10));
        });
      }

      const contact = {
        name: document.getElementById('contact-name').value.trim(),
        email: document.getElementById('contact-email').value.trim(),
        phone: document.getElementById('contact-phone').value.trim(),
      };

      const totalPriceElement = document.getElementById('total-cost');
      const currency = translations[preferredLanguage]['currency'];
      const currencySuffix = translations[preferredLanguage]['currency_suffix'];
      const totalCost = parseFloat(
        totalPriceElement.textContent
          .replace(`${currency}`, '')
          .replace(`${currencySuffix}`, '')
          .trim(),
      );

      const token = localStorage.getItem('token');

      if (hasCheckbox) {
        const postRequestData = {
          prime: result.card.prime,
          order: {
            totalPrice: totalCost,
            trip: selectedBookings.map((id) => ({ booking_id: id })),
            contact: contact,
          },
        };
        try {
          response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(postRequestData),
          });

          if (!response.ok) {
            throw new Error(
              translations[preferredLanguage][
                'order_submission_failed'
              ].replace('{status}', response.status),
            );
          }

          responseData = await response.json();
          const url = `/thankyou?number=${encodeURIComponent(responseData.data.number)}`;
          window.location.href = url;
        } catch (error) {
          console.error('提交訂單錯誤:', error);
          alert(translations[preferredLanguage]['order_creation_failed']);
        }
      } else {
        const putRequestData = {
          prime: result.card.prime,
        };

        try {
          response = await fetch(`/api/order/${orderNumber}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
              'Accept-Language': preferredLanguage,
            },
            body: JSON.stringify(putRequestData),
          });

          if (!response.ok) {
            throw new Error(
              translations[preferredLanguage][
                'order_submission_failed'
              ].replace('{status}', response.status),
            );
          }

          responseData = await response.json();
          const url = `/thankyou?number=${encodeURIComponent(responseData.data.number)}`;
          window.location.href = url;
        } catch (error) {
          console.error('更新訂單錯誤:', error);
          alert(translations[preferredLanguage]['order_update_failed']);
        }
      }
    });
  });
}

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

    if (key === 'greeting_message') {
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

  checkUrlAndFetchDetails();
  setupBookingEventListeners();
  handleConfirmOrder();
});
