//LOGIN FUNCTIONALITY
document.getElementById('loginForm').addEventListener('submit', function(event) {
  event.preventDefault();

  const userID = document.getElementById('userID').value;
  const staffPassword = document.getElementById('staffPassword').value;
  const encryptedPassword = btoa(staffPassword);

  fetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `userID=${userID}&staffPassword=${encryptedPassword}`
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      alert('Login successful');
      window.location.href = data.redirectUrl;
    } else {
      alert('Invalid login credentials');
    }
  })
  .catch(error => {
    console.error('There was a problem with the fetch operation:', error);
    alert('An error occurred. Please try again later.');
  });
});

// DASHBOARD NAVIGATION FUNCTIONALITY
document.addEventListener('DOMContentLoaded', function() {
  const sections = [
    { buttonId: "add_Orders", sectionClass: "content_add_orders" },
    { buttonId: "active_Orders", sectionClass: "content_active_orders" },
    { buttonId: "payment_Content", sectionClass: "content_payment" },
    { buttonId: "history_Content", sectionClass: "content_history" },
    { buttonId: "inventory_Stock", sectionClass: "content_inventory_stock" }
  ];

  function toggleSection(activeSectionClass) {
    const contentPanelDivs = document.querySelectorAll('.content_panel > div');
    contentPanelDivs.forEach(div => {
      if (div.classList.contains(activeSectionClass)) {
        div.classList.add('active');
      } else {
        div.classList.remove('active');
      }
    });
  }

  sections.forEach(({ buttonId, sectionClass }) => {
    const button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener('click', () => {
        toggleSection(sectionClass);
        const panelTitle = document.getElementById('panel-title');
        if (panelTitle) {
          panelTitle.textContent = button.textContent;
        }
      });
    }
  });

  // LOGOUT FUNCTIONALITY
  const logoutButton = document.getElementById('logout');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.clear();
      window.location.href = '/';
    });
  }

  // Set initial active section
  const defaultSection = document.querySelector('.content_add_orders');
  if (defaultSection) {
    defaultSection.classList.add('active');
  }
});


