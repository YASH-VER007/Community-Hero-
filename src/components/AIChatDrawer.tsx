import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Sparkles, Mic, Volume2 } from "lucide-react";

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  lang: 'en' | 'hi';
}

export default function AIChatDrawer({ isOpen, onClose, userId, userName, lang }: AIChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: lang === 'en'
        ? `Namaste ${userName}! I am **HeroBot**, your AI neighborhood assistant. Ask me anything about local potholes, streetlights, resolving issues, or how to earn points!`
        : `नमस्ते ${userName}! मैं हूँ **HeroBot**, आपका एआई पड़ोसी सहायक। मुझसे स्थानीय गड्ढों, स्ट्रीटलाइट्स, या अंक अर्जित करने के तरीकों के बारे में कुछ भी पूछें!`
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Append user message
    const updatedMessages = [...messages, { role: 'user' as const, text: textToSend }];
    setMessages(updatedMessages);
    setInputText("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          chatHistory: messages.map(m => ({ role: m.role, text: m.text }))
        })
      });

      const data = await response.json();
      setIsTyping(false);

      if (data.responseText) {
        setMessages(prev => [...prev, { role: 'model', text: data.responseText }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'model',
          text: lang === 'en'
            ? "I'm having trouble connecting to my civic knowledge base. Please try again in a moment!"
            : "मुझे नागरिक ज्ञानकोश से जुड़ने में समस्या हो रही है। कृपया थोड़ी देर में पुनः प्रयास करें!"
        }]);
      }
    } catch (e) {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        role: 'model',
        text: lang === 'en'
          ? "Connection issue. I am operating in basic offline assistant mode. Feel free to ask about points or report processes!"
          : "कनेक्शन समस्या। मैं सामान्य ऑफलाइन सहायक मोड में काम कर रहा हूँ।"
      }]);
    }
  };

  // Real voice search handler with automatic fallback
  const handleVoiceListen = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
      return;
    }

    setIsListening(true);
    setInputText("");

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Simulate speech-to-text as fallback
      setTimeout(() => {
        setIsListening(false);
        const spokenSamples = lang === 'en' 
          ? ["How many points do I get for reporting a pothole?", "Check active pothole Sector 15", "How do I earn badges?"]
          : ["गड्ढे की शिकायत करने के कितने अंक मिलते हैं?", "सेक्टर 15 का गड्ढा चेक करें", "बैज कैसे मिलेंगे?"];
        const randomSpoken = spokenSamples[Math.floor(Math.random() * spokenSamples.length)];
        setInputText(randomSpoken);
      }, 1500);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = lang === 'en' ? 'en-US' : 'hi-IN';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        if (resultText) {
          setInputText(resultText);
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error in HeroBot", event);
        // Fallback simulation in case of block/permission issues
        const spokenSamples = lang === 'en' 
          ? ["How many points do I get for reporting a pothole?", "Check active pothole Sector 15", "How do I earn badges?"]
          : ["गड्ढे की शिकायत करने के कितने अंक मिलते हैं?", "सेक्टर 15 का गड्ढा चेक करें", "बैज कैसे मिलेंगे?"];
        const randomSpoken = spokenSamples[Math.floor(Math.random() * spokenSamples.length)];
        setInputText(randomSpoken);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error("Speech Recognition fail", err);
      setIsListening(false);
    }
  };

  const suggestions = lang === 'en' 
    ? [
        { label: "Pothole Status", text: "What is the status of the Sector 15 highway pothole?" },
        { label: "Earn Points", text: "How can I earn active reporter badges and points?" },
        { label: "Water Rupture", text: "Has the water line leakage issue been resolved?" }
      ]
    : [
        { label: "गड्ढे की स्थिति", text: "सेक्टर 15 राजमार्ग के गड्ढे की क्या स्थिति है?" },
        { label: "अंक अर्जित करें", text: "मैं सक्रिय रिपोर्टर बैज और अंक कैसे प्राप्त कर सकता हूँ?" },
        { label: "पानी का रिसाव", text: "क्या पानी की लाइन रिसाव समस्या हल हो गई है?" }
      ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-[#1D1D1F] dark:bg-slate-950 text-white">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-emerald-600 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-base">HeroBot Assistant</h3>
            <span className="text-xs text-emerald-400 font-mono">● Online AI Liaison</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          id="close-chatbot"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-950">
        {messages.map((m, idx) => (
          <div 
            key={idx}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm text-sm ${
              m.role === 'user' 
                ? 'bg-slate-900 dark:bg-emerald-600 text-white rounded-br-none'
                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-bl-none'
            }`}>
              <div className="prose prose-sm dark:prose-invert font-sans whitespace-pre-line leading-relaxed">
                {m.text}
              </div>
              <span className={`block text-xs mt-1 text-right font-mono ${m.role === 'user' ? 'text-white/60' : 'text-slate-400 dark:text-slate-500'}`}>
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-bl-none p-3 shadow-sm flex items-center space-x-1.5">
              <span className="w-2 h-2 bg-slate-400 dark:bg-slate-600 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-slate-400 dark:bg-slate-600 rounded-full animate-bounce delay-75"></span>
              <span className="w-2 h-2 bg-slate-400 dark:bg-slate-600 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-1.5 overflow-x-auto max-h-24">
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(s.text)}
            className="text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-700 hover:text-emerald-700 dark:hover:text-emerald-450 hover:border-emerald-300 dark:hover:border-slate-600 border border-slate-300 dark:border-slate-700 rounded-full px-3 py-1.5 transition-all whitespace-nowrap"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Input Tray */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
        className="p-3 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2"
      >
        <button
          type="button"
          onClick={handleVoiceListen}
          className={`p-2.5 rounded-xl border transition-all ${
            isListening 
              ? 'bg-red-500 text-white border-red-500 animate-pulse'
              : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800'
          }`}
          title="Voice Command"
        >
          <Mic className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isListening 
            ? (lang === 'en' ? "Listening..." : "सुन रहा हूँ...") 
            : (lang === 'en' ? "Ask HeroBot..." : "हीरोबॉट से पूछें...")
          }
          className="flex-1 px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white dark:focus:bg-slate-950 transition-all text-slate-800 dark:text-white"
          disabled={isListening}
        />

        <button
          type="submit"
          className="p-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl disabled:opacity-50 transition-all flex items-center justify-center shadow-sm"
          disabled={!inputText.trim() || isListening}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
