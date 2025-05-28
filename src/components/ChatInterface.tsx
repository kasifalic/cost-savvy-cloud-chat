
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/button';

interface ChatInterfaceProps {
  billData: any;
  apiKey: string;
}

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const ChatInterface = ({ billData, apiKey }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hi! I'm your AWS cost optimization assistant powered by Groq AI. I've analyzed your bill and I'm ready to help you understand your costs and find savings opportunities. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsTyping(true);

    try {
      // Call Groq AI via edge function
      const response = await fetch('/api/chat-with-groq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          billData: billData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: data.response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error calling Groq AI:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "I apologize, but I'm having trouble connecting to the AI service right now. Please try again later.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestedQuestions = [
    "What are my highest cost services?",
    "How can I optimize my EC2 costs?",
    "Show me cost trends over time",
    "What savings opportunities do you see?"
  ];

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-black via-gray-800 to-gray-600 bg-clip-text text-transparent">
          AI Cost Assistant
        </h1>
        <p className="text-black">Ask questions about your AWS bill and get intelligent insights powered by Groq AI</p>
      </div>

      <div className="relative h-full">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-orange-600/5 rounded-3xl blur-2xl"></div>
        <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl h-full flex flex-col overflow-hidden">
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'bot' && (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-orange-600/20 rounded-full blur-lg"></div>
                    <div className="relative p-3 bg-gradient-to-r from-teal-500/10 to-orange-600/10 rounded-full border border-white/20">
                      <Bot className="h-5 w-5 text-teal-400" />
                    </div>
                  </div>
                )}
                
                <div className={`max-w-md relative ${
                  message.type === 'user' 
                    ? 'bg-gradient-to-r from-teal-500 to-orange-600 text-white' 
                    : 'backdrop-blur-xl bg-white/10 border border-white/10 text-black'
                } rounded-2xl px-4 py-3 shadow-lg`}>
                  {message.type === 'user' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-orange-600/20 rounded-2xl blur-xl"></div>
                  )}
                  <p className="relative text-sm leading-relaxed">{message.content}</p>
                  <span className="text-xs opacity-60 mt-2 block">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {message.type === 'user' && (
                  <div className="p-3 bg-white/10 rounded-full border border-white/20">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-orange-600/20 rounded-full blur-lg"></div>
                  <div className="relative p-3 bg-gradient-to-r from-teal-500/10 to-orange-600/10 rounded-full border border-white/20">
                    <Bot className="h-5 w-5 text-teal-400" />
                  </div>
                </div>
                <div className="backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length <= 1 && (
            <div className="px-6 py-4 border-t border-white/10">
              <p className="text-sm text-black mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Try asking:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInputValue(question)}
                    className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-black hover:text-gray-800 transition-all duration-200"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-6 border-t border-white/10">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about your AWS costs..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:border-teal-400 focus:bg-white/10 transition-all duration-200"
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="bg-gradient-to-r from-teal-500 to-orange-600 hover:from-teal-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl border-0 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all duration-300 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
