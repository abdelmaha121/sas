'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { Zap } from 'lucide-react';

export function ChatWidget() {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: number; text: string; sender: 'user' | 'bot' }>>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (input.trim()) {
      const userMessage = {
        id: messages.length + 1,
        text: input,
        sender: 'user' as const,
      };
      setMessages([...messages, userMessage]);
      setInput('');
      setIsTyping(true);

      try {
        // استدعاء واجهة برمجة تطبيقات الدردشة | Call chat API
        const apiResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: input, userId: 'guest' }), // TODO: احصل على معرف المستخدم الفعلي من سياق المصادقة | Get actual userId from auth context
        });

        if (!apiResponse.ok) {
          throw new Error('Failed to get response from chat API');
        }

        const result = await apiResponse.json();

        const botMessage = {
          id: messages.length + 2,
          text: result.response,
          sender: 'bot' as const,
        };

        setMessages((prev) => [...prev, botMessage]);
      } catch (error) {
        console.error('Chat error:', error);
        const errorMessage = {
          id: messages.length + 2,
          text: language === 'ar' ? 'آسف، أواجه مشكلة في الرد الآن. يرجى المحاولة لاحقاً.' : 'Sorry, I\'m having trouble responding right now. Please try again later.',
          sender: 'bot' as const,
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors flex items-center justify-center"
        aria-label={language === 'ar' ? 'فتح الدردشة' : 'Open chat'}
      >
        💬
      </button>

      {isOpen && (
        <Card className=" fixed bottom-24 right-8 w-96 h-64 sm:h-72 md:h-80 lg:h-96 shadow-xl flex flex-col rounded-2xl ">
          <div className="bg-primary text-white p-3 rounded-t-2xl font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 fill-white" />
              <span>{language === 'ar' ? 'دعم العملاء' : 'Support Chat'}</span>
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              {language === 'ar' ? 'ذكاء اصطناعي' : 'AI'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && !isTyping && (
              <div className="text-center text-muted-foreground text-xs">
                {language === 'ar' ? 'ابدأ محادثة معنا' : 'Start a conversation with us'}
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs px-3 py-1 rounded-lg text-sm ${
                    msg.sender === 'user' ? 'bg-primary text-white' : 'bg-gray-200 text-black'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-black px-3 py-1 rounded-lg text-sm">
                  {language === 'ar' ? 'جاري الكتابة...' : 'Typing...'}
                </div>
              </div>
            )}
          </div>

          <div className="border-t p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={language === 'ar' ? 'اكتب رسالتك...' : 'Type your message...'}
              className="flex-1 border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isTyping}
            />
            <Button 
              onClick={handleSendMessage} 
              size="sm"
              disabled={isTyping || !input.trim()}
              className="rounded-lg text-xs"
            >
              {language === 'ar' ? 'إرسال' : 'Send'}
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}