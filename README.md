# Custom AI Chatbot Web App using Gemini 2.0 flash API

A modern chatbot interface that uses the Google Gemini API for AI responses.

## Features

- 💬 Real-time chat interface with AI
- 🌓 Light/Dark theme support
- 💾 Local storage for chat history
- 🔍 Message search functionality
- 📱 Responsive design
- ⌨️ Keyboard shortcuts
- 📤 Export/Import chat functionality
- ✏️ Message editing
- 📋 Code block copying

## Demo
[![Custom AI Chatbot Web App using Gemini 2.0 flash API] ]

## Getting Started

1. Clone the repository
2. Replace the API key in [chatbot.js](chatbot.js) line 218:
```javascript
"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=YOUR_API_KEY"
```
3. Open 

chatbot.html

 in a web browser

## Screenshots
Light theme (no message send):
![image](https://github.com/user-attachments/assets/2d8521c8-76d9-456c-9784-33f6844ad38b)

Light theme (with message send and code block rendering):
![image](https://github.com/user-attachments/assets/e70bbb17-0139-42eb-8dd7-db477cf8aa96)

Light theme (markdown rendering):
![image](https://github.com/user-attachments/assets/b6ba2d2f-32c5-4da6-8fef-d51d1cbc876a)

Dark theme:
![image](https://github.com/user-attachments/assets/6e99de59-236a-4cb3-8a0d-fb47746d0a62)



## Keyboard Shortcuts

- `Ctrl + K`: Toggle search
- `Ctrl + S`: Save chat
- `Ctrl + D`: Toggle dark mode
- `Ctrl + N`: New chat
- `Ctrl + E`: Export chat
- `Ctrl + H`: Help

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Marked.js for Markdown rendering
- Prism.js for code syntax highlighting
- Google Gemini API for AI responses
- Font Awesome for icons

## Local Storage

The app uses browser local storage to save:
- Chat history
- Theme preference
- Sidebar state

## License

MIT

## Author

Abhijeet Pachpute
