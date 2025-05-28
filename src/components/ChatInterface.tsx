
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
      content: "Hi! I'm your AWS cost optimization assistant. I've analyzed your bill and I'm ready to help you understand your costs and find savings opportunities. What would you like to know?",
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
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: generateMockResponse(inputValue),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const generateMockResponse = (query: string) => {
    const responses = [
      "Based on your AWS bill analysis, your highest cost service is EC2 at $1,240.50. I recommend considering Reserved Instances which could save you up to 30% on compute costs.",
      "Your S3 costs have increased by 8.1% this month. Consider implementing lifecycle policies to automatically transition older objects to cheaper storage classes like IA or Glacier.",
      "I notice you're spending $765.20 on RDS. You could potentially save $200/month by right-sizing your database instances based on actual utilization patterns.",
      "Your Lambda usage shows great cost efficiency! The 15.3% increase is likely due to increased business value. Consider using Provisioned Concurrency for consistent performance if needed."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
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
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
          AI Cost Assistant
        </h1>
        <p className="text-gray-300">Ask questions about your AWS bill and get intelligent insights</p>
      </div>

      <div className="relative h-full">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-600/5 rounded-3xl blur-2xl"></div>
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
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full blur-lg"></div>
                    <div className="relative p-3 bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-full border border-white/20">
                      <Bot className="h-5 w-5 text-blue-400" />
                    </div>
                  </div>
                )}
                
                <div className={`max-w-md relative ${
                  message.type === 'user' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                    : 'backdrop-blur-xl bg-white/10 border border-white/10 text-gray-100'
                } rounded-2xl px-4 py-3 shadow-lg`}>
                  {message.type === 'user' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-2xl blur-xl"></div>
                  )}
                  <p className="relative text-sm leading-relaxed">{message.content}</p>
                  <span className="text-xs opacity-60 mt-2 block">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {message.type === 'user' && (
                  <div className="p-3 bg-white/10 rounded-full border border-white/20">
                    <User className="h-5 w-5 text-gray-300" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full blur-lg"></div>
                  <div className="relative p-3 bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-full border border-white/20">
                    <Bot className="h-5 w-5 text-blue-400" />
                  </div>
                </div>
                <div className="backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length <= 1 && (
            <div className="px-6 py-4 border-t border-white/10">
              <p className="text-sm text-gray-300 mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Try asking:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInputValue(question)}
                    className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-gray-300 hover:text-white transition-all duration-200"
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
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white/10 transition-all duration-200"
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl border-0 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 disabled:opacity-50"
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
