//LOGIN FUNCTIONALITY
document.addEventListener('DOMContentLoaded', function() {

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
      event.preventDefault();

      const userID = document.getElementById('userID').value;
      const staffPassword = document.getElementById('staffPassword').value;
      
      // Don't double-encode the password here, send it as-is and let server handle encryption
      fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'  // Change to JSON content type
        },
        body: JSON.stringify({  // Use JSON.stringify instead of urlencoded format
          userID: userID,
          staffPassword: staffPassword
        })
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
          window.location.href = data.redirectUrl;  // This should work now
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
      if (page === 'content_inventory_stock') {
        fetchInventoryItems();
        fetchStockInfo();
      }
      if (page === 'content_staff_info') {
        fetchStaffInfo();
      }
    });
  });

  //button for item list page
  const addItemOrderButton = document.getElementById('add_item_order');
  if (addItemOrderButton) {
    addItemOrderButton.addEventListener('click', function() {
      showPage('content_add_item_order');
      setTimeout(function() {
        // Ensure subtotal is updated when page is shown
        updateSubtotal();
      }, 100);
    });
  }

  //button for returning to main add order page
  const backToAddOrder = document.getElementById('back_to_add_order');
  if (backToAddOrder) {
    backToAddOrder.addEventListener('click', function() {
      showPage('content_add_order');
      setTimeout(function() {
        // Ensure subtotal is updated when page is shown
        updateSubtotal();
      }, 100);
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
        <td class="item-id" data-id="${item.item_ID}">${item.item_name}</td>
        <td class="item-price">${item.item_price}</td>
        <td>${item.item_quantity}</td>
        <td><input type="number" class="item-quantity" min="0" max="${item.item_quantity}" value="0" data-id="${item.item_ID}" data-price="${item.item_price}"></td>
        <td class="item-subtotal">0.00</td>
      `;
      tableBody.appendChild(row);
    });

    // Add event listeners for quantity inputs with validation
    tableBody.querySelectorAll('.item-quantity').forEach(input => {
      input.addEventListener('input', function() {
        const max = parseInt(this.getAttribute('max'));
        validateNumericInput(this, 0, max);
        updateSubtotal();
      });
      
      input.addEventListener('blur', function() {
        const max = parseInt(this.getAttribute('max'));
        validateNumericInput(this, 0, max);
        updateSubtotal();
      });
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

  document.getElementById('extra_fees').addEventListener('input', updateSubtotal);

  // Add input validation to ensure values are within acceptable ranges
  function validateNumericInput(input, minValue, maxValue) {
    let value = parseFloat(input.value);
    
    if (isNaN(value) || value < minValue) {
      input.value = minValue;
      return minValue;
    } else if (value > maxValue) {
      input.value = maxValue;
      return maxValue;
    }
    
    return value;
  }

  // Updated updateSubtotal function to properly target elements across add order pages
  function updateSubtotal() {
    let subtotal = 0;
    const quantityInputs = document.querySelectorAll('#tables_Container .item-quantity, #chairs_Container .item-quantity, #misc_Container .item-quantity');
    
    quantityInputs.forEach(input => {
      const quantity = parseFloat(input.value) || 0;
      const price = parseFloat(input.dataset.price) || 0;
      const row = input.closest('tr');
      const subtotalCell = row.querySelector('.item-subtotal');
      
      const itemSubtotal = quantity * price;
      subtotalCell.textContent = itemSubtotal.toFixed(2);
      if (quantity > 0) {
        subtotal += itemSubtotal;
      }
    });
    
    // Get event duration value
    const eventDuration = parseFloat(document.getElementById('event_duration').value) || 1;
    const subtotalPrice = subtotal * eventDuration;
    
    // Get extra fees value
    const extraFees = parseFloat(document.getElementById('extra_fees').value) || 0;
    const totalPrice = subtotalPrice + extraFees;
    
    // Update all subtotal and total price elements in add order pages
    const subtotalElements = document.querySelectorAll('#add_subtotal_price');
    subtotalElements.forEach(el => {
      if (el) el.textContent = subtotalPrice.toFixed(2);
    });
    
    const totalElements = document.querySelectorAll('#add_total_price');
    totalElements.forEach(el => {
      if (el) el.textContent = totalPrice.toFixed(2);
    });
  }

  // Updated updateModifySubtotal function to properly target elements across modify order pages
  function updateModifySubtotal() {
    let subtotal = 0;
    // Loop over every quantity input in modify item containers
    document.querySelectorAll(
      '#modify_tables_Container .item-quantity, #modify_chairs_Container .item-quantity, #modify_misc_Container .item-quantity'
    ).forEach(input => {
      const quantity = parseFloat(input.value) || 0;
      const price = parseFloat(input.dataset.price) || 0;
      const row = input.closest('tr');
      const subtotalCell = row.querySelector('.item-subtotal');
      
      const itemSubtotal = quantity * price;
      subtotalCell.textContent = itemSubtotal.toFixed(2);
      if (quantity > 0) {
        subtotal += itemSubtotal;
      }
    });
    
    // Get event duration for modify order form
    const eventDuration = parseFloat(document.getElementById('modify_event_duration').value) || 1;
    const subtotalPrice = subtotal * eventDuration;
    
    // Get extra fees from the modify order extra fees input
    const extraFees = parseFloat(document.getElementById('modify_extra_fees').value) || 0;
    const totalPrice = subtotalPrice + extraFees;
    
    // Update all subtotal and total price elements in modify order pages
    const subtotalElements = document.querySelectorAll('#modify_subtotal_Price');
    subtotalElements.forEach(el => {
      if (el) el.textContent = subtotalPrice.toFixed(2);
    });
    
    const totalElements = document.querySelectorAll('#modify_total_Price');
    totalElements.forEach(el => {
      if (el) el.textContent = totalPrice.toFixed(2);
    });
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
    if (selectedItems.length === 0) {
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
    document.querySelectorAll('#tables_Container .item-quantity, #chairs_Container .item-quantity, #misc_Container .item-quantity').forEach(input => {
      const quantity = parseFloat(input.value) || 0;
      if (quantity > 0) {
        const itemId = input.dataset.id;
        const price = parseFloat(input.dataset.price) || 0;
        items.push({ item_id: itemId, quantity, price });
      }
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
              <button class="cancel-order" data-id="${order.order_ID}">Cancel</button>
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

        document.querySelectorAll('.cancel-order').forEach(button => {
          button.addEventListener('click', function() {
            const orderId = this.dataset.id;
            if (confirm('Are you sure you want to cancel this order?')) {
              cancelOrder(orderId);
            }
          });
        });
      })
      .catch(error => console.error('Error fetching active orders:', error));
  }

  function cancelOrder(orderId) {
    fetch(`/cancelOrder/${orderId}`, { method: 'PUT' })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('Order cancelled successfully');
          fetchActiveOrders();  // Refresh the active orders list
        } else {
          alert('Error cancelling order: ' + (data.message || 'Unknown error'));
        }
      })
      .catch(error => {
        console.error('Error cancelling order:', error);
        alert('An error occurred while cancelling the order.');
      });
  }

  function deleteOrder(orderId, callback) {
    fetch(`/deleteOrder/${orderId}`, { method: 'DELETE' })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('Order deleted successfully');
          // Execute callback function (fetchActiveOrders or fetchOrderHistory)
          if (typeof callback === 'function') {
            callback();
          }
        } else {
          alert('Error deleting order: ' + (data.message || 'Unknown error'));
        }
      })
      .catch(error => {
        console.error('Error deleting order:', error);
        alert('An error occurred while deleting the order.');
      });
  }

  function fetchOrderItems(orderId) {
    fetch(`/getOrderItems/${orderId}`)
      .then(response => response.json())
      .then(data => {
        const { items, daysRented, extraFees } = data;
        const tableBody = document.getElementById('order_items_table').querySelector('tbody');
        tableBody.innerHTML = '';

        let itemsSubtotal = 0;
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
          itemsSubtotal += item.subtotal;
        });

        // Calculate the costs
        const subtotalWithDays = itemsSubtotal * daysRented;
        const totalPrice = subtotalWithDays + parseFloat(extraFees || 0);

        // Display the cost information
        document.getElementById('days_rented').textContent = `Days Rented: ${daysRented}`;
        document.getElementById('order_items_subtotal').textContent = itemsSubtotal.toFixed(2);
        document.getElementById('order_subtotal_with_days').textContent = subtotalWithDays.toFixed(2);
        document.getElementById('order_extra_fees').textContent = (extraFees || 0).toFixed(2);
        document.getElementById('order_items_total').textContent = totalPrice.toFixed(2);
      })
      .catch(error => console.error('Error fetching order items:', error));
  }

  function fetchOrderDetails(orderId) {
    fetch(`/getOrderDetails/${orderId}`)
      .then(response => response.json())
      .then(data => {
        const { order, itemsByType, workers } = data;
        
        // Store the current order ID in a data attribute for later use
        document.getElementById('save_modify_order').setAttribute('data-order-id', order.order_ID);
        
        // Populate form fields
        document.getElementById('modify_event_name').value = order.event_name || '';
        document.getElementById('modify_event_timestamp').value = order.event_timestamp.slice(0, 16) || '';
        document.getElementById('modify_event_duration').value = order.event_duration || 1;
        document.getElementById('modify_assigned_manager').value = order.assigned_manager || '';
        document.getElementById('modify_street').value = order.street || '';
        document.getElementById('modify_barangay').value = order.barangay || '';
        document.getElementById('modify_city').value = order.city || '';
        
        // Fill customer information
        document.getElementById('modify_first_name').value = order.first_name || '';
        document.getElementById('modify_middle_name').value = order.middle_name || '';
        document.getElementById('modify_last_name').value = order.last_name || '';
        document.getElementById('modify_phone_number').value = order.phone_number || '';
        document.getElementById('modify_age').value = order.age || 0;
        document.getElementById('modify_gender').value = order.gender || '';
        document.getElementById('modify_extra_fees').value = order.extra_fees || 0;
        
        // Populate item tables with pre-sorted items from the server
        populateModifyTable(itemsByType.tables, 'modify_tables_Container');
        populateModifyTable(itemsByType.chairs, 'modify_chairs_Container');
        populateModifyTable(itemsByType.misc, 'modify_misc_Container');
        
        // Populate workers table
        populateModifyWorkersTable(workers, 'modify_workers_Container');
        
        // Update subtotals
        updateModifySubtotal();
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
        <td class="item-id" data-id="${item.item_ID}">${item.item_name}</td>
        <td class="item-price">${item.item_price}</td>
        <td>${availableStock}</td>
        <td><input type="number" class="item-quantity" min="0" max="${availableStock}" value="${quantity}" data-id="${item.item_ID}" data-price="${item.item_price}"></td>
        <td class="item-subtotal">${(item.item_price * quantity).toFixed(2)}</td>
      `;
      tableBody.appendChild(row);
    });
  
    // Attach event listeners for quantity input to update totals
    tableBody.querySelectorAll('.item-quantity').forEach(input => {
      input.addEventListener('input', function() {
        const max = parseInt(this.getAttribute('max'));
        validateNumericInput(this, 0, max);
        updateModifySubtotal();
      });
      
      input.addEventListener('blur', function() {
        const max = parseInt(this.getAttribute('max'));
        validateNumericInput(this, 0, max);
        updateModifySubtotal();
      });
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
    // Loop over every quantity input in modify item containers
    document.querySelectorAll(
      '#modify_tables_Container .item-quantity, #modify_chairs_Container .item-quantity, #modify_misc_Container .item-quantity'
    ).forEach(input => {
      const quantity = parseFloat(input.value) || 0;
      const price = parseFloat(input.dataset.price) || 0;
      const row = input.closest('tr');
      const subtotalCell = row.querySelector('.item-subtotal');
      
      const itemSubtotal = quantity * price;
      subtotalCell.textContent = itemSubtotal.toFixed(2);
      if (quantity > 0) {
        subtotal += itemSubtotal;
      }
    });
    
    // Get event duration for modify order form (use explicit ID)
    let eventDuration;
    if (document.querySelector('.content_modify_order.active')) {
      eventDuration = parseFloat(document.getElementById('modify_event_duration').value) || 1;
    } else if (document.querySelector('.content_modify_item_order.active')) {
      eventDuration = parseFloat(document.getElementById('modify_event_duration').value) || 1;
    } else {
      eventDuration = 1;
    }
    
    const subtotalPrice = subtotal * eventDuration;
    
    // Get extra fees from the modify order extra fees input (use explicit ID)
    let extraFees;
    if (document.querySelector('.content_modify_order.active')) {
      extraFees = parseFloat(document.getElementById('modify_extra_fees').value) || 0;
    } else if (document.querySelector('.content_modify_item_order.active')) {
      extraFees = parseFloat(document.getElementById('modify_extra_fees').value) || 0;
    } else {
      extraFees = 0;
    }
    
    const totalPrice = subtotalPrice + extraFees;
    
    // Update the modify order form subtotal and total (fix ID discrepancies)
    const subtotalElements = document.querySelectorAll(
      '.content_modify_order.active #subtotal_Price, ' + 
      '.content_modify_order.active #subtotal_price, ' +
      '.content_modify_item_order.active #subtotal_Price, ' +
      '.content_modify_item_order.active #subtotal_price'
    );
    
    subtotalElements.forEach(element => {
      if (element) element.textContent = subtotalPrice.toFixed(2);
    });
    
    const totalElements = document.querySelectorAll(
      '.content_modify_order.active #total_Price, ' +
      '.content_modify_order.active #total_price, ' +
      '.content_modify_item_order.active #total_Price, ' +
      '.content_modify_item_order.active #total_price'
    );
    
    totalElements.forEach(element => {
      if (element) element.textContent = totalPrice.toFixed(2);
    });
  }

  function attachModifyListeners(tableBody) {
    tableBody.querySelectorAll('.item-select').forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        const row = this.closest('tr');
        const quantityInput = row.querySelector('.item-quantity');
        if (this.checked) {
          quantityInput.disabled = false;
          // Default to 1 if the value is 0
          if (parseFloat(quantityInput.value) === 0) {
            quantityInput.value = 1;
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

  const tablesBody = document.getElementById('modify_tables_Container').querySelector('tbody');
  attachModifyListeners(tablesBody);

  const chairsBody = document.getElementById('modify_chairs_Container').querySelector('tbody');
  attachModifyListeners(chairsBody);

  const miscBody = document.getElementById('modify_misc_Container').querySelector('tbody');
  attachModifyListeners(miscBody);

  document.getElementById('modify_extra_fees').addEventListener('input', updateModifySubtotal);

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
            if (confirm('Are you sure you want to delete this order? This will permanently remove all customer information.')) {
              deleteOrder(orderId, fetchOrderHistory); // Pass fetchOrderHistory as the callback
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
        const { items, daysRented, extraFees } = data;
        const tableBody = document.getElementById('order_History_Items_Table').querySelector('tbody');
        tableBody.innerHTML = '';

        let itemsSubtotal = 0;
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
          itemsSubtotal += item.subtotal;
        });

        // Calculate the costs
        const subtotalWithDays = itemsSubtotal * daysRented;
        const totalPrice = subtotalWithDays + parseFloat(extraFees || 0);

        // Display the cost information
        document.getElementById('history_days_rented').textContent = `Days Rented: ${daysRented}`;
        document.getElementById('history_items_subtotal').textContent = itemsSubtotal.toFixed(2);
        document.getElementById('history_subtotal_with_days').textContent = subtotalWithDays.toFixed(2);
        document.getElementById('history_extra_fees').textContent = (extraFees || 0).toFixed(2);
        document.getElementById('order_history-items-total').textContent = totalPrice.toFixed(2);
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

  // Function to fetch and display inventory items
  function fetchInventoryItems() {
    fetch('/getInventoryItems')
      .then(response => response.json())
      .then(data => {
        const tableBody = document.getElementById('inventory_items_table').querySelector('tbody');
        tableBody.innerHTML = '';

        data.forEach(item => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${item.item_ID}</td>
            <td>${item.item_name}</td>
            <td>${item.item_description || 'N/A'}</td>
            <td>${item.item_type}</td>
            <td>${item.item_price}</td>
            <td>${item.total_stock || 0}</td>
            <td>
              <button class="delete-item" data-id="${item.item_ID}">Delete</button>
            </td>
          `;
          tableBody.appendChild(row);
        });

        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-item').forEach(button => {
          button.addEventListener('click', function() {
            const itemId = this.dataset.id;
            if (confirm('Are you sure you want to delete this item? This will remove all stock entries as well.')) {
              deleteInventoryItem(itemId);
            }
          });
        });
      })
      .catch(error => console.error('Error fetching inventory items:', error));
  }

  // Function to fetch and display stock information
  function fetchStockInfo() {
    fetch('/getStockInfo')
      .then(response => response.json())
      .then(data => {
        const tableBody = document.getElementById('stock_info_table').querySelector('tbody');
        tableBody.innerHTML = '';

        data.forEach(stock => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${stock.item_stock_ID}</td>
            <td>${stock.item_ID}</td>
            <td>${stock.item_name}</td>
            <td>${stock.item_quantity}</td>
            <td>${stock.supplier_source_name}</td>
            <td>${stock.supplier_ID}</td>
            <td>${stock.manager_name}</td>
            <td>
              <button class="delete-stock" data-id="${stock.item_stock_ID}">Delete</button>
            </td>
          `;
          tableBody.appendChild(row);
        });

        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-stock').forEach(button => {
          button.addEventListener('click', function() {
            const stockId = this.dataset.id;
            if (confirm('Are you sure you want to delete this stock entry?')) {
              deleteStock(stockId);
            }
          });
        });
      })
      .catch(error => console.error('Error fetching stock information:', error));
  }

  // Function to delete inventory item
  function deleteInventoryItem(itemId) {
    fetch(`/deleteItem/${itemId}`, { method: 'DELETE' })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert(data.message);
          fetchInventoryItems();
          fetchStockInfo();
        } else {
          alert(`Error: ${data.message}`);
        }
      })
      .catch(error => {
        console.error('Error deleting inventory item:', error);
        alert('An error occurred while deleting the item.');
      });
  }

  // Function to delete stock entry
  function deleteStock(stockId) {
    fetch(`/deleteStock/${stockId}`, { method: 'DELETE' })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert(data.message);
          fetchStockInfo();
          fetchInventoryItems(); // Refresh items to update total stock count
        } else {
          alert(`Error: ${data.message}`);
        }
      })
      .catch(error => {
        console.error('Error deleting stock entry:', error);
        alert('An error occurred while deleting the stock entry.');
      });
  }

  // Function to populate item types dropdown
  function populateItemTypes() {
    fetch('/getItemTypes')
      .then(response => response.json())
      .then(data => {
        const selector = document.getElementById('item_type_select');
        selector.innerHTML = '';
        
        data.forEach(type => {
          const option = document.createElement('option');
          option.value = type.id;
          option.textContent = type.name;
          selector.appendChild(option);
        });
      })
      .catch(error => console.error('Error fetching item types:', error));
  }

  // Function to populate managers and suppliers dropdowns for stock entry
  function populateStockSelectors() {
    // Reuse existing manager data
    fetch('/getItemsAndWorkers')
      .then(response => response.json())
      .then(data => {
        // Populate manager selector
        const managerSelector = document.getElementById('stock_manager_select');
        managerSelector.innerHTML = '';
        
        data.managers.forEach(manager => {
          const option = document.createElement('option');
          option.value = manager.id;
          option.textContent = manager.name;
          managerSelector.appendChild(option);
        });
      })
      .catch(error => console.error('Error fetching managers:', error));
    
    // Get item dropdown for stock entry
    fetch('/getInventoryItems')
      .then(response => response.json())
      .then(data => {
        const itemSelector = document.getElementById('stock_item_select');
        itemSelector.innerHTML = '';
        
        data.forEach(item => {
          const option = document.createElement('option');
          option.value = item.item_ID;
          option.textContent = `${item.item_name} (ID: ${item.item_ID})`;
          itemSelector.appendChild(option);
        });
      })
      .catch(error => console.error('Error fetching items for stock selector:', error));
      
    // Get suppliers
    fetch('/getSuppliers')
      .then(response => response.json())
      .then(data => {
        const supplierIdInput = document.getElementById('stock_supplier_id');
        // Convert to datalist for autocomplete
        let datalistHTML = '<datalist id="supplier_list">';
        data.forEach(supplier => {
          datalistHTML += `<option value="${supplier.id}">${supplier.name}</option>`;
        });
        datalistHTML += '</datalist>';
        
        // Insert datalist after the input
        supplierIdInput.insertAdjacentHTML('afterend', datalistHTML);
        supplierIdInput.setAttribute('list', 'supplier_list');
      })
      .catch(error => console.error('Error fetching suppliers:', error));
  }

  // Function to add a new item
  function addItem() {
    const name = document.getElementById('item_name_input').value.trim();
    const description = document.getElementById('item_description_input').value.trim();
    const price = document.getElementById('item_price_input').value;
    const itemType = document.getElementById('item_type_select').value;
    
    if (!name || !price || !itemType) {
      alert('Please fill in all required fields (name, price, item type)');
      return;
    }
    
    fetch('/addItem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        description,
        price,
        itemType
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert(data.message);
        document.getElementById('item_name_input').value = '';
        document.getElementById('item_description_input').value = '';
        document.getElementById('item_price_input').value = '';
        showPage('content_inventory_stock');
        fetchInventoryItems();
      } else {
        alert(`Error: ${data.message}`);
      }
    })
    .catch(error => {
      console.error('Error adding item:', error);
      alert('An error occurred while adding the item.');
    });
  }

  // Function to add stock
  function addStock() {
    const itemId = document.getElementById('stock_item_select').value;
    const quantity = document.getElementById('stock_quantity').value;
    const managerId = document.getElementById('stock_manager_select').value;
    const supplierId = document.getElementById('stock_supplier_id').value;
    
    if (!itemId || !quantity || !managerId || !supplierId) {
      alert('Please fill in all required fields');
      return;
    }
    
    fetch('/addStock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        itemId,
        quantity,
        managerId,
        supplierId
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert(data.message);
        document.getElementById('stock_quantity').value = '';
        document.getElementById('stock_supplier_id').value = '';
        showPage('content_inventory_stock');
        fetchStockInfo();
        fetchInventoryItems();
      } else {
        alert(`Error: ${data.message}`);
      }
    })
    .catch(error => {
      console.error('Error adding stock:', error);
      alert('An error occurred while adding stock.');
    });
  }

  // Initial page load
  showPage('content_add_order');
  importData();

  // STAFF INFO FUNCTIONALITY
  
  // Function to fetch and display staff info
  function fetchStaffInfo() {
    console.log("Fetching staff info...");
    fetch('/getStaffInfo')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log("Staff data received:", data);
        const tableBody = document.getElementById('staff_info_table').querySelector('tbody');
        tableBody.innerHTML = '';

        if (data.length === 0) {
          const row = document.createElement('tr');
          row.innerHTML = `<td colspan="5">No staff information found</td>`;
          tableBody.appendChild(row);
          return;
        }

        data.forEach(staff => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${staff.staff_id || 'N/A'}</td>
            <td>${staff.worker_name || 'N/A'}</td>
            <td>${staff.age || 'N/A'}</td>
            <td>${staff.phone_Number || 'N/A'}</td>
            <td>
              <button class="view-assigned-orders" data-worker-id="${staff.worker_ID}">View Assigned Orders</button>
              <button class="fire-worker" data-worker-id="${staff.worker_ID}">Fire Worker</button>
            </td>
          `;
          tableBody.appendChild(row);
        });

        // Add event listeners to the view assigned orders buttons
        document.querySelectorAll('.view-assigned-orders').forEach(button => {
          button.addEventListener('click', function() {
            const workerId = this.dataset.workerId;
            showAssignedOrders(workerId);
          });
        });

        // Add event listeners to the fire worker buttons
        document.querySelectorAll('.fire-worker').forEach(button => {
          button.addEventListener('click', function() {
            const workerId = this.dataset.workerId;
            if (confirm('Are you sure you want to fire this worker? This action cannot be undone.')) {
              fireWorker(workerId);
            }
          });
        });
      })
      .catch(error => {
        console.error('Error fetching staff information:', error);
        const tableBody = document.getElementById('staff_info_table').querySelector('tbody');
        tableBody.innerHTML = `<tr><td colspan="5">Error loading staff information: ${error.message}</td></tr>`;
      });
  }

  // Function to show assigned orders
  function showAssignedOrders(workerId) {
    document.querySelector('.view_assigned_orders_popup').classList.add('active');
    
    fetch(`/getAssignedOrders/${workerId}`)
      .then(response => response.json())
      .then(data => {
        const tableBody = document.getElementById('assigned_orders_table').querySelector('tbody');
        tableBody.innerHTML = '';

        if (data.length === 0) {
          const row = document.createElement('tr');
          row.innerHTML = `<td colspan="4">No orders assigned to this worker</td>`;
          tableBody.appendChild(row);
        } else {
          data.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${order.order_ID}</td>
              <td>${order.event_Name}</td>
              <td>${new Date(order.event_date).toLocaleDateString()}</td>
              <td>${new Date(order.end_event_date).toLocaleDateString()}</td>
            `;
            tableBody.appendChild(row);
          });
        }
      })
      .catch(error => console.error('Error fetching assigned orders:', error));
  }

  // Function to fire a worker
  function fireWorker(workerId) {
    fetch(`/fireWorker/${workerId}`, { method: 'DELETE' })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('Worker fired successfully');
          fetchStaffInfo(); // Refresh the staff table
        } else {
          alert(`Error firing worker: ${data.message}`);
        }
      })
      .catch(error => {
        console.error('Error firing worker:', error);
        alert('An error occurred while firing the worker.');
      });
  }

  // Add event listener for return button in assigned orders popup
  document.getElementById('assigned_orders_return').addEventListener('click', function() {
    document.querySelector('.view_assigned_orders_popup').classList.remove('active');
  });

  // Add event listener for add worker button
  document.getElementById('add_worker_btn').addEventListener('click', function() {
    // Populate gender dropdown first
    populateWorkerGenderDropdown();
    document.querySelector('.view_add_worker_popup').classList.add('active');
  });

  // Function to populate gender dropdown in add worker form
  function populateWorkerGenderDropdown() {
    fetch('/getGenders')
      .then(response => response.json())
      .then(data => {
        const selector = document.getElementById('worker_gender');
        selector.innerHTML = '';
        
        data.forEach(gender => {
          const option = document.createElement('option');
          option.value = gender.id;
          option.textContent = gender.name;
          selector.appendChild(option);
        });
      })
      .catch(error => console.error('Error fetching genders:', error));
  }

  // Add event listener for cancel button in add worker popup
  document.getElementById('worker_cancel_btn').addEventListener('click', function() {
    document.querySelector('.view_add_worker_popup').classList.remove('active');
  });

  // Add event listener for save worker button
  document.getElementById('worker_save_btn').addEventListener('click', function() {
    // Validate form fields
    if (!validateWorkerForm()) {
      alert('Please fill in all required fields');
      return;
    }

    // Collect form data
    const workerData = {
      first_name: document.getElementById('worker_first_name').value.trim(),
      middle_name: document.getElementById('worker_middle_name').value.trim(),
      last_name: document.getElementById('worker_last_name').value.trim(),
      phone_number: document.getElementById('worker_phone_number').value.trim(),
      age: document.getElementById('worker_age').value,
      gender: document.getElementById('worker_gender').value,
      password: document.getElementById('worker_password').value
    };

    // Send data to server
    fetch('/addWorker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workerData)
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('Worker added successfully');
        document.querySelector('.view_add_worker_popup').classList.remove('active');
        fetchStaffInfo(); // Refresh the staff table
        clearWorkerForm(); // Clear the form fields
      } else {
        alert(`Error adding worker: ${data.message}`);
      }
    })
    .catch(error => {
      console.error('Error adding worker:', error);
      alert('An error occurred while adding the worker.');
    });
  });

  // Function to validate the worker form
  function validateWorkerForm() {
    const requiredFields = [
      'worker_first_name', 
      'worker_last_name', 
      'worker_phone_number', 
      'worker_age', 
      'worker_gender',
      'worker_password'
    ];

    for (const field of requiredFields) {
      if (!document.getElementById(field).value) {
        return false;
      }
    }
    return true;
  }

  // Function to clear the worker form
  function clearWorkerForm() {
    document.getElementById('worker_first_name').value = '';
    document.getElementById('worker_middle_name').value = '';
    document.getElementById('worker_last_name').value = '';
    document.getElementById('worker_phone_number').value = '';
    document.getElementById('worker_age').value = '';
    document.getElementById('worker_password').value = '';
  }

  // If content_staff_info is active, fetch the staff info
  document.querySelectorAll('.nav-button').forEach(button => {
    button.addEventListener('click', function() {
      const page = this.getAttribute("data-page");
      showPage(page);
      if (page === 'content_staff_info') {
        fetchStaffInfo();
      }
    });
  });

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

  // Back to Active Order button functionality
  const backToActiveOrderButton = document.getElementById('back_to_active_order');
  if (backToActiveOrderButton) {
    backToActiveOrderButton.addEventListener('click', function() {
      showPage('content_active_order');
      fetchActiveOrders(); // Refresh the active orders list
    });
  }

  // When clicking the "Back to Order Info" button on modify item order page
  const backToModifyOrderButton = document.getElementById('back_to_modify_order');
  if (backToModifyOrderButton) {
    backToModifyOrderButton.addEventListener('click', function() {
    showPage('content_modify_order');
  });
  } 

  // Add event listener for the return button in order history view
  document.getElementById('order_history_items_return').addEventListener('click', function() {
    document.querySelector('.view_order_item_history').classList.remove('active');
  });

  const saveModifyOrderButton = document.getElementById('save_modify_order');
  if (saveModifyOrderButton) {
    saveModifyOrderButton.addEventListener('click', saveModifyOrder);
  }

  function getModifiedOrderData(orderId) {
    const getValue = id => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };
  
    return {
      order_id: orderId,
      event_name: getValue('modify_event_name'),
      event_timestamp: getValue('modify_event_timestamp'),
      event_duration: getValue('modify_event_duration') || 1,
      assigned_manager: getValue('modify_assigned_manager'),
      street: getValue('modify_street'),
      barangay: getValue('modify_barangay'),
      city: getValue('modify_city'),
      first_name: getValue('modify_first_name'),
      middle_name: getValue('modify_middle_name'),
      last_name: getValue('modify_last_name'),
      phone_number: getValue('modify_phone_number'),
      age: getValue('modify_age') || 0,
      gender: getValue('modify_gender'),
      extra_fees: getValue('modify_extra_fees') || 0,
      items: getModifiedSelectedItems(),
      workers: getModifiedSelectedWorkers()
    };
  }
  
  function validateModifyForm() {
    const requiredFields = [
      'modify_event_name', 'modify_event_timestamp', 'modify_event_duration', 'modify_assigned_manager',
      'modify_street', 'modify_barangay', 'modify_city', 'modify_first_name', 'modify_last_name',
      'modify_phone_number', 'modify_gender'
    ];
  
    for (const field of requiredFields) {
      if (!document.getElementById(field).value) {
        return false;
      }
    }
  
    const selectedItems = getModifySelectedItems();
    if (selectedItems.length === 0 || !selectedItems.some(item => item.quantity > 0)) {
      return false;
    }
  
    const selectedWorkers = getModifySelectedWorkers();
    if (selectedWorkers.length === 0) {
      return false;
    }
    return true;
  }
  
  function getModifyOrderData() {
    const getValue = id => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };
  
    const orderId = document.getElementById('save_modify_order').getAttribute('data-order-id');
  
    return {
      order_id: orderId,
      event_name: getValue('modify_event_name'),
      event_timestamp: getValue('modify_event_timestamp'),
      event_duration: getValue('modify_event_duration') || 1,
      assigned_manager: getValue('modify_assigned_manager'),
      street: getValue('modify_street'),
      barangay: getValue('modify_barangay'),
      city: getValue('modify_city'),
      first_name: getValue('modify_first_name'),
      middle_name: getValue('modify_middle_name'),
      last_name: getValue('modify_last_name'),
      phone_number: getValue('modify_phone_number'),
      age: getValue('modify_age') || 0,
      gender: getValue('modify_gender'),
      extra_fees: getValue('modify_extra_fees') || 0,
      items: getModifySelectedItems(),
      workers: getModifySelectedWorkers()
    };
  }
  
  function getModifySelectedItems() {
    const items = [];
    // Assuming your modify tables have the same structure and class names as the add order tables
    document.querySelectorAll('#modify_tables_Container .item-quantity, #modify_chairs_Container .item-quantity, #modify_misc_Container .item-quantity')
      .forEach(input => {
        const quantity = parseFloat(input.value) || 0;
        if (quantity > 0) {
          const itemId = input.dataset.id;
          const price = parseFloat(input.dataset.price) || 0;
          items.push({ item_id: itemId, quantity, price });
        }
      });
    return items;
  }
  
  function getModifySelectedWorkers() {
    const workers = [];
    document.querySelectorAll('#modify_workers_Container .worker-select')
      .forEach(checkbox => {
        if (checkbox.checked) {
          workers.push(checkbox.dataset.id);
        }
      });
    return workers;
  }
  
  function getModifiedSelectedItems() {
    return getModifySelectedItems(); // These functions do the same thing now
  }
  
  function saveModifyOrder() {
    if (!validateModifyForm()) {
      alert('Please fill in all required fields and ensure at least one item (with quantity > 0) and one worker are selected.');
      return;
    }
    
    const orderData = getModifyOrderData();
    const orderId = orderData.order_id;
    
    if (!orderId) {
      alert('Could not determine which order to modify.');
      return;
    }
  
    fetch(`/updateOrder/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        alert('Order updated successfully');
        showPage('content_active_order');
        fetchActiveOrders(); // Refresh the active orders list
      } else {
        alert('Error updating order: ' + (data.message || 'Unknown error'));
      }
    })
    .catch(error => {
      console.error('Error updating order:', error);
      alert(error);
      alert('An error occurred while updating the order. Please try again.');
    });
  }

  
  const modifyExtraFeesInput = document.getElementById('modify_extra_fees');
  if (modifyExtraFeesInput) {
    modifyExtraFeesInput.addEventListener('input', updateModifySubtotal);
  }

  // Fix listeners for modify item order page
  function setupModifyItemOrderListeners() {
    // For the tables
    document.querySelectorAll(
      '#modify_tables_Container .item-quantity, #modify_chairs_Container .item-quantity, #modify_misc_Container .item-quantity'
    ).forEach(input => {
      input.addEventListener('input', updateModifySubtotal);
    });
  }

  // Update listeners when switching to modify item order page
  const modifyItemOrderButton = document.getElementById('modify_item_order');
  if (modifyItemOrderButton) {
    modifyItemOrderButton.addEventListener('click', function() {
      showPage('content_modify_item_order');
      setTimeout(function() {
        // Ensure subtotal is updated when page is shown
        updateModifySubtotal();
      }, 100);
    });
  }

  // Also attach listeners right after populating tables
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
        <td class="item-id" data-id="${item.item_ID}">${item.item_name}</td>
        <td class="item-price">${item.item_price}</td>
        <td>${availableStock}</td>
        <td><input type="number" class="item-quantity" min="0" max="${availableStock}" value="${quantity}" data-id="${item.item_ID}" data-price="${item.item_price}"></td>
        <td class="item-subtotal">${(item.item_price * quantity).toFixed(2)}</td>
      `;
      tableBody.appendChild(row);
    });
  
    // Attach event listeners for quantity input to update totals
    tableBody.querySelectorAll('.item-quantity').forEach(input => {
      input.addEventListener('input', function() {
        const max = parseInt(this.getAttribute('max'));
        validateNumericInput(this, 0, max);
        updateModifySubtotal();
      });
      
      input.addEventListener('blur', function() {
        const max = parseInt(this.getAttribute('max'));
        validateNumericInput(this, 0, max);
        updateModifySubtotal();
      });
    });
  }

  // Add event listeners for inventory management buttons
  const addStocksBtn = document.getElementById('add_stocks_btn');
  if (addStocksBtn) {
    addStocksBtn.addEventListener('click', function() {
      populateStockSelectors();
      showPage('view_stock_input');
    });
  }
  
  const addItemBtn = document.getElementById('add_item_btn');
  if (addItemBtn) {
    addItemBtn.addEventListener('click', function() {
      populateItemTypes();
      showPage('view_item_input');
    });
  }
  
  const stockReturnBtn = document.getElementById('stock_return_btn');
  if (stockReturnBtn) {
    stockReturnBtn.addEventListener('click', function() {
      showPage('content_inventory_stock');
    });
  }
  
  const stockSubmitBtn = document.getElementById('stock_submit_btn');
  if (stockSubmitBtn) {
    stockSubmitBtn.addEventListener('click', addStock);
  }
  
  const itemReturnBtn = document.getElementById('item_return_btn');
  if (itemReturnBtn) {
    itemReturnBtn.addEventListener('click', function() {
      showPage('content_inventory_stock');
    });
  }
  
  const itemSubmitBtn = document.getElementById('item_submit_btn');
  if (itemSubmitBtn) {
    itemSubmitBtn.addEventListener('click', addItem);
  }
  
  // 
  if (document.querySelector('.content_inventory_stock.active')) {
    fetchInventoryItems();
    fetchStockInfo();
  }

  // REPLACES USERNAME ON DASHBOARD
  function fetchCurrentUser() {
    fetch('/getCurrentUser')
      .then(response => response.json())
      .then(data => {
        if (data.loggedIn) {
          const usernameElement = document.getElementById('dashboard_Username');
          if (usernameElement) {
            usernameElement.textContent = data.userName;
          }
        } else {
          window.location.href = '/login';
        }
      })
      .catch(error => {
        console.error('Error fetching user information:', error);
      });
  }

  // CALLS FUNCTION TO REPLACE USERNAME ON STARTUP
  fetchCurrentUser();

  // Add validation for event duration in add order form
  const eventDurationElement = document.getElementById('event_duration');
  if (eventDurationElement) {
    eventDurationElement.addEventListener('input', function() {
      validateNumericInput(this, 1, 60);
      updateSubtotal();
    });
    
    eventDurationElement.addEventListener('blur', function() {
      validateNumericInput(this, 1, 60);
      updateSubtotal();
    });
  }

  // Add validation for event duration in modify order form
  const modifyEventDurationInput = document.getElementById('modify_event_duration');
  if (modifyEventDurationInput) {
    modifyEventDurationInput.addEventListener('input', function() {
      validateNumericInput(this, 1, 60);
      updateModifySubtotal();
    });
    
    modifyEventDurationInput.addEventListener('blur', function() {
      validateNumericInput(this, 1, 60);
      updateModifySubtotal();
    });
  }

});

