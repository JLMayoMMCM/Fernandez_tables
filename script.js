document.addEventListener("DOMContentLoaded", function () {
    // --------------------------
    // 0. Toggle Between Order Info and Item List Containers
    // --------------------------
    const toggleToItemList = document.getElementById("toggleToItemList");
    const rever_to_order_info = document.getElementById("rever_to_order_info");
    const addOrdersContainer = document.querySelector(".content_add_orders");
    const addItemListContainer = document.querySelector(".content_add_item_list");
  
    if (toggleToItemList) {
      toggleToItemList.addEventListener("click", () => {
        addOrdersContainer.style.display = "none";
        addItemListContainer.style.display = "flex";
      });
    }
  
    if (rever_to_order_info) {
      rever_to_order_info.addEventListener("click", () => {
        addItemListContainer.style.display = "none";
        addOrdersContainer.style.display = "flex";
      });
    }
  
    // --------------------------
    // 1. Populate Items with Subtotal Calculation
    // --------------------------
    fetch("/getItems")
      .then(response => response.json())
      .then(items => {
        const tablesBody = document.querySelector("#tablesContainer tbody");
        const chairsBody = document.querySelector("#chairsContainer tbody");
        const miscBody = document.querySelector("#miscContainer tbody");
  
        items.forEach(item => {
          // Create table row
          const row = document.createElement("tr");
  
          // 1) Checkbox cell
          const checkCell = document.createElement("td");
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.id = `check_${item.item_ID}`;
          checkCell.appendChild(checkbox);
          row.appendChild(checkCell);
  
          // 2) Name cell
          const nameCell = document.createElement("td");
          nameCell.textContent = item.item_name;
          row.appendChild(nameCell);
  
          // 3) Price cell
          const priceCell = document.createElement("td");
          priceCell.textContent = item.item_price;
          row.appendChild(priceCell);
  
          // 4) Quantity cell
          const qtyCell = document.createElement("td");
          const qtyInput = document.createElement("input");
          qtyInput.type = "number";
          qtyInput.min = 0;
          qtyInput.max = item.stock_quantity;
          qtyInput.value = 0;
          qtyInput.id = `qty_${item.item_ID}`;
          qtyCell.appendChild(qtyInput);
          row.appendChild(qtyCell);
  
          // 5) Subtotal cell (new column)
          const subtotalCell = document.createElement("td");
          subtotalCell.textContent = "0.00";
          row.appendChild(subtotalCell);
  
          // Append row to correct table based on item_type_ID
          if (item.item_type_ID === 101) {
            tablesBody.appendChild(row);
          } else if (item.item_type_ID === 102) {
            chairsBody.appendChild(row);
          } else {
            miscBody.appendChild(row);
          }
  
          // Listen for changes in quantity to update row subtotal and grand total
          qtyInput.addEventListener("input", () => {
            updateRowSubtotal(qtyInput, item.item_price, subtotalCell);
            updateGrandSubtotal();
          });
  
          // Update grand total when item checkbox is toggled
          checkbox.addEventListener("change", () => {
            updateGrandSubtotal();
          });
        });
      })
      .catch(error => console.error("Error fetching items:", error));
  
    // --------------------------
    // 2. Populate Workers
    // --------------------------
    fetch("/getWorkers")
      .then(response => response.json())
      .then(workers => {
        const workerBody = document.querySelector("#workersContainer tbody");
  
        workers.forEach(worker => {
          const row = document.createElement("tr");
  
          // Worker checkbox
          const checkCell = document.createElement("td");
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.id = `workerCheck_${worker.worker_ID}`;
          checkCell.appendChild(checkbox);
          row.appendChild(checkCell);
  
          // Worker name cell
          const nameCell = document.createElement("td");
          nameCell.textContent = `${worker.first_Name} ${worker.last_Name}`;
          row.appendChild(nameCell);
  
          workerBody.appendChild(row);
        });
      })
      .catch(error => console.error("Error fetching workers:", error));
  
    // --------------------------
    // 3. Section Toggle Logic for Sidebar (if needed)
    // --------------------------
    const sections = [
      { buttonId: "addOrders", sectionClass: "content_add_orders" },
      { buttonId: "activeOrders", sectionClass: "content_active_orders" },
      { buttonId: "payment", sectionClass: "content_pending_orders" },
      { buttonId: "history", sectionClass: "content_order_history" },
      { buttonId: "inventoryStock", sectionClass: "content_inventory_stock" },
    ];
  
    function toggleSection(activeSectionClass) {
      sections.forEach(({ sectionClass }) => {
        let section = document.querySelector(`.${sectionClass}`);
        if (section) {
          section.style.display = sectionClass === activeSectionClass ? "block" : "none";
        }
      });
    }
  
    sections.forEach(({ buttonId, sectionClass }) => {
      let button = document.getElementById(buttonId);
      if (button) {
        button.addEventListener("click", () => toggleSection(sectionClass));
      }
    });
  
    // --------------------------
    // 4. Logout Functionality
    // --------------------------
    let logoutButton = document.getElementById("logout");
    if (logoutButton) {
      logoutButton.addEventListener("click", function () {
        localStorage.clear();
        window.location.href = "/";
      });
    }
  
    // --------------------------
    // 5. Subtotal Calculation Functions
    // --------------------------
    // Updates the row-level subtotal
    function updateRowSubtotal(qtyInput, price, subtotalCell) {
      const quantity = parseInt(qtyInput.value) || 0;
      const rowSubtotal = quantity * parseFloat(price);
      subtotalCell.textContent = rowSubtotal.toFixed(2);
    }
  
    // Updates the grand total (summing checked items and extra fees)
    function updateGrandSubtotal() {
      let total = 0;
      const allRows = document.querySelectorAll(
        "#tablesContainer tbody tr, #chairsContainer tbody tr, #miscContainer tbody tr"
      );
  
      allRows.forEach(row => {
        const checkbox = row.querySelector("input[type='checkbox']");
        const subtotalCell = row.cells[4]; // 5th column: Subtotal
        if (checkbox && checkbox.checked) {
          const rowSubtotal = parseFloat(subtotalCell.textContent) || 0;
          total += rowSubtotal;
        }
      });
  
      // Add Extra Fees if provided
      const extraFees = parseFloat(document.getElementById("extra-fees").value) || 0;
      total += extraFees;
  
      document.getElementById("grandSubtotal").textContent = total.toFixed(2);
    }
  
    // Listen for changes in the Extra Fees input
    const extraFeesInput = document.getElementById("extra-fees");
    if (extraFeesInput) {
      extraFeesInput.addEventListener("input", () => {
        updateGrandSubtotal();
      });
    }
  
    // --------------------------
    // 6. Handle "Add Order" Submission
    // --------------------------
    const addOrderButton = document.getElementById("add_order_button");
    addOrderButton.addEventListener("click", function () {
      // Gather event info
      const eventName = document.getElementById("event-name").value;
      const eventDate = document.getElementById("event-date").value;
  
      // Gather address info
      const street = document.getElementById("street").value;
      const barangay = document.getElementById("barangay").value;
      const city = document.getElementById("city").value;
  
      // Gather customer info
      const firstName = document.getElementById("first-name").value;
      const middleName = document.getElementById("middle-name").value;
      const lastName = document.getElementById("last-name").value;
      const phoneNumber = document.getElementById("phone-number").value;
      const age = document.getElementById("age").value;
      const gender = document.getElementById("gender").value;
  
      // Extra fees
      const extraFees = document.getElementById("extra-fees").value || 0;
  
      // Gather selected items from Tables, Chairs, and Miscellaneous
      const tableRows = document.querySelectorAll("#tablesContainer tbody tr");
      const chairRows = document.querySelectorAll("#chairsContainer tbody tr");
      const miscRows = document.querySelectorAll("#miscContainer tbody tr");
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
      const workerRows = document.querySelectorAll("#workersContainer tbody tr");
      let workers = [];
      workerRows.forEach(row => {
        const checkbox = row.querySelector("input[type='checkbox']");
        if (checkbox && checkbox.checked) {
          const workerId = checkbox.id.split("_")[1];
          workers.push(workerId);
        }
      });
  
      // Calculate final subtotal (for debugging or further processing)
      let finalSubtotal = 0;
      items.forEach(item => {
        finalSubtotal += item.quantity * item.price;
      });
      finalSubtotal += parseFloat(extraFees);
  
      console.log("Final Subtotal:", finalSubtotal);
  
      // POST data to createOrder endpoint
      fetch("/createOrder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName,
          eventDate,
          eventLocation,
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
            // Optionally reset form or redirect
            // location.reload();
          }
        })
        .catch(err => {
          console.error("Error creating order:", err);
          alert("An error occurred while creating the order.");
        });
    });
  });
  