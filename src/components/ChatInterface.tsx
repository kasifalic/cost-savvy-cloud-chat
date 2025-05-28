
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { supabase } from '../integrations/supabase/client';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatInterfaceProps {
  billData: any;
}

const ChatInterface = ({ billData }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm your AWS cost optimization assistant. Upload your AWS bill first, then ask me anything about your costs, usage patterns, or how to save money on your AWS services.",
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-aws-assistant', {
        body: {
          message: inputMessage,
          billData: billData
        }
      });

      if (error) {
        throw error;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message || 'Sorry, I encountered an error processing your request.',
        sender: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please make sure you have uploaded your AWS bill and try again.',
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[600px] flex flex-col">
      {/* Header */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-orange-600/5 rounded-2xl blur-xl"></div>
        <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-teal-500/20 to-orange-600/20 rounded-xl">
              <Bot className="h-6 w-6 text-teal-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-black">AWS Cost Assistant</h2>
              <p className="text-black">Ask me anything about your AWS costs and optimization strategies</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="relative flex-1 mb-4">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-orange-600/5 rounded-2xl blur-xl"></div>
        <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 h-full">
          <ScrollArea className="h-full">
            <div className="space-y-4 pr-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.sender === 'assistant' && (
                    <div className="p-2 bg-gradient-to-r from-teal-500/20 to-orange-600/20 rounded-lg">
                      <Bot className="h-5 w-5 text-teal-400" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-teal-500 to-orange-600 text-white'
                        : 'bg-white/10 border border-white/20 text-black'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <p className={`text-xs mt-2 opacity-70 ${
                      message.sender === 'user' ? 'text-white' : 'text-black'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>

                  {message.sender === 'user' && (
                    <div className="p-2 bg-gradient-to-r from-teal-500/20 to-orange-600/20 rounded-lg">
                      <User className="h-5 w-5 text-teal-400" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="p-2 bg-gradient-to-r from-teal-500/20 to-orange-600/20 rounded-lg">
                    <Bot className="h-5 w-5 text-teal-400" />
                  </div>
                  <div className="bg-white/10 border border-white/20 p-4 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-teal-400 animate-pulse" />
                      <span className="text-black text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Input Area */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-orange-600/5 rounded-2xl blur-xl"></div>
        <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex gap-4">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about your AWS costs, optimization strategies, or specific services..."
              className="flex-1 bg-white/10 border border-white/20 rounded-xl p-3 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              rows={2}
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="self-end bg-gradient-to-r from-teal-500 to-orange-600 hover:from-teal-600 hover:to-orange-700 text-white border-0 shadow-xl shadow-teal-500/25 hover:shadow-teal-500/40 transition-all duration-300"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
