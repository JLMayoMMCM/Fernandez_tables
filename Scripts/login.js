document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
  
        const userID = document.getElementById('userID').value;
        const staffPassword = document.getElementById('staffPassword').value;
  
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


});