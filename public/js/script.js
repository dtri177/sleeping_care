let messageCount = 0; // Counter for unique message IDs

// Utility function to scroll the chat container to the bottom
function scrollToBottom() {
    const chatContainer = document.getElementById("chatContainer");
    if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

// Function to append a message to the chat container
function appendMessage(sender, message, id = null) {
    const chatContainer = document.getElementById("chatContainer");
    if (!chatContainer) return;
    
    const messageHtml = `
      <div class="message ${sender}">
        <div class="msg-header">${capitalizeFirstLetter(sender)}</div>
        <div class="msg-body" ${id ? `id="${id}"` : ""}>${message}</div>
      </div>
    `;
    chatContainer.insertAdjacentHTML('beforeend', messageHtml);
    scrollToBottom();
}

// Utility function to capitalize the first letter of a string
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Function to handle sending a user message
function sendMessage() {
    const inputField = document.getElementById("text");
    if (!inputField) return;
    
    const rawText = inputField.value;
    if (!rawText) return; // Do nothing if input is empty

    appendMessage("user", rawText); // Add user message
    inputField.value = ""; // Clear the input field

    const formData = new FormData();
    formData.append("msg", rawText);

    fetchBotResponse(formData); // Fetch response from the server
}

// Function to fetch the bot's response from the server
function fetchBotResponse(formData) {
    fetch("/ai/get", {
        method: "POST",
        body: formData,
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then((data) => displayBotResponse(data))
        .catch((error) => {
            console.error("Error fetching bot response:", error);
            displayError();
        });
}

// Function to display the bot's response with a gradual reveal effect
function displayBotResponse(data) {
    const botMessageId = `botMessage-${messageCount++}`; // Use and increment messageCount
    appendMessage("model", "", botMessageId); // Add placeholder for bot message

    const botMessageDiv = document.getElementById(botMessageId);
    if (!botMessageDiv) return;
    
    botMessageDiv.textContent = ""; // Ensure it's empty

    let index = 0;
    const interval = setInterval(() => {
        if (index < data.length) {
            botMessageDiv.textContent += data[index++]; // Gradually add characters
        } else {
            clearInterval(interval); // Stop once the response is fully revealed
        }
    }, 30);
}

// Function to display an error message in the chat
function displayError() {
    appendMessage("model error", "Failed to fetch a response from the server.");
}

// Attach event listeners for the send button and the Enter key
function attachEventListeners() {
    const sendButton = document.getElementById("send");
    const inputField = document.getElementById("text");
    
    if (sendButton) {
        sendButton.addEventListener("click", sendMessage);
    }

    if (inputField) {
        inputField.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                sendMessage();
            }
        });
    }
    
    // Only set up attachment functionality if the elements exist
    const attachmentButton = document.getElementById("attachment");
    const fileInput = document.getElementById("fileInput");

    if (attachmentButton && fileInput) {
        attachmentButton.addEventListener("click", () => {
            fileInput.click();
        });
    }
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

async function updateUserDisplay() {
    try {
        const response = await fetch('/auth/user', { 
            credentials: 'include',
            // Add error handling for the request
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            // If user is not logged in (401) or other error, just don't update the display
            // This prevents the error message in console
            console.log("User not logged in or error fetching user data");
            return;
        }
        
        const user = await response.json();
        if (user && user.user && user.user.name) {
            const userNameElement = document.getElementById("user-name");
            const authActionElement = document.getElementById("auth-action");
            const profileLinkElement = document.getElementById("profile-link");
            
            if (userNameElement) userNameElement.innerText = `Welcome, ${user.user.name}`;
            
            if (authActionElement) {
                authActionElement.href = "/auth/logout";
                authActionElement.innerHTML = `
                    <span>Logout</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M21,11H11.41l2.3-2.29a1,1,0,1,0-1.42-1.42l-4,4a1,1,0,0,0-.21.33,1,1,0,0,0,0,.76,1,1,0,0,0,.21.33l4,4a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42L11.41,13H21a1,1,0,0,0,0-2Z"/>
                    </svg>
                `;
            }
            
            if (profileLinkElement) {
                profileLinkElement.innerHTML = `
                    <a href="/user/profile" id="profile-icon">
                        <i class="fa-solid fa-user-circle fa-2x"></i>
                    </a>
                `;
            }
        }
    } catch (error) {
        // Silently handle errors during user data fetching
        console.log("Error in updateUserDisplay:", error.message);
    }
}

async function refreshAccessToken() {
    try {
        const response = await fetch('/auth/refresh-token', { 
            method: 'POST', 
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            // If token refresh fails, just log it - user might not be logged in
            console.log("Token refresh failed or user not logged in");
            return;
        }
        
        const data = await response.json();
        if (data && data.accessToken) {
            document.cookie = `accessToken=${data.accessToken}; path=/; secure; SameSite=Strict`;
        }
    } catch (error) {
        console.log("Error in refreshAccessToken:", error.message);
    }
}

// Initialize the chat application when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    // First attach event listeners
    attachEventListeners();
    
    // Then try to update user display if user is logged in
    // This won't cause errors if the user isn't logged in
    try {
        updateUserDisplay();
    } catch (error) {
        console.log("User not logged in or error in updating display");
    }
    
    // Set up token refresh for logged-in users
    setInterval(() => {
        // Only try to refresh if there's an accessToken cookie
        if (getCookie('accessToken')) {
            refreshAccessToken();
        }
    }, 14 * 60 * 1000); // 14 minutes
});