

let selectedFile = null; // Variable to store the selected file
let messageCount = 0; // Counter for unique message IDs

// Utility function to scroll the chat container to the bottom
function scrollToBottom() {
    const chatContainer = document.getElementById("chatContainer");
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Function to append a message to the chat container
function appendMessage(sender, message, id = null) {
    const messageHtml = `
      <div class="message ${sender}">
        <div class="msg-header">${capitalizeFirstLetter(sender)}</div>
        <div class="msg-body" ${id ? `id="${id}"` : ""}>${message}</div>
      </div>
    `;
    document.getElementById("chatContainer").insertAdjacentHTML('beforeend', messageHtml);
    scrollToBottom();
}

// Utility function to capitalize the first letter of a string
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Function to handle sending a user message
function sendMessage() {
    const inputField = document.getElementById("text");
    const rawText = inputField.value;

    if (!rawText) return; // Do nothing if input and file are empty

    appendMessage("user", rawText || "File Sent"); // Add user message or file notification
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
        .then((response) => response.text())
        .then((data) => displayBotResponse(data))
        .catch(() => displayError())
       
}

// Function to display the bot's response with a gradual reveal effect
function displayBotResponse(data) {
    const botMessageId = `botMessage-${messageCount++}`; // Use and increment messageCount
    appendMessage("model", "", botMessageId); // Add placeholder for bot message

    const botMessageDiv = document.getElementById(botMessageId);
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
    const attachmentButton = document.getElementById("attachment");
    const fileInput = document.getElementById("fileInput");

    sendButton.addEventListener("click", sendMessage);

    inputField.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            sendMessage();
        }
    });

    // Trigger file input on attachment button click
    attachmentButton.addEventListener("click", () => {
        fileInput.click();
    });

    // Store selected file when user selects one
   
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function updateUserDisplay() {
    const userCookie = getCookie('userData'); // Assume 'userData' stores JSON string with user info

    if (userCookie) {
        try {
            const user = JSON.parse(decodeURIComponent(userCookie));

            if (user && user.name) {
                document.getElementById("user-name").innerText = `Welcome, ${user.name}`;
                document.getElementById("auth-action").href = "/auth/logout";
                document.getElementById("auth-action").innerHTML = `
                    <span>Logout</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M21,11H11.41l2.3-2.29a1,1,0,1,0-1.42-1.42l-4,4a1,1,0,0,0-.21.33,1,1,0,0,0,0,.76,1,1,0,0,0,.21.33l4,4a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42L11.41,13H21a1,1,0,0,0,0-2Z"/>
                    </svg>
                `;
                document.getElementById("profile-link").innerHTML = `
                <a href="/user/profile" id="profile-icon">
                <i class="fa-solid fa-user-circle fa-2x"></i>
                </a>
                `;
            }
        } catch (error) {
            console.error("Error parsing user cookie:", error);
        }
    }
}

function refreshAccessToken() {
    fetch('/auth/refresh-token', { method: 'POST', credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            if (data.accessToken) {
                document.cookie = `accessToken=${data.accessToken}; path=/; secure; SameSite=Strict`;
            }
        })
        .catch(error => console.error("Error refreshing token:", error));
}

setInterval(refreshAccessToken, 14 * 60 * 1000);
updateUserDisplay();

// Initialize the chat application when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", attachEventListeners);






