const typingForm = document.querySelector(".typing-form");
const chatContainer = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion");
const toggleThemeButton = document.querySelector("#theme-toggle-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

// State variables
let userMessage = null;
let isResponseGenerating = false;
let isUserScrolling = false; // NEW FLAG

// API configuration
const API_KEY = 'AIzaSyB7n3FH5LAtxUCAMr2hQsPqeUrHur6EmSg'; // Your API key here
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

// Detect user manual scrolling
chatContainer.addEventListener("scroll", () => {
    const nearBottom =
        chatContainer.scrollHeight - chatContainer.scrollTop <=
        chatContainer.clientHeight + 10;
    isUserScrolling = !nearBottom; // True when user scrolls up
});

// Load theme and chat data from local storage on page load
const loadDataFromLocalstorage = () => {
    const savedChats = localStorage.getItem("saved-chats");
    const isLightMode =
        localStorage.getItem("themeColor") === "light_mode";

    // Apply the stored theme
    document.body.classList.toggle("light_mode", isLightMode);
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

    // Restore saved chats or clear the chat container
    chatContainer.innerHTML = savedChats || "";
    document.body.classList.toggle("hide-header", savedChats);

    if (!isUserScrolling) {
        chatContainer.scrollTo(0, chatContainer.scrollHeight);
    }
};

// Create a new message element and return it
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
};

// Show typing effect by displaying words one by one
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
    const words = text.split(" ");
    let currentWordIndex = 0;
    const typingInterval = setInterval(() => {
        // Append each word to the text element with a space
        textElement.innerText +=
            (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex++];

        incomingMessageDiv.querySelector(".icon").classList.add("hide");

        // Scroll only if user hasn't scrolled manually
        if (!isUserScrolling) {
            chatContainer.scrollTo(0, chatContainer.scrollHeight);
        }

        // If all words are displayed
        if (currentWordIndex === words.length) {
            clearInterval(typingInterval);
            isResponseGenerating = false;
            incomingMessageDiv.querySelector(".icon").classList.remove("hide");
            localStorage.setItem("saved-chats", chatContainer.innerHTML);
        }
    }, 75);
};

// Fetch response from the API based on user message
const generateAPIResponse = async (incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector(".text"); // Getting text element
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [{ text: userMessage }],
                    },
                ],
            }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error.message);

        // Get the API response text and remove asterisks
        const apiResponse = data.candidates[0].content.parts[0].text.replace(
            /\*\*(.*?)\*\*/g,
            "$1"
        );

        showTypingEffect(apiResponse, textElement, incomingMessageDiv);
    } catch (error) {
        isResponseGenerating = false;
        textElement.innerText = error.message;
        textElement.parentElement.closest(".message").classList.add("error");
    } finally {
        incomingMessageDiv.classList.remove("loading");
    }
};

// Show a loading animation while waiting for the API response
const showLoadingAnimation = () => {
    const html = `<div class="message-content">
      <img class="avatar" src="./gemini.png" alt="Gemini avatar">
      <p class="text"></p>
      <div class="loading-indicator">
        <div class="loading-bar"></div>
        <div class="loading-bar"></div>
        <div class="loading-bar"></div>
      </div>
    </div>
    <span onClick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;

    const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
    chatContainer.appendChild(incomingMessageDiv);

    if (!isUserScrolling) {
        chatContainer.scrollTo(0, chatContainer.scrollHeight);
    }

    generateAPIResponse(incomingMessageDiv);
};

// Copy message text to the clipboard
const copyMessage = (copyButton) => {
    const messageText =
        copyButton.parentElement.querySelector(".text").innerText;
    navigator.clipboard.writeText(messageText);
    copyButton.innerText = "done";
    setTimeout(() => (copyButton.innerText = "content_copy"), 1000);
};

// Handle sending outgoing chat messages
const handleOutgoingChat = () => {
    userMessage =
        typingForm.querySelector(".typing-input").value.trim() || userMessage;
    if (!userMessage || isResponseGenerating) return;

    isResponseGenerating = true;

    const html = `<div class="message-content">
      <img class="avatar" src="./user.png" alt="User avatar">
      <p class="text"></p>
    </div>`;

    const outgoingMessageDiv = createMessageElement(html, "outgoing");
    outgoingMessageDiv.querySelector(".text").innerText = userMessage;
    chatContainer.appendChild(outgoingMessageDiv);

    typingForm.reset();
    document.body.classList.add("hide-header");

    if (!isUserScrolling) {
        chatContainer.scrollTo(0, chatContainer.scrollHeight);
    }

    setTimeout(showLoadingAnimation, 500);
};

// Toggle between light and dark themes
toggleThemeButton.addEventListener("click", () => {
    const isLightMode = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

// Delete all chats
deleteChatButton.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete all the chats?")) {
        localStorage.removeItem("saved-chats");
        loadDataFromLocalstorage();
    }
});

// Suggestion click handler
suggestions.forEach((suggestion) => {
    suggestion.addEventListener("click", () => {
        userMessage = suggestion.querySelector(".text").innerText;
        handleOutgoingChat();
    });
});

// Prevent form submit reload
typingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleOutgoingChat();
});

loadDataFromLocalstorage();
