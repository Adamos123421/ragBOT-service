import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot } from 'lucide-react';
import Message from './Message';

const ChatInterface = ({ messages, isLoading, onSendMessage, messagesEndRef }) => {
  const [inputMessage, setInputMessage] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading) {
      onSendMessage(inputMessage);
      setInputMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputMessage]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-chatgpt-dark border-b border-chatgpt-border p-4">
        <h1 className="text-xl font-semibold text-chatgpt-text">RAG Bot</h1>
        <p className="text-sm text-gray-400">AI-powered document assistant</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-4xl mx-auto px-6">
            <Bot className="w-16 h-16 text-chatgpt-green mb-6" />
            <h2 className="text-3xl font-bold mb-4 text-chatgpt-text">✅ Welcome to RAG Bot</h2>
            
            <div className="bg-chatgpt-light p-6 rounded-lg border border-chatgpt-border mb-6 text-left">
              <p className="text-lg text-chatgpt-text mb-4">
                Ask me anything about your documents.
              </p>
              <p className="text-gray-300 mb-4">
                I'll search through your Google Drive files—including expert-level PDFs on Retrieval-Augmented Generation (RAG), AI-generated content, and data engineering workflows—to give you accurate, context-rich answers based on their content.
              </p>
              
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-chatgpt-green font-semibold mb-3 flex items-center">
                  🧠 What I Know:
                </h3>
                <ul className="text-gray-300 space-y-2">
                  <li>• RAG fundamentals & system design</li>
                  <li>• Automating data pipelines with AI</li>
                  <li>• Enterprise knowledge management with LLMs</li>
                  <li>• PDF-based AI workflows</li>
                  <li>• Best practices from recent research (2024–2025)</li>
                </ul>
              </div>
            </div>
            
            <div className="text-sm text-gray-400">
              Start by asking about any document in your Google Drive!
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <Message key={message.id} message={message} />
          ))
        )}
        
        {isLoading && (
          <div className="message assistant">
            <div className="flex-shrink-0">
              <Bot className="w-8 h-8 text-chatgpt-green" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-chatgpt-green rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-chatgpt-green rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-chatgpt-green rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-chatgpt-border p-4">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your documents..."
              className="message-input min-h-[44px] max-h-[200px] pr-12"
              rows="1"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="send-button flex items-center justify-center w-12 h-12"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
