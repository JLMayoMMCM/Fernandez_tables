var userID = localStorage.getItem('userID');
const header_title = document.getElementById("panel-title");

document.addEventListener("DOMContentLoaded", function () {
    let firstName, middleName, lastName;
    try {
        firstName = localStorage.getItem('firstName');
        middleName = localStorage.getItem('middleName');
        lastName = localStorage.getItem('lastName');
    } catch (error) {
        console.error('Error retrieving user information from localStorage:', error);
    }

    if (firstName && lastName) {
        document.getElementById("dashboard_Username").textContent = `${firstName} ${middleName} ${lastName}`;
    }

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

    let logoutButton = document.getElementById("logout");
    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            localStorage.clear();
            window.location.href = "/";
        });
    }

    
});

document.addEventListener("DOMContentLoaded", function () {
    fetch('/getItems')
        .then(response => response.json())
        .then(items => {
            const tablesContainer = document.getElementById("tablesContainer");
            const chairsContainer = document.getElementById("chairsContainer");
            const miscContainer = document.getElementById("miscContainer");

            items.forEach(item => {
                let row = `<tr>
                    <td>${item.item_name}</td>
                    <td>${item.item_price}</td>
                    <td><input type="number" id="qty_${item.item_ID}" min="0" max="${item.stock_quantity}" value="0"></td>
                </tr>`;

                if (item.item_type_ID === 101) tablesContainer.innerHTML += row;
                else if (item.item_type_ID === 102) chairsContainer.innerHTML += row;
                else miscContainer.innerHTML += row;
            });
        })
        .catch(error => console.error('Error fetching items:', error));
});



