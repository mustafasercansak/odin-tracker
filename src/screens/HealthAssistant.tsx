import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Brain, 
  ChevronLeft, 
  Send, 
  Sparkles, 
  User, 
  Bot, 
  Trash2, 
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePets } from '@/hooks/queries/usePets';
import { useHealthAssistant } from '@/hooks/queries/useHealthAssistant';
import type { Message } from '@/hooks/queries/useHealthAssistant';

export default function HealthAssistant() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pets, isLoading: petsLoading } = usePets();
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentPetId = selectedPetId ?? pets[0]?.id ?? null;
  const currentPet = pets.find(p => p.id === currentPetId);
  const { askAssistant, isLoading } = useHealthAssistant(currentPetId || '');

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || !currentPetId) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
      const response = await askAssistant(input, messages);
      const modelMsg: Message = { role: 'model', content: response };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error: any) {
      const errorMsg: Message = { 
        role: 'model', 
        content: error.message === 'NO_API_KEY' 
          ? t('assistant.errors.noApiKey') 
          : t('assistant.errors.failed') 
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const handleSuggested = (text: string) => {
    setInput(text);
    // Use a ref or state for firing after input update if needed, 
    // but a simple timeout works for basic cases
    setTimeout(() => {
      const btn = document.getElementById('chat-submit-btn');
      btn?.click();
    }, 50);
  };

  const clearChat = () => {
    if (window.confirm(t('common.confirmDelete'))) {
      setMessages([]);
    }
  };

  const suggestedQuestions = [
    t('assistant.suggestedQuestions.summary'),
    t('assistant.suggestedQuestions.trends'),
    t('assistant.suggestedQuestions.meds'),
    t('assistant.suggestedQuestions.vet'),
  ];

  if (petsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-muted-foreground animate-pulse">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-h-[900px] bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-2xl relative page-enter mt-4">
      {/* Header */}
      <div className="p-6 border-b border-border bg-secondary/30 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="md:hidden p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <Brain size={24} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">{t('assistant.title')}</h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{t('assistant.subtitle')}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button 
              onClick={clearChat}
              className="p-2.5 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Pet Selector */}
      {pets.length > 1 && (
        <div className="px-6 py-3 border-b border-border/50 bg-secondary/10 flex gap-2 overflow-x-auto scrollbar-none">
          {pets.map(pet => (
            <button
              key={pet.id}
              onClick={() => {
                setSelectedPetId(pet.id);
                setMessages([]);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                pet.id === currentPetId
                  ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'bg-card border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {pet.name}
            </button>
          ))}
        </div>
      )}

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth custom-scrollbar"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-700 py-10">
            <div className="relative">
              <div className="w-24 h-24 rounded-[2.5rem] bg-primary/5 flex items-center justify-center text-primary/30">
                <Sparkles size={48} />
              </div>
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -inset-4 bg-primary/10 rounded-full blur-2xl -z-10"
              />
            </div>
            
            <div className="max-w-xs space-y-2">
              <h2 className="text-xl font-black">{t('assistant.title')}</h2>
              <p className="text-sm text-muted-foreground font-medium">
                {currentPet ? t('assistant.disclaimer') : t('assistant.noData')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggested(q)}
                  className="flex items-center gap-3 px-5 py-4 rounded-[1.5rem] bg-secondary/40 hover:bg-primary/5 hover:border-primary/30 border border-border/50 transition-all text-xs font-bold text-left group"
                >
                  <MessageSquare size={16} className="text-primary/40 group-hover:text-primary transition-colors flex-shrink-0" />
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[90%] md:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-sm border ${
                    msg.role === 'user' ? 'bg-primary border-primary text-primary-foreground' : 'bg-card border-border text-primary'
                  }`}>
                    {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                  </div>
                  <div className={`p-4 rounded-[1.5rem] text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-none shadow-primary/10' 
                      : 'bg-secondary/40 text-foreground rounded-tl-none border border-border/50'
                  }`}>
                    {msg.content.split('\n').map((line, j) => (
                      <p key={j} className={line.trim() === '' ? 'h-3' : 'mb-1 last:mb-0'}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-2xl bg-card border border-border text-primary flex items-center justify-center">
                <Bot size={20} className="animate-spin" />
              </div>
              <div className="bg-secondary/20 p-4 rounded-[1.5rem] rounded-tl-none border border-border/50 flex items-center gap-3">
                <div className="flex gap-1">
                  <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest animate-pulse">{t('assistant.thinking')}</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-secondary/10 backdrop-blur-md border-t border-border flex flex-col gap-4">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tight px-2">
          <AlertCircle size={12} />
          {t('assistant.disclaimer')}
        </div>
        <form 
          onSubmit={handleSend}
          className="relative flex items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('assistant.placeholder')}
            className="flex-1 bg-card border border-border rounded-2xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-primary outline-none transition-all pr-16 shadow-inner"
            disabled={isLoading || !currentPetId}
          />
          <button
            id="chat-submit-btn"
            type="submit"
            disabled={!input.trim() || isLoading || !currentPetId}
            className="absolute right-2 p-3 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
          >
            <Send size={24} />
          </button>
        </form>
      </div>
    </div>
  );
}
