import { useState } from "react";
import { Bot, Send, X, Minimize2, Maximize2, Sparkles, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const quickActions = [
  { label: "Grow followers", icon: "📈" },
  { label: "Boost engagement", icon: "💬" },
  { label: "Schedule posts", icon: "📅" },
  { label: "Find hashtags", icon: "#️⃣" },
];

const initialMessages = [
  {
    role: "assistant",
    content: "👋 Hey there! I'm your AI Growth Assistant. I can help you find the best automation tools for your goals. What would you like to achieve today?",
  },
];

const aiResponses: Record<string, string> = {
  "grow followers": "🚀 Great choice! For follower growth, I recommend:\n\n1. **Auto-Engagement Bot** - Automatically interact with users in your niche\n2. **Smart Scheduler** - Post at optimal times for maximum reach\n3. **Hashtag Research** - Use trending tags to get discovered\n\nWould you like me to set up any of these for you?",
  "boost engagement": "💡 To boost engagement, here's my strategy:\n\n1. Use the **AI Caption Generator** for compelling content\n2. Enable **Auto-Comments** to start conversations\n3. Check **Growth Analytics** to see what's working\n\nYour current engagement rate is 7.1% - let's push it to 10%!",
  "schedule posts": "📅 Smart scheduling is key! Here's what I suggest:\n\n• **Best posting times** for your audience: 10AM, 2PM, 7PM\n• Set up **cross-platform posting** to save time\n• Use **content calendar** for batch planning\n\nWant me to take you to the scheduler?",
  "find hashtags": "#️⃣ Finding the right hashtags can 5x your reach!\n\n• I found **234 low-competition** hashtags in your niche\n• Top trending: #growthhacking (+32% this week)\n• Avoid oversaturated tags over 50M posts\n\nCheck out the Hashtag Research Tool for personalized suggestions!",
  default: "I understand you want to grow your social media presence! Based on your goals, I can help with:\n\n• 📈 Follower growth strategies\n• 💬 Engagement optimization\n• 📅 Content scheduling\n• #️⃣ Hashtag research\n\nJust tell me what you'd like to focus on!",
};

export const AIAssistantWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (message?: string) => {
    const text = message || inputValue.trim();
    if (!text) return;

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const lowerText = text.toLowerCase();
      let response = aiResponses.default;
      
      for (const key of Object.keys(aiResponses)) {
        if (lowerText.includes(key)) {
          response = aiResponses[key];
          break;
        }
      }

      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickAction = (action: string) => {
    handleSend(action);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-r from-primary to-brand-purple text-white shadow-lg glow-blue-intense hover:scale-105 transition-transform group"
      >
        <Bot className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-green rounded-full flex items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
        </span>
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap bg-card px-3 py-1.5 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity border border-border">
          AI Assistant
        </span>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        isMinimized ? "w-72 h-14" : "w-96 h-[500px]"
      }`}
    >
      <div className="h-full glass-card flex flex-col overflow-hidden border-primary/30 glow-blue">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-brand-purple/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-brand-purple">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">AI Growth Assistant</h4>
              {!isMinimized && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-brand-green"></span>
                  Online
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 hover:text-destructive"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-xl text-sm ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-secondary rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-secondary p-3 rounded-xl rounded-bl-none">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            {messages.length <= 2 && (
              <div className="px-4 pb-2">
                <p className="text-xs text-muted-foreground mb-2">Quick actions:</p>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => handleQuickAction(action.label)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-xs font-medium transition-colors"
                    >
                      <span>{action.icon}</span>
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask me anything..."
                  className="bg-secondary/50 border-border text-sm"
                />
                <Button
                  size="icon"
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isTyping}
                  className="bg-primary hover:bg-primary/90 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
