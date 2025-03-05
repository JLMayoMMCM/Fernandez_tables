//LOGIN FUNCTIONALITY
document.addEventListener('DOMContentLoaded', function() {

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
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
  }

  function showPage(pageId) {
    // Hide all sections
    document.querySelectorAll(".content_panel > section").forEach(section => {
      section.classList.remove("active");
    });

    // Show the selected section
    const activeSection = document.querySelector(`.${pageId}`);
    if (activeSection) {
      activeSection.classList.add("active");
    } else {
      console.error(`Section with class '${pageId}' not found.`);
    }

    // Update panel title
    const panelTitle = document.getElementById("panel-title");
    if (panelTitle) {
      panelTitle.textContent = pageId.replace("content_", "").replace("_", " ").toUpperCase();
    }
  }

  //button navigation listener

  //Navigation Buttons
  document.querySelectorAll(".nav-button").forEach(button => {
    button.addEventListener('click', function() {
      document.querySelectorAll(".nav-button").forEach(btn => btn.classList.remove("active"));
      this.classList.add("active");

      const page = this.getAttribute("data-page");
      showPage(page);
    });
  });

  //button for item list page
  const addItemOrderButton = document.getElementById('add_item_order');
  if (addItemOrderButton) {
    addItemOrderButton.addEventListener('click', function() {
      showPage('content_add_item_order');
    });
  }

  //button for returning to main add order page
  const backToAddOrder = document.getElementById('back_to_add_order');
  if (backToAddOrder) {
    backToAddOrder.addEventListener('click', function() {
      showPage('content_add_order');
    });
  }

  // Function to import items and workers
  function importData() {
    fetch('/getItemsAndWorkers')
      .then(response => response.json())
      .then(data => {
        const { items, workers, managers, genders } = data;

        // Populate item tables
        populateTable(items.tables, 'tables_Container');
        populateTable(items.chairs, 'chairs_Container');
        populateTable(items.miscellaneous, 'misc_Container');

        // Populate workers table
        populateWorkersTable(workers, 'workers_Container');

        // Populate manager selector
        populateSelector(managers, 'assigned_manager');

        // Populate gender selector
        populateSelector(genders, 'gender');
      })
      .catch(error => console.error('Error importing data:', error));
  }

  function populateTable(items, tableId) {
    const tableBody = document.getElementById(tableId).querySelector('tbody');
    tableBody.innerHTML = '';

    items.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><input type="checkbox" class="item-select" data-id="${item.item_ID}" data-price="${item.item_price}" data-stock="${item.item_quantity}"></td>
        <td>${item.item_name}</td>
        <td>${item.item_price}</td>
        <td>${item.item_quantity}</td>
        <td><input type="number" class="item-quantity" min="0" max="${item.item_quantity}" value="0"></td>
        <td class="item-subtotal">0.00</td>
      `;
      tableBody.appendChild(row);
    });

    // Add event listeners for quantity inputs and checkboxes
    tableBody.querySelectorAll('.item-select').forEach(checkbox => {
      checkbox.addEventListener('change', updateSubtotal);
    });
    tableBody.querySelectorAll('.item-quantity').forEach(input => {
      input.addEventListener('input', updateSubtotal);
    });
  }

  function populateWorkersTable(workers, tableId) {
    const tableBody = document.getElementById(tableId).querySelector('tbody');
    tableBody.innerHTML = '';

    workers.forEach(worker => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><input type="checkbox" class="worker-select" data-id="${worker.worker_ID}"></td>
        <td>${worker.worker_name}</td>
      `;
      tableBody.appendChild(row);
    });
  }

  function populateSelector(data, selectorId) {
    const selector = document.getElementById(selectorId);
    selector.innerHTML = '';

    data.forEach(item => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.name;
      selector.appendChild(option);
    });
  }

  document.getElementById('event_duration').addEventListener('input', updateSubtotal);
  document.getElementById('extra_fees').addEventListener('input', updateSubtotal);


  function updateSubtotal() {
    let subtotal = 0;
    const checkboxes = document.querySelectorAll('.item-select:checked');
    checkboxes.forEach(checkbox => {
      const row = checkbox.closest('tr');
      const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
      const price = parseFloat(checkbox.dataset.price) || 0;
      const subtotalCell = row.querySelector('.item-subtotal');
      
      const itemSubtotal = quantity * price;
      subtotalCell.textContent = itemSubtotal.toFixed(2);
      subtotal += itemSubtotal;
    });
    
    const eventDuration = parseFloat(document.getElementById('event_duration').value) || 1;
    const subtotalPrice = subtotal * eventDuration;
    document.getElementById('subtotal_price').textContent = subtotalPrice.toFixed(2);
    
    const extraFees = parseFloat(document.getElementById('extra_fees').value) || 0;
    const totalPrice = subtotalPrice + extraFees;
    document.getElementById('total_price').textContent = totalPrice.toFixed(2);
  }

  function getOrderData() {
  
    const getValue = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };

  return { event_name: getValue('event_name'), 
    event_timestamp: getValue('event_timestamp'), 
    event_duration: getValue('event_duration') || 1, 
    assigned_manager: getValue('assigned_manager'), 
    street: getValue('street'), 
    barangay: getValue('barangay'), 
    city: getValue('city'), 
    first_name: getValue('first_name'), 
    middle_name: getValue('middle_name'), 
    last_name: getValue('last_name'), 
    phone_number: getValue('phone_number'), 
    age: getValue('age') || 0, 
    gender: getValue('gender'), 
    extra_fees: getValue('extra_fees') || 0, 
    items: getSelectedItems(), 
    workers: getSelectedWorkers() };
  }

  // Function to handle adding an order
  function addOrder() {
    // Validate form fields
    if (!validateForm()) {
      alert('Please fill in all required fields and ensure at least one item and one worker are selected.');
      return;
    }

    const orderData = getOrderData();

      // const orderData = {
      //   event_name: document.getElementById('event_name').value,
      //   event_timestamp: document.getElementById('event_timestamp').value,
      //   event_duration: document.getElementById('event_duration').value,
      //   assigned_manager: document.getElementById('assigned_manager').value,
      //   street: document.getElementById('street').value,
      //   barangay: document.getElementById('barangay').value,
      //   city: document.getElementById('city').value,
      //   first_name: document.getElementById('first_name').value,
      //   middle_name: document.getElementById('middle_name').value,
      //   last_name: document.getElementById('last_name').value,
      //   phone_number: document.getElementById('phone_number').value,
      //   age: document.getElementById('age').value,
      //   gender: document.getElementById('gender').value,
      //   extra_fees: document.getElementById('extra_fees').value,
      //   items: getSelectedItems(),
      //   workers: getSelectedWorkers()
      // };



    fetch('/addOrder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('Order added successfully');
        showPage('content_add_order');
      } else {
        alert('Error adding order');
      }
    })
    .catch(error => console.error('Error adding order:', error));
  }

  function validateForm() {
    const requiredFields = [
      'event_name', 'event_timestamp', 'event_duration', 'assigned_manager',
      'street', 'barangay', 'city', 'first_name', 'last_name', 'phone_number', 'gender'
    ];

    for (const field of requiredFields) {
      if (!document.getElementById(field).value) {
        return false;
      }
    }

    const selectedItems = getSelectedItems();
    if (selectedItems.length === 0 || !selectedItems.some(item => item.quantity > 0)) {
      return false;
    }

    const selectedWorkers = getSelectedWorkers();
    if (selectedWorkers.length === 0) {
      return false;
    }

    return true;
  }

  function getSelectedItems() {
    const items = [];
    document.querySelectorAll('.item-select:checked').forEach(checkbox => {
      const row = checkbox.closest('tr');
      const itemId = checkbox.dataset.id;
      const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
      const price = parseFloat(checkbox.dataset.price) || 0;
      items.push({ item_id: itemId, quantity, price });
    });
    return items;
  }  

  function getSelectedWorkers() {
    const workers = [];
    document.querySelectorAll('.worker-select:checked').forEach(checkbox => {
      workers.push(checkbox.dataset.id);
    });
    return workers;
  }

  // Initial page load
  showPage("content_add_order");
  importData();

  // LOGOUT FUNCTIONALITY
  const logoutButton = document.getElementById('logout');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      fetch('/logout', { method: 'POST' }) // Assuming a server logout endpoint
        .then(() => {
          alert('Logged out successfully.');
          sessionStorage.clear(); 
          localStorage.clear(); // Clear local storage if needed
          window.location.href = '/login'; // Redirect to login page
        })
        .catch(error => {
          console.error('Logout error:', error);
          alert('Error logging out. Please try again.');
        });
    });
  }

  // Add order button functionality
  const addOrderButton = document.getElementById('add_order_button');
  if (addOrderButton) {
    addOrderButton.addEventListener('click', addOrder);
  }

});
