(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        GEMINI_API_KEY: 'AIzaSyDoWC0rmdwqFamFgY9-YYu2bzxVdHLn3_s', // Get free from https://ai.google.dev/
        GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
        WIDGET_POSITION: 'bottom-right',
        PRIMARY_COLOR: '#4285f4',
        SECONDARY_COLOR: '#34a853'
    };
    
    // Global variables
    let isOpen = false;
    let currentPageContent = '';
    let ragData = '';
    let chatHistory = [];
    
    // Create widget HTML
    function createWidget() {
        const widgetHTML = `
            <div id="olabs-chatbot-container" style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <!-- Chat Button -->
                <div id="olabs-chat-button" style="
                    width: 60px;
                    height: 60px;
                    background: ${CONFIG.PRIMARY_COLOR};
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    transition: all 0.3s ease;
                ">
                    <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                    </svg>
                </div>
                
                <!-- Chat Window -->
                <div id="olabs-chat-window" style="
                    position: absolute;
                    bottom: 80px;
                    right: 0;
                    width: 350px;
                    height: 500px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
                    display: none;
                    flex-direction: column;
                    overflow: hidden;
                ">
                    <!-- Header -->
                    <div style="
                        background: ${CONFIG.PRIMARY_COLOR};
                        color: white;
                        padding: 16px;
                        font-weight: 600;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <span>Olabs Assistant</span>
                        <span id="olabs-close-btn" style="cursor: pointer; font-size: 20px;">&times;</span>
                    </div>
                    
                    <!-- Messages Container -->
                    <div id="olabs-messages" style="
                        flex: 1;
                        overflow-y: auto;
                        padding: 16px;
                        background: #f8f9fa;
                    "></div>
                    
                    <!-- Input Area -->
                    <div style="
                        padding: 16px;
                        border-top: 1px solid #e0e0e0;
                        background: white;
                    ">
                        <div style="display: flex; gap: 8px;">
                            <input 
                                id="olabs-message-input" 
                                type="text" 
                                placeholder="Ask me anything about this page..."
                                style="
                                    flex: 1;
                                    padding: 12px;
                                    border: 1px solid #ddd;
                                    border-radius: 24px;
                                    outline: none;
                                    font-size: 14px;
                                "
                            >
                            <button id="olabs-send-btn" style="
                                padding: 12px 16px;
                                background: ${CONFIG.PRIMARY_COLOR};
                                color: white;
                                border: none;
                                border-radius: 24px;
                                cursor: pointer;
                                font-size: 14px;
                            ">Send</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
        initializeEventListeners();
    }
    
    // Scrape current page content
    function scrapePageContent() {
        try {
            // Get page title and URL
            const title = document.title;
            const url = window.location.href;
            const pathname = window.location.pathname;
            
            // Extract main content (avoiding scripts, styles, etc.)
            const contentSelectors = [
                'main', 
                '.content', 
                '#content', 
                'article', 
                '.post-content',
                '.page-content',
                'body'
            ];
            
            let mainContent = '';
            for (const selector of contentSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    // Clone element and remove unwanted parts
                    const clone = element.cloneNode(true);
                    
                    // Remove scripts, styles, ads, etc.
                    const unwantedSelectors = [
                        'script', 'style', 'nav', 'header', 'footer', 
                        '.ad', '.advertisement', '.sidebar', '.menu',
                        '[class*="ad-"]', '[id*="ad-"]'
                    ];
                    
                    unwantedSelectors.forEach(sel => {
                        clone.querySelectorAll(sel).forEach(el => el.remove());
                    });
                    
                    mainContent = clone.innerText || clone.textContent || '';
                    break;
                }
            }
            
            // Get meta description
            const metaDesc = document.querySelector('meta[name="description"]');
            const description = metaDesc ? metaDesc.getAttribute('content') : '';
            
            // Combine all content
            currentPageContent = `
                Title: ${title}
                URL: ${url}
                Path: ${pathname}
                Description: ${description}
                Content: ${mainContent.substring(0, 5000)}
            `.trim();
            
            return currentPageContent;
            
        } catch (error) {
            console.error('Error scraping page:', error);
            return `Title: ${document.title}\nURL: ${window.location.href}`;
        }
    }
    
    // Convert content to PDF data (simulated for RAG)
    function prepareRAGData(content) {
        // For RAG, we'll chunk the content into smaller pieces
        const chunks = [];
        const chunkSize = 500;
        const words = content.split(' ');
        
        for (let i = 0; i < words.length; i += chunkSize) {
            chunks.push(words.slice(i, i + chunkSize).join(' '));
        }
        
        ragData = chunks.join('\n\n---CHUNK---\n\n');
        return ragData;
    }
    
    // Generate context-aware greeting
    function generateGreeting() {
        const url = window.location.href.toLowerCase();
        const pathname = window.location.pathname.toLowerCase();
        const title = document.title.toLowerCase();
        
        // Detect page type and generate appropriate greeting
        if (pathname === '/' || pathname === '/index.html' || pathname === '/home') {
            return "Hello! How can I help you explore Olabs today? 🧪";
        } else if (url.includes('physics') || title.includes('physics')) {
            if (url.includes('projectile') || title.includes('projectile')) {
                return "Hey there! Ready to dive into projectile motion? I'm here to help! 🚀";
            } else if (url.includes('mechanics') || title.includes('mechanics')) {
                return "Hi! Let's explore the fascinating world of mechanics together! ⚙️";
            } else {
                return "Welcome to Physics! How can I help you understand the wonders of physics today? ⚡";
            }
        } else if (url.includes('chemistry') || title.includes('chemistry')) {
            return "Hello! Ready for some chemistry magic? How can I assist you? 🧬";
        } else if (url.includes('biology') || title.includes('biology')) {
            return "Hi there! Let's explore the amazing world of biology! How can I help? 🌱";
        } else if (url.includes('math') || title.includes('math')) {
            return "Hey! Ready to solve some mathematical puzzles? I'm here to help! 📊";
        } else {
            return `Hi! I'm here to help you with "${document.title}". What would you like to know? 💡`;
        }
    }
    
    // Call Gemini API
    async function callGeminiAPI(userMessage, isGreeting = false) {
        try {
            let systemPrompt;
            
            if (isGreeting) {
                systemPrompt = `You are a helpful educational assistant for Olabs (Online Labs). 
                Generate a short, friendly, and contextual greeting based on the current page content.
                Keep it under 20 words and make it engaging for students.
                
                Current page context: ${currentPageContent.substring(0, 1000)}`;
            } else {
                systemPrompt = `You are an educational assistant for Olabs. Use the following page content to answer questions accurately and helpfully.
                
                Page Content: ${ragData || currentPageContent}
                
                Instructions:
                - Answer based on the page content provided
                - Be concise but thorough
                - Use simple language suitable for students
                - If the answer isn't in the page content, say so politely
                - Focus on educational value`;
            }
            
            const requestBody = {
                contents: [{
                    parts: [{
                        text: isGreeting ? systemPrompt : `${systemPrompt}\n\nUser Question: ${userMessage}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            };
            
            const response = await fetch(`${CONFIG.GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }
            
            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
            
        } catch (error) {
            console.error('Gemini API Error:', error);
            return "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.";
        }
    }
    
    // Add message to chat
    function addMessage(message, isUser = false) {
        const messagesContainer = document.getElementById('olabs-messages');
        const messageDiv = document.createElement('div');
        
        messageDiv.style.cssText = `
            margin-bottom: 12px;
            display: flex;
            ${isUser ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
        `;
        
        const messageBubble = document.createElement('div');
        messageBubble.style.cssText = `
            max-width: 80%;
            padding: 12px 16px;
            border-radius: 18px;
            font-size: 14px;
            line-height: 1.4;
            ${isUser ? 
                `background: ${CONFIG.PRIMARY_COLOR}; color: white; border-bottom-right-radius: 4px;` :
                'background: white; color: #333; border: 1px solid #e0e0e0; border-bottom-left-radius: 4px;'
            }
        `;
        
        messageBubble.textContent = message;
        messageDiv.appendChild(messageBubble);
        messagesContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Handle sending messages
    async function sendMessage() {
        const input = document.getElementById('olabs-message-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message
        addMessage(message, true);
        input.value = '';
        
        // Show typing indicator
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.style.cssText = 'margin: 12px 0; color: #666; font-size: 12px;';
        typingDiv.textContent = 'Assistant is typing...';
        document.getElementById('olabs-messages').appendChild(typingDiv);
        
        try {
            // Get AI response
            const response = await callGeminiAPI(message);
            
            // Remove typing indicator
            document.getElementById('typing-indicator')?.remove();
            
            // Add AI response
            addMessage(response);
            
            // Store in chat history
            chatHistory.push({ user: message, assistant: response });
            
        } catch (error) {
            document.getElementById('typing-indicator')?.remove();
            addMessage("I apologize, but I'm experiencing technical difficulties. Please try again.");
        }
    }
    
    // Initialize event listeners
    function initializeEventListeners() {
        const chatButton = document.getElementById('olabs-chat-button');
        const chatWindow = document.getElementById('olabs-chat-window');
        const closeBtn = document.getElementById('olabs-close-btn');
        const sendBtn = document.getElementById('olabs-send-btn');
        const messageInput = document.getElementById('olabs-message-input');
        
        // Toggle chat window
        chatButton.addEventListener('click', async () => {
            if (!isOpen) {
                chatWindow.style.display = 'flex';
                isOpen = true;
                
                // First time opening - scrape content and show greeting
                if (chatHistory.length === 0) {
                    scrapePageContent();
                    prepareRAGData(currentPageContent);
                    
                    const greeting = generateGreeting();
                    addMessage(greeting);
                }
            } else {
                chatWindow.style.display = 'none';
                isOpen = false;
            }
        });
        
        // Close chat window
        closeBtn.addEventListener('click', () => {
            chatWindow.style.display = 'none';
            isOpen = false;
        });
        
        // Send message
        sendBtn.addEventListener('click', sendMessage);
        
        // Send on Enter key
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        
        // Hover effects
        chatButton.addEventListener('mouseenter', () => {
            chatButton.style.transform = 'scale(1.1)';
        });
        
        chatButton.addEventListener('mouseleave', () => {
            chatButton.style.transform = 'scale(1)';
        });
    }
    
    // Initialize widget when DOM is ready
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createWidget);
        } else {
            createWidget();
        }
    }
    
    // Start the widget
    init();
    
})();
