
import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, User, Bot } from 'lucide-react';

interface ChatInterfaceProps {
  billData: any;
  apiKey: string;
}

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const ChatInterface = ({ billData, apiKey }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (billData && messages.length === 0) {
      const welcomeMessage: Message = {
        id: '1',
        text: `Hi! I've analyzed your AWS bill for ${billData.billingPeriod}. Your total cost was $${billData.totalCost}. I can help you understand your costs, identify optimization opportunities, and answer any questions about your bill. What would you like to know?`,
        isBot: true,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [billData]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "Based on your bill analysis, I can see that EC2 instances are your largest cost at $456.32 (36.6% of total). Consider right-sizing your instances to save 25-30%.",
        "Your S3 costs are $234.21 this month. You could save money by moving infrequently accessed data to S3 IA or Glacier storage classes.",
        "I notice you're spending $187.45 on RDS. Reserved instances could save you up to 40% for predictable workloads.",
        "Looking at your monthly trend, costs increased 8.2% from last month. The main drivers are increased EC2 usage and new RDS instances.",
        "I found several optimization opportunities: unused EBS volumes ($23), idle load balancers ($22), and over-provisioned instances ($137 potential savings)."
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!billData) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-16">
          <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Chat Analysis Not Available</h3>
          <p className="text-gray-500">Upload an AWS bill first to start chatting about your costs.</p>
        </div>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">API Key Required</h3>
          <p className="text-yellow-700 mb-4">
            Please configure your OpenAI API key in Settings to enable AI-powered chat analysis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[600px] flex flex-col">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">AWS Bill Analysis Chat</h2>
          <p className="text-sm text-gray-500">Ask me anything about your AWS costs and optimization opportunities</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`flex max-w-xs lg:max-w-md ${message.isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className={`flex-shrink-0 ${message.isBot ? 'mr-2' : 'ml-2'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.isBot ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {message.isBot ? (
                      <Bot className="w-4 h-4 text-blue-600" />
                    ) : (
                      <User className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-lg ${
                  message.isBot 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'bg-blue-600 text-white'
                }`}>
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="flex flex-row">
                <div className="flex-shrink-0 mr-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div className="bg-gray-100 px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-200 p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your AWS costs..."
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              "What are my highest cost services?",
              "How can I optimize my EC2 costs?",
              "Show me cost trends",
              "Find unused resources"
            ].map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setInputValue(suggestion)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
