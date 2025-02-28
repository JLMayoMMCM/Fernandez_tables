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
        { buttonId: "pendingOrders", sectionClass: "content_pending_orders" },
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
