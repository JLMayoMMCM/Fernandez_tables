document.addEventListener("DOMContentLoaded", function () {
  // Global variable for all items (fetched once)
  let allItems = [];

  // ---------- Sidebar Navigation ----------
  const sections = [
    { buttonId: "addOrders", sectionClass: "content_add_orders" },
    { buttonId: "activeOrders", sectionClass: "content_active_orders" }
    // (Other sections omitted for brevity)
  ];
  function toggleSection(activeSectionClass) {
    sections.forEach(({ sectionClass }) => {
      const section = document.querySelector(`.${sectionClass}`);
      if (section) section.classList.toggle("active", sectionClass === activeSectionClass);
      if (sectionClass === "content_active_orders" && section.classList.contains("active")) {
        populateActiveOrders();
      }
    });
  }
  sections.forEach(({ buttonId, sectionClass }) => {
    const button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener("click", () => {
        toggleSection(sectionClass);
        document.getElementById("panel-title").textContent = button.textContent;
      });
    }
  });

  // ---------- Logout Functionality ----------
  const logoutButton = document.getElementById("logout");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "/";
    });
  }

  // ---------- Populate Select Elements ----------
  function populateSelect(url, selectElement) {
    fetch(url)
      .then(res => res.json())
      .then(data => {
        data.forEach(entry => {
          const option = document.createElement("option");
          if (url === "/getManagers") {
            option.value = entry.manager_ID;
            option.textContent = `${entry.first_Name} ${entry.last_Name}`;
          } else if (url === "/getGenders") {
            option.value = entry.gender_ID;
            option.textContent = entry.gender_name;
          }
          selectElement.appendChild(option);
        });
      })
      .catch(err => console.error("Error fetching from " + url, err));
  }
  const managerSelect = document.getElementById("assigned_manager");
  if (managerSelect) populateSelect("/getManagers", managerSelect);
  const genderSelect = document.getElementById("gender");
  if (genderSelect) populateSelect("/getGenders", genderSelect);
  const modifyManagerSelect = document.getElementById("modify_assigned_manager");
  if (modifyManagerSelect) populateSelect("/getManagers", modifyManagerSelect);
  const modifyGenderSelect = document.getElementById("modify_gender");
  if (modifyGenderSelect) populateSelect("/getGenders", modifyGenderSelect);

  // ---------- Populate Items for Add Order ----------
  fetch("/getItems")
    .then(res => res.json())
    .then(items => {
      allItems = items;
      populateAddOrderItems(items);
    })
    .catch(err => console.error("Error fetching items:", err));

  function populateAddOrderItems(items) {
    const tablesBody = document.querySelector("#tables_Container tbody");
    const chairsBody = document.querySelector("#chairs_Container tbody");
    const miscBody = document.querySelector("#misc_Container tbody");
    tablesBody.innerHTML = "";
    chairsBody.innerHTML = "";
    miscBody.innerHTML = "";
    items.forEach(item => {
      const row = document.createElement("tr");
      // Checkbox
      const checkCell = document.createElement("td");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `check_${item.item_ID}`;
      checkCell.appendChild(checkbox);
      row.appendChild(checkCell);
      // Name
      const nameCell = document.createElement("td");
      nameCell.textContent = item.item_name;
      row.appendChild(nameCell);
      // Price
      const priceCell = document.createElement("td");
      priceCell.textContent = parseFloat(item.item_price).toFixed(2);
      row.appendChild(priceCell);
      // Stock
      const stockCell = document.createElement("td");
      stockCell.textContent = item.stock_quantity;
      row.appendChild(stockCell);
      // Quantity
      const qtyCell = document.createElement("td");
      const qtyInput = document.createElement("input");
      qtyInput.type = "number";
      qtyInput.min = 0;
      qtyInput.max = item.stock_quantity;
      qtyInput.value = 0;
      qtyInput.id = `qty_${item.item_ID}`;
      qtyCell.appendChild(qtyInput);
      row.appendChild(qtyCell);
      // Subtotal
      const subtotalCell = document.createElement("td");
      subtotalCell.textContent = "0.00";
      row.appendChild(subtotalCell);
      // Append based on item type
      if (item.item_type_ID === 401) tablesBody.appendChild(row);
      else if (item.item_type_ID === 402) chairsBody.appendChild(row);
      else miscBody.appendChild(row);
      // Listeners
      qtyInput.addEventListener("input", () => {
        const maxVal = parseInt(qtyInput.max);
        if (parseInt(qtyInput.value) > maxVal) qtyInput.value = maxVal;
        updateRowSubtotal(qtyInput, item.item_price, subtotalCell);
        updateAddOrderTotals();
      });
      checkbox.addEventListener("change", updateAddOrderTotals);
    });
  }
  function updateAddOrderTotals() {
    let total = 0;
    const rows = document.querySelectorAll("#tables_Container tbody tr, #chairs_Container tbody tr, #misc_Container tbody tr");
    rows.forEach(row => {
      const checkbox = row.querySelector("input[type='checkbox']");
      const subtotalCell = row.cells[5];
      if (checkbox && checkbox.checked) {
        total += parseFloat(subtotalCell.textContent) || 0;
      }
    });
    const extraFees = parseFloat(document.getElementById("extra_fees").value) || 0;
    total += extraFees;
    document.getElementById("grandSubtotal").textContent = total.toFixed(2);
  }

  // ---------- Populate Workers for Add Order ----------
  fetch("/getWorkers")
    .then(res => res.json())
    .then(workers => {
      const workerBody = document.querySelector("#workers_Container tbody");
      workerBody.innerHTML = "";
      workers.forEach(worker => {
        const row = document.createElement("tr");
        const checkCell = document.createElement("td");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `workerCheck_${worker.worker_ID}`;
        checkCell.appendChild(checkbox);
        row.appendChild(checkCell);
        const nameCell = document.createElement("td");
        nameCell.textContent = `${worker.first_Name} ${worker.last_Name}`;
        row.appendChild(nameCell);
        workerBody.appendChild(row);
      });
    })
    .catch(err => console.error("Error fetching workers:", err));

  // ---------- Subtotal Calculation ----------
  function updateRowSubtotal(qtyInput, price, subtotalCell) {
    const qty = parseInt(qtyInput.value) || 0;
    const subtotal = qty * parseFloat(price);
    subtotalCell.textContent = subtotal.toFixed(2);
  }

  // ---------- Active Orders Functionality ----------
  function populateActiveOrders() {
    fetch("/getActiveOrders")
      .then(res => res.json())
      .then(orders => {
        const tableBody = document.querySelector("#activeOrdersTable tbody");
        tableBody.innerHTML = "";
        orders.forEach(order => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${order.order_ID}</td>
            <td>${order.customer_name}</td>
            <td>${order.event_Name}</td>
            <td>${order.event_start}</td>
            <td>${order.event_end}</td>
            <td>${order.total_price}</td>
            <td>${order.payment_status}</td>
            <td>${order.manager_name}</td>
            <td>${order.address}</td>
            <td>
              <button class="modify_order" data-order-id="${order.order_ID}">Modify</button>
              <button class="delete_order" data-order-id="${order.order_ID}">Delete</button>
            </td>
          `;
          tableBody.appendChild(row);
        });
        document.querySelectorAll(".modify_order").forEach(btn => {
          btn.addEventListener("click", e => {
            const orderId = e.target.dataset.orderId;
            document.querySelector(".content_active_orders").classList.remove("active");
            document.querySelector(".content_modify_order").classList.add("active");
            fetchOrderDetails(orderId);
          });
        });
        document.querySelectorAll(".delete_order").forEach(btn => {
          btn.addEventListener("click", e => {
            const orderId = e.target.dataset.orderId;
            if (confirm("Are you sure you want to delete this order?")) {
              fetch("/deleteOrder", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId })
              })
              .then(res => res.json())
              .then(() => {
                alert("Order deleted successfully!");
                populateActiveOrders();
              })
              .catch(err => {
                console.error("Error deleting order:", err);
                alert("Failed to delete order.");
              });
            }
          });
        });
      })
      .catch(err => console.error("Error fetching active orders:", err));
  }

  // ---------- Modify Order Functionality ----------
  function fetchOrderDetails(orderId) {
    fetch(`/getOrderDetails?orderId=${orderId}`)
      .then(res => res.json())
      .then(data => {
        document.getElementById("modify_event_name").value = data.order.event_Name;
        document.getElementById("modify_event_timestamp").value = data.order.event_date;
        document.getElementById("modify_event_duration").value = calculateDuration(data.order.event_date, data.order.end_event_date);
        document.getElementById("modify_assigned_manager").value = data.order.manager_ID;
        document.getElementById("modify_street").value = data.address ? data.address.street_Name : "";
        document.getElementById("modify_barangay").value = data.address ? data.address.barangay_Name : "";
        document.getElementById("modify_city").value = data.address ? data.address.city_Name : "";
        document.getElementById("modify_first_name").value = data.customer.first_Name;
        document.getElementById("modify_middle_name").value = data.customer.middle_Name || "";
        document.getElementById("modify_last_name").value = data.customer.last_Name;
        document.getElementById("modify_phone_number").value = data.customer.phone_Number;
        document.getElementById("modify_age").value = data.customer.age;
        document.getElementById("modify_gender").value = data.customer.gender_ID;
        document.getElementById("modify_extra_fees").value = data.order.extra_Fee;
        document.getElementById("modify_grandSubtotal").textContent = data.order.total_Amount;
        // Populate items for modify order
        populateModifyOrderItems(allItems, data.orderDetails);
        // Populate workers for modify order
        populateModifyWorkers(data.assignedWorkers);
        window.currentModifyOrderId = orderId;
      })
      .catch(err => console.error("Error fetching order details:", err));
  }
  function calculateDuration(start, end) {
    const s = new Date(start);
    const e = new Date(end);
    return Math.ceil(Math.abs(e - s) / (1000 * 60 * 60 * 24));
  }
  function populateModifyOrderItems(items, orderDetails = []) {
    const tablesBody = document.querySelector("#modify_tables_Container tbody");
    const chairsBody = document.querySelector("#modify_chairs_Container tbody");
    const miscBody = document.querySelector("#modify_misc_Container tbody");
    tablesBody.innerHTML = "";
    chairsBody.innerHTML = "";
    miscBody.innerHTML = "";
    items.forEach(item => {
      const detail = orderDetails.find(d => d.item_ID == item.item_ID);
      const orderQty = detail ? detail.item_quantity : 0;
      const row = document.createElement("tr");
      const checkCell = document.createElement("td");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `modify_check_${item.item_ID}`;
      checkbox.checked = orderQty > 0;
      checkCell.appendChild(checkbox);
      row.appendChild(checkCell);
      const nameCell = document.createElement("td");
      nameCell.textContent = item.item_name;
      row.appendChild(nameCell);
      const priceCell = document.createElement("td");
      priceCell.textContent = parseFloat(item.item_price).toFixed(2);
      row.appendChild(priceCell);
      const stockCell = document.createElement("td");
      stockCell.textContent = item.stock_quantity;
      row.appendChild(stockCell);
      const qtyCell = document.createElement("td");
      const qtyInput = document.createElement("input");
      qtyInput.type = "number";
      qtyInput.min = 0;
      qtyInput.max = item.stock_quantity;
      qtyInput.value = orderQty;
      qtyInput.id = `modify_qty_${item.item_ID}`;
      qtyCell.appendChild(qtyInput);
      row.appendChild(qtyCell);
      const subtotalCell = document.createElement("td");
      subtotalCell.textContent = (orderQty * parseFloat(item.item_price)).toFixed(2);
      row.appendChild(subtotalCell);
      if (item.item_type_ID === 401) tablesBody.appendChild(row);
      else if (item.item_type_ID === 402) chairsBody.appendChild(row);
      else miscBody.appendChild(row);
      qtyInput.addEventListener("input", () => {
        const maxVal = parseInt(qtyInput.max);
        if (parseInt(qtyInput.value) > maxVal) qtyInput.value = maxVal;
        updateRowSubtotal(qtyInput, item.item_price, subtotalCell);
        updateModifyTotals();
      });
      checkbox.addEventListener("change", updateModifyTotals);
    });
  }
  function populateModifyWorkers(orderWorkers = []) {
    fetch("/getWorkers")
      .then(res => res.json())
      .then(workers => {
        const workerBody = document.querySelector("#modify_workers_Container tbody");
        workerBody.innerHTML = "";
        workers.forEach(worker => {
          const row = document.createElement("tr");
          const checkCell = document.createElement("td");
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.id = `modify_workerCheck_${worker.worker_ID}`;
          if (orderWorkers.find(w => w.worker_ID == worker.worker_ID)) {
            checkbox.checked = true;
          }
          checkCell.appendChild(checkbox);
          row.appendChild(checkCell);
          const nameCell = document.createElement("td");
          nameCell.textContent = `${worker.first_Name} ${worker.last_Name}`;
          row.appendChild(nameCell);
          workerBody.appendChild(row);
        });
      })
      .catch(err => console.error("Error fetching workers:", err));
  }
  function updateModifyTotals() {
    let total = 0;
    const rows = document.querySelectorAll("#modify_tables_Container tbody tr, #modify_chairs_Container tbody tr, #modify_misc_Container tbody tr");
    rows.forEach(row => {
      const checkbox = row.querySelector("input[type='checkbox']");
      const subtotalCell = row.cells[5];
      if (checkbox && checkbox.checked) {
        total += parseFloat(subtotalCell.textContent) || 0;
      }
    });
    const extraFees = parseFloat(document.getElementById("modify_extra_fees").value) || 0;
    total += extraFees;
    document.getElementById("modify_grandSubtotal").textContent = total.toFixed(2);
  }

  // ---------- Save Order (Add Order) ----------
  document.getElementById("add_order_button").addEventListener("click", () => {
    if (!validateOrderForm()) return;
    const eventName = document.getElementById("event_name").value;
    const eventTimestamp = document.getElementById("event_timestamp").value;
    const eventDuration = document.getElementById("event_duration").value;
    const assignedManager = document.getElementById("assigned_manager").value;
    const street = document.getElementById("street").value;
    const barangay = document.getElementById("barangay").value;
    const city = document.getElementById("city").value;
    const firstName = document.getElementById("first_name").value;
    const middleName = document.getElementById("middle_name").value;
    const lastName = document.getElementById("last_name").value;
    const phoneNumber = document.getElementById("phone_number").value;
    const age = document.getElementById("age").value;
    const gender = document.getElementById("gender").value;
    const extraFees = document.getElementById("extra_fees").value || 0;
    const grandSubtotal = parseFloat(document.getElementById("grandSubtotal").textContent) || 0;
    const tableRows = document.querySelectorAll("#tables_Container tbody tr");
    const chairRows = document.querySelectorAll("#chairs_Container tbody tr");
    const miscRows = document.querySelectorAll("#misc_Container tbody tr");
    const allRows = [...tableRows, ...chairRows, ...miscRows];
    let items = [];
    allRows.forEach(row => {
      const checkbox = row.querySelector("input[type='checkbox']");
      const qtyInput = row.querySelector("input[type='number']");
      if (checkbox && checkbox.checked) {
        const itemId = checkbox.id.split("_")[1];
        const price = parseFloat(row.cells[2].textContent) || 0;
        const quantity = parseInt(qtyInput.value) || 0;
        if (quantity > 0) items.push({ item_ID: itemId, quantity, price });
      }
    });
    const workerRows = document.querySelectorAll("#workers_Container tbody tr");
    let workers = [];
    workerRows.forEach(row => {
      const checkbox = row.querySelector("input[type='checkbox']");
      if (checkbox && checkbox.checked) {
        const workerId = checkbox.id.split("_")[1];
        workers.push(workerId);
      }
    });
    fetch("/createOrder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName, eventTimestamp, eventDuration, assignedManager,
        street, barangay, city, firstName, middleName, lastName, phoneNumber,
        age, gender, extraFees, grandSubtotal, items, workers
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) alert("Failed to create order: " + data.error);
      else {
        alert("Order created successfully! Order ID: " + data.orderId);
        populateActiveOrders();
      }
    })
    .catch(err => {
      console.error("Error creating order:", err);
      alert("An error occurred while creating the order.");
    });
  });

  // ---------- Save Modified Order ----------
  document.getElementById("save_order_button").addEventListener("click", () => {
    const orderData = {
      orderId: window.currentModifyOrderId,
      eventName: document.getElementById("modify_event_name").value,
      eventTimestamp: document.getElementById("modify_event_timestamp").value,
      eventDuration: document.getElementById("modify_event_duration").value,
      assignedManager: document.getElementById("modify_assigned_manager").value,
      street: document.getElementById("modify_street").value,
      barangay: document.getElementById("modify_barangay").value,
      city: document.getElementById("modify_city").value,
      firstName: document.getElementById("modify_first_name").value,
      middleName: document.getElementById("modify_middle_name").value,
      lastName: document.getElementById("modify_last_name").value,
      phoneNumber: document.getElementById("modify_phone_number").value,
      age: document.getElementById("modify_age").value,
      gender: document.getElementById("modify_gender").value,
      extraFees: document.getElementById("modify_extra_fees").value,
      grandSubtotal: parseFloat(document.getElementById("modify_grandSubtotal").textContent),
      items: [],
      workers: []
    };
    const modTableRows = document.querySelectorAll("#modify_tables_Container tbody tr");
    const modChairRows = document.querySelectorAll("#modify_chairs_Container tbody tr");
    const modMiscRows = document.querySelectorAll("#modify_misc_Container tbody tr");
    const modRows = [...modTableRows, ...modChairRows, ...modMiscRows];
    modRows.forEach(row => {
      const checkbox = row.querySelector("input[type='checkbox']");
      const qtyInput = row.querySelector("input[type='number']");
      if (checkbox && checkbox.checked) {
        const itemId = checkbox.id.split("_")[2];
        const price = parseFloat(row.cells[2].textContent) || 0;
        const quantity = parseInt(qtyInput.value) || 0;
        if (quantity > 0) orderData.items.push({ item_ID: itemId, quantity, price });
      }
    });
    const modWorkerRows = document.querySelectorAll("#modify_workers_Container tbody tr");
    modWorkerRows.forEach(row => {
      const checkbox = row.querySelector("input[type='checkbox']");
      if (checkbox && checkbox.checked) {
        const workerId = checkbox.id.split("_")[2];
        orderData.workers.push(workerId);
      }
    });
    fetch("/updateOrder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData)
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) alert("Failed to update order: " + data.error);
      else {
        alert("Order updated successfully!");
        document.querySelector(".content_modify_order").classList.remove("active");
        document.querySelector(".content_active_orders").classList.add("active");
        populateActiveOrders();
      }
    })
    .catch(err => {
      console.error("Error updating order:", err);
      alert("An error occurred while updating the order.");
    });
  });

  // ---------- Back Button from Modify Order ----------
  document.getElementById("back_to_active_orders").addEventListener("click", () => {
    document.querySelector(".content_modify_order").classList.remove("active");
    document.querySelector(".content_active_orders").classList.add("active");
  });

  // ---------- Validation ----------
  function validateOrderForm() {
    const requiredFields = ["event_name", "event_timestamp", "event_duration", "assigned_manager",
      "street", "barangay", "city", "first_name", "last_name", "phone_number", "gender"];
    for (let id of requiredFields) {
      const field = document.getElementById(id) || document.getElementById("modify_" + id);
      if (!field || !field.value.trim()) {
        alert(`Field "${id}" is required.`);
        return false;
      }
    }
    const workerCheckboxes = document.querySelectorAll("#workers_Container tbody input[type='checkbox'], #modify_workers_Container tbody input[type='checkbox']");
    const hasWorker = Array.from(workerCheckboxes).some(cb => cb.checked);
    if (!hasWorker) {
      alert("Please select at least one worker.");
      return false;
    }
    const grandTotal = document.getElementById("grandSubtotal").textContent || document.getElementById("modify_grandSubtotal").textContent;
    if (parseFloat(grandTotal) <= 0) {
      alert("Grand total must be greater than 0.");
      return false;
    }
    return true;
  }
});
