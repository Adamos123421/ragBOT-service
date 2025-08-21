import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, RefreshCw, FileText, Settings, MessageSquare } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import Sidebar from './components/Sidebar';
import HowItWorks from './components/HowItWorks';
import RateLimitIndicator from './components/RateLimitIndicator';
import rateLimiter from './utils/rateLimiter';

function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState('chat'); // 'chat', 'how-it-works'

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Load messages from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('ragbot-chat-messages');
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (error) {
        console.error('Error loading saved messages:', error);
      }
    }
  }, []);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('ragbot-chat-messages', JSON.stringify(messages));
    }
  }, [messages]);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(' https://deaf-finish-contribution-retrieval.trycloudflare.com/api/documents');
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };







  const sendMessage = async (message) => {
    if (!message.trim()) return;

    // Check rate limit before sending request
    if (!rateLimiter.canMakeRequest()) {
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Rate limit exceeded. You have used all 120 requests for today. Please try again after ${rateLimiter.getFormattedResetTime()}.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Record the request before making it
      rateLimiter.recordRequest();

      const response = await axios.post(' https://deaf-finish-contribution-retrieval.trycloudflare.com/api/chat', {
        message,
        history: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      });

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.data.response,
        sources: response.data.sources,
        sourceExcerpts: response.data.sourceExcerpts,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };



  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('ragbot-chat-messages');
  };

  const showHowItWorks = () => {
    setCurrentView('how-it-works');
  };

  const backToChat = () => {
    setCurrentView('chat');
  };

  return (
    <div className="flex h-screen bg-black">
      {/* Rate Limit Indicator */}
      <RateLimitIndicator />
      
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        documents={documents}
        onClearChat={clearChat}
        onShowHowItWorks={showHowItWorks}
        onBackToChat={backToChat}
        currentView={currentView}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {currentView === 'chat' && (
          <ChatInterface
            messages={messages}
            isLoading={isLoading}
            onSendMessage={sendMessage}
            messagesEndRef={messagesEndRef}
          />
        )}
        
        {currentView === 'how-it-works' && (
          <HowItWorks onBack={backToChat} />
        )}
      </div>
    </div>
  );
}

export default App;
