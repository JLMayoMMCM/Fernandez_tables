document.addEventListener('DOMContentLoaded', function() {


    //Initialize the payment channel
    const paymentChannelButton = document.querySelector('.nav-button[data-page="content_payment_order"]');
    if (paymentChannelButton) {
        paymentChannelButton.addEventListener('click', function() {
            fetchPaymentOrders();
        });
    }
    
    //Handles Navigation
    function showPage(pageId) {
        // Hide all sections
        document.querySelectorAll("main > section").forEach(section => {
            section.style.display = "none";
        });
    
        // Show the selected section
        const activeSection = document.querySelector(`.${pageId}`);
        if (activeSection) {
            activeSection.style.display = "grid";
        } else {
            console.error(`Section with class '${pageId}' not found.`);
        }
    
        // Update panel title
        const panelTitle = document.getElementById("panel-title");
        if (panelTitle) {
            panelTitle.textContent = pageId.replace("content_", "").replace("_", " ").toUpperCase();
        }
    }

    //Navigation Sidebar
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
            if (page === 'content_payment_order') {
                fetchPaymentOrders();
            }
        });
    });

    // Navigation Function
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


    // Import Data
    function importData() {
        fetch('/getItemsAndWorkers')
            .then(response => response.json())
            .then(data => {
                const { items, workers, managers, genders, suppliers, selector} = data;

                // Populate item tables directly with all items
                populateTable(items.tables, 'tables_Container');
                populateTable(items.chairs, 'chairs_Container');
                populateTable(items.miscellaneous, 'misc_Container');

                populateTable(items.tables, 'modify_tables_Container');
                populateTable(items.chairs, 'modify_chairs_Container');
                populateTable(items.miscellaneous, 'modify_misc_Container');

                // Populate workers table
                populateWorkersTable(workers, 'workers_Container');
                populateWorkersTable(workers, 'modify_workers_Container');

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
        const tablebody = document.getElementById(tableId).querySelector('tbody');
        tablebody.innerHTML = '';

        items.forEach(item => {
            // Ensure item_quantity is at least 0 if null
            const quantity = item.item_quantity || 0;
            // Get selected_quantity if it exists (for modify tables)
            const selectedQuantity = item.selected_quantity || 0;
            // Use the actual max value based on context (available stock + selected quantity for modify)
            const maxQuantity = quantity + selectedQuantity;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="item-id" data-id="${item.id || item.item_ID}">${item.item_name}</td>
                <td class="item-price">${item.item_price}</td>
                <td>${quantity}</td>
                <td>
                    <button class="quantity-btn minus">-</button>
                    <input type="number" class="item-quantity" min="0" max="${maxQuantity}" 
                           value="${selectedQuantity}" data-id="${item.id || item.item_ID}" 
                           data-price="${item.item_price}" style="background: none;">
                    <button class="quantity-btn plus">+</button>
                </td>
                <td class="item-subtotal">${(selectedQuantity * item.item_price).toFixed(2)}</td>
            `;
            tablebody.appendChild(row);
        });

        // Add event listeners for quantity inputs with validation
        tablebody.querySelectorAll('.item-quantity').forEach(input => {
            input.addEventListener('input', function() {
                const max = parseInt(this.getAttribute('max'));
                validateNumericInput(this, 0, max);
                if (tableId.includes('modify_')) {
                    updateModifySubtotal();
                } else {
                    updateSubtotal();
                }
            });
            
            input.addEventListener('blur', function() {
                const max = parseInt(this.getAttribute('max'));
                validateNumericInput(this, 0, max);
                if (tableId.includes('modify_')) {
                    updateModifySubtotal();
                } else {
                    updateSubtotal();
                }
            });
        });

        // Add event listeners for plus and minus buttons
        tablebody.querySelectorAll('.quantity-btn').forEach(button => {
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
        const tablebody = document.getElementById(tableId).querySelector('tbody');
        tablebody.innerHTML = '';

        workers.forEach(worker => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="worker-select" data-id="${worker.worker_ID}"></td>
                <td>${worker.worker_name}</td>
            `;
            tablebody.appendChild(row);
        });
    }

    function populateSelector(data, selectorId) {
        const selector = document.getElementById(selectorId);
        selector.innerHTML = '';
        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id; 
            option.textContent = item.suppliername || item.name || item.item_name;
            selector.appendChild(option);
        });
    }

    //Value Validation
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











    // ------------------------------ ADD ORDER PAGE ------------------------------

    //Add Order Navigation
    const addItemOrderButton = document.getElementById('add_item_order'); // Corrected selector
    if (addItemOrderButton) {
        addItemOrderButton.addEventListener('click', function() {
            showPage('content_add_item_order');
            setTimeout(function() {
                updateSubtotal();
            }, 100);
        });
    }

    const backToAddOrder = document.getElementById('back_to_add_order'); // Corrected selector
    if (backToAddOrder) {
        backToAddOrder.addEventListener('click', function() {
            showPage('content_add_order');
            setTimeout(function() {
                updateSubtotal();
            }, 100);
        });
    }

    //Add Order Behaviour
    document.getElementById('extra_fees').addEventListener('input', updateSubtotal);
    document.getElementById('event_duration').addEventListener('input', updateSubtotal);

    // Update subtotal and total price
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

    // Adds an order to the database
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
                clearAddOrderForm();
                if (confirm('Do you want to proceed to the payment page?')) {
                    showPage('content_payment_order');
                }
            } else {
                alert('Error adding order');
            }
        })
        .catch(error => console.error('Error adding order:', error));
    }

    function clearAddOrderForm() {
        document.getElementById('event_name').value = '';
        document.getElementById('event_timestamp').value = '';
        document.getElementById('event_duration').value = '';
        document.getElementById('assigned_manager').value = '';
        document.getElementById('street').value = '';
        document.getElementById('barangay').value = '';
        document.getElementById('city').value = '';
        document.getElementById('first_name').value = '';
        document.getElementById('middle_name').value = '';
        document.getElementById('last_name').value = '';
        document.getElementById('phone_number').value = '';
        document.getElementById('age').value = '';
        document.getElementById('extra_fees').value = '';
        document.querySelectorAll('.item-quantity').forEach(input => input.value = 0);
        document.querySelectorAll('.worker-select').forEach(checkbox => checkbox.checked = false);
        updateSubtotal();
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

    const addOrderButton = document.getElementById('add_order_button'); // Corrected selector
    if (addOrderButton) {
        addOrderButton.addEventListener('click', addOrder);
    }


    // ------------------------------ MODIFY ORDER PAGE ------------------------------
    
    // Modify Order Navigation
    const backToActiveOrderButton = document.getElementById('back_to_active_order'); // Corrected selector
    if (backToActiveOrderButton) {
        backToActiveOrderButton.addEventListener('click', function() {
            showPage('content_active_order');
            fetchActiveOrders(); // Refresh the active orders list
        });
    }

    // When clicking the "Back to Order Info" button on modify item order page
    const backToModifyOrderButton = document.getElementById('back_to_modify_order'); // Corrected selector
    if (backToModifyOrderButton) {
        backToModifyOrderButton.addEventListener('click', function() {
        showPage('content_modify_order');
    });
    } 

    const modifyItemOrderButton = document.getElementById('modify_item_order'); // Corrected selector
    if (modifyItemOrderButton) {
        modifyItemOrderButton.addEventListener('click', function() {
        showPage('content_modify_item_order');
        });
    }

    // Modify Order Behaviour

    // Function to fetch order details for modification
    function fetchOrderDetails(orderId) {
        fetch(`/fetchOrderDetails/${orderId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (!data.success) {
                    alert('Error: ' + data.message);
                    return;
                }

                // Store order ID in a hidden field for later use in form submission
                document.getElementById('modify_order_id').value = orderId;
                
                // Populate form fields with order details
                const details = data.orderDetails;
                
                // Format date for datetime-local input
                const eventDate = details.event_date ? new Date(details.event_date)
                    .toISOString()
                    .slice(0, 16) : ''; // Format as YYYY-MM-DDTHH:MM
                
                // Event Info
                document.getElementById('modify_event_name').value = details.event_Name || '';
                document.getElementById('modify_event_timestamp').value = eventDate;
                document.getElementById('modify_event_duration').value = details.event_duration || 1;
                document.getElementById('modify_assigned_manager').value = details.manager_ID || '';
                
                // Address Info
                document.getElementById('modify_street').value = details.street_Name || '';
                document.getElementById('modify_barangay').value = details.barangay_Name || '';
                document.getElementById('modify_city').value = details.city_Name || '';
                
                // Customer Info
                document.getElementById('modify_first_name').value = details.first_Name || '';
                document.getElementById('modify_middle_name').value = details.middle_Name || '';
                document.getElementById('modify_last_name').value = details.last_Name || '';
                document.getElementById('modify_phone_number').value = details.phone_Number || '';
                document.getElementById('modify_age').value = details.age || '';
                document.getElementById('modify_gender').value = details.gender_ID || '';
                document.getElementById('modify_extra_fees').value = details.extra_Fee || 0;

                // Populate tables with selected quantities
                populateModifyItemTables(data.items);
                
                // Mark selected workers
                markSelectedWorkers(data.workers);
                
                // Update subtotal and total price
                updateModifySubtotal();
            })
            .catch(error => {
                console.error('Error fetching order details:', error);
                alert('Error fetching order details. Please try again.');
            });
    }

    // Function to populate modify tables with items and their quantities
    function populateModifyItemTables(items) {
        // Group items by type
        const itemsByType = {
            201: [], // Tables
            202: [], // Chairs
            203: []  // Miscellaneous
        };
        
        // Group items by their type
        items.forEach(item => {
            const typeId = parseInt(item.item_type_ID);
            if (itemsByType.hasOwnProperty(typeId)) {
                itemsByType[typeId].push(item);
            }
        });
        
        // Function to populate a specific table
        const populateTable = (items, containerId) => {
            const tableBody = document.getElementById(containerId).querySelector('tbody');
            tableBody.innerHTML = '';
            
            items.forEach(item => {
                const row = document.createElement('tr');
                const availableStock = parseInt(item.available_stock) || 0;
                const selectedQty = parseInt(item.selected_quantity) || 0;
                const maxQty = availableStock + selectedQty; // Allow selecting up to available + currently selected
                
                row.innerHTML = `
                    <td class="item-id" data-id="${item.item_ID}">${item.item_name}</td>
                    <td class="item-price">${item.item_price}</td>
                    <td>${availableStock}</td>
                    <td>
                        <button class="quantity-btn minus">-</button>
                        <input type="number" class="item-quantity" min="0" max="${maxQty}" 
                               value="${selectedQty}" data-id="${item.item_ID}" 
                               data-price="${item.item_price}" style="background: none;">
                        <button class="quantity-btn plus">+</button>
                    </td>
                    <td class="item-subtotal">${(selectedQty * item.item_price).toFixed(2)}</td>
                `;
                tableBody.appendChild(row);
                
                // Add event listeners for quantity buttons
                const quantityInput = row.querySelector('.item-quantity');
                const minusBtn = row.querySelector('.minus');
                const plusBtn = row.querySelector('.plus');
                
                minusBtn.addEventListener('click', () => {
                    if (quantityInput.value > 0) {
                        quantityInput.value = parseInt(quantityInput.value) - 1;
                        quantityInput.dispatchEvent(new Event('input'));
                    }
                });
                
                plusBtn.addEventListener('click', () => {
                    if (parseInt(quantityInput.value) < maxQty) {
                        quantityInput.value = parseInt(quantityInput.value) + 1;
                        quantityInput.dispatchEvent(new Event('input'));
                    }
                });
                
                // Add event listener for quantity input
                quantityInput.addEventListener('input', () => {
                    validateNumericInput(quantityInput, 0, maxQty);
                    const quantity = parseInt(quantityInput.value) || 0;
                    const price = parseFloat(item.item_price);
                    row.querySelector('.item-subtotal').textContent = (quantity * price).toFixed(2);
                    updateModifySubtotal();
                });
            });
        };
        
        // Populate each table with its corresponding items
        populateTable(itemsByType[201], 'modify_tables_Container');
        populateTable(itemsByType[202], 'modify_chairs_Container');
        populateTable(itemsByType[203], 'modify_misc_Container');
        
        // Update the total subtotal
        updateModifySubtotal();
    }

    // Function to mark selected workers
    function markSelectedWorkers(workerIds) {
        // Uncheck all workers first
        document.querySelectorAll('#modify_workers_Container .worker-select').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Check selected workers
        workerIds.forEach(workerId => {
            const checkbox = document.querySelector(`#modify_workers_Container .worker-select[data-id="${workerId}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }

    // Function to update subtotal and total price for modify order page
    function updateModifySubtotal() {
        let subtotal = 0;
        const quantityInputs = document.querySelectorAll('#modify_tables_Container .item-quantity, #modify_chairs_Container .item-quantity, #modify_misc_Container .item-quantity');
        
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
        const eventDuration = parseFloat(document.getElementById('modify_event_duration').value) || 1;
        const subtotalPrice = subtotal * eventDuration;
        
        // Get extra fees value
        const extraFees = parseFloat(document.getElementById('modify_extra_fees').value) || 0;
        const totalPrice = subtotalPrice + extraFees;
        
        // Update all subtotal and total price elements in modify order page
        const subtotalElements = document.querySelectorAll('#modify_subtotal_Price');
        subtotalElements.forEach(el => {
            if (el) el.textContent = subtotalPrice.toFixed(2);
        });
        
        const totalElements = document.querySelectorAll('#modify_total_Price');
        totalElements.forEach(el => {
            if (el) el.textContent = totalPrice.toFixed(2);
        });
    }

    // Add event listeners to modify page
    document.getElementById('modify_event_duration').addEventListener('input', updateModifySubtotal);
    document.getElementById('modify_extra_fees').addEventListener('input', updateModifySubtotal);

    // Function to get data for updating an order
    function getModifyOrderData() {
        const orderId = document.getElementById('modify_order_id').value;
        
        // Get all form values
        const eventName = document.getElementById('modify_event_name').value;
        const eventTimestamp = document.getElementById('modify_event_timestamp').value;
        const eventDuration = document.getElementById('modify_event_duration').value;
        const assignedManager = document.getElementById('modify_assigned_manager').value;
        const street = document.getElementById('modify_street').value;
        const barangay = document.getElementById('modify_barangay').value;
        const city = document.getElementById('modify_city').value;
        const firstName = document.getElementById('modify_first_name').value;
        const middleName = document.getElementById('modify_middle_name').value;
        const lastName = document.getElementById('modify_last_name').value;
        const phoneNumber = document.getElementById('modify_phone_number').value;
        const age = document.getElementById('modify_age').value;
        const gender = document.getElementById('modify_gender').value;
        const extraFees = document.getElementById('modify_extra_fees').value;
        
        // Get selected items with quantities
        const items = [];
        document.querySelectorAll('#modify_tables_Container .item-quantity, #modify_chairs_Container .item-quantity, #modify_misc_Container .item-quantity')
            .forEach(input => {
                const quantity = parseInt(input.value) || 0;
                if (quantity > 0) {
                    items.push({
                        item_id: input.dataset.id,
                        quantity: quantity,
                        price: parseFloat(input.dataset.price)
                    });
                }
            });
        
        // Get selected workers
        const workers = [];
        document.querySelectorAll('#modify_workers_Container .worker-select:checked').forEach(checkbox => {
            workers.push(checkbox.dataset.id);
        });
        
        return {
            order_ID: orderId,
            event_name: eventName,
            event_timestamp: eventTimestamp,
            event_duration: eventDuration,
            assigned_manager: assignedManager,
            street: street,
            barangay: barangay,
            city: city,
            first_name: firstName,
            middle_name: middleName,
            last_name: lastName,
            phone_number: phoneNumber,
            age: age,
            gender: gender,
            extra_fees: extraFees,
            items: items,
            workers: workers
        };
    }

    // Function to save the modified order
    function saveModifyOrder() {
        if (!validateModifyForm()) {
            alert('Please fill in all required fields and ensure at least one item and one worker are selected.');
            return;
        }
        
        const orderData = getModifyOrderData();
        
        fetch('/modifyOrder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        })
        .then(response => response.json())
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
            alert('An error occurred while updating the order.');
        });
    }

    // Function to validate the modify form
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

        // Check if at least one item is selected
        const hasItems = Array.from(document.querySelectorAll('#modify_tables_Container .item-quantity, #modify_chairs_Container .item-quantity, #modify_misc_Container .item-quantity'))
            .some(input => parseInt(input.value) > 0);
        if (!hasItems) {
            return false;
        }

        // Check if at least one worker is selected
        const hasWorkers = document.querySelector('#modify_workers_Container .worker-select:checked') !== null;
        if (!hasWorkers) {
            return false;
        }

        return true;
    }

    // Add event listener to the save button
    const saveModifyOrderButton = document.getElementById('save_modify_order');
    if (saveModifyOrderButton) {
        saveModifyOrderButton.addEventListener('click', saveModifyOrder);
    }


    // ------------------------------ ACTIVE ORDER PAGE ------------------------------
    
    //Active Order Navigation
    document.querySelectorAll('.modify-order').forEach(button => {
        button.addEventListener('click', function() {
            const orderId = this.dataset.id;
            showPage('content_modify_order');
            fetchOrderDetails(orderId);
        });
    });
            


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


    // Active Order Behaviour

    // Add event listener for the assigned workers return button
    document.getElementById('assigned_workers_return_btn').addEventListener('click', function() {
        document.querySelector('.view_assigned_workers_popup').classList.remove('active');
    });

    // Add function to return button (content_active_order)
    document.getElementById('content_active_order').addEventListener('click', function() {
        document.querySelector('.view_order_item_popup').classList.remove('active');
        showPage('content_active_order');
    });


    function fetchActiveOrders() {
        fetch('/getActiveOrders')
            .then(response => response.json())
            .then(data => {
                const tablebody = document.getElementById('active_order_table').querySelector('tbody');
                tablebody.innerHTML = '';

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
                        <td class="active-button-container">
                            <button class="icon-button view-order" data-id="${order.order_ID}">
                                <i class="fa-solid fa-eye"></i>
                                <span class="tooltip">View Order</span>
                            </button>
                            <button class="icon-button modify-order" data-id="${order.order_ID}">
                                <i class="fa-solid fa-pen-to-square"></i>
                                <span class="tooltip">Modify Order</span>
                            </button>
                                <button class="icon-button view-workers" data-id="${order.order_ID}">
                                    <i class="fa-solid fa-users"></i>
                                    <span class="tooltip">View Workers</span>
                            </button>
                            <button class="icon-button cancel-order" data-id="${order.order_ID}">
                                <i class="fa-solid fa-ban"></i>
                                <span class="tooltip">Cancel Order</span>
                            </button>
                        </td>
                    `;
                    tablebody.appendChild(row);
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

                document.querySelectorAll('.view-workers').forEach(button => {
                    button.addEventListener('click', function() {
                        const orderId = this.dataset.id;
                        fetch(`/getOrderWorkers/${orderId}`)
                            .then(response => response.json())
                            .then(data => {
                                const tablebody = document.getElementById('assigned_workers_table').querySelector('tbody');
                                tablebody.innerHTML = '';

                                if (data.length === 0) {
                                    const row = document.createElement('tr');
                                    row.innerHTML = '<td colspan="2">No workers assigned to this order</td>';
                                    tablebody.appendChild(row);
                                } else {
                                    data.forEach(worker => {
                                        const row = document.createElement('tr');
                                        row.innerHTML = `
                                            <td>${worker.worker_ID}</td>
                                            <td>${worker.worker_name}</td>
                                        `;
                                        tablebody.appendChild(row);
                                    });
                                }
                                document.querySelector('.view_assigned_workers_popup').classList.add('active');
                            })
                            .catch(error => console.error('Error fetching assigned workers:', error));
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

    // Fetch order items and populate the view_order_item table
    function fetchOrderItems(orderId) {
        fetch(`/fetchOrderItems/${orderId}`)
            .then(response => response.json())
            .then(data => {
                const { items = [], daysRented = 0, extraFees = 0 } = data;
                const popup = document.querySelector('.view_order_item_popup');
                const tablebody = popup.querySelector('.table_wrapper_view_order tbody');
                tablebody.innerHTML = '';

                let totalItemSum = 0;

                items.forEach(item => {
                    // Ensure we have valid numeric values
                    const subtotal = parseFloat(item.item_subtotal) || 0;
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${item.item_name}</td>
                        <td>${item.item_description || 'N/A'}</td>
                        <td>${parseFloat(item.item_price).toFixed(2)}</td>
                        <td>${item.item_quantity}</td>
                        <td>${subtotal.toFixed(2)}</td>
                    `;
                    tablebody.appendChild(row);
                    totalItemSum += subtotal;
                });

                // Ensure all values are proper numbers before calculation
                const daysRentedValue = parseInt(daysRented) || 0;
                const extraFeesValue = parseFloat(extraFees) || 0;
                const itemTotal = extraFeesValue + (daysRentedValue * totalItemSum);

                // Update the cost elements
                document.getElementById('order_days_rented').textContent = daysRentedValue;
                document.getElementById('order_item_cost').textContent = totalItemSum.toFixed(2);
                document.getElementById('order_extra_fees').textContent = extraFeesValue.toFixed(2);
                document.getElementById('order_total_cost').textContent = itemTotal.toFixed(2);
            })
            .catch(error => console.error('Error fetching order items:', error));
    }

    // ------------------------------ ORDER HISTORY PAGE ------------------------------
    // Order History Navigation

    document.getElementById('order_history_items_return').addEventListener('click', function() {
        document.querySelector('.view_order_item_history').classList.remove('active');
    });


    // Order History Behaviour
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



    function fetchOrderHistory() {
        fetch('/getOrderHistory')
            .then(response => response.json())
            .then(data => {
                const tablebody = document.getElementById('order_History_Table').querySelector('tbody');
                tablebody.innerHTML = '';

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
                    tablebody.appendChild(row);
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

    function showOrderHistoryDetails(orderId) {
        // First check if all required elements exist
        const requiredElements = [
            'history_event_name',
            'history_event_date',
            'history_end_date',
            'history_customer_name',
            'history_address',
            'history_contact',
            'history_manager',
            'history_transactions_table',
            'history_liabilities_table',
            'history_items_table',
            'history_days_rented',
            'history_subtotal',
            'history_extra_fees',
            'history_total',
            'history_total_payment',
            'history_total_liability',
            'history_missing_requirements'
        ];

        // Check if all elements exist
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        if (missingElements.length > 0) {
            console.error('Missing elements:', missingElements);
            alert('Error: Some required elements are missing from the page.');
            return;
        }

        // Show the popup before fetching data
        const popup = document.querySelector('.view_order_item_history');
        if (popup) {
            popup.classList.add('active');
        }

        // Fetch order details using the new endpoint
        fetch(`/getOrderHistoryDetails/${orderId}`)
            .then(response => response.json())
            .then(data => {
                try {
                    const popup = document.querySelector('.view_order_item_history');
                    // Populate Customer & Event Info
                    const details = data.orderDetails;
                    if (details) {
                        document.getElementById('history_event_name').textContent = details.event_Name || 'N/A';
                        document.getElementById('history_event_date').textContent = details.event_date || 'N/A';
                        document.getElementById('history_end_date').textContent = details.end_event_date || 'N/A';
                        document.getElementById('history_customer_name').textContent = details.customer_name || 'N/A';
                        document.getElementById('history_address').textContent = details.full_address || 'N/A';
                        document.getElementById('history_contact').textContent = details.phone_Number || 'N/A';
                        document.getElementById('history_manager').textContent = details.manager_name || 'N/A';
                    }

                    // Display Missing Requirements
                    const missingReqContainer = document.getElementById('history_missing_requirements');
                    missingReqContainer.innerHTML = '';
                    if (data.missingRequirements && data.missingRequirements.length > 0) {
                        const missingList = document.createElement('div');
                        missingList.className = 'missing-requirements-list';
                        missingList.innerHTML = '<h4>Missing Requirements</h4>';
                        
                        const table = document.createElement('table');
                        table.innerHTML = `
                            <thead>
                                <tr>
                                    <th>Item Name</th>
                                    <th>Required Quantity</th>
                                    <th>Available Quantity</th>
                                    <th>Missing Quantity</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.missingRequirements.map(item => `
                                    <tr>
                                        <td>${item.item_name}</td>
                                        <td>${item.required_quantity}</td>
                                        <td>${item.available_quantity}</td>
                                        <td class="missing-quantity">${item.missing_quantity}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        `;
                        missingList.appendChild(table);
                        missingReqContainer.appendChild(missingList);
                    } else {
                        missingReqContainer.innerHTML = '<div class="no-missing">All requirements are met</div>';
                    }

                    // Populate Transactions Table
                    const transactionBody = document.getElementById('history_transactions_table').querySelector('tbody');
                    transactionBody.innerHTML = '';
                    let totalPayment = 0;

                    if (data.transactions && data.transactions.length > 0) {
                        data.transactions.forEach(transaction => {
                            const row = document.createElement('tr');
                            const amount = parseFloat(transaction.payment_amount) || 0;
                            row.innerHTML = `
                                <td>${transaction.payment_type || 'N/A'}</td>
                                <td>${amount.toFixed(2)}</td>
                                <td>${transaction.payment_reference_no || 'N/A'}</td>
                                <td>${transaction.date_of_payment || 'N/A'}</td>
                            `;
                            transactionBody.appendChild(row);
                            totalPayment += amount;
                        });
                    } else {
                        transactionBody.innerHTML = '<tr><td colspan="4">No transactions found</td></tr>';
                    }
                    document.getElementById('history_total_payment').textContent = totalPayment.toFixed(2);

                    // Populate Liabilities Table
                    const liabilityBody = document.getElementById('history_liabilities_table').querySelector('tbody');
                    liabilityBody.innerHTML = '';
                    let totalLiability = 0;

                    if (data.liabilities && data.liabilities.length > 0) {
                        data.liabilities.forEach(liability => {
                            const row = document.createElement('tr');
                            const amount = parseFloat(liability.liability_amount) || 0;
                            row.innerHTML = `
                                <td>${liability.liability_title || 'N/A'}</td>
                                <td>${liability.item_name || 'N/A'}</td>
                                <td>${liability.item_quantity || '0'}</td>
                                <td>${amount.toFixed(2)}</td>
                                <td>${liability.liability_description || 'N/A'}</td>
                                <td>${liability.liability_date || 'N/A'}</td>
                            `;
                            liabilityBody.appendChild(row);
                            totalLiability += amount;
                        });
                    } else {
                        liabilityBody.innerHTML = '<tr><td colspan="6">No liabilities found</td></tr>';
                    }
                    document.getElementById('history_total_liability').textContent = totalLiability.toFixed(2);

                    // Populate Items Table and Calculations
                    const itemBody = document.getElementById('history_items_table').querySelector('tbody');
                    itemBody.innerHTML = '';
                    let subtotal = 0;

                    if (data.items && data.items.length > 0) {
                        data.items.forEach(item => {
                            const itemSubtotal = parseFloat(item.item_subtotal) || 0;
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td>${item.item_name || 'N/A'}</td>
                                <td>${item.item_description || 'N/A'}</td>
                                <td>${parseFloat(item.item_price).toFixed(2)}</td>
                                <td>${item.item_quantity}</td>
                                <td>${itemSubtotal.toFixed(2)}</td>
                            `;
                            itemBody.appendChild(row);
                            subtotal += itemSubtotal;
                        });
                    } else {
                        itemBody.innerHTML = '<tr><td colspan="5">No items found</td></tr>';
                    }

                    // Update Summary Information
                    const daysRented = parseInt(details.daysRented) || 0;
                    const extraFees = parseFloat(details.extraFees) || 0;
                    const total = (subtotal * daysRented) + extraFees;

                    document.getElementById('history_days_rented').textContent = daysRented;
                    document.getElementById('history_subtotal').textContent = subtotal.toFixed(2);
                    document.getElementById('history_extra_fees').textContent = extraFees.toFixed(2);
                    document.getElementById('history_total').textContent = total.toFixed(2);

                } catch (error) {
                    console.error('Error processing order history details:', error);
                    alert('Error processing order details. Please try again.');
                }
            })
            .catch(error => {
                console.error('Error fetching order history details:', error);
                alert('Error loading order details. Please try again.');
            });
    }



    // ------------------------------- PAYMENT ORDER PAGE ------------------------------
    // Payment Order Navigation
    const transactionsReturnBtn = document.getElementById('transactions_return_btn');
    if (transactionsReturnBtn) {
        transactionsReturnBtn.addEventListener('click', function() {
        document.querySelector('.view_transactions_popup').classList.remove('active');
        fetchPaymentOrders();
    });
    }

    const liabilitiesReturnBtn = document.getElementById('liabilities_return_btn');
    if (liabilitiesReturnBtn) {
        liabilitiesReturnBtn.addEventListener('click', function() {
        document.querySelector('.view_liabilities_popup').classList.remove('active');
        fetchPaymentOrders();
    });
    }


    // Payment Order Behaviour

    function fetchPaymentOrders() {
        fetch('/getPaymentOrders')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                const tablebody = document.getElementById('payment_order_table').querySelector('tbody');
                tablebody.innerHTML = '';

                if (data.length === 0) {
                    const row = document.createElement('tr');
                    row.innerHTML = '<td colspan="12">No payment orders found</td>';
                    tablebody.appendChild(row);
                    return;
                }

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
                        <td>${order.status}</td>
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
                        </td>`;
                    tablebody.appendChild(row);
                });

                // Add event listeners to buttons
                addPaymentButtonListeners();
            })
            .catch(error => {
                console.error('Error fetching payment orders:', error);
                const tablebody = document.getElementById('payment_order_table').querySelector('tbody');
                tablebody.innerHTML = '<tr><td colspan="12">Error loading payment orders</td></tr>';
            });
    }

    // Add payment button listeners
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
                
                // Set up the submit transaction button handler
                const submitTransactionBtn = document.getElementById('submit_transaction_btn');
                submitTransactionBtn.dataset.financeId = financeId;
                
                // Remove any existing click listeners
                const newSubmitBtn = submitTransactionBtn.cloneNode(true);
                submitTransactionBtn.parentNode.replaceChild(newSubmitBtn, submitTransactionBtn);
                
                // Add new click listener
                newSubmitBtn.addEventListener('click', function() {
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
                            clearTransactionForm();
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
                
                // Show the popup
                document.querySelector('.view_create_transaction_popup').classList.add('active');
            });
        });
    
        // Add Liability button
        document.querySelectorAll('.add-liability').forEach(button => {
            button.addEventListener('click', function() {
                const financeId = this.dataset.id;
                const orderId = this.dataset.orderid;
                
                // Set current date and time for liability date input
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                document.getElementById('liability_date').value = `${year}-${month}-${day}T${hours}:${minutes}`;
                
                // Fetch both order items for liability AND managers for the dropdown
                Promise.all([
                    fetch(`/getOrderItemsForLiability/${orderId}`).then(response => response.json()),
                    fetch('/getItemsAndWorkers').then(response => response.json())
                ])
                .then(([orderItems, itemsAndWorkers]) => {
                    // Populate order items dropdown
                    const itemSelector = document.getElementById('liability_item_id');
                    itemSelector.innerHTML = '';
                    
                    orderItems.forEach(item => {
                        const option = document.createElement('option');
                        option.value = item.item_ID;
                        option.textContent = item.item_name;
                        option.dataset.maxQuantity = item.available_quantity;
                        itemSelector.appendChild(option);
                    });
                    
                    // Add change event to update max quantity
                    itemSelector.addEventListener('change', function() {
                        const selectedOption = this.options[this.selectedIndex];
                        if (selectedOption) {
                            const maxQuantity = parseInt(selectedOption.dataset.maxQuantity);
                            const quantityInput = document.getElementById('liability_quantity');
                            quantityInput.max = maxQuantity;
                            quantityInput.value = maxQuantity > 0 ? 1 : 0;
                            validateNumericInput(quantityInput, 1, maxQuantity);
                        }
                    });

                    // Add input validation for quantity
                    const quantityInput = document.getElementById('liability_quantity');
                    quantityInput.addEventListener('input', function() {
                        const selectedOption = itemSelector.options[this.selectedIndex];
                        if (selectedOption) {
                            const maxQuantity = parseInt(selectedOption.dataset.maxQuantity);
                            validateNumericInput(this, 1, maxQuantity);
                        }
                    });
                    
                    // Trigger change event to set initial max quantity
                    if (itemSelector.options.length > 0) {
                        itemSelector.dispatchEvent(new Event('change'));
                    }
                    
                    // Populate managers dropdown
                    const { managers } = itemsAndWorkers;
                    const managerSelector = document.getElementById('liability_manager_id');
                    managerSelector.innerHTML = '';
                    
                    managers.forEach(manager => {
                        const option = document.createElement('option');
                        option.value = manager.id;
                        option.textContent = manager.name;
                        managerSelector.appendChild(option);
                    });
                    
                    // Set up the submit liability button handler
                    const submitLiabilityBtn = document.getElementById('submit_liability_btn');
                    submitLiabilityBtn.dataset.financeId = financeId;
                    
                    // Remove any existing click listeners
                    const newSubmitBtn = submitLiabilityBtn.cloneNode(true);
                    submitLiabilityBtn.parentNode.replaceChild(newSubmitBtn, submitLiabilityBtn);
                    
                    // Add new click listener
                    newSubmitBtn.addEventListener('click', function() {
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
                            })
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                alert(data.message);
                                clearLiabilityForm();
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
                    
                    // Show the popup
                    document.querySelector('.view_add_liability_popup').classList.add('active');
                })
                .catch(error => {
                    console.error('Error fetching data for liability form:', error);
                    alert('Failed to load liability form data. Please try again.');
                });
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


    // Function to fetch transactions for a finance ID
    function fetchTransactions(financeId) {
        fetch(`/getTransactions/${financeId}`)
            .then(response => response.json())
            .then(data => {
                const tablebody = document.getElementById('transactions_table').querySelector('tbody');
                tablebody.innerHTML = '';

                let totalPayment = 0;
                data.transactions.forEach(transaction => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${transaction.payment_type}</td>
                        <td>${transaction.payment_amount}</td>
                        <td>${transaction.payment_reference_no}</td>
                        <td>${transaction.date_of_payment}</td>
                        <td class="single-button-container">
                            <button class="icon-button delete-transaction" data-finance-id="${transaction.finance_ID}" data-payment-amount="${transaction.payment_amount}">
                                <i class="fa-solid fa-trash-can"></i>
                                <span class="tooltip">Delete Transaction</span>
                            </button>
                        </td>
                    `;
                    tablebody.appendChild(row);
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
                const tablebody = document.getElementById('liabilities_table').querySelector('tbody');
                tablebody.innerHTML = '';

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
                    tablebody.appendChild(row);
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

    // Function to clear transaction form
    function clearTransactionForm() {
        document.getElementById('payment_type').selectedIndex = 0;
        document.getElementById('payment_amount').value = '';
        document.getElementById('payment_reference').value = '';
    }

    // Function to clear liability form
    function clearLiabilityForm() {
        document.getElementById('liability_title').value = '';
        document.getElementById('liability_item_id').selectedIndex = 0;
        document.getElementById('liability_quantity').value = '';
        document.getElementById('liability_amount').value = '';
        document.getElementById('liability_description').value = '';
        document.getElementById('liability_manager_id').selectedIndex = 0;
        
        // Trigger change event on item selector to reset max quantity
        const itemSelector = document.getElementById('liability_item_id');
        if (itemSelector) {
            itemSelector.dispatchEvent(new Event('change'));
        }
    }

    // Add cancel button handlers for transaction and liability forms
    const cancelTransactionBtn = document.getElementById('cancel_transaction_btn');
    if (cancelTransactionBtn) {
        cancelTransactionBtn.addEventListener('click', function() {
            clearTransactionForm();
        document.querySelector('.view_create_transaction_popup').classList.remove('active');
    });
    }

    const cancelLiabilityBtn = document.getElementById('cancel_liability_btn');
    if (cancelLiabilityBtn) {
        cancelLiabilityBtn.addEventListener('click', function() {
            clearLiabilityForm();
        document.querySelector('.view_add_liability_popup').classList.remove('active');
        });
    }

    // ------------------------------- INVENTORY MANAGEMENT PAGE -----------------------------

    //Inventory Management Navigation

    
    //Inventory Management Behaviour


    // -------------------------------   STAFF MANAGEMENT PAGE   -----------------------------

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
                            <div class="horizontal-button-container">
                                <button class="icon-button modify-item" data-id="${item.item_ID}">
                                    <i class="fa-solid fa-pen-to-square"></i>
                                    <span class="tooltip">Modify Item</span>
                                </button>
                            </div>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });

                // Add event listeners for modify buttons
                document.querySelectorAll('.modify-item').forEach(button => {
                    button.addEventListener('click', function() {
                        const itemId = this.dataset.id;
                        fetchItemDetails(itemId);
                    });
                });
            })
            .catch(error => console.error('Error fetching inventory items:', error));
    }

    // Function to fetch item details for modification
    function fetchItemDetails(itemId) {
        // First, populate the item types dropdown
        fetch('/getItemTypes')
            .then(response => response.json())
            .then(types => {
                const typeSelect = document.getElementById('modify_item_type');
                typeSelect.innerHTML = '';
                types.forEach(type => {
                    const option = document.createElement('option');
                    option.value = type.id;
                    option.textContent = type.name;
                    typeSelect.appendChild(option);
                });
                
                // Then fetch the item details
                return fetch(`/getItemDetails/${itemId}`);
            })
            .then(response => response.json())
            .then(item => {
                // Populate the modify item form
                document.getElementById('modify_item_id').value = item.item_ID;
                document.getElementById('modify_item_name').value = item.item_name;
                document.getElementById('modify_item_description').value = item.item_description || '';
                document.getElementById('modify_item_price').value = item.item_price;
                document.getElementById('modify_item_type').value = item.item_type_ID;
                
                // Show the modify item popup
                document.querySelector('.view_modify_item_popup').classList.add('active');
            })
            .catch(error => {
                console.error('Error fetching item details:', error);
                alert('An error occurred while fetching item details.');
            });
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
                        <td>${stock.supplier_name || 'N/A'}</td>
                        <td>${stock.supplier_ID || 'N/A'}</td>
                        <td>${stock.manager_name}</td>
                        <td>
                            <div class="horizontal-button-container">
                                <button class="icon-button modify-stock" data-id="${stock.item_stock_ID}">
                                    <i class="fa-solid fa-pen-to-square"></i>
                                    <span class="tooltip">Modify Stock</span>
                                </button>
                                <button class="icon-button delete-stock" data-id="${stock.item_stock_ID}">
                                    <i class="fa-solid fa-trash"></i>
                                    <span class="tooltip">Delete Stock</span>
                                </button>
                            </div>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });

                // Add event listeners for modify buttons
                document.querySelectorAll('.modify-stock').forEach(button => {
                    button.addEventListener('click', function() {
                        const stockId = this.dataset.id;
                        fetchStockDetails(stockId);
                    });
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

    // Function to fetch stock details for modification
    function fetchStockDetails(stockId) {
        // First, fetch suppliers
        fetch('/getItemsAndWorkers')
            .then(response => response.json())
            .then(data => {
                // Populate supplier selector
                const supplierSelect = document.getElementById('modify_stock_supplier_id');
                supplierSelect.innerHTML = '';
                data.suppliers.forEach(supplier => {
                    const option = document.createElement('option');
                    option.value = supplier.id;
                    option.textContent = supplier.name;
                    supplierSelect.appendChild(option);
                });

                // Populate manager selector
                const managerSelect = document.getElementById('modify_stock_manager_id');
                managerSelect.innerHTML = '';
                data.managers.forEach(manager => {
                            const option = document.createElement('option');
                    option.value = manager.id;
                    option.textContent = manager.name;
                    managerSelect.appendChild(option);
                });

                // Then fetch stock details
                return fetch(`/getStockDetails/${stockId}`);
            })
            .then(response => response.json())
            .then(stock => {
                // Populate the modify stock form
                document.getElementById('modify_stock_item_name').value = stock.item_name;
                document.getElementById('modify_stock_quantity').value = stock.item_quantity;
                document.getElementById('modify_stock_supplier_id').value = stock.supplier_ID;
                document.getElementById('modify_stock_manager_id').value = stock.manager_ID;
                
                // Store the stock ID for the save operation
                document.getElementById('modify_stock_form').dataset.stockId = stockId;
                
                // Show the modify stock popup
                document.querySelector('.view_modify_stock_popup').classList.add('active');
        })
        .catch(error => {
                console.error('Error fetching stock details:', error);
                alert('An error occurred while fetching stock details.');
            });
    }

    // Add event listeners for modify stock form
    document.getElementById('modify_stock_form').addEventListener('submit', function(e) {
        e.preventDefault();
        const stockId = this.dataset.stockId;
        const quantity = document.getElementById('modify_stock_quantity').value;
        const supplierId = document.getElementById('modify_stock_supplier_id').value;
        const managerId = document.getElementById('modify_stock_manager_id').value;

        fetch(`/updateStock/${stockId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                itemQuantity: quantity,
                supplierId: supplierId,
                managerId: managerId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Stock updated successfully');
                document.querySelector('.view_modify_stock_popup').classList.remove('active');
                fetchStockInfo();
                fetchInventoryItems(); // Refresh items to update total stock
            } else {
                alert('Error updating stock: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error updating stock:', error);
            alert('An error occurred while updating the stock.');
        });
    });

    // Add event listener for modify stock return button
    document.getElementById('modify_stock_return_btn').addEventListener('click', function() {
        document.querySelector('.view_modify_stock_popup').classList.remove('active');
    });

    // Add event listener for modify item form
    document.getElementById('modify_item_form').addEventListener('submit', function(e) {
        e.preventDefault();
        const itemId = document.getElementById('modify_item_id').value;
        const name = document.getElementById('modify_item_name').value;
        const description = document.getElementById('modify_item_description').value;
        const price = validateNumericInput(document.getElementById('modify_item_price'), 0, Number.MAX_SAFE_INTEGER);
        const itemType = document.getElementById('modify_item_type').value;

        fetch(`/updateItem/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                itemName: name,
                itemDescription: description,
                itemPrice: price,
                itemType: itemType
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Item updated successfully');
                document.querySelector('.view_modify_item_popup').classList.remove('active');
                fetchInventoryItems();
            } else {
                alert('Error updating item: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error updating item:', error);
            alert('An error occurred while updating the item.');
        });
    });

    // Add event listener for modify item return button
    document.getElementById('modify_item_return_btn').addEventListener('click', function() {
        document.querySelector('.view_modify_item_popup').classList.remove('active');
    });

    // Close assigned workers popup
    const assignedWorkersReturnBtn = document.getElementById('assigned_workers_return_btn');
    if (assignedWorkersReturnBtn) {
        assignedWorkersReturnBtn.addEventListener('click', function() {
            document.querySelector('.view_assigned_workers_popup').classList.remove('active');
        });
    }

    // Close modify item popup
    const modifyItemReturnBtn = document.getElementById('modify_item_return_btn');
    if (modifyItemReturnBtn) {
        modifyItemReturnBtn.addEventListener('click', function() {
            document.querySelector('.view_modify_item_popup').classList.remove('active');
        });
    }

    // Close modify stock popup
    const modifyStockReturnBtn = document.getElementById('modify_stock_return_btn');
    if (modifyStockReturnBtn) {
        modifyStockReturnBtn.addEventListener('click', function() {
            document.querySelector('.view_modify_stock_popup').classList.remove('active');
        });
    }

    // Close assigned orders popup
    const assignedOrdersReturnBtn = document.getElementById('assigned_orders_return_btn');
    if (assignedOrdersReturnBtn) {
        assignedOrdersReturnBtn.addEventListener('click', function() {
            document.querySelector('.view_assigned_orders_popup').classList.remove('active');
        });
    }

    // Close view order item popup when clicking outside
    const viewOrderItemPopup = document.querySelector('.view_order_item_popup');
    if (viewOrderItemPopup) {
        viewOrderItemPopup.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    }

    // Close add item popup
    const itemReturnBtn = document.getElementById('item_return_btn');
    if (itemReturnBtn) {
        itemReturnBtn.addEventListener('click', function() {
            document.querySelector('.view_item_input_popup').classList.remove('active');
            document.getElementById('add_item_form').reset();
        });
    }

    // Close add stock popup
    const stockReturnBtn = document.getElementById('stock_return_btn');
    if (stockReturnBtn) {
        stockReturnBtn.addEventListener('click', function() {
            document.querySelector('.view_stock_input_popup').classList.remove('active');
        });
    }

    // Validation function for add item form
    function validateItemForm() {
        const name = document.getElementById('item_name').value.trim();
        const price = parseFloat(document.getElementById('item_price').value);
        const type = document.getElementById('item_type').value;

        if (!name) {
            alert('Please enter an item name');
            return false;
        }

        if (isNaN(price) || price <= 0) {
            alert('Please enter a valid price (greater than 0)');
            return false;
        }

        if (!type) {
            alert('Please select an item type');
            return false;
        }

        return true;
    }

    // Function to add a new item
    function addItem() {
        if (!validateItemForm()) {
            return;
        }

        const itemData = {
            name: document.getElementById('item_name').value.trim(),
            description: document.getElementById('item_description').value.trim(),
            price: parseFloat(document.getElementById('item_price').value),
            itemType: document.getElementById('item_type').value
        };

        fetch('/addItem', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(itemData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('Item added successfully!');
                document.querySelector('.view_item_input_popup').classList.remove('active');
                document.getElementById('add_item_form').reset();
                fetchInventoryItems(); // Refresh the inventory items table
            } else {
                alert('Failed to add item: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error adding item:', error);
            alert('An error occurred while adding the item. Please try again.');
        });
    }

    // Function to add new stock
    function addStock() {
        const selectedItem = document.querySelector('input[name="selected_item"]:checked');
        if (!selectedItem) {
            alert('Please select an item');
            return;
        }

        const quantity = document.getElementById('stock_quantity').value;
        const managerId = document.getElementById('stock_manager_select').value;
        const supplierId = document.getElementById('stock_supplier_id').value;

        // Validate all required fields
        if (!quantity || !managerId || !supplierId) {
            alert('Please fill in all required fields');
            return;
        }

        // Validate quantity is a positive number
        if (parseInt(quantity) <= 0) {
            alert('Quantity must be greater than 0');
            return;
        }

        const stockData = {
            itemId: parseInt(selectedItem.value),
            quantity: parseInt(quantity),
            managerId: parseInt(managerId),
            supplierId: parseInt(supplierId)
        };

        fetch('/addStock', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(stockData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('Stock added successfully!');
                document.querySelector('.view_stock_input_popup').classList.remove('active');
                document.getElementById('add_stock_form').reset();
                fetchStockInfo(); // Refresh the stock table
                fetchInventoryItems(); // Refresh the inventory items to update total stock
            } else {
                alert('Failed to add stock: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error adding stock:', error);
            alert('An error occurred while adding the stock. Please try again.');
        });
    }

    // Setup form event listeners
    function setupFormEventListeners() {
        // Add Item form
        const addItemForm = document.getElementById('add_item_form');
        if (addItemForm) {
            addItemForm.addEventListener('submit', function(e) {
                e.preventDefault();
                addItem();
            });
        }

        // Add Stock form
        const addStockForm = document.getElementById('add_stock_form');
        if (addStockForm) {
            addStockForm.addEventListener('submit', function(e) {
                e.preventDefault();
                addStock();
            });
        }

        // Add Item button
        const addItemBtn = document.getElementById('add_item_btn');
        if (addItemBtn) {
            addItemBtn.addEventListener('click', function() {
                // Fetch item types for the dropdown
                fetch('/getItemTypes')
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(types => {
                        const typeSelect = document.getElementById('item_type');
                        typeSelect.innerHTML = '<option value="">Select item type</option>';
                        types.forEach(type => {
                            const option = document.createElement('option');
                            option.value = type.id;
                            option.textContent = type.name;
                            typeSelect.appendChild(option);
                        });

                        // Reset form and show popup
                        document.getElementById('add_item_form').reset();
                        document.querySelector('.view_item_input_popup').classList.add('active');
                    })
                    .catch(error => {
                        console.error('Error fetching item types:', error);
                        alert('Error loading item types. Please try again.');
                    });
            });
        }

        // Add input validation event listeners
        const itemPrice = document.getElementById('item_price');
        if (itemPrice) {
            itemPrice.addEventListener('input', function() {
                validateNumericInput(this, 0, Number.MAX_SAFE_INTEGER);
            });
        }

        const modifyItemPrice = document.getElementById('modify_item_price');
        if (modifyItemPrice) {
            modifyItemPrice.addEventListener('input', function() {
                validateNumericInput(this, 0, Number.MAX_SAFE_INTEGER);
            });
        }

        // Add quantity input validation
        const stockQuantity = document.getElementById('stock_quantity');
        if (stockQuantity) {
            stockQuantity.addEventListener('input', function() {
                validateNumericInput(this, 1, 10000);
            });
        }

        const modifyStockQuantity = document.getElementById('modify_stock_quantity');
        if (modifyStockQuantity) {
            modifyStockQuantity.addEventListener('input', function() {
                validateNumericInput(this, 1, 10000);
            });
        }

        // Add popup close event listeners
        const additempopup = document.querySelector('.view_item_input_popup');
        if (additempopup) {
            additempopup.addEventListener('click', function(e) {
                if (e.target === this) {
                    document.querySelector('.view_item_input_popup').classList.remove('active');
                    document.getElementById('add_item_form').reset();
                }
            });
        }

        const addstockpopup = document.querySelector('.view_stock_input_popup');
        if (addstockpopup) {
            addstockpopup.addEventListener('click', function(e) {
                if (e.target === this) {
                    document.querySelector('.view_stock_input_popup').classList.remove('active');
                    document.getElementById('add_stock_form').reset();
                }
            });
        }

        // Add return button functionality for add item form
        const addItemReturnBtn = document.getElementById('add_item_return_btn');
        if (addItemReturnBtn) {
            addItemReturnBtn.addEventListener('click', function() {
                document.querySelector('.view_item_input_popup').classList.remove('active');
                document.getElementById('add_item_form').reset();
            });
        }

        // Add event listeners for inventory management buttons
        const addStocksBtn = document.getElementById('add_stocks_btn');
        if (addStocksBtn) {
            addStocksBtn.addEventListener('click', function() {
                // Fetch necessary data for dropdowns and table
                Promise.all([
                    fetch('/getItemsAndWorkers').then(response => response.json()),
                    fetch('/getInventoryItems').then(response => response.json())
                ])
                .then(([data, items]) => {
                    // Populate items table
                    const tableBody = document.getElementById('stock_items_table').querySelector('tbody');
                    tableBody.innerHTML = '';
                    
                    items.forEach(item => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>
                                <input type="radio" name="selected_item" value="${item.item_ID}" 
                                       data-name="${item.item_name}" required>
                            </td>
                            <td>${item.item_name}</td>
                        `;
                        tableBody.appendChild(row);
                    });

                    // Populate manager selector
                    const managerSelect = document.getElementById('stock_manager_select');
                    managerSelect.innerHTML = '<option value="">Select a manager</option>';
                    data.managers.forEach(manager => {
                        const option = document.createElement('option');
                        option.value = manager.id;
                        option.textContent = manager.name;
                        managerSelect.appendChild(option);
                    });

                    // Populate supplier selector
                    const supplierSelect = document.getElementById('stock_supplier_id');
                    supplierSelect.innerHTML = '<option value="">Select a supplier</option>';
                    data.suppliers.forEach(supplier => {
                        const option = document.createElement('option');
                        option.value = supplier.id;
                        option.textContent = supplier.name;
                        supplierSelect.appendChild(option);
                    });

                    // Reset form and show popup
                    document.getElementById('add_stock_form').reset();
                    document.querySelector('.view_stock_input_popup').classList.add('active');
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                    alert('Error loading form data. Please try again.');
                });
            });
        }

        // Add Worker button
        const addWorkerBtn = document.getElementById('add_worker_btn');
        if (addWorkerBtn) {
            addWorkerBtn.addEventListener('click', function() {
                // Fetch necessary data for dropdowns
                fetch('/getItemsAndWorkers')
                    .then(response => response.json())
                    .then(data => {
                        // Populate manager selector
                        const managerSelect = document.getElementById('worker_manager');
                        managerSelect.innerHTML = '<option value="">Select a manager</option>';
                        data.managers.forEach(manager => {
                            const option = document.createElement('option');
                            option.value = manager.id;
                            option.textContent = manager.name;
                            managerSelect.appendChild(option);
                        });

                        // Populate gender selector
                        const genderSelect = document.getElementById('worker_gender');
                        genderSelect.innerHTML = '<option value="">Select gender</option>';
                        data.genders.forEach(gender => {
                            const option = document.createElement('option');
                            option.value = gender.id;
                            option.textContent = gender.name;
                            genderSelect.appendChild(option);
                        });

                        // Reset form and show popup
                        document.getElementById('worker_first_name').value = '';
                        document.getElementById('worker_middle_name').value = '';
                        document.getElementById('worker_last_name').value = '';
                        document.getElementById('worker_phone_number').value = '';
                        document.getElementById('worker_age').value = '';
                        document.getElementById('worker_password').value = '';
                        document.getElementById('worker_confirm_password').value = '';
                        document.querySelector('.view_add_worker_popup').classList.add('active');
                    })
                    .catch(error => {
                        console.error('Error fetching data:', error);
                        alert('Error loading form data. Please try again.');
                    });
            });
        }

        // Add Worker form validation and submission
        const addWorkerForm = document.querySelector('.add_worker_container');
        if (addWorkerForm) {
            // Phone number validation
            const phoneInput = document.getElementById('worker_phone_number');
            if (phoneInput) {
                phoneInput.addEventListener('input', function() {
                    this.value = this.value.replace(/\D/g, '').substring(0, 10);
                    validateNumericInput(this, 0, 9999999999);
                });
            }

            // Age validation
            const ageInput = document.getElementById('worker_age');
            if (ageInput) {
                ageInput.addEventListener('input', function() {
                    validateNumericInput(this, 18, 100);
                });
            }

            // Show/Hide password functionality
            const showPasswordCheckbox = document.getElementById('show_password');
            const passwordInput = document.getElementById('worker_password');
            const confirmPasswordInput = document.getElementById('worker_confirm_password');
            
            if (showPasswordCheckbox && passwordInput && confirmPasswordInput) {
                showPasswordCheckbox.addEventListener('change', function() {
                    const type = this.checked ? 'text' : 'password';
                    passwordInput.type = type;
                    confirmPasswordInput.type = type;
                });
            }

            // Save button functionality
            const saveWorkerBtn = document.getElementById('worker_save_btn');
            if (saveWorkerBtn) {
                saveWorkerBtn.addEventListener('click', function() {
                    if (validateWorkerForm()) {
                        addWorker();
                    }
                });
            }

            // Cancel button functionality
            const cancelWorkerBtn = document.getElementById('worker_cancel_btn');
            if (cancelWorkerBtn) {
                cancelWorkerBtn.addEventListener('click', function() {
                    document.querySelector('.view_add_worker_popup').classList.remove('active');
                });
            }
        }
    }

    function validateWorkerForm() {
        const firstName = document.getElementById('worker_first_name').value.trim();
        const lastName = document.getElementById('worker_last_name').value.trim();
        const phoneNumber = document.getElementById('worker_phone_number').value.trim();
        const age = document.getElementById('worker_age').value;
        const gender = document.getElementById('worker_gender').value;
        const manager = document.getElementById('worker_manager').value;
        const password = document.getElementById('worker_password').value;
        const confirmPassword = document.getElementById('worker_confirm_password').value;

        if (!firstName) {
            alert('Please enter first name');
            return false;
        }
        if (!lastName) {
            alert('Please enter last name');
            return false;
        }
        if (!phoneNumber || phoneNumber.length !== 10) {
            alert('Please enter a valid 10-digit phone number');
            return false;
        }
        if (!age || age < 18 || age > 100) {
            alert('Please enter a valid age between 18 and 100');
            return false;
        }
        if (!gender) {
            alert('Please select gender');
            return false;
        }
        if (!manager) {
            alert('Please select a manager');
            return false;
        }
        if (!password) {
            alert('Please enter a password');
            return false;
        }
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return false;
        }

        return true;
    }

    function addWorker() {
        const workerData = {
            firstName: document.getElementById('worker_first_name').value.trim(),
            middleName: document.getElementById('worker_middle_name').value.trim(),
            lastName: document.getElementById('worker_last_name').value.trim(),
            phoneNumber: document.getElementById('worker_phone_number').value.trim(),
            age: parseInt(document.getElementById('worker_age').value),
            gender: document.getElementById('worker_gender').value,
            managerId: document.getElementById('worker_manager').value,
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
                fetchStaffInfo(); // Refresh the staff table
            } else {
                alert('Error adding worker: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error adding worker:', error);
            alert('An error occurred while adding the worker.');
        });
    }

    // Call setup function when DOM is loaded
    setupFormEventListeners();

    function fetchStaffInfo() {
        fetch('/getStaffInfo')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                const tableBody = document.getElementById('staff_info_table').querySelector('tbody');
                tableBody.innerHTML = '';

                data.forEach(staff => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${staff.worker_ID}</td>
                        <td>${staff.worker_name}</td>
                        <td>${staff.age}</td>
                        <td>${staff.phone_Number}</td>
                        <td>
                            <div class="horizontal-button-container">
                                <button class="icon-button view-assigned-orders" data-id="${staff.worker_ID}">
                                    <i class="fa-solid fa-list-check"></i>
                                    <span class="tooltip">View Assigned Orders</span>
                                </button>
                                <button class="icon-button fire-worker" data-id="${staff.worker_ID}">
                                    <i class="fa-solid fa-user-slash"></i>
                                    <span class="tooltip">Fire Worker</span>
                                </button>
                            </div>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });

                // Add event listeners for the view assigned orders buttons
                document.querySelectorAll('.view-assigned-orders').forEach(button => {
                    button.addEventListener('click', function() {
                        const workerId = this.dataset.id;
                        showAssignedOrders(workerId);
                    });
                });

                // Add event listeners for the fire worker buttons
                document.querySelectorAll('.fire-worker').forEach(button => {
                    button.addEventListener('click', function() {
                        const workerId = this.dataset.id;
                        if (confirm('Are you sure you want to fire this worker? This action cannot be undone.')) {
                            fireWorker(workerId);
                        }
                    });
                });
            })
            .catch(error => {
                console.error('Error fetching staff info:', error);
                const tableBody = document.getElementById('staff_info_table').querySelector('tbody');
                tableBody.innerHTML = '<tr><td colspan="5">Error loading staff information</td></tr>';
            });
    }

    function fireWorker(workerId) {
        fetch(`/fireWorker/${workerId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Worker has been fired successfully');
                fetchStaffInfo(); // Refresh the staff table
            } else {
                alert('Error firing worker: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error firing worker:', error);
            alert('An error occurred while firing the worker.');
        });
    }

    // Remove all previous worker-related event listeners and consolidate them here
    function setupWorkerFormEventListeners() {
        // Add Worker button
        const addWorkerBtn = document.getElementById('add_worker_btn');
        if (addWorkerBtn) {
            const newBtn = addWorkerBtn.cloneNode(true);
            addWorkerBtn.parentNode.replaceChild(newBtn, addWorkerBtn);
            
            newBtn.addEventListener('click', function() {
                clearWorkerForm();
                fetch('/getItemsAndWorkers')
                    .then(response => response.json())
                    .then(data => {
                        const { managers, genders } = data;
                        
                        // Populate gender dropdown
                        const genderSelect = document.getElementById('worker_gender');
                        genderSelect.innerHTML = '<option value="">Select gender</option>';
                        genders.forEach(gender => {
                            const option = document.createElement('option');
                            option.value = gender.id;
                            option.textContent = gender.name;
                            genderSelect.appendChild(option);
                        });
                        
                        // Populate manager dropdown
                        const managerSelect = document.getElementById('worker_manager');
                        managerSelect.innerHTML = '<option value="">Select a manager</option>';
                        managers.forEach(manager => {
                            const option = document.createElement('option');
                            option.value = manager.id;
                            option.textContent = manager.name;
                            managerSelect.appendChild(option);
                        });
                        
                        document.querySelector('.view_add_worker_popup').classList.add('active');
                    })
                    .catch(error => {
                        console.error('Error loading form data:', error);
                        alert('Error loading form data. Please try again.');
                    });
            });
        }

        // Save Worker button
        const saveWorkerBtn = document.getElementById('worker_save_btn');
        if (saveWorkerBtn) {
            const newSaveBtn = saveWorkerBtn.cloneNode(true);
            saveWorkerBtn.parentNode.replaceChild(newSaveBtn, saveWorkerBtn);
            
            newSaveBtn.addEventListener('click', function() {
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
                        fetchStaffInfo();
                        clearWorkerForm();
                    } else {
                        alert(data.message || 'Error adding worker');
                    }
                })
                .catch(error => {
                    console.error('Error adding worker:', error);
                    alert('An error occurred while adding the worker');
                });
            });
        }

        // Cancel Worker button
        const cancelWorkerBtn = document.getElementById('worker_cancel_btn');
        if (cancelWorkerBtn) {
            const newCancelBtn = cancelWorkerBtn.cloneNode(true);
            cancelWorkerBtn.parentNode.replaceChild(newCancelBtn, cancelWorkerBtn);
            
            newCancelBtn.addEventListener('click', function() {
                document.querySelector('.view_add_worker_popup').classList.remove('active');
                clearWorkerForm();
            });
        }

        // Phone number validation
        const phoneInput = document.getElementById('worker_phone_number');
        if (phoneInput) {
            phoneInput.addEventListener('input', function() {
                // Remove any non-digit characters
                this.value = this.value.replace(/\D/g, '');
                // Limit to 11 digits
                if (this.value.length > 10) {
                    this.value = this.value.slice(0, 10);
                }
            });
        }

        // Age validation
        const ageInput = document.getElementById('worker_age');
        if (ageInput) {
            ageInput.addEventListener('input', function() {
                validateNumericInput(this, 18, 100);
            });
        }

        // Show/Hide password functionality
        const showPasswordCheckbox = document.getElementById('show_password');
        const passwordInput = document.getElementById('worker_password');
        const confirmPasswordInput = document.getElementById('worker_confirm_password');
        
        if (showPasswordCheckbox && passwordInput && confirmPasswordInput) {
            showPasswordCheckbox.addEventListener('change', function() {
                const type = this.checked ? 'text' : 'password';
                passwordInput.type = type;
                confirmPasswordInput.type = type;
            });
        }
    }

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

        const phoneNumber = document.getElementById('worker_phone_number').value.trim();
        if (phoneNumber.length > 10) {
            alert('Please enter a valid 10-digit phone number');
            document.getElementById('worker_phone_number').focus();
            return false;
        }

        const age = parseInt(document.getElementById('worker_age').value);
        if (isNaN(age) || age < 18 || age > 100) {
            alert('Please enter a valid age between 18 and 100');
            document.getElementById('worker_age').focus();
            return false;
        }

        const password = document.getElementById('worker_password').value;
        const confirmPassword = document.getElementById('worker_confirm_password').value;
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            document.getElementById('worker_password').focus();
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
            const element = document.getElementById(field);
            if (element) {
                element.value = '';
            }
        });

        const showPasswordCheckbox = document.getElementById('show_password');
        if (showPasswordCheckbox) {
            showPasswordCheckbox.checked = false;
        }
    }

    // Add this line after setupFormEventListeners();
    setupWorkerFormEventListeners();

    // LOGOUT FUNCTIONALITY
    const logoutButton = document.getElementById('logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                fetch('/logout', { 
                    method: 'POST',
                    credentials: 'same-origin' // Include cookies in the request
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Clear any client-side storage
                        sessionStorage.clear();
                        localStorage.clear();
                        
                        // Redirect to login page
                        window.location.href = '/login';
                    } else {
                        throw new Error(data.message || 'Logout failed');
                    }
                })
                .catch(error => {
                    console.error('Logout error:', error);
                    alert('Error during logout. Please try again.');
                });
            }
        });
    }

    // Add print functionality
    function printOrder(popupClass) {
        const popup = document.querySelector(`.${popupClass}`);
        const printContent = popup.cloneNode(true);
        
        // Remove buttons and other non-printable elements
        printContent.querySelectorAll('button').forEach(button => {
            if (!button.classList.contains('print-order-button') && !button.classList.contains('print-history-button')) {
                button.remove();
            }
        });
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Order</title>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .button-container, .icon-button, .tooltip { display: none; }
                        @media print {
                            button { display: none; }
                        }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        // Wait for content to load before printing
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }

    document.getElementById('print_order_btn').addEventListener('click', function() {
        const popup = document.querySelector('.view_order_item_history');
        const printContent = popup.cloneNode(true);
        
        // Remove non-printable elements
        printContent.querySelectorAll('button').forEach(button => button.remove());
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Order Details</title>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
                        .info-item { margin: 5px 0; }
                        .total-row { font-weight: bold; margin-top: 10px; }
                        @media print {
                            button { display: none; }
                        }
                    </style>
                </head>
                <body>${printContent.innerHTML}</body>
            </html>
        `);
        
        // Wait for content to load then print
        printWindow.document.close();
        printWindow.onload = function() {
            printWindow.print();
            printWindow.onafterprint = function() {
                printWindow.close();
            };
        };
    });

    showPage('content_add_order');

    // Function to show assigned orders for a worker
    function showAssignedOrders(workerId) {
        fetch(`/getAssignedOrders/${workerId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                const tbody = document.querySelector('#assigned_orders_table tbody');
                tbody.innerHTML = '';
                
                if (!data || !Array.isArray(data)) {
                    throw new Error('Invalid data format received from server');
                }

                if (data.length === 0) {
                    const row = document.createElement('tr');
                    row.innerHTML = '<td colspan="4" style="text-align: center;">No assigned orders found</td>';
                    tbody.appendChild(row);
                } else {
                    data.forEach(order => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${order.order_ID || 'N/A'}</td>
                            <td>${order.event_Name|| 'Unnamed Event'}</td>
                            <td>${order.event_date ? new Date(order.event_date).toLocaleString() : 'N/A'}</td>
                            <td>${order.end_event_date ? new Date(order.end_event_date).toLocaleString() : 'N/A'}</td>
                        `;
                        tbody.appendChild(row);
                    });
                }

                // Show the popup
                document.querySelector('.view_assigned_orders_popup').classList.add('active');
            })
            .catch(error => {
                console.error('Error fetching assigned orders:', error);
                alert('An error occurred while fetching assigned orders. Please try again.');
            });
    }

    // Add event listener for the assigned orders return button
    document.getElementById('assigned_orders_return').addEventListener('click', function() {
        document.querySelector('.view_assigned_orders_popup').classList.remove('active');
    });

    // Update the event listener in fetchStaffInfo
    document.querySelectorAll('.view-assigned-orders').forEach(button => {
        button.addEventListener('click', function() {
            const workerId = this.dataset.id;
            showAssignedOrders(workerId);
        });
    });
});
