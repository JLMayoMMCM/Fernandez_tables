document.addEventListener('DOMContentLoaded', function() {

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

                // Store order ID in a hidden field or data attribute for later use in form submission
                document.getElementById('modify_order_id').value = orderId;
                
                // Populate form fields with order details
                const details = data.orderDetails;
                
                // Event Info
                document.getElementById('modify_event_name').value = details.event_Name;
                document.getElementById('modify_event_timestamp').value = details.event_date;
                document.getElementById('modify_event_duration').value = details.event_duration;
                document.getElementById('modify_assigned_manager').value = details.manager_ID;
                
                // Address Info
                document.getElementById('modify_street').value = details.street_Name;
                document.getElementById('modify_barangay').value = details.barangay_Name;
                document.getElementById('modify_city').value = details.city_Name;
                
                // Customer Info
                document.getElementById('modify_first_name').value = details.first_Name;
                document.getElementById('modify_middle_name').value = details.middle_Name || '';
                document.getElementById('modify_last_name').value = details.last_Name;
                document.getElementById('modify_phone_number').value = details.phone_Number;
                document.getElementById('modify_age').value = details.age;
                document.getElementById('modify_gender').value = details.gender_ID;
                document.getElementById('modify_extra_fees').value = details.extra_Fee;

                // Populate tables with selected quantities
                populateModifyItemTables(data.items);
                
                // Mark selected workers
                markSelectedWorkers(data.assignedWorkers);
                
                // Update subtotal and total price
                updateModifySubtotal();
            })
            .catch(error => {
                console.error('Error fetching order details:', error);
                alert('Error fetching order details. Please try again.');
            });
    }

    // Function to populate modify tables with items and their quantities
    function populateModifyItemTables(itemsByType) {
        // Clear existing selected quantities
        document.querySelectorAll('#modify_tables_Container .item-quantity, #modify_chairs_Container .item-quantity, #modify_misc_Container .item-quantity')
            .forEach(input => {
                input.value = 0;
            });
        
        // Set selected quantities from order
        itemsByType.tables.forEach(item => {
            const input = document.querySelector(`#modify_tables_Container .item-quantity[data-id="${item.item_ID}"]`);
            if (input) {
                input.value = item.selected_quantity;
                
                // Update subtotal in row
                const row = input.closest('tr');
                const subtotalCell = row.querySelector('.item-subtotal');
                subtotalCell.textContent = (item.selected_quantity * item.item_price).toFixed(2);
            }
        });
        
        itemsByType.chairs.forEach(item => {
            const input = document.querySelector(`#modify_chairs_Container .item-quantity[data-id="${item.item_ID}"]`);
            if (input) {
                input.value = item.selected_quantity;
                
                // Update subtotal in row
                const row = input.closest('tr');
                const subtotalCell = row.querySelector('.item-subtotal');
                subtotalCell.textContent = (item.selected_quantity * item.item_price).toFixed(2);
            }
        });
        
        itemsByType.miscellaneous.forEach(item => {
            const input = document.querySelector(`#modify_misc_Container .item-quantity[data-id="${item.item_ID}"]`);
            if (input) {
                input.value = item.selected_quantity;
                
                // Update subtotal in row
                const row = input.closest('tr');
                const subtotalCell = row.querySelector('.item-subtotal');
                subtotalCell.textContent = (item.selected_quantity * item.item_price).toFixed(2);
            }
        });
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
                const tablebody = document.querySelector('.view_order_item_popup .table_wrapper_view_order tbody');
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

    // Add function to return button (content_active_order)
    document.getElementById('content_active_order').addEventListener('click', function() {
        document.querySelector('.view_order_item_popup').classList.remove('active');
        showPage('content_active_order');
    });

    // ------------------------------ ORDER HISTORY PAGE ------------------------------
    // Order History Navigation

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

    document.getElementById('order_history_items_return').addEventListener('click', function() {
        document.querySelector('.view_order_item_history').classList.remove('active');
    });


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
        fetchOrderItems(orderId);
        fetchOrderTransactions(orderId);
        fetchOrderLiabilities(orderId);
        document.querySelector('.view_order_item_history').classList.add('active');
    }
    

    // ------------------------------- PAYMENT ORDER PAGE ------------------------------
    // Payment Order Navigation
    document.getElementById('transactions_return_btn').addEventListener('click', function() {
        document.querySelector('.view_transactions_popup').classList.remove('active');
        fetchPaymentOrders();
    });

    document.getElementById('liabilities_return_btn').addEventListener('click', function() {
        document.querySelector('.view_liabilities_popup').classList.remove('active');
        fetchPaymentOrders();
    });


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
                    row.innerHTML = '<td colspan="11">No payment orders found</td>';
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
                    tablebody.appendChild(row);
                });

                // Add event listeners to buttons
                addPaymentButtonListeners();
            })
            .catch(error => {
                console.error('Error fetching payment orders:', error);
                const tablebody = document.getElementById('payment_order_table').querySelector('tbody');
                tablebody.innerHTML = '<tr><td colspan="11">Error loading payment orders</td></tr>';
            });
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
                        option.dataset.maxQuantity = item.item_quantity;
                        itemSelector.appendChild(option);
                    });
                    
                    // Add change event to update max quantity
                    itemSelector.addEventListener('change', function() {
                        const selectedOption = this.options[this.selectedIndex];
                        if (selectedOption) {
                            const maxQuantity = selectedOption.dataset.maxQuantity;
                            const quantityInput = document.getElementById('liability_quantity');
                            quantityInput.max = maxQuantity;
                            quantityInput.value = maxQuantity > 0 ? 1 : 0;
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
                    
                    // Set the financeId on the submit button
                    document.getElementById('submit_liability_btn').dataset.financeId = financeId;
                    
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
                        <td>${transaction.payment_Reference_No}</td>
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





    // ------------------------------ INVENTORY STOCK PAGE ------------------------------
    // Inventory Stock Navigation
    const addStocksBtn = document.getElementById('add_stocks_btn'); // Corrected selector
    if (addStocksBtn) {
        addStocksBtn.addEventListener('click', function() {
            document.querySelector('.view_stock_input_popup').classList.add('active');
        });
    }
    
    const addItemBtn = document.getElementById('add_item_btn'); // Corrected selector
    if (addItemBtn) {
        addItemBtn.addEventListener('click', function() {
            populateItemTypes();
            document.querySelector('.view_item_input_popup').classList.add('active');
        });
    }
    
    const stockReturnBtn = document.getElementById('stock_return_btn'); // Corrected selector
    if (stockReturnBtn) {
        stockReturnBtn.addEventListener('click', function() {
            document.querySelector('.view_stock_input_popup').classList.remove('active');
        });
    }
    
    const itemReturnBtn = document.getElementById('item_return_btn'); // Corrected selector
    if (itemReturnBtn) {
        itemReturnBtn.addEventListener('click', function() {
            document.querySelector('.view_item_input_popup').classList.remove('active');
        });
    }
    
    const stockSubmitBtn = document.getElementById('stock_submit_btn'); // Corrected selector
    if (stockSubmitBtn) {
        stockSubmitBtn.addEventListener('click', addStock);
    }
    
    const itemSubmitBtn = document.getElementById('item_submit_btn'); // Corrected selector
    if (itemSubmitBtn) {
        itemSubmitBtn.addEventListener('click', addItem);
    }

    const modifyitemsaveBtn = document.getElementById('modify_item_save_btn'); // Corrected selector
    if (modifyitemsaveBtn) {
        modifyitemsaveBtn.addEventListener('click', saveModifiedItem);
    }

    const modifyStockSaveBtn = document.getElementById('modify_stock_save_btn'); // Corrected selector
    if (modifyStockSaveBtn) {
        modifyStockSaveBtn.addEventListener('click', saveModifiedStock);
    }

    if (document.querySelector('.content_inventory_stock.active')) {
        fetchInventoryItems();
        fetchStockInfo();
    }



    function fetchInventoryItems() {
        fetch('/getInventoryItems')
            .then(response => response.json())
            .then(data => {
                const tablebody = document.getElementById('inventory_items_table').querySelector('tbody');
                tablebody.innerHTML = '';

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
                                <button class="icon-button modify-item" data-id="${item.item_ID}">
                                    <i class="fas fa-edit"></i>
                                    <span class="tooltip">Modify Item</span>
                                </button>
                            </div>
                        </td>
                    `;
                    tablebody.appendChild(row);
                });

                // Add event listeners for modify buttons
                document.querySelectorAll('.modify-item').forEach(button => {
                    button.addEventListener('click', function() {
                        const itemId = this.dataset.id;
                        fetchItemDetails(itemId);
                        populateItemTypes();
                        document.querySelector('.view_modify_item_popup').classList.add('active');
                    });
                });
            })
            .catch(error => console.error('Error fetching inventory items:', error));
    }

    function fetchStockInfo() {
        fetch('/getStockInfo')
            .then(response => response.json())
            .then(data => {
                const tablebody = document.getElementById('stock_info_table').querySelector('tbody');
                tablebody.innerHTML = '';

                data.forEach(stock => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${stock.item_stock_ID}</td>
                        <td>${stock.item_ID}</td>
                        <td>${stock.item_name}</td>
                        <td>${stock.item_quantity}</td>
                        <td>${stock.supplier_name}</td>
                        <td>${stock.supplier_ID}</td>
                        <td>${stock.manager_name}</td>
                        <td>
                            <div class="single-button-container">
                                <button class="icon-button modify-stock" data-id="${stock.item_stock_ID}">
                                    <i class="fas fa-edit"></i>
                                    <span class="tooltip">Modify Stock</span>
                                </button>
                            </div>
                        </td>
                    `;
                    tablebody.appendChild(row);
                });

                // Add event listeners for modify buttons
                document.querySelectorAll('.modify-stock').forEach(button => {
                    button.addEventListener('click', function() {
                        const stockId = this.dataset.id;
                        fetchStockDetails(stockId);
                        document.querySelector('.view_modify_stock_popup').classList.add('active');
                    });
                });
            })
            .catch(error => console.error('Error fetching stock information:', error));
    }

    
    // Function to fetch item details for modification
    function fetchItemDetails(itemId) {
        fetch(`/getItemDetails/${itemId}`)
            .then(response => response.json())
            .then(data => {
                document.getElementById('modify_item_id').value = data.item_ID;
                document.getElementById('modify_item_name').value = data.item_name;
                document.getElementById('modify_item_description').value = data.item_description;
                document.getElementById('modify_item_price').value = data.item_price;

                // Populate item types and set selected item type
                fetch('/getItemTypes')
                    .then(response => response.json())
                    .then(itemTypes => {
                        const modifySelector = document.getElementById('modify_item_type');
                        modifySelector.innerHTML = '';
                        itemTypes.forEach(type => {
                            const option = document.createElement('option');
                            option.value = type.id;
                            option.textContent = type.name;
                            modifySelector.appendChild(option);
                        });
                        // Set the selected item type based on the data from the server
                        modifySelector.value = data.item_type_ID;
                    })
                    .catch(error => console.error('Error fetching item types:', error));
            })
            .catch(error => console.error('Error fetching item details:', error));
    }

    // Function to fetch stock details for modification
    function fetchStockDetails(stockId) {
        fetch(`/getStockDetails/${stockId}`)
            .then(response => response.json())
            .then(data => {
                document.getElementById('update_stock_item_id').value = data.item_stock_ID;
                document.getElementById('update_stock_quantity').value = data.item_quantity;

                // Load items, managers, and suppliers all at once
                fetch('/getItemsAndWorkers')
                    .then(response => response.json())
                    .then(itemsAndWorkersData => {
                        populateSelector(itemsAndWorkersData.suppliers, 'update_stock_supplier');
                        populateSelector(itemsAndWorkersData.managers, 'update_stock_manager');
                        document.getElementById('update_stock_supplier').value = data.supplier_ID;
                        document.getElementById('update_stock_manager').value = data.manager_ID;
                    })
                    .catch(error => console.error('Error fetching form data:', error));
            })
            .catch(error => console.error('Error fetching stock details:', error));
    }

    // Function to clear modify item form
    function clearModifyItemForm() {
        document.getElementById('modify_item_id').value = '';
        document.getElementById('modify_item_name').value = '';
        document.getElementById('modify_item_description').value = '';
        document.getElementById('modify_item_price').value = '';
        document.getElementById('modify_item_type').value = '';
    }

    // Function to clear modify stock form
    function clearModifyStockForm() {
        document.getElementById('modify_stock_id').value = '';
        document.getElementById('modify_stock_item_id').value = '';
        document.getElementById('modify_stock_quantity').value = '';
        document.getElementById('modify_stock_supplier_id').value = '';
        document.getElementById('modify_stock_manager_id').value = '';
    }

    // Function to save modified item
    function saveModifiedItem() {
        const itemId = document.getElementById('modify_item_id').value;
        const itemName = document.getElementById('modify_item_name').value.trim();
        const itemDescription = document.getElementById('modify_item_description').value.trim();
        const itemPrice = document.getElementById('modify_item_price').value;
        const itemType = document.getElementById('modify_item_type').value;

        if (!itemName || !itemPrice || !itemType) {
            alert('Please fill in all required fields.');
            return;
        }

        fetch(`/updateItem/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                itemName,
                itemDescription,
                itemPrice,
                itemType
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Item updated successfully.');
                clearModifyItemForm();
                fetchInventoryItems();
                document.querySelector('.view_modify_item_popup').classList.remove('active'); // Hide popup
                showPage('content_inventory_stock'); // Redirect to inventory stock page
            } else {
                alert('Error updating item: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error updating item:', error);
            alert('An error occurred while updating the item.');
        });
    }

    // Function to save modified stock
    function saveModifiedStock() {
        const stockId = document.getElementById('update_stock_item_id').value;
        const quantity = document.getElementById('update_stock_quantity').value;
        const supplierId = document.getElementById('update_stock_supplier').value;
        const managerId = document.getElementById('update_stock_manager').value;

        if (!quantity || !supplierId || !managerId) {
            alert('Please fill in all required fields.');
            return;
        }

        fetch(`/updateStock/${stockId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                itemQuantity: quantity,
                supplierId,
                managerId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Stock updated successfully');
                document.querySelector('.view_modify_stock_popup').classList.remove('active');
                fetchStockInfo();
            } else {
                alert('Error updating stock');
            }
        })
        .catch(error => {
            console.error('Error updating stock:', error);
            alert('An error occurred while updating the stock.');
        });
    }

    // Function to populate item types dropdown
    function populateItemTypes() {
        fetch('/getItemTypes')
            .then(response => response.json())
            .then(data => {
                const selector = document.getElementById('item_type_select');
                const modifySelector = document.getElementById('modify_item_type');

                selector.innerHTML = '';
                modifySelector.innerHTML = '';

                data.forEach(type => {
                    const option = document.createElement('option');
                    option.value = type.id;
                    option.textContent = type.name;
                    selector.appendChild(option);
                    modifySelector.appendChild(option.cloneNode(true));
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
                showPage('content_inventory_stock');
                alert('Item added successfully.');
                clearAddItemForm();
                fetchInventoryItems();
                document.querySelector('.view_item_input_popup').classList.remove('active'); // Hide popup
            } else {
                alert('Error adding item: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error adding item:', error);
            alert('An error occurred while adding the item.');
        });
    }

    function clearAddItemForm() {
        document.getElementById('item_name_input').value = '';
        document.getElementById('item_description_input').value = '';
        document.getElementById('item_price_input').value = '';
        document.getElementById('item_type_select').selectedIndex = 0;
    }


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
                clearStockForm();
                fetchStockInfo();
                fetchInventoryItems();
                document.querySelector('.view_stock_input_popup').classList.remove('active'); // Hide popup
            } else {
                alert(`Error: ${data.message}`);
            }
        })
        .catch(error => {
            console.error('Error adding stock:', error);
            alert('An error occurred while adding stock.');
        });
    }

    function clearStockForm() {
        document.getElementById('stock_quantity').value = '';
        document.getElementById('stock_supplier_id').value = '';
        document.getElementById('stock_item_select').selectedIndex = 0;
        document.getElementById('stock_manager_select').selectedIndex = 0;
    }

    document.getElementById('modify_item_return_btn').addEventListener('click', function() {
        document.querySelector('.view_modify_item_popup').classList.remove('active');
        clearModifyItemForm();
    });

    document.getElementById('modify_stock_return_btn').addEventListener('click', function() {
        document.querySelector('.view_modify_stock_popup').classList.remove('active');
        clearModifyStockForm();
    });

    document.getElementById('update_stock_save_btn').addEventListener('click', saveModifiedStock);
    document.getElementById('update_stock_return').addEventListener('click', function() {
        document.querySelector('.view_modify_stock_popup').classList.remove('active');
        clearModifyStockForm();
    });





    // ------------------------------ WORKER MANAGEMENT PAGE ------------------------------

    // Staff Management Navigation
    const assignedOrdersReturnBtn = document.getElementById('assigned_orders_return'); // Corrected selector
    if (assignedOrdersReturnBtn) {
        assignedOrdersReturnBtn.addEventListener('click', function() {
            document.querySelector('.view_assigned_orders_popup').classList.remove('active');
        });
    }
    const workerCancelBtn = document.getElementById('worker_cancel_btn'); // Corrected selector
    if (workerCancelBtn) {
        workerCancelBtn.addEventListener('click', function() {
            document.querySelector('.view_add_worker_popup').classList.remove('active');
        });
    }


    // Staff Management Behaviour
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
                const tablebody = document.getElementById('staff_info_table').querySelector('tbody');
                tablebody.innerHTML = '';

                if (data.length === 0) {
                    const row = document.createElement('tr');
                    row.innerHTML = `<td colspan="5">No staff information found</td>`;
                    tablebody.appendChild(row);
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
                    tablebody.appendChild(row);
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
                const tablebody = document.getElementById('staff_info_table').querySelector('tbody');
                tablebody.innerHTML = `<tr><td colspan="5">Error loading staff information: ${error.message}</td></tr>`;
            });
    }

    const addStaffBtn = document.getElementById('add_worker_btn');
    if (addStaffBtn) {
        addStaffBtn.addEventListener('click', function() {
            fetch('/getItemsAndWorkers')
                .then(response => response.json())
                .then(data => {
                    const { managers, genders } = data; // Corrected variable names
                    populateSelector(genders, 'worker_gender');
                    populateSelector(managers, 'worker_manager'); // Corrected variable name
                    document.querySelector('.view_add_worker_popup').classList.add('active');
                })
                .catch(error => console.error('Error fetching worker form data:', error));
        });
    }

    const workerReturnBtn = document.getElementById('worker_return_btn'); // Corrected selector
    if (workerReturnBtn) {
        workerReturnBtn.addEventListener('click', function() {
            document.querySelector('.view_add_worker_popup').classList.remove('active');
        });
    }

    const workersaveBtn = document.getElementById('worker_save_btn'); // Corrected selector
    if (workersaveBtn) {
        workersaveBtn.addEventListener('click', addWorker);
    }

    function addWorker() {
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

    function showAssignedOrders(workerId) {
        document.querySelector('.view_assigned_orders_popup').classList.add('active');
        
        fetch(`/getAssignedOrders/${workerId}`)
            .then(response => response.json())
            .then(data => {
                const tablebody = document.getElementById('assigned_orders_table').querySelector('tbody');
                tablebody.innerHTML = '';

                if (data.length === 0) {
                    const row = document.createElement('tr');
                    row.innerHTML = `<td colspan="4">No orders assigned to this worker</td>`;
                    tablebody.appendChild(row);
                } else {
                    data.forEach(order => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${order.order_ID}</td>
                            <td>${order.event_Name}</td>
                            <td>${new Date(order.event_date).toLocaleDateString()}</td>
                            <td>${new Date(order.end_event_date).toLocaleDateString()}</td>
                        `;
                        tablebody.appendChild(row);
                    });
                }
            })
            .catch(error => console.error('Error fetching assigned orders:', error));
    }

    // ------------------------------ Dashboard Controls ------------------------------
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

    fetchCurrentUser();

    importData();
});

