import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, User, RotateCcw, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import { ChatMessage } from '../../types';
import { apiClient } from '../../services/api/client';

export const AiChatOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'สวัสดีครับ! ผมคือ AI Trading Assistant เพื่อนคู่คิดการลงทุนของคุณ 😊\n\nวันนี้ตลาดมีจังหวะน่าสนใจหลายตัวเลยครับ มีหุ้นตัวไหนที่กำลังเล็งไว้ หรืออยากให้ช่วยเช็คพอร์ตวันนี้ ทักทายหรือพิมพ์คุยกันสบายๆ ได้เลยนะคร้าบ!',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    { label: '🚀 แนะนำหุ้นเด่น', query: 'แนะนำหุ้นหน่อย' },
    { label: '📊 วิเคราะห์ AAPL', query: 'วิเคราะห์ AAPL' },
    { label: '💼 เช็คพอร์ตของฉัน', query: 'ช่วยสรุปสุขภาพพอร์ตของฉันตอนนี้หน่อย' },
    { label: '⚖️ NVDA vs TSLA', query: 'เปรียบเทียบ NVDA กับ TSLA ตัวไหนน่าสนใจกว่า' },
    { label: '🤖 แนะนำ Auto-Trade', query: 'แนะนำการตั้งค่า Auto-Trade ให้หน่อย' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isExpanded]);

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: queryText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const data = await apiClient.post<{ response: string }>('/ai/chat', {
        prompt: queryText
      });

      const assistantMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: data.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: `เกิดข้อผิดพลาดในการติดต่อระบบ AI: ${err.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    const query = inputValue;
    setInputValue('');
    await sendQuery(query);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'assistant',
        text: 'ยินดีเริ่มต้นคุยเรื่องใหม่เลยครับ! 😊 วันนี้อยากให้ผมช่วยดูหุ้นตัวไหน หรือเช็คตลาดภาพรวมบอกได้เลยนะคร้าบ',
        timestamp: new Date()
      }
    ]);
  };

  // Helper function to render Rich Formatted Markdown nicely
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 text-xs leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={idx} className="h-1" />;
          }

          // Headers: ### Title
          if (trimmed.startsWith('### ')) {
            return (
              <div key={idx} className="font-bold text-sm text-cyan-400 pt-1 pb-0.5 border-b border-slate-800 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span>{trimmed.replace('### ', '')}</span>
              </div>
            );
          }

          // Bullet points: - item
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const itemText = trimmed.substring(2);
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1.5 text-slate-300">
                <span className="text-cyan-400 font-bold leading-none mt-1">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(itemText) }} />
              </div>
            );
          }

          // Numbered lists: 1. item
          const matchNum = trimmed.match(/^(\d+)\.\s+(.*)/);
          if (matchNum) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1.5 text-slate-300">
                <span className="text-cyan-400 font-mono text-[10px] font-bold mt-0.5">{matchNum[1]}.</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(matchNum[2]) }} />
              </div>
            );
          }

          // Regular paragraph
          return (
            <p key={idx} className="text-slate-300" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed) }} />
          );
        })}
      </div>
    );
  };

  // Formats inline bold, quotes, and profit/loss highlights
  const formatInlineMarkdown = (text: string) => {
    let out = text
      // Bold: **text**
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-100">$1</strong>')
      // Inline Code: `code`
      .replace(/`([^`]+)`/g, '<code class="bg-slate-900 text-cyan-300 px-1 py-0.5 rounded font-mono text-[11px]">$1</code>');

    // Highlight positive / negative percentages & amounts
    out = out.replace(/(\+\$[\d,]+(?:\.\d+)?|\+[\d,]+(?:\.\d+)?%)/g, '<span class="text-emerald-400 font-semibold">$1</span>');
    out = out.replace(/(-\$[\d,]+(?:\.\d+)?|-[\d,]+(?:\.\d+)?%)/g, '<span class="text-rose-400 font-semibold">$1</span>');

    return out;
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className={`mb-3 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-200 ${
          isExpanded 
            ? 'w-[750px] max-w-[calc(100vw-1.5rem)] h-[620px] max-h-[calc(100vh-6rem)]' 
            : 'w-96 max-w-[calc(100vw-2rem)] h-[520px]'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-950 px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 text-cyan-400 border border-cyan-500/30">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  <span>AI Trading Assistant</span>
                  <span className="text-[9px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.2 rounded font-mono border border-cyan-500/30">PRO</span>
                </div>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Context-Aware Market Engine
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                title="ล้างประวัติการคุย"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'ย่อหน้าต่าง' : 'ขยายหน้าต่าง'}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors hidden sm:block"
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="ปิด"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompts Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-2 bg-slate-950/70 border-b border-slate-850 scrollbar-none text-[11px]">
            {quickPrompts.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => sendQuery(chip.query)}
                disabled={isLoading}
                className="whitespace-nowrap rounded-full border border-slate-800 bg-slate-900/90 px-2.5 py-1 text-slate-300 hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-300 transition-all disabled:opacity-50"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => {
              const isAssistant = msg.sender === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isAssistant ? '' : 'flex-row-reverse'}`}
                >
                  {/* Icon */}
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium shadow-md ${
                    isAssistant ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  
                  {/* Message Bubble */}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${
                    isAssistant 
                      ? 'bg-slate-950 text-slate-200 border border-slate-850 rounded-tl-none' 
                      : 'bg-gradient-to-tr from-cyan-600 to-cyan-500 text-slate-950 font-medium rounded-tr-none'
                  }`}>
                    {isAssistant ? (
                      renderFormattedContent(msg.text)
                    ) : (
                      <p className="whitespace-pre-line text-xs font-semibold leading-relaxed">{msg.text}</p>
                    )}
                    <span className={`block mt-1.5 text-[9px] text-right ${isAssistant ? 'text-slate-500' : 'text-cyan-950'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {isLoading && (
              <div className="flex gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-slate-950 text-slate-400 border border-slate-850 rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">AI กำลังวิเคราะห์ข้อมูลตลาด...</span>
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-850 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="พิมพ์คุยกับ AI ได้เลย เช่น แนะนำหุ้นหน่อย, วิเคราะห์ NVDA, ดูพอร์ต..."
              className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="flex items-center justify-center h-9 w-9 rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-500 transition-colors shadow-lg shadow-cyan-500/20"
              disabled={!inputValue.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Circle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-13 w-13 p-3.5 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-500 text-slate-950 shadow-2xl hover:scale-105 transition-all focus:outline-none hover:shadow-cyan-500/25 hover:shadow-lg relative group"
        title="AI Investment Assistant"
      >
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
        </span>
        {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>
    </div>
  );
};

export default AiChatOverlay;
