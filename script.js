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
      if (page === 'content_active_order') {
        fetchActiveOrders();
      }
      if (page === 'content_order_history') {
        fetchOrderHistory();
      }
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
        populateSelector(managers, 'modify_assigned_manager');

        // Populate gender selector
        populateSelector(genders, 'gender');
        populateSelector(genders, 'modify_gender');
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

  const eventDurationElement = document.getElementById('event_duration');
  if (eventDurationElement) {
    eventDurationElement.addEventListener('input', updateSubtotal);
  }
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

  function fetchActiveOrders() {
    fetch('/getActiveOrders')
      .then(response => response.json())
      .then(data => {
        const tableBody = document.getElementById('active_order_table').querySelector('tbody');
        tableBody.innerHTML = '';

        data.forEach(order => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${order.order_ID}</td>
            <td>${order.event_Name}</td>
            <td>${order.customer_name}</td>
            <td>${order.order_status}</td>
            <td>${order.event_date}</td>
            <td>${order.end_event_date}</td>
            <td>${order.manager_name}</td>
            <td>${order.total_amount}</td>
            <td>
              <button class="view-order" data-id="${order.order_ID}">View</button>
              <button class="modify-order" data-id="${order.order_ID}">Modify</button>
              <button class="delete-order" data-id="${order.order_ID}">Delete</button>
            </td>
          `;
          tableBody.appendChild(row);
        });

        document.querySelectorAll('.view-order').forEach(button => {
          button.addEventListener('click', function() {
            const orderId = this.dataset.id;
            showPage('view_order_item_popup');
            fetchOrderItems(orderId);
          });
        });

        document.querySelectorAll('.modify-order').forEach(button => {
          button.addEventListener('click', function() {
            const orderId = this.dataset.id;
            showPage('content_modify_order');
            fetchOrderDetails(orderId);
          });
        });

        document.querySelectorAll('.delete-order').forEach(button => {
          button.addEventListener('click', function() {
            const orderId = this.dataset.id;
            deleteOrder(orderId);
          });
        });
      })
      .catch(error => console.error('Error fetching active orders:', error));
  }

  function deleteOrder(orderId) {
    fetch(`/deleteOrder/${orderId}`, { method: 'DELETE' })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('Order deleted successfully');
          fetchActiveOrders();
        } else {
          alert('Error deleting order');
        }
      })
      .catch(error => console.error('Error deleting order:', error));
  }

  function fetchOrderItems(orderId) {
    fetch(`/getOrderItems/${orderId}`)
      .then(response => response.json())
      .then(data => {
        const { items, daysRented } = data;
        const tableBody = document.getElementById('order_items_table').querySelector('tbody');
        tableBody.innerHTML = '';

        let total = 0;
        items.forEach(item => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${item.item_ID}</td>
            <td>${item.item_name}</td>
            <td>${item.item_description}</td>
            <td>${item.item_price}</td>
            <td>${item.item_quantity}</td>
            <td>${item.subtotal.toFixed(2)}</td>
          `;
          tableBody.appendChild(row);
          total += item.subtotal;
        });

        document.getElementById('order_items_total').textContent = total.toFixed(2);
        document.getElementById('days_rented').textContent = `Days Rented: ${daysRented}`;
      })
      .catch(error => console.error('Error fetching order items:', error));
  }

  function fetchOrderDetails(orderId) {
    fetch(`/getOrderDetails/${orderId}`)
      .then(response => response.json())
      .then(data => {
        const { order, items, workers } = data;

        // Fill event information
        document.getElementById('modify_event_name').value = order.event_name;
        document.getElementById('modify_event_timestamp').value = order.event_timestamp.slice(0, 16);
        document.getElementById('modify_event_duration').value = order.event_duration;
        document.getElementById('modify_assigned_manager').value = order.assigned_manager;
        document.getElementById('modify_street').value = order.street;
        document.getElementById('modify_barangay').value = order.barangay;
        document.getElementById('modify_city').value = order.city;

        // Fill customer information
        document.getElementById('modify_first_name').value = order.first_name;
        document.getElementById('modify_middle_name').value = order.middle_name;
        document.getElementById('modify_last_name').value = order.last_name;
        document.getElementById('modify_phone_number').value = order.phone_number;
        document.getElementById('modify_age').value = order.age;
        document.getElementById('modify_gender').value = order.gender;
        document.getElementById('modify_extra_fees').value = order.extra_fees;

        // Populate item and worker tables
        populateModifyTable(items, 'modify_tables_Container', orderId);
        populateModifyTable(items, 'modify_chairs_Container', orderId);
        populateModifyTable(items, 'modify_misc_Container', orderId);
        populateWorkersTable(workers, 'modify_workers_Container');
      })
      .catch(error => console.error('Error fetching order details:', error));
  }

  function populateModifyTable(items, tableId) {
    const tableBody = document.getElementById(tableId).querySelector('tbody');
    tableBody.innerHTML = '';
  
    items.forEach(item => {
      // The item is considered selected if order_selected is not null
      const isSelected = item.order_selected !== null;
      // Use the selected_quantity if available, otherwise 0
      const quantity = isSelected ? (item.selected_quantity || 0) : 0;
      // available_stock is the total stock available from item_stock_tbl
      const availableStock = item.available_stock;
  
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <input type="checkbox" class="item-select" 
            data-id="${item.item_ID}" 
            data-price="${item.item_price}" 
            data-stock="${availableStock}"
            ${isSelected ? 'checked' : ''}>
        </td>
        <td>${item.item_name}</td>
        <td>${item.item_price}</td>
        <td>${availableStock}</td>
        <td>
          <input type="number" class="item-quantity" min="0" max="${availableStock}"
            value="${quantity}" ${!isSelected ? 'disabled' : ''}>
        </td>
        <td class="item-subtotal">${(item.item_price * quantity).toFixed(2)}</td>
      `;
      tableBody.appendChild(row);
    });
  
    // Attach event listeners for checkbox and quantity input to update totals
    tableBody.querySelectorAll('.item-select').forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        const row = this.closest('tr');
        const quantityInput = row.querySelector('.item-quantity');
        if (this.checked) {
          quantityInput.disabled = false;
          if (parseFloat(quantityInput.value) === 0) {
            quantityInput.value = 1; // default if not set
          }
        } else {
          quantityInput.disabled = true;
          quantityInput.value = 0;
        }
        updateModifySubtotal();
      });
    });
  
    tableBody.querySelectorAll('.item-quantity').forEach(input => {
      input.addEventListener('input', updateModifySubtotal);
    });
  }
  
  function populateModifyWorkersTable(workers, tableId) {
    const tableBody = document.getElementById(tableId).querySelector('tbody');
    tableBody.innerHTML = '';
  
    workers.forEach(worker => {
      const isSelected = worker.selected === 1;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <input type="checkbox" class="worker-select" data-id="${worker.worker_ID}"
            ${isSelected ? 'checked' : ''}>
        </td>
        <td>${worker.worker_name}</td>
      `;
      tableBody.appendChild(row);
    });
  }

  




  

  function updateModifySubtotal() {
  let subtotal = 0;
  // Loop through each selected item row
  document.querySelectorAll('#modify_tables_Container .item-select:checked, #modify_chairs_Container .item-select:checked, #modify_misc_Container .item-select:checked').forEach(checkbox => {
    const row = checkbox.closest('tr');
    const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
    const price = parseFloat(checkbox.dataset.price) || 0;
    const itemSubtotal = quantity * price;
    row.querySelector('.item-subtotal').textContent = itemSubtotal.toFixed(2);
    subtotal += itemSubtotal;
  });
  
  // Optionally, apply any event duration or extra fees if needed; here we simply update the display:
  document.getElementById('subtotal_price').textContent = subtotal.toFixed(2);
  // For example, if extra fees are applied:
  const extraFees = parseFloat(document.getElementById('modify_extra_fees').value) || 0;
  const total = subtotal + extraFees;
  document.getElementById('total_price').textContent = total.toFixed(2);
}


  function saveModifiedOrder(orderId) {
    const orderData = getOrderData();

    fetch(`/modifyOrder/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('Order modified successfully');
          showPage('content_active_order');
          fetchActiveOrders();
        } else {
          alert('Error modifying order');
        }
      })
      .catch(error => console.error('Error modifying order:', error));
  }

  // Function to fetch and display order history
  function fetchOrderHistory() {
    fetch('/getOrderHistory')
      .then(response => response.json())
      .then(data => {
        const tableBody = document.getElementById('order_History_Table').querySelector('tbody');
        tableBody.innerHTML = '';

        data.forEach(order => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${order.order_ID}</td>
            <td>${order.customer_name}</td>
            <td>${order.event_Name}</td>
            <td>${new Date(order.event_date).toLocaleDateString()}</td>
            <td>${new Date(order.end_event_date).toLocaleDateString()}</td>
            <td>${order.total_amount}</td>
            <td>${order.order_status}</td>
            <td>${order.manager_name}</td>
            <td>${order.address}</td>
            <td>
              <button class="view-history-order" data-id="${order.order_ID}">View</button>
              <button class="delete-history-order" data-id="${order.order_ID}">Delete</button>
            </td>
          `;
          tableBody.appendChild(row);
        });

        // Add event listeners to the view and delete buttons
        document.querySelectorAll('.view-history-order').forEach(button => {
          button.addEventListener('click', function() {
            const orderId = this.dataset.id;
            showOrderHistoryDetails(orderId);
          });
        });

        document.querySelectorAll('.delete-history-order').forEach(button => {
          button.addEventListener('click', function() {
            const orderId = this.dataset.id;
            if (confirm('Are you sure you want to delete this order?')) {
              deleteOrder(orderId);
              fetchOrderHistory(); // Refresh the table after deletion
            }
          });
        });

        // Add search functionality
        setupOrderHistorySearch();
      })
      .catch(error => console.error('Error fetching order history:', error));
  }

  // Function to show order history item details
  function showOrderHistoryDetails(orderId) {
    const popup = document.querySelector('.view_order_item_history');
    popup.classList.add('active');
    
    fetch(`/getOrderItems/${orderId}`)
      .then(response => response.json())
      .then(data => {
        const { items, daysRented } = data;
        const tableBody = document.getElementById('order_History_Items_Table').querySelector('tbody');
        tableBody.innerHTML = '';

        let total = 0;
        items.forEach(item => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${item.item_ID}</td>
            <td>${item.item_name}</td>
            <td>${item.item_description || 'N/A'}</td>
            <td>${item.item_price}</td>
            <td>${item.item_quantity}</td>
            <td>${item.subtotal.toFixed(2)}</td>
          `;
          tableBody.appendChild(row);
          total += item.subtotal;
        });

        document.getElementById('order_history-items-total').textContent = total.toFixed(2);
      })
      .catch(error => console.error('Error fetching order items:', error));
  }

  // Function to set up search functionality for order history
  function setupOrderHistorySearch() {
    const searchInput = document.getElementById('orderHistorySearch');
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const rows = document.getElementById('order_History_Table').querySelectorAll('tbody tr');
        
        rows.forEach(row => {
          const orderId = row.cells[0].textContent.toLowerCase();
          const customerName = row.cells[1].textContent.toLowerCase();
          
          if (orderId.includes(searchTerm) || customerName.includes(searchTerm)) {
            row.style.display = '';
          } else {
            row.style.display = 'none';
          }
        });
      });
    }
  }

  // Initial page load
  showPage('content_add_order');
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

  document.querySelectorAll('.view-order').forEach(button => {
    button.addEventListener('click', function() {
      const orderId = this.dataset.id;
      fetchOrderItems(orderId);
      document.querySelector('.view_order_item_popup').classList.add('active');
    });
  });

  document.getElementById('content_active_order').addEventListener('click', function() {
    document.querySelector('.view_order_item_popup').classList.remove('active');
    showPage('content_active_order');
    fetchActiveOrders();
  });

  document.querySelectorAll('.modify-order').forEach(button => {
    button.addEventListener('click', function() {
      const orderId = this.dataset.id;
      showPage('content_modify_order');
      fetchOrderDetails(orderId);
    });
  });

  const modifyItemOrderButton = document.getElementById('modify_item_order');
    if (modifyItemOrderButton) {
    modifyItemOrderButton.addEventListener('click', function() {
    showPage('content_modify_item_order');
  });
  }

  // When clicking the "Back to Order Info" button on modify item order page
  const backToModifyOrderButton = document.getElementById('back_to_modify_order');
  if (backToModifyOrderButton) {
    backToModifyOrderButton.addEventListener('click', function() {
    showPage('content_modify_order');
  });
  } 
  document.getElementById('save_modify_order').addEventListener('click', function() {
    const orderId = document.querySelector('.modify-order.active').dataset.id;
    saveModifiedOrder(orderId);
  });

  // Add event listener for the return button in order history view
  document.getElementById('order_history_items_return').addEventListener('click', function() {
    document.querySelector('.view_order_item_history').classList.remove('active');
  });

});
