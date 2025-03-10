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
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
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
            showValidationMessage('Login successful', true);
            setTimeout(() => {
              window.location.href = data.redirectUrl;
            }, 1000); // Redirect after 1 second
          } else {
            showValidationMessage('Invalid login credentials', false);
          }
        })
        .catch(error => {
          console.error('There was a problem with the fetch operation:', error);
          showValidationMessage('An error occurred. Please try again later.', false);
        });
      });
    }

    // Function to show validation message
    function showValidationMessage(message, isSuccess = false) {
        const messageElement = document.getElementById('validationMessage');
        messageElement.textContent = message;
        messageElement.style.display = 'block';
        messageElement.style.color = isSuccess ? '#0c9041' : '#b63f3f';
    }

    function showPage(pageId) {
        // Hide all sections
        document.querySelectorAll("main > section").forEach(section => {
            section.style.display = "none";
        });
    
        // Show the selected section
        const activeSection = document.querySelector(`.${pageId}`);
        if (activeSection) {
            activeSection.style.display = "grid"; // or "block" depending on layout
        } else {
            console.error(`Section with class '${pageId}' not found.`);
        }
    
        // Update panel title
        const panelTitle = document.getElementById("panel-title");
        if (panelTitle) {
            panelTitle.textContent = pageId.replace("content_", "").replace("_", " ").toUpperCase();
        }
    }

    //Navigation Buttons
    document.querySelectorAll(".nav-button").forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll(".nav-button").forEach(btn => btn.classList.remove("active"));
            this.classList.add("active");

            const page = this.getAttribute("data-page");
            showPage(page);

            if (page === 'content_add_order') {
                importData();
            }
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
                const { items, workers, managers, genders, suppliers, selector} = data;

                // Aggregate item quantities by item ID
                const aggregateQuantities = items => {
                    const itemMap = new Map();
                    items.forEach(item => {
                        if (itemMap.has(item.id)) {
                            itemMap.get(item.id).item_quantity += item.item_quantity;
                        } else {
                            itemMap.set(item.id, { ...item });
                        }
                    });
                    return Array.from(itemMap.values());
                };

                // Populate item tables
                populateTable(aggregateQuantities(items.tables), 'tables_Container');
                populateTable(aggregateQuantities(items.chairs), 'chairs_Container');
                populateTable(aggregateQuantities(items.miscellaneous), 'misc_Container');

                // Populate workers table
                populateWorkersTable(workers, 'workers_Container');

                // Populate manager selector
                populateSelector(managers, 'assigned_manager');
                populateSelector(managers, 'modify_assigned_manager');
                populateSelector(managers, 'stock_manager_select');
                populateSelector(managers, 'worker_manager');

                // Populate gender selector
                populateSelector(genders, 'gender');
                populateSelector(genders, 'modify_gender');
                populateSelector(genders, 'worker_gender');

                             
                // POPULATE STOCK SUPPLIERS
                populateSelector(suppliers, 'stock_supplier_id');

                // Populate stock item selector

                populateSelector(selector, 'stock_item_select');
            })
            .catch(error => console.error('Error importing data:', error));
    }

    

    function populateTable(items, tableId) {
        const tableBody = document.getElementById(tableId).querySelector('tbody');
        tableBody.innerHTML = '';

        items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="item-id" data-id="${item.id}">${item.item_name}</td>
                <td class="item-price">${item.item_price}</td>
                <td>${item.item_quantity}</td>
                <td>
                    <button class="quantity-btn minus">-</button>
                    <input type="number" class="item-quantity" min="0" max="${item.item_quantity}" value="0" data-id="${item.id}" data-price="${item.item_price}" style="background: none;">
                    <button class="quantity-btn plus">+</button>
                </td>
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

        // Add event listeners for plus and minus buttons
        tableBody.querySelectorAll('.quantity-btn').forEach(button => {
            button.addEventListener('click', function() {
                const input = this.parentElement.querySelector('.item-quantity');
                let value = parseInt(input.value) || 0;
                if (this.classList.contains('plus')) {
                    value++;
                } else if (this.classList.contains('minus')) {
                    value = Math.max(0, value - 1);
                }
                input.value = value;
                input.dispatchEvent(new Event('input'));
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
            option.textContent = item.name || item.item_name; // Ensure text is set correctly
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
        
        // Get event duration for modify order form (use explicit ID)
        let eventDuration = parseFloat(document.getElementById('modify_event_duration').value) || 1;
        
        const subtotalPrice = subtotal * eventDuration;
        
        // Get extra fees from the modify order extra fees input (use explicit ID)
        let extraFees = parseFloat(document.getElementById('modify_extra_fees').value) || 0;
        
        const totalPrice = subtotalPrice + extraFees;
        
        // Update the modify order form subtotal and total (fix ID discrepancies)
        const subtotalElements = document.querySelectorAll(
            '#modify_subtotal_Price'
        );
        
        subtotalElements.forEach(element => {
            if (element) element.textContent = subtotalPrice.toFixed(2);
        });
        
        const totalElements = document.querySelectorAll(
            '#modify_total_Price'
        );
        
        totalElements.forEach(element => {
            if (element) element.textContent = totalPrice.toFixed(2);
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
                        <td class="horizontal-button-container">
                            <button class="icon-button view-order" data-id="${order.order_ID}">
                                <i class="fa-solid fa-eye"></i>
                                <span class="tooltip">View Order</span>
                            </button>
                            <button class="icon-button modify-order" data-id="${order.order_ID}">
                                <i class="fa-solid fa-pen-to-square"></i>
                                <span class="tooltip">Modify Order</span>
                            </button>
                            <button class="icon-button cancel-order" data-id="${order.order_ID}">
                                <i class="fa-solid fa-ban"></i>
                                <span class="tooltip">Cancel Order</span>
                            </button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });

                // Add event listeners for buttons
                document.querySelectorAll('.view-order').forEach(button => {
                    button.addEventListener('click', function() {
                        const orderId = this.dataset.id;
                        fetchOrderItems(orderId);
                        document.querySelector('.view_order_item_popup').classList.add('active');
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

                // Update the view order button event listeners
                document.querySelectorAll('.view-order').forEach(button => {
                    button.addEventListener('click', function() {
                        const orderId = this.dataset.id;
                        fetchOrderItems(orderId);
                        document.querySelector('.view_order_item_popup').classList.add('active');
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
                    fetchActiveOrders();    // Refresh the active orders list
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
                
                // Aggregate item quantities by item ID
                const aggregateQuantities = items => {
                    const itemMap = new Map();
                    items.forEach(item => {
                        if (itemMap.has(item.item_ID)) {
                            itemMap.get(item.item_ID).available_stock += item.available_stock;
                        } else {
                            itemMap.set(item.item_ID, { ...item });
                        }
                    });
                    return Array.from(itemMap.values());
                };

                // Populate modify item tables
                populateModifyTable(aggregateQuantities(itemsByType.tables), 'modify_tables_Container');
                populateModifyTable(aggregateQuantities(itemsByType.chairs), 'modify_chairs_Container');
                populateModifyTable(aggregateQuantities(itemsByType.misc), 'modify_misc_Container');
                
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
                        <td>${order.event_date}</td>
                        <td>${order.end_event_date}</td>
                        <td>${order.total_amount}</td>
                        <td>${order.order_status}</td>
                        <td>${order.manager_name}</td>
                        <td>${order.address}</td>
                        <td>
                            <div class="horizontal-button-container">
                                <button class="icon-button view-history-order" data-id="${order.order_ID}">
                                    <i class="fa-solid fa-eye"></i>
                                    <span class="tooltip">View Order</span>
                                </button>
                                <button class="icon-button delete-history-order" data-id="${order.order_ID}">
                                    <i class="fa-solid fa-trash"></i>
                                    <span class="tooltip">Delete Order</span>
                                </button>
                            </div>
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
                            <div class="single-button-container">
                                <button class="icon-button delete-item" data-id="${item.item_ID}">
                                    <i class="fas fa-trash-alt"></i>
                                    <span class="tooltip">Delete Item</span>
                                </button>
                            </div>
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
                            <div class="single-button-container">
                                <button class="icon-button delete-stock" data-id="${stock.item_stock_ID}">
                                    <i class="fas fa-trash-alt"></i>
                                    <span class="tooltip">Delete Stock</span>
                                </button>
                            </div>
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


    // Function to add a new item
    function addItem() {
        const name = document.getElementById('item_name_input').value.trim();
        const description = document.getElementById('item_description_input').value.trim();
        const price = document.getElementById('item_price_input').value;
        const itemType = document.getElementById('item_type_select').value;
        
        if (!name || !price || !itemType) {
            alert('Please fill in all required fields.');
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
                alert('Item added successfully.');
                fetchInventoryItems();
            } else {
                alert('Error adding item: ' + data.message);
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
        // Call a new combined function to populate all dropdown fields
        populateWorkerForm();
        document.querySelector('.view_add_worker_popup').classList.add('active');
    });

    // New function to populate worker form dropdowns with both gender and manager data


    // Add event listener for cancel button in add worker popup
    document.getElementById('worker_cancel_btn').addEventListener('click', function() {
        document.querySelector('.view_add_worker_popup').classList.remove('active');
    });

    // Function to validate the worker form
    function validateWorkerForm() {
        const requiredFields = [
            'worker_first_name', 
            'worker_last_name', 
            'worker_phone_number', 
            'worker_age', 
            'worker_gender',
            'worker_manager',
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
        document.getElementById('worker_gender').value = '';
        document.getElementById('worker_manager').value = '';
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

    function setupModifyItemOrderListeners() {

        document.querySelectorAll(
            '#modify_tables_Container .item-quantity, #modify_chairs_Container .item-quantity, #modify_misc_Container .item-quantity'
        ).forEach(input => {
            // Remove any existing listeners to avoid duplicates
            const oldElement = input.cloneNode(true);
            input.parentNode.replaceChild(oldElement, input);
            

            oldElement.addEventListener('input', updateModifySubtotal);
            oldElement.addEventListener('blur', function() {
                const max = parseInt(this.getAttribute('max'));
                validateNumericInput(this, 0, max);
                updateModifySubtotal();
            });
        });
    }


    const modifyItemOrderButton = document.getElementById('modify_item_order');
    if (modifyItemOrderButton) {
        modifyItemOrderButton.addEventListener('click', function() {
            showPage('content_modify_item_order');
            setTimeout(function() {

                setupModifyItemOrderListeners();

                updateModifySubtotal();
            }, 100);
        });
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

    // Add event listeners for inventory management buttons
    const addStocksBtn = document.getElementById('add_stocks_btn');
    if (addStocksBtn) {
        addStocksBtn.addEventListener('click', function() {
            document.querySelector('.view_stock_input_popup').classList.add('active');
        });
    }
    
    const addItemBtn = document.getElementById('add_item_btn');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', function() {
            populateItemTypes();
            document.querySelector('.view_item_input_popup').classList.add('active');
        });
    }
    
    const stockReturnBtn = document.getElementById('stock_return_btn');
    if (stockReturnBtn) {
        stockReturnBtn.addEventListener('click', function() {
            document.querySelector('.view_stock_input_popup').classList.remove('active');
        });
    }
    
    const itemReturnBtn = document.getElementById('item_return_btn');
    if (itemReturnBtn) {
        itemReturnBtn.addEventListener('click', function() {
            document.querySelector('.view_item_input_popup').classList.remove('active');
        });
    }
    
    const stockSubmitBtn = document.getElementById('stock_submit_btn');
    if (stockSubmitBtn) {
        stockSubmitBtn.addEventListener('click', addStock);
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
            console.log('Input event duration:', this.value);
            updateModifySubtotal();
        });
        
        modifyEventDurationInput.addEventListener('blur', function() {
            validateNumericInput(this, 1, 60);
            updateModifySubtotal();
        });
    }







    // Modify the add worker button event listener to populate both gender and manager dropdowns
    document.getElementById('add_worker_btn').addEventListener('click', function() {
        document.querySelector('.view_add_worker_popup').classList.add('active');
    });

    // Function to populate worker form dropdowns

    // Update the validateWorkerForm function to include manager field validation
    function validateWorkerForm() {
        const requiredFields = [
            'worker_first_name', 
            'worker_last_name', 
            'worker_phone_number', 
            'worker_age', 
            'worker_gender',
            'worker_manager',
            'worker_password'
        ];

        for (const field of requiredFields) {
            if (!document.getElementById(field).value) {
                return false;
            }
        }
        return true;
    }

    // Update the worker_save_btn event listener to include manager ID
    document.getElementById('worker_save_btn').addEventListener('click', function() {
        const password = document.getElementById('worker_password').value;
        const confirmPassword = document.getElementById('worker_confirm_password').value;
        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        if (!validateWorkerForm()) {
            alert('Please fill in all required fields.');
            return;
        }

        // Collect form data including manager
        const workerData = {
            first_name: document.getElementById('worker_first_name').value.trim(),
            middle_name: document.getElementById('worker_middle_name').value.trim(),
            last_name: document.getElementById('worker_last_name').value.trim(),
            phone_number: document.getElementById('worker_phone_number').value.trim(),
            age: document.getElementById('worker_age').value,
            gender: document.getElementById('worker_gender').value,
            manager_id: document.getElementById('worker_manager').value,
            password: password
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

    // Update the clearWorkerForm function to clear manager field
    function clearWorkerForm() {
        document.getElementById('worker_first_name').value = '';
        document.getElementById('worker_middle_name').value = '';
        document.getElementById('worker_last_name').value = '';
        document.getElementById('worker_phone_number').value = '';
        document.getElementById('worker_age').value = '';
        document.getElementById('worker_gender').value = '';
        document.getElementById('worker_manager').value = '';
        document.getElementById('worker_password').value = '';
    }

    // Add event listener for show password checkbox
    document.getElementById('show_password').addEventListener('change', function() {
        const passwordField = document.getElementById('worker_password');
        const confirmPasswordField = document.getElementById('worker_confirm_password');
        if (this.checked) {
            passwordField.type = 'text';
            confirmPasswordField.type = 'text';
        } else {
            passwordField.type = 'password';
            confirmPasswordField.type = 'password';
        }
    });

    // PAYMENT ORDER FUNCTIONALITY
    
    // Function to fetch payment order data
    function fetchPaymentOrders() {
        fetch('/getPaymentOrders')
            .then(response => response.json())
            .then(data => {
                const tableBody = document.getElementById('payment_order_table').querySelector('tbody');
                tableBody.innerHTML = '';

                data.forEach(order => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${order.finance_ID}</td>
                        <td>${order.order_ID}</td>
                        <td>${order.customer_name}</td>
                        <td>${order.event_date}</td>
                        <td>${order.end_event_date}</td>
                        <td>${parseFloat(order.item_subtotal).toFixed(2)}</td>
                        <td>${parseFloat(order.extra_fees).toFixed(2)}</td>
                        <td>${parseFloat(order.liabilities).toFixed(2)}</td>
                        <td>${parseFloat(order.total_amount).toFixed(2)}</td>
                        <td>${parseFloat(order.balance).toFixed(2)}</td>
                        <td class="button-container">
                            <button class="icon-button create-transaction" data-id="${order.finance_ID}" data-orderid="${order.order_ID}" data-balance="${order.balance}">
                                <i class="fa-solid fa-file-circle-plus"></i>
                                <span class="tooltip">Create Transaction</span>
                            </button>
                            <button class="icon-button add-liability" data-id="${order.finance_ID}" data-orderid="${order.order_ID}">
                                <i class="fa-solid fa-sack-xmark"></i>
                                <span class="tooltip">Add Liability</span>
                            </button>
                            <button class="icon-button view-transactions" data-id="${order.finance_ID}" data-orderid="${order.order_ID}">
                                <i class="fa-solid fa-file-circle-check"></i>
                                <span class="tooltip">View Transactions</span>
                            </button>
                            <button class="icon-button view-liabilities" data-id="${order.finance_ID}" data-orderid="${order.order_ID}">
                                <i class="fa-solid fa-file-invoice-dollar"></i>
                                <span class="tooltip">View Liabilities</span>
                            </button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });

                // Add event listeners to buttons
                addPaymentButtonListeners();
            })
            .catch(error => console.error('Error fetching payment orders:', error));
    }

    // Function to add event listeners to payment order buttons
    function addPaymentButtonListeners() {
        // Create Transaction button
        document.querySelectorAll('.create-transaction').forEach(button => {
            button.addEventListener('click', function() {
                const financeId = this.dataset.id;
                const orderId = this.dataset.orderid;
                const balance = this.dataset.balance;
                fetchPaymentTypes();
                document.getElementById('transaction_order_id').value = orderId;
                const paymentAmountInput = document.getElementById('payment_amount');
                paymentAmountInput.max = balance;
                paymentAmountInput.value = balance;
                
                document.getElementById('submit_transaction_btn').dataset.financeId = financeId;
                
                // Show the popup
                document.querySelector('.view_create_transaction_popup').classList.add('active');
            });
        });
    
        // Add Liability button
        document.querySelectorAll('.add-liability').forEach(button => {
            button.addEventListener('click', function() {
                const financeId = this.dataset.id;
                const orderId = this.dataset.orderid;
                fetchOrderItemsForLiability(orderId);
                document.getElementById('submit_liability_btn').dataset.financeId = financeId;
                document.querySelector('.view_add_liability_popup').classList.add('active');
            });
        });
    
        // View Transactions button
        document.querySelectorAll('.view-transactions').forEach(button => {
            button.addEventListener('click', function() {
                const financeId = this.dataset.id;
                fetchTransactions(financeId);
                document.querySelector('.view_transactions_popup').classList.add('active');
            });
        });
    
        // View Liabilities button
        document.querySelectorAll('.view-liabilities').forEach(button => {
            button.addEventListener('click', function() {
                const financeId = this.dataset.id;
                fetchLiabilities(financeId);
                document.querySelector('.view_liabilities_popup').classList.add('active');
            });
        });
    }

    // Function to fetch payment types for dropdown
    function fetchPaymentTypes() {
        fetch('/getPaymentTypes')
            .then(response => response.json())
            .then(data => {
                const selector = document.getElementById('payment_type');
                selector.innerHTML = '';
                
                data.forEach(type => {
                    const option = document.createElement('option');
                    option.value = type.id;
                    option.textContent = type.name;
                    selector.appendChild(option);
                });
            })
            .catch(error => console.error('Error fetching payment types:', error));
    }

    // Function to fetch order items for liability dropdown
    function fetchOrderItemsForLiability(orderId) {
        fetch(`/getOrderItemsForLiability/${orderId}`)
            .then(response => response.json())
            .then(data => {
                const selector = document.getElementById('liability_item_id');
                selector.innerHTML = '';
                
                data.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.item_ID;
                    option.textContent = item.item_name;
                    option.dataset.maxQuantity = item.item_quantity;
                    selector.appendChild(option);
                });
                
                // Add change event to update max quantity
                selector.addEventListener('change', function() {
                    const selectedOption = this.options[this.selectedIndex];
                    if (selectedOption) {
                        const maxQuantity = selectedOption.dataset.maxQuantity;
                        const quantityInput = document.getElementById('liability_quantity');
                        quantityInput.max = maxQuantity;
                        quantityInput.value = maxQuantity > 0 ? 1 : 0;
                    }
                });
                
                // Trigger change event to set initial max quantity
                if (selector.options.length > 0) {
                    selector.dispatchEvent(new Event('change'));
                }
            })
            .catch(error => console.error('Error fetching order items for liability:', error));
    }

    // Function to fetch transactions for a finance ID
    function fetchTransactions(financeId) {
        fetch(`/getTransactions/${financeId}`)
            .then(response => response.json())
            .then(data => {
                const tableBody = document.getElementById('transactions_table').querySelector('tbody');
                tableBody.innerHTML = '';

                let totalPayment = 0;
                data.transactions.forEach(transaction => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${transaction.payment_type}</td>
                        <td>${transaction.payment_amount}</td>
                        <td>${transaction.payment_Reference_No}</td>
                        <td>${transaction.date_of_payment}</td>
                        <td class="single-button-container">
                            <button class="icon-button delete-transaction" data-finance-id="${transaction.finance_ID}" data-payment-amount="${transaction.payment_amount}">
                                <i class="fa-solid fa-trash-can"></i>
                                <span class="tooltip">Delete Transaction</span>
                            </button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                    totalPayment += parseFloat(transaction.payment_amount);
                });

                document.getElementById('total_payment_amount').textContent = totalPayment.toFixed(2);

                document.querySelectorAll('.delete-transaction').forEach(button => {
                    button.addEventListener('click', function() {
                        const financeId = this.getAttribute('data-finance-id');
                        const paymentAmount = this.getAttribute('data-payment-amount');
                        deleteTransaction(financeId, paymentAmount);
                    });
                });
            })
            .catch(error => console.error('Error fetching transactions:', error));
    }

    // Function to fetch liabilities for a finance ID
    function fetchLiabilities(financeId) {
        fetch(`/getLiabilities/${financeId}`)
            .then(response => response.json())
            .then(data => {
                const tableBody = document.getElementById('liabilities_table').querySelector('tbody');
                tableBody.innerHTML = '';

                let totalLiability = 0;
                data.forEach(liability => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${liability.liability_title}</td>
                        <td>${liability.item_name}</td>
                        <td>${liability.item_quantity}</td>
                        <td>${liability.liability_amount}</td>
                        <td>${liability.liability_description}</td>
                        <td>${liability.liability_date}</td>
                        <td class="single-button-container">
                            <button class="icon-button delete-liability" data-finance-id="${liability.finance_ID}" data-liability-title="${liability.liability_title}">
                                <i class="fa-solid fa-trash-can"></i>
                                <span class="tooltip">Delete Liability</span>
                            </button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                    totalLiability += parseFloat(liability.liability_amount);
                });

                document.getElementById('total_liability_amount').textContent = totalLiability.toFixed(2);

                document.querySelectorAll('.delete-liability').forEach(button => {
                    button.addEventListener('click', function() {
                        const financeId = this.getAttribute('data-finance-id');
                        const liabilityTitle = this.getAttribute('data-liability-title');
                        deleteLiability(financeId, liabilityTitle);
                    });
                });
            })
            .catch(error => console.error('Error fetching liabilities:', error));
    }

    function deleteTransaction(financeId, paymentAmount) {
        if (!financeId) {
            console.error('Finance ID is undefined');
            return;
        }
    
        if (confirm('Are you sure you want to delete this transaction?')) {
            fetch(`/deleteTransaction/${financeId}/${paymentAmount}`, { method: 'DELETE' })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('Transaction deleted successfully');
                        fetchTransactions(financeId);
                    } else {
                        alert('Error deleting transaction: ' + (data.message || 'Unknown error'));
                    }
                })
                .catch(error => {
                    console.error('Error deleting transaction:', error);
                    alert('An error occurred while deleting the transaction.');
                });
        }
    }

    function deleteLiability(financeId, liabilityTitle) {
        if (!financeId) {
            console.error('Finance ID is undefined');
            return;
        }
    
        if (confirm('Are you sure you want to delete this liability?')) {
            fetch(`/deleteLiability/${financeId}/${liabilityTitle}`, { method: 'DELETE' })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('Liability deleted successfully');
                        fetchLiabilities(financeId);
                    } else {
                        alert('Error deleting liability: ' + (data.message || 'Unknown error'));
                    }
                })
                .catch(error => {
                    console.error('Error deleting liability:', error);
                    alert('An error occurred while deleting the liability.');
                });
        }
    }

    // Function to validate transaction form
    function validateTransactionForm() {
        const paymentAmount = parseFloat(document.getElementById('payment_amount').value);
        const paymentType = document.getElementById('payment_type').value;
        const maxAmount = parseFloat(document.getElementById('payment_amount').max);
        
        if (!paymentType) {
            alert('Please select a payment type');
            return false;
        }
        
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            alert('Please enter a valid payment amount (greater than 0)');
            return false;
        }
        
        if (paymentAmount > maxAmount) {
            alert(`Maximum payment amount is ${maxAmount}`);
            return false;
        }
        
        return true;
    }

    // Function to validate liability form
    function validateLiabilityForm() {
        const title = document.getElementById('liability_title').value.trim();
        const itemId = document.getElementById('liability_item_id').value;
        const quantity = parseInt(document.getElementById('liability_quantity').value);
        const amount = parseFloat(document.getElementById('liability_amount').value);
        const description = document.getElementById('liability_description').value.trim();
        const date = document.getElementById('liability_date').value;
        
        if (!title) {
            alert('Please enter a liability title');
            return false;
        }
        
        if (!itemId) {
            alert('Please select an item');
            return false;
        }
        
        if (isNaN(quantity) || quantity <= 0) {
            alert('Please enter a valid quantity (greater than 0)');
            return false;
        }
        
        const maxQuantity = parseInt(document.getElementById('liability_item_id').options[
            document.getElementById('liability_item_id').selectedIndex
        ].dataset.maxQuantity);
        
        if (quantity > maxQuantity) {
            alert(`Maximum quantity is ${maxQuantity}`);
            return false;
        }
        
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount (greater than 0)');
            return false;
        }
        
        if (!description) {
            alert('Please enter a description');
            return false;
        }
        
        if (!date) {
            alert('Please select a date');
            return false;
        }
        
        return true;
    }

    // Add event listeners for the payment forms
    document.getElementById('submit_transaction_btn').addEventListener('click', function() {
        if (!validateTransactionForm()) {
            return;
        }
        
        const financeId = this.dataset.financeId;
        const paymentTypeId = document.getElementById('payment_type').value;
        const paymentAmount = document.getElementById('payment_amount').value;
        const referenceNumber = document.getElementById('payment_reference').value;
        
        fetch('/addTransaction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                financeId,
                paymentTypeId,
                paymentAmount,
                referenceNumber
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                document.querySelector('.view_create_transaction_popup').classList.remove('active');
                fetchPaymentOrders(); // Refresh the payment orders table
            } else {
                alert(`Error: ${data.message}`);
            }
        })
        .catch(error => {
            console.error('Error adding transaction:', error);
            alert('An error occurred while adding the transaction.');
        });
    });

    document.getElementById('submit_liability_btn').addEventListener('click', function() {
        if (!validateLiabilityForm()) {
            return;
        }
        
        const financeId = this.dataset.financeId;
        const title = document.getElementById('liability_title').value;
        const itemId = document.getElementById('liability_item_id').value;
        const quantity = document.getElementById('liability_quantity').value;
        const amount = document.getElementById('liability_amount').value;
        const description = document.getElementById('liability_description').value;
        const date = document.getElementById('liability_date').value;
        const managerId = document.getElementById('liability_manager_id').value;
        
        fetch('/addLiability', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                financeId,
                title,
                itemId,
                quantity,
                amount,
                description,
                date,
                managerId
            }) // Removed orderId from payload
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                document.querySelector('.view_add_liability_popup').classList.remove('active');
                fetchPaymentOrders(); // Refresh the payment orders table
            } else {
                alert(`Error: ${data.message}`);
            }
        })
        .catch(error => {
            console.error('Error adding liability:', error);
            alert('An error occurred while adding the liability.');
        });
    });

    // Add input validation for payment amount
    document.getElementById('payment_amount').addEventListener('input', function() {
        const max = parseFloat(this.max) || 1000000;
        validateNumericInput(this, 1, max);
    });

    // Add input validation for liability quantity
    document.getElementById('liability_quantity').addEventListener('input', function() {
        const max = parseFloat(this.max) || 1000;
        validateNumericInput(this, 1, max);
    });

    // Add input validation for liability amount
    document.getElementById('liability_amount').addEventListener('input', function() {
        validateNumericInput(this, 1, 1000000);
    });

    // Add event listeners for popup buttons
    document.getElementById('cancel_transaction_btn').addEventListener('click', function() {
        document.querySelector('.view_create_transaction_popup').classList.remove('active');
    });

    document.getElementById('cancel_liability_btn').addEventListener('click', function() {
        document.querySelector('.view_add_liability_popup').classList.remove('active');
    });

    document.getElementById('transactions_return_btn').addEventListener('click', function() {
        document.querySelector('.view_transactions_popup').classList.remove('active');
        fetchPaymentOrders(); // Refresh payment orders after closing
    });

    document.getElementById('liabilities_return_btn').addEventListener('click', function() {
        document.querySelector('.view_liabilities_popup').classList.remove('active');
        fetchPaymentOrders(); // Refresh payment orders after closing
    });



    // Load payment orders when the page is shown
    document.querySelectorAll('.nav-button').forEach(button => {
        button.addEventListener('click', function() {
            const page = this.getAttribute("data-page");
            if (page === 'content_payment_order') {
                fetchPaymentOrders();
            }
        });
    });

    // Update popup show/hide functions
    if (addStocksBtn) {
        addStocksBtn.addEventListener('click', function() {
            document.querySelector('.view_stock_input_popup').classList.add('active');
        });
    }
    
    if (addItemBtn) {
        addItemBtn.addEventListener('click', function() {
            populateItemTypes();
            document.querySelector('.view_item_input_popup').classList.add('active');
        });
    }
    
    if (stockReturnBtn) {
        stockReturnBtn.addEventListener('click', function() {
            document.querySelector('.view_stock_input_popup').classList.remove('active');
        });
    }
    
    if (itemReturnBtn) {
        itemReturnBtn.addEventListener('click', function() {
            document.querySelector('.view_item_input_popup').classList.remove('active');
        });
    }

    // Updated worker popup functionality
    document.getElementById('add_worker_btn').addEventListener('click', function() {
        // Reset form before showing
        clearWorkerForm();
        // Populate dropdowns 
        fetch('/getWorkerFormData')
            .then(response => response.json())
            .then(data => {
                const { managers, genders } = data;
                populateSelector(genders, 'worker_gender');
                populateSelector(managers, 'worker_manager');
                document.querySelector('.view_add_worker_popup').classList.add('active');
            })
            .catch(error => {
                console.error('Error fetching worker form data:', error);
                alert('Error loading form data. Please try again.');
            });
    });

    document.getElementById('worker_save_btn').addEventListener('click', function() {
        if (!validateWorkerForm()) {
            return;
        }

        const workerData = {
            first_name: document.getElementById('worker_first_name').value.trim(),
            middle_name: document.getElementById('worker_middle_name').value.trim(),
            last_name: document.getElementById('worker_last_name').value.trim(),
            phone_number: document.getElementById('worker_phone_number').value.trim(),
            age: parseInt(document.getElementById('worker_age').value),
            gender: document.getElementById('worker_gender').value,
            manager_id: document.getElementById('worker_manager').value,
            password: document.getElementById('worker_password').value
        };

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
                fetchStaffInfo(); // Refresh staff table
            } else {
                alert(data.message || 'Error adding worker');
            }
        })
        .catch(error => {
            console.error('Error adding worker:', error);
            alert('An error occurred while adding the worker');
        });
    });

    function validateWorkerForm() {
        const requiredFields = [
            { id: 'worker_first_name', label: 'First Name' },
            { id: 'worker_last_name', label: 'Last Name' },
            { id: 'worker_phone_number', label: 'Phone Number' },
            { id: 'worker_age', label: 'Age' },
            { id: 'worker_gender', label: 'Gender' },
            { id: 'worker_manager', label: 'Manager' },
            { id: 'worker_password', label: 'Password' },
            { id: 'worker_confirm_password', label: 'Confirm Password' }
        ];

        for (const field of requiredFields) {
            const element = document.getElementById(field.id);
            const value = element.value.trim();
            if (!value) {
                alert(`Please enter ${field.label}`);
                element.focus();
                return false;
            }
        }

        const age = parseInt(document.getElementById('worker_age').value);
        if (isNaN(age) || age < 18) {
            alert('Worker must be at least 18 years old');
            return false;
        }

        const password = document.getElementById('worker_password').value;
        const confirmPassword = document.getElementById('worker_confirm_password').value;
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return false;
        }

        // Add phone number validation
        const phoneNumber = document.getElementById('worker_phone_number').value;
        const phoneRegex = /^\d{11}$/;  // Assumes 11-digit phone number
        if (!phoneRegex.test(phoneNumber)) {
            alert('Please enter a valid 11-digit phone number');
            return false;
        }

        return true;
    }

    function clearWorkerForm() {
        const fields = [
            'worker_first_name',
            'worker_middle_name',
            'worker_last_name',
            'worker_phone_number',
            'worker_age',
            'worker_gender',
            'worker_manager',
            'worker_password',
            'worker_confirm_password'
        ];
        
        fields.forEach(field => {
            document.getElementById(field).value = '';
        });
    }

// Update the add worker button event listener
document.getElementById('add_worker_btn').addEventListener('click', function() {
    clearWorkerForm(); // Reset form
    
    // We can use the existing data from getItemsAndWorkers instead
    fetch('/getItemsAndWorkers')
        .then(response => response.json())
        .then(data => {
            const { managers, genders } = data;
            
            // Populate gender dropdown
            const genderSelect = document.getElementById('worker_gender');
            genderSelect.innerHTML = '';
            genders.forEach(gender => {
                const option = document.createElement('option');
                option.value = gender.id;
                option.textContent = gender.name;
                genderSelect.appendChild(option);
            });
            
            // Populate manager dropdown
            const managerSelect = document.getElementById('worker_manager');
            managerSelect.innerHTML = '';
            managers.forEach(manager => {
                const option = document.createElement('option');
                option.value = manager.id;
                option.textContent = manager.name;
                managerSelect.appendChild(option);
            });
            
            // Show the popup
            document.querySelector('.view_add_worker_popup').classList.add('active');
        })
        .catch(error => {
            console.error('Error loading form data:', error);
            alert('Error loading form data. Please try again.');
        });
});

    // Remove any duplicate event listeners
    document.getElementById('add_worker_btn').replaceWith(document.getElementById('add_worker_btn').cloneNode(true));
    
    // Update the add worker button event listener to use existing data
    document.getElementById('add_worker_btn').addEventListener('click', function() {
        clearWorkerForm(); // Reset form
        fetch('/getItemsAndWorkers')
            .then(response => response.json())
            .then(data => {
                const { managers, genders } = data;
                populateSelector(genders, 'worker_gender');
                populateSelector(managers, 'worker_manager');
                document.querySelector('.view_add_worker_popup').classList.add('active');
            })
            .catch(error => {
                console.error('Error loading form data:', error);
                alert('Error loading form data. Please try again.');
            });
    });

    // Remove duplicate worker save button listener
    document.getElementById('worker_save_btn').replaceWith(document.getElementById('worker_save_btn').cloneNode(true));
    
    // Single event listener for saving worker
    document.getElementById('worker_save_btn').addEventListener('click', function() {
        if (!validateWorkerForm()) {
            return;
        }

        const workerData = {
            first_name: document.getElementById('worker_first_name').value.trim(),
            middle_name: document.getElementById('worker_middle_name').value.trim(),
            last_name: document.getElementById('worker_last_name').value.trim(),
            phone_number: document.getElementById('worker_phone_number').value.trim(),
            age: parseInt(document.getElementById('worker_age').value),
            gender: document.getElementById('worker_gender').value,
            manager_id: document.getElementById('worker_manager').value,
            password: document.getElementById('worker_password').value
        };

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
                fetchStaffInfo(); // Refresh staff table
                clearWorkerForm(); // Clear the form
            } else {
                alert(data.message || 'Error adding worker');
            }
        })
        .catch(error => {
            console.error('Error adding worker:', error);
            alert('An error occurred while adding the worker');
        });
    });

});