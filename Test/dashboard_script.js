document.addEventListener("DOMContentLoaded", function () {
    // Set the default active section to "Add Orders"
    let defaultPage = "add_orders"; // Fixed ID to match Dashboard.html
    showPage(defaultPage);

    // Add event listeners to navigation buttons
    document.querySelectorAll(".nav-button").forEach(button => {
        button.addEventListener("click", function () {
            const page = this.getAttribute("data-page");
            if (page) {
                showPage(page);
            }
        });
    });

    function showPage(pageId) {
        // Hide all sections
        document.querySelectorAll(".page-section").forEach(section => {
            section.style.display = "none";
            section.classList.remove("active-section"); // Remove active class
        });
        
        // Show the selected section
        const activeSection = document.getElementById(pageId);
        if (activeSection) {
            activeSection.style.display = "grid"; // Ensure grid layout applies
            activeSection.classList.add("active-section"); // Reapply active-section styles
        }

        // Update the header title
        const panelTitle = document.getElementById("panel-title");
        if (panelTitle) {
            panelTitle.textContent = pageId.replace("_", " ").toUpperCase();
        }
    }
});
