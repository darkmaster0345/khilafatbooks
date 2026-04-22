import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles, LogIn, AlertTriangle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
const db = supabase as any;

type Msg = { role: 'user' | 'assistant'; content: string; id?: string };
type FeedbackType = 'helpful' | 'not_helpful';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

// Islamic jurisprudence keywords to block
const FIQH_KEYWORDS = [
  'halal', 'haram', 'fiqh', 'fatwa', 'ruling', 'islamic ruling',
  'prayer method', 'how to pray', 'salat method', 'wudu steps',
  'fasting rules', 'ramadan fasting', 'zakat calculation',
  'marriage ruling', 'nikah rules', 'divorce in islam', 'talaq',
  'riba', 'interest', 'bank interest', 'loan interest',
  'inheritance', 'mirath', 'islamic will',
  'hajj steps', 'umrah method', 'pilgrimage ruling',
  'food halal', 'meat halal', 'slaughter rules'
];

// Check if message contains fiqh keywords
function containsFiqhKeywords(content: string): boolean {
  const lowerContent = content.toLowerCase();
  return FIQH_KEYWORDS.some(keyword => lowerContent.includes(keyword.toLowerCase()));
}

// AI Disclaimer message
const AI_DISCLAIMER = "I'm an AI assistant for Khilafat Books. I can help with book recommendations and order questions. I am NOT an Islamic scholar — for religious guidance, consult a qualified Mufti.";

// Fiqh warning message
const FIQH_WARNING = "This relates to Islamic jurisprudence. I cannot provide religious rulings. Please consult a qualified Islamic scholar or check our Fiqh book collection for scholarly references.";

async function submitFeedback(
  messageId: string,
  userId: string,
  feedback: FeedbackType,
  comment?: string
): Promise<{ error?: string }> {
  try {
    const { error } = await supabase
      .from('ai_chat_feedback')
      .insert({
        message_id: messageId,
        user_id: userId,
        feedback,
        comment: comment || null,
        created_at: new Date().toISOString(),
      });

    if (error) throw error;
    return {};
  } catch (err) {
    console.error('Error submitting feedback:', err);
    return { error: 'Failed to submit feedback' };
  }
}

async function streamChat({
  messages, onDelta, onDone, onError,
}: {
  messages: Msg[];
  onDelta: (t: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const { data: { session } } = await db.auth.getSession();
  if (!session?.access_token) {
    onError('Please sign in to use the AI assistant.');
    return;
  }

  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Failed to connect' }));
    onError(err.error || 'Something went wrong');
    return;
  }

  if (!resp.body) { onError('No response'); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let nl: number;
    while ((nl = buf.indexOf('\n')) !== -1) {
      let line = buf.slice(0, nl);
      buf = buf.slice(nl + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (json === '[DONE]') { onDone(); return; }
      try {
        const parsed = JSON.parse(json);
        const c = parsed.choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch { /* partial */ }
    }
  }
  onDone();
}

// Generate a unique message ID
const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const AIChatWidget = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<Record<string, FeedbackType>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;

    const userContent = input.trim();

    // Check for fiqh keywords before sending
    if (containsFiqhKeywords(userContent)) {
      const userMsg: Msg = { role: 'user', content: userContent, id: generateMessageId() };
      const aiMsg: Msg = { role: 'assistant', content: FIQH_WARNING, id: generateMessageId() };
      setMessages(prev => [...prev, userMsg, aiMsg]);
      setInput('');
      return;
    }

    const userMsg: Msg = { role: 'user', content: userContent, id: generateMessageId() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    let assistantContent = '';
    const messageId = generateMessageId();

    const upsert = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.id === messageId) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
        }
        return [...prev, { role: 'assistant', content: assistantContent, id: messageId }];
      });
    };

    await streamChat({
      messages: newMessages,
      onDelta: upsert,
      onDone: () => setLoading(false),
      onError: (msg) => {
        setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, ${msg}. Please try again.`, id: generateMessageId() }]);
        setLoading(false);
      },
    });
  };

  const handleFeedback = async (messageId: string, feedback: FeedbackType) => {
    if (!user?.id) return;

    const result = await submitFeedback(messageId, user.id, feedback);
    if (!result.error) {
      setFeedbackSubmitted(prev => ({ ...prev, [messageId]: feedback }));
    }
  };

  // Check if this is the first conversation (no messages yet)
  const isFirstConversation = messages.length === 0;

  return (
    <>
      {/* Toggle button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.5 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-24 z-[9999] flex h-14 w-14 items-center justify-center rounded-full emerald-gradient text-primary-foreground shadow-lg hover:shadow-xl transition-shadow"
            aria-label="AI Assistant"
          >
            <Sparkles className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-[9999] w-[380px] max-w-[calc(100vw-32px)] rounded-2xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden"
            style={{ height: '540px', maxHeight: 'calc(100vh - 100px)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border emerald-gradient shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/15">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-primary-foreground">Khilafat Assistant</h3>
                  <p className="text-[10px] text-primary-foreground/70">Product finder</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Persistent AI Disclaimer */}
              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  This AI provides general information only. It is NOT a qualified Islamic scholar. For religious rulings, consult a certified Mufti.
                </p>
              </div>

              {messages.length === 0 && (
                <div className="text-center py-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
                    <Sparkles className="h-7 w-7 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Assalamu Alaikum!</p>
                  <p className="text-xs text-muted-foreground mt-1">How can I help you find the right product?</p>
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {['Gift for Ramadan', 'Best Quran edition', 'Islamic courses'].map(q => (
                      <button
                        key={q}
                        onClick={() => { setInput(q); }}
                        className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={msg.id || i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                  <div className="flex flex-col max-w-[80%]">
                    <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md'
                    }`}>
                      {msg.content}
                    </div>
                    {/* Feedback buttons for AI responses */}
                    {msg.role === 'assistant' && msg.id && !loading && (
                      <div className="flex items-center gap-1 mt-1 ml-1">
                        {feedbackSubmitted[msg.id] ? (
                          <span className="text-[10px] text-muted-foreground">
                            Thanks for your feedback!
                          </span>
                        ) : (
                          <>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => handleFeedback(msg.id!, 'helpful')}
                                    className="p-1 hover:bg-muted rounded transition-colors"
                                    aria-label="Helpful"
                                  >
                                    <ThumbsUp className="h-3 w-3 text-muted-foreground hover:text-green-500" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                  <p className="text-xs">Helpful</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => handleFeedback(msg.id!, 'not_helpful')}
                                    className="p-1 hover:bg-muted rounded transition-colors"
                                    aria-label="Not helpful"
                                  >
                                    <ThumbsDown className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                  <p className="text-xs">Not helpful</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 mt-0.5">
                      <User className="h-3.5 w-3.5 text-accent" />
                    </div>
                  )}
                </div>
              ))}
              {loading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            {/* Input / Auth Gate */}
            <div className="border-t border-border px-4 py-3 shrink-0">
              {user ? (
                <form onSubmit={e => { e.preventDefault(); send(); }} className="flex gap-2">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask about products..."
                    className="flex-1 h-10 px-4 rounded-xl bg-muted border-none text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    maxLength={300}
                    disabled={loading}
                  />
                  <Button type="submit" size="sm" disabled={loading || !input.trim()} className="h-10 w-10 p-0 rounded-xl">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <a
                  href="/auth"
                  className="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <LogIn className="h-4 w-4" />
                  Sign in to chat
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatWidget;
