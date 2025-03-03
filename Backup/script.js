document.addEventListener("DOMContentLoaded", function () {



  const toggleToItemList = document.getElementById("toggleToItemList");
  const revertToOrderInfo = document.getElementById("revert_to_order_info");
  const addOrdersContainer = document.querySelector(".content_add_orders");
  const addItemListContainer = document.querySelector(".content_add_item_list");

  if (toggleToItemList) {
    toggleToItemList.addEventListener("click", () => {
      addOrdersContainer.style.display = "none";
      addItemListContainer.style.display = "flex";
    });
  }

  if (revertToOrderInfo) {
    revertToOrderInfo.addEventListener("click", () => {
      addItemListContainer.style.display = "none";
      addOrdersContainer.style.display = "flex";
    });
  }

  // --------------------------
  // SIDEBAR NAVIGATION
  // --------------------------
  const sections = [
    { buttonId: "addOrders", sectionClass: "content_add_orders" },
    { buttonId: "activeOrders", sectionClass: "content_active_orders" },
    { buttonId: "payment", sectionClass: "content_pending_orders" },
    { buttonId: "history", sectionClass: "content_order_history" },
    { buttonId: "inventoryStock", sectionClass: "content_inventory_stock" },
    { sectionClass: "content_add_item_list" }
  ];

  function toggleSection(activeSectionClass) {
    sections.forEach(({ sectionClass }) => {
      const section = document.querySelector(`.${sectionClass}`);
      if (section) {
        section.style.display = sectionClass === activeSectionClass ? "block" : "none";
      }
    });
  }

  sections.forEach(({ buttonId, sectionClass }) => {
  const button = document.getElementById(buttonId);
  if (button) {
    button.addEventListener("click", () => {
      toggleSection(sectionClass);
      document.getElementById("panel-title").textContent = button.textContent;
      
      if (sectionClass === "content_active_orders") {
        populateActiveOrders();
      }
    });
  }
});


  // --------------------------
  // LOGOUT FUNCTIONALITY
  // --------------------------
  const logoutButton = document.getElementById("logout");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "/";
    });
  }

  // --------------------------
  // ADD VALUES TO VARIOUS SELECT ELEMENTS
  // --------------------------
  const managerSelect = document.getElementById("assigned_manager");
  fetch("/getManagers")
    .then(response => response.json())
    .then(managers => {
      managers.forEach(manager => {
        const option = document.createElement("option");
        option.value = manager.manager_ID;
        option.textContent = `${manager.first_Name} ${manager.last_Name}`;
        managerSelect.appendChild(option);
      });
    })
    .catch(error => console.error("Error fetching managers:", error));

  const genderSelect = document.getElementById("gender");
  fetch("/getGenders")
    .then(response => response.json())
    .then(genders => {
      genders.forEach(gender => {
        const option = document.createElement("option");
        option.value = gender.gender_ID;
        option.textContent = gender.gender_name;
        genderSelect.appendChild(option);
      });
    })
    .catch(error => console.error("Error fetching genders:", error));

  // --------------------------
  // ADD ITEMS TO ITEM TABLE
  // --------------------------
  fetch("/getItems")
    .then(response => response.json())
    .then(items => {
      const tablesBody = document.querySelector("#tables_Container tbody");
      const chairsBody = document.querySelector("#chairs_Container tbody");
      const miscBody = document.querySelector("#misc_Container tbody");

      items.forEach(item => {
        const row = document.createElement("tr");

        // Checkbox cell
        const checkCell = document.createElement("td");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `check_${item.item_ID}`;
        checkCell.appendChild(checkbox);
        row.appendChild(checkCell);

        // Name cell
        const nameCell = document.createElement("td");
        nameCell.textContent = item.item_name;
        row.appendChild(nameCell);

        // Price cell
        const priceCell = document.createElement("td");
        priceCell.textContent = item.item_price;
        row.appendChild(priceCell);

        // Quantity cell (auto-correct if value exceeds max)
        const qtyCell = document.createElement("td");
        const qtyInput = document.createElement("input");
        qtyInput.type = "number";
        qtyInput.min = 0;
        qtyInput.max = item.stock_quantity;
        qtyInput.value = 0;
        qtyInput.id = `qty_${item.item_ID}`;
        qtyCell.appendChild(qtyInput);
        row.appendChild(qtyCell);

        // Subtotal cell
        const subtotalCell = document.createElement("td");
        subtotalCell.textContent = "0.00";
        row.appendChild(subtotalCell);

        // Decide which table body to place row in (by item_type_ID)
        if (item.item_type_ID === 401) {
          tablesBody.appendChild(row);
        } else if (item.item_type_ID === 402) {
          chairsBody.appendChild(row);
        } else {
          miscBody.appendChild(row);
        }

        // Event listeners for quantity & checkbox changes
        qtyInput.addEventListener("input", () => {
          const maxVal = parseInt(qtyInput.max);
          let currentVal = parseInt(qtyInput.value);
          if (currentVal > maxVal) {
            qtyInput.value = maxVal;
          }
          updateRowSubtotal(qtyInput, item.item_price, subtotalCell);
          updateItemSubtotal();
          updateGrandSubtotal();
        });

        checkbox.addEventListener("change", () => {
          updateItemSubtotal();
          updateGrandSubtotal();
        });
      });
    })
    .catch(error => console.error("Error fetching items:", error));

  // --------------------------
  // ADD WORKERS TO OPTION TABLE
  // --------------------------
  fetch("/getWorkers")
    .then(response => response.json())
    .then(workers => {
      const workerBody = document.querySelector("#workers_Container tbody");
      workers.forEach(worker => {
        const row = document.createElement("tr");

        // Checkbox
        const checkCell = document.createElement("td");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `workerCheck_${worker.worker_ID}`;
        checkCell.appendChild(checkbox);
        row.appendChild(checkCell);

        // Worker name
        const nameCell = document.createElement("td");
        nameCell.textContent = `${worker.first_Name} ${worker.last_Name}`;
        row.appendChild(nameCell);

        workerBody.appendChild(row);
      });
    })
    .catch(error => console.error("Error fetching workers:", error));

  // --------------------------
  // 7. Subtotal Calculation Functions
  // --------------------------
  function updateRowSubtotal(qtyInput, price, subtotalCell) {
    const quantity = parseInt(qtyInput.value) || 0;
    const rowSubtotal = quantity * parseFloat(price);
    subtotalCell.textContent = rowSubtotal.toFixed(2);
  }

  function updateItemSubtotal() {
    let total = 0;
    const allRows = document.querySelectorAll(
      "#tables_Container tbody tr, #chairs_Container tbody tr, #misc_Container tbody tr"
    );
    allRows.forEach(row => {
      const checkbox = row.querySelector("input[type='checkbox']");
      const subtotalCell = row.cells[4]; // 5th column is "Subtotal"
      if (checkbox && checkbox.checked) {
        const rowSubtotal = parseFloat(subtotalCell.textContent) || 0;
        total += rowSubtotal;
      }
    });
    document.getElementById("item_Subtotal").textContent = total.toFixed(2);
  }

  function updateGrandSubtotal() {
    let total = 0;
    const allRows = document.querySelectorAll(
      "#tables_Container tbody tr, #chairs_Container tbody tr, #misc_Container tbody tr"
    );
    allRows.forEach(row => {
      const checkbox = row.querySelector("input[type='checkbox']");
      const subtotalCell = row.cells[4]; // 5th column is "Subtotal"
      if (checkbox && checkbox.checked) {
        const rowSubtotal = parseFloat(subtotalCell.textContent) || 0;
        total += rowSubtotal;
      }
    });
    const extraFees = parseFloat(document.getElementById("extra_fees").value) || 0;
    total += extraFees;
    document.getElementById("grandSubtotal").textContent = total.toFixed(2);
  }

  // --------------------------
  // 8. Form Validation Before Submission
  // --------------------------
  function validateOrderForm() {
    // Required field IDs
    const requiredFields = [
      "event_name",
      "event_date",
      "event_time",
      "event_duration",
      "assigned_manager",
      "street",
      "barangay",
      "city",
      "first_name",
      "last_name",
      "phone_number",
      "gender"
    ];
    // Check each required field
    for (let fieldId of requiredFields) {
      const field = document.getElementById(fieldId);
      if (!field || !field.value.trim()) {
        alert(`Field "${fieldId}" is required.`);
        return false;
      }
    }
    // At least one worker must be selected
    const workerCheckboxes = document.querySelectorAll("#workers_Container tbody input[type='checkbox']");
    const atLeastOneWorker = Array.from(workerCheckboxes).some(cb => cb.checked);
    if (!atLeastOneWorker) {
      alert("Please select at least one worker.");
      return false;
    }

    // Grand subtotal must be > 0
    const grandSubtotal = parseFloat(document.getElementById("grandSubtotal").textContent) || 0;
    if (grandSubtotal <= 0) {
      alert("Grand subtotal must be greater than 0.");
      return false;
    }
    return true;
  }

  // --------------------------
  // Handle "Add Order" Submission
  // --------------------------
  const addOrderButton = document.getElementById("add_order_button");
  addOrderButton.addEventListener("click", () => {
    if (!validateOrderForm()) return;

    // Gather event information
    const eventName = document.getElementById("event_name").value;
    const eventDate = document.getElementById("event_date").value;
    const eventTime = document.getElementById("event_time").value;
    const eventDuration = document.getElementById("event_duration").value;
    const assignedManager = document.getElementById("assigned_manager").value;

    // Gather address information
    const street = document.getElementById("street").value;
    const barangay = document.getElementById("barangay").value;
    const city = document.getElementById("city").value;

    // Gather customer information
    const firstName = document.getElementById("first_name").value;
    const middleName = document.getElementById("middle_name").value;
    const lastName = document.getElementById("last_name").value;
    const phoneNumber = document.getElementById("phone_number").value;
    const age = document.getElementById("age") ? document.getElementById("age").value : "";
    const gender = document.getElementById("gender").value;

    // Extra fees
    const extraFees = document.getElementById("extra_fees").value || 0;

    // Gather selected items
    const tableRows = document.querySelectorAll("#tables_Container tbody tr");
    const chairRows = document.querySelectorAll("#chairs_Container tbody tr");
    const miscRows = document.querySelectorAll("#misc_Container tbody tr");
    const allItemRows = [...tableRows, ...chairRows, ...miscRows];

    let items = [];
    allItemRows.forEach(row => {
      const checkbox = row.querySelector("input[type='checkbox']");
      const qtyInput = row.querySelector("input[type='number']");
      if (checkbox && checkbox.checked) {
        const itemId = checkbox.id.split("_")[1];
        const price = parseFloat(row.cells[2].textContent) || 0;
        const quantity = parseInt(qtyInput.value) || 0;
        if (quantity > 0) {
          items.push({
            item_ID: itemId,
            quantity: quantity,
            price: price,
          });
        }
      }
    });

    // Gather selected workers
    const workerRows = document.querySelectorAll("#workers_Container tbody tr");
    let workers = [];
    workerRows.forEach(row => {
      const checkbox = row.querySelector("input[type='checkbox']");
      if (checkbox && checkbox.checked) {
        const workerId = checkbox.id.split("_")[1];
        workers.push(workerId);
      }
    });

    // POST data to /createOrder endpoint
    fetch("/createOrder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        eventDate,
        eventTime,
        eventDuration,
        assignedManager,
        street,
        barangay,
        city,
        firstName,
        middleName,
        lastName,
        phoneNumber,
        age,
        gender,
        extraFees,
        items,
        workers
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert("Failed to create order: " + data.error);
        } else {
          alert("Order created successfully! Order ID: " + data.orderId);
        }
      })
      .catch(err => {
        console.error("Error creating order:", err);
        alert("An error occurred while creating the order.");
      });
  });

  // --------------------------
  // 
  // --------------------------
  function populateActiveOrders() {
    fetch("/getActiveOrders")
      .then(response => response.json())
      .then(orders => {
        const tableBody = document.querySelector("#activeOrdersTable tbody");
        tableBody.innerHTML = "";
        orders.forEach(order => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${order.order_ID}</td>
            <td>${order.customer_name}</td>
            <td>${order.event_Name}</td>
            <td>${order.event_date}</td>
            <td>${order.end_event_date}</td>
            <td>${order.start_date}</td>
            <td>${order.end_date}</td>
            <td>${order.subtotal}</td>
            <td>${order.manager_name}</td>
            <td>${order.address}</td>
          `;
          tableBody.appendChild(row);
        });
      })
      .catch(error => console.error("Error fetching active orders:", error));
  }
  
});