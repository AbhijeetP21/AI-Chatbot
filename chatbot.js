document.getElementById("send-button").addEventListener("click", sendMessage);
document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
document.getElementById("clear-button").addEventListener("click", clearChat);
document
  .getElementById("save-button")
  .addEventListener("click", saveChatHistory);
document
  .getElementById("load-button")
  .addEventListener("click", loadChatHistory);
document.getElementById("new-chat-button").addEventListener("click", newChat);
document.getElementById("help-button").addEventListener("click", showHelpModal);
document
  .getElementById("collapse-history-button")
  .addEventListener("click", toggleHistorySidebar);
document
  .getElementById("reopen-history-button")
  .addEventListener("click", toggleHistorySidebar);
document
  .getElementById("user-input")
  .addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      sendMessage();
    }
  });
document
  .getElementById("search-toggle")
  .addEventListener("click", toggleSearch);
document.getElementById("export-button").addEventListener("click", exportChat);
document.getElementById("search-input").addEventListener("input", handleSearch);

// Add keyboard shortcuts
document.addEventListener("keydown", function (e) {
  if (e.ctrlKey && e.key === "k") {
    e.preventDefault();
    toggleSearch();
  }
  if (e.ctrlKey && e.key === "s") {
    e.preventDefault();
    saveChatHistory();
  }
});

let conversationHistory = [];
let chatSaved = false;
let currentChatId = null;

marked.setOptions({
  highlight: function (code, lang) {
    if (Prism.languages[lang]) {
      return Prism.highlight(code, Prism.languages[lang], lang);
    }
    return code;
  },
});

function toggleTheme() {
  document.body.classList.toggle("dark-theme");
  const themeIcon = document.querySelector("#theme-toggle i");
  themeIcon.classList.toggle("fa-moon");
  themeIcon.classList.toggle("fa-sun");
}

function generateChatName(message) {
  // Get first 4-5 words from message, max 30 chars
  return message.split(" ").slice(0, 5).join(" ").substring(0, 30) + "...";
}

function saveChatHistory() {
  if (conversationHistory.length === 0) {
    showNotification("No messages to save", "warning");
    return;
  }

  if (!currentChatId) {
    currentChatId = Date.now().toString();
  }

  const chatData = {
    id: currentChatId,
    name: generateChatName(conversationHistory[0].content),
    messages: conversationHistory,
    timestamp: new Date().toISOString(),
    lastMessage:
      conversationHistory[conversationHistory.length - 1].content.substring(
        0,
        50
      ) + "...",
  };

  // Save to localStorage
  const allChats = JSON.parse(localStorage.getItem("chatHistory") || "{}");
  allChats[currentChatId] = chatData;
  localStorage.setItem("chatHistory", JSON.stringify(allChats));

  // Update sidebar
  updateChatList();
  showNotification("Chat saved successfully");
}

function updateChatList() {
  const historyList = document.getElementById("history-list");
  historyList.innerHTML = "";

  const allChats = JSON.parse(localStorage.getItem("chatHistory") || "{}");

  Object.values(allChats)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .forEach((chat) => {
      const li = document.createElement("li");

      const chatInfo = document.createElement("div");
      chatInfo.className = "chat-info";

      const chatName = document.createElement("div");
      chatName.className = "chat-name";
      chatName.textContent = chat.name;

      const chatTime = document.createElement("div");
      chatTime.className = "chat-time";
      chatTime.textContent = new Date(chat.timestamp).toLocaleString();

      chatInfo.appendChild(chatName);
      chatInfo.appendChild(chatTime);

      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-button";
      deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
      deleteButton.onclick = (e) => {
        e.stopPropagation();
        deleteChat(chat.id);
      };

      li.appendChild(chatInfo);
      li.appendChild(deleteButton);
      li.onclick = () => loadChat(chat.id);

      historyList.appendChild(li);
    });
}

function loadChat(chatId) {
  const allChats = JSON.parse(localStorage.getItem("chatHistory") || "{}");
  const chat = allChats[chatId];

  if (chat) {
    currentChatId = chatId;
    conversationHistory = chat.messages;
    displayChatHistory();
  }
}

function deleteChat(chatId) {
  const allChats = JSON.parse(localStorage.getItem("chatHistory") || "{}");
  delete allChats[chatId];
  localStorage.setItem("chatHistory", JSON.stringify(allChats));
  updateChatList();
}

function sendMessage() {
  const userInput = document.getElementById("user-input").value;
  if (userInput.trim() === "") return;

  // Reset chat if starting new conversation
  if (conversationHistory.length === 0) {
    currentChatId = null;
    chatSaved = false;
  }

  addMessageToChat("User", userInput);
  document.getElementById("user-input").value = "";
  showTypingIndicator(true);

  conversationHistory.push({ role: "user", content: userInput });

  // Auto-save after first message
  if (!chatSaved) {
    saveChatHistory();
    chatSaved = true;
  }

  // Prepare conversation context
  const contextMessage = conversationHistory
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  callAPI(contextMessage)
    .then((data) => {
      showTypingIndicator(false);
      if (data?.candidates?.[0]?.content?.parts?.[0]) {
        const aiResponse = data.candidates[0].content.parts[0].text;
        addMessageToChat("AI", aiResponse);
        // Add AI response to conversation history
        conversationHistory.push({ role: "assistant", content: aiResponse });

        // Auto-save after AI response
        saveChatHistory();

        // Keep conversation history limited to last 10 messages
        if (conversationHistory.length > 10) {
          conversationHistory = conversationHistory.slice(-10);
        }
      } else {
        addMessageToChat("AI", "Sorry, I did not understand that.");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showTypingIndicator(false);
      addMessageToChat("AI", "Sorry, something went wrong.");
    });
}
import config from './config.js';

async function callAPI(contextMessage, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(
        `${config.apiEndpoint}?key=${config.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: contextMessage }] }],
          }),
        }
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

function addMessageToChat(sender, message) {
  const chatBox = document.getElementById("chat-box");
  const messageElement = document.createElement("div");
  messageElement.classList.add("message", sender.toLowerCase());

  // Render markdown for AI messages
  if (sender === "AI") {
    messageElement.innerHTML = marked.parse(message);

    // Add copy buttons to code blocks
    messageElement.querySelectorAll("pre").forEach((pre) => {
      const copyButton = document.createElement("button");
      copyButton.className = "copy-button";
      copyButton.innerHTML = "Copy";
      copyButton.onclick = () => {
        const code = pre.querySelector("code").textContent;
        navigator.clipboard.writeText(code);
        copyButton.innerHTML = "Copied!";
        setTimeout(() => (copyButton.innerHTML = "Copy"), 2000);
      };
      pre.appendChild(copyButton);
    });
  } else {
    messageElement.textContent = message;
  }

  // Add timestamp
  const timestamp = document.createElement("div");
  timestamp.classList.add("timestamp");
  timestamp.textContent = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  messageElement.appendChild(timestamp);

  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;

  // Highlight code blocks
  Prism.highlightAllUnder(messageElement);

  // Enable message editing
  enableMessageEditing(messageElement, conversationHistory.length - 1);
}

function enableMessageEditing(messageElement, messageIndex) {
  const editButton = document.createElement("button");
  editButton.className = "edit-button";
  editButton.innerHTML = '<i class="fas fa-edit"></i>';
  editButton.onclick = () => {
    const content = conversationHistory[messageIndex].content;
    const textarea = document.createElement("textarea");
    textarea.value = content;
    messageElement.innerHTML = "";
    messageElement.appendChild(textarea);

    const saveButton = document.createElement("button");
    saveButton.textContent = "Save";
    saveButton.onclick = () => {
      conversationHistory[messageIndex].content = textarea.value;
      displayChatHistory();
      saveChatHistory();
    };
    messageElement.appendChild(saveButton);
  };
  messageElement.appendChild(editButton);
}

function executeCode(code, language) {
  const supportedLanguages = ["javascript", "python"];
  if (!supportedLanguages.includes(language)) {
    return Promise.reject("Language not supported");
  }

  if (language === "javascript") {
    try {
      const result = eval(code);
      return Promise.resolve(result);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // For Python, you would need a backend service or WASM solution
  return Promise.reject("Python execution not implemented");
}

function showTypingIndicator(show) {
  const typingIndicator = document.getElementById("typing-indicator");
  typingIndicator.style.display = show ? "block" : "none";
}

function clearChat() {
  if (conversationHistory.length === 0) return;

  if (confirm("Are you sure you want to clear the chat?")) {
    const chatBox = document.getElementById("chat-box");
    chatBox.innerHTML = "";
    conversationHistory = [];
    chatSaved = false;
    showNotification("Chat cleared");
  }
}

function loadChatHistory() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        conversationHistory = JSON.parse(e.target.result);
        displayChatHistory();
      };
      reader.readAsText(file);
    }
  };
  input.click();
}

function displayChatHistory() {
  const chatBox = document.getElementById("chat-box");
  chatBox.innerHTML = "";
  conversationHistory.forEach((msg, index) => {
    addMessageToChat(msg.role === "user" ? "User" : "AI", msg.content);
  });
}

function newChat() {
  clearChat();
  currentChatId = null;
  chatSaved = false;
  document.getElementById("user-input").focus();
}

function showHelpModal() {
  const modal = document.getElementById("help-modal");
  const closeButton = modal.querySelector(".close-button");

  modal.style.display = "block";

  closeButton.onclick = () => {
    modal.style.display = "none";
  };

  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };
}

function toggleHistorySidebar() {
  const historyContainer = document.getElementById("history-container");
  const chatContainer = document.getElementById("chat-container");

  historyContainer.classList.toggle("collapsed");
  chatContainer.classList.toggle("expanded");

  // Save sidebar state
  localStorage.setItem(
    "sidebarCollapsed",
    historyContainer.classList.contains("collapsed")
  );
}

// Initialize with last saved theme
if (localStorage.getItem("darkTheme") === "true") {
  toggleTheme();
}

// Save theme preference
function saveThemePreference() {
  localStorage.setItem(
    "darkTheme",
    document.body.classList.contains("dark-theme")
  );
}

// Initialize sidebar state on load
document.addEventListener("DOMContentLoaded", () => {
  const sidebarCollapsed = localStorage.getItem("sidebarCollapsed") === "true";
  if (sidebarCollapsed) {
    toggleHistorySidebar();
  }
  updateChatList();
});

// Add message search functionality
function searchMessages(query) {
  const results = conversationHistory.filter((msg) =>
    msg.content.toLowerCase().includes(query.toLowerCase())
  );
  displaySearchResults(results);
}

function displaySearchResults(results) {
  const chatBox = document.getElementById("chat-box");
  chatBox.innerHTML = "";
  results.forEach((msg) => {
    addMessageToChat(msg.role === "user" ? "User" : "AI", msg.content);
  });
}

// Improve export functionality
function exportChat() {
  if (conversationHistory.length === 0) {
    showNotification("No chat to export");
    return;
  }

  const exportData = {
    timestamp: new Date().toISOString(),
    messages: conversationHistory,
    metadata: {
      chatId: currentChatId,
      exportVersion: "1.0",
    },
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `chat_export_${new Date().toLocaleDateString()}.json`;
  a.click();
  URL.revokeObjectURL(url);

  showNotification("Chat exported successfully");
}

// Add notification system
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }, 100);
}

function toggleSearch() {
  const searchContainer = document.getElementById("search-container");
  const searchInput = document.getElementById("search-input");
  const isHidden = searchContainer.style.display === "none";

  searchContainer.style.display = isHidden ? "block" : "none";
  if (isHidden) {
    searchInput.focus();
  } else {
    searchInput.value = "";
    displayChatHistory(); // Reset to normal view
  }
}

function handleSearch(e) {
  const query = e.target.value.trim();
  if (query) {
    searchMessages(query);
  } else {
    displayChatHistory();
  }
}
