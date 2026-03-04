import React, { useState } from "react";
import Sidebar from "@/components/Ui/sidebar";
import ParallaxWrapper from "@/components/Ui/parallax/ParallaxWrapper";
import { Activity, Send } from "lucide-react";

// Enhanced Bot Replies
const mockBotReply = (userMsg: string): string => {
  const lower = userMsg.toLowerCase();

  // Greetings
  if (lower.includes("hi") || lower.includes("hello")) {
    const replies = [
      "Hello 👋! How are you today?",
      "Hi there! 😄 How's it going?",
      "Hey! Glad to see you here! 🚀"
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }
  if (lower.includes("how are you")) {
    return "I’m just a simple chatbot, but I’m doing great 🚀 How about you?";
  }
  if (
    lower.includes("i am good") ||
    lower.includes("i'm good") ||
    lower.includes("fine") ||
    lower.includes("great")
  ) {
    return "Glad to hear that! 😄 What would you like to talk about today?";
  }
  if (lower.includes("bye") || lower.includes("goodbye")) {
    const replies = [
      "Goodbye! 👋 Have an awesome day!",
      "See you later! Stay safe! 🌟",
      "Bye! Come back soon! 😄"
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }

  // Time & Date
  if (lower.includes("time")) {
    const now = new Date();
    return `Current time is ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ⏰`;
  }
  if (lower.includes("date") || lower.includes("day")) {
    const today = new Date();
    return `Today is ${today.toLocaleDateString()} 📅`;
  }

  // Hobbies & Interests
  if (lower.includes("hobby") || lower.includes("hobbies")) {
    return "I enjoy chatting with humans and learning new things! 😎 What about you?";
  }
  if (lower.includes("movie") || lower.includes("movies")) {
    return "I love sci-fi movies! Do you have a favorite movie?";
  }
  if (lower.includes("music")) {
    return "I enjoy electronic and chill music! 🎵 What kind do you like?";
  }

  // Simple Jokes
  if (lower.includes("joke") || lower.includes("funny")) {
    const jokes = [
      "Why don't scientists trust atoms? Because they make up everything! 😂",
      "Why did the math book look sad? Because it had too many problems. 😅",
      "I told my computer I needed a break, and it said 'No problem, I'll go to sleep.' 🖥️💤",
      "Why did the scarecrow win an award? Because he was outstanding in his field! 🌾"
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }

  // Advice & Encouragement
  if (lower.includes("advice") || lower.includes("help")) {
    const advice = [
      "Stay positive and keep learning new things! 💡",
      "Take breaks when you feel overwhelmed. It helps! 😌",
      "Remember: small steps every day lead to big progress! 🚀"
    ];
    return advice[Math.floor(Math.random() * advice.length)];
  }

  // Math
  if (lower.includes("add") || lower.includes("+")) {
    try {
      const numbers = userMsg.match(/(\d+)/g)?.map(Number);
      if (numbers && numbers.length >= 2) {
        const sum = numbers.reduce((a, b) => a + b, 0);
        return `The sum is ${sum} ✅`;
      }
    } catch {}
  }
  if (lower.includes("subtract") || lower.includes("-")) {
    try {
      const numbers = userMsg.match(/(\d+)/g)?.map(Number);
      if (numbers && numbers.length >= 2) {
        const diff = numbers.reduce((a, b) => a - b);
        return `The result is ${diff} ✅`;
      }
    } catch {}
  }

  // Fun Facts
  if (lower.includes("fact")) {
    const facts = [
      "Did you know? Honey never spoils 🍯",
      "Did you know? Octopuses have three hearts 🐙",
      "Fun fact: Bananas are berries, but strawberries aren’t! 🍌"
    ];
    return facts[Math.floor(Math.random() * facts.length)];
  }

  // Fallback
  const fallbackReplies = [
    `You said: "${userMsg}" 🤔 Can you tell me more?`,
    `Interesting! Can you elaborate on "${userMsg}"?`,
    `Hmm... "${userMsg}" sounds cool! Tell me more.`
  ];
  return fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
};

// Utility: format time
const getTime = () => {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi 👋 I’m your Chatbot. Type something to start!",
      time: getTime(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = () => {
    if (!input.trim()) return;

    const newMessages = [
      ...messages,
      { role: "user", content: input, time: getTime() },
    ];
    setMessages(newMessages);
    setLoading(true);

    setTimeout(() => {
      const botReply = mockBotReply(input);
      setMessages([
        ...newMessages,
        { role: "assistant", content: botReply, time: getTime() },
      ]);
      setLoading(false);
    }, 800);

    setInput("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      {/* Sidebar */}
      <Sidebar currentPage="chatbot" isDarkMode={false} onToggleDarkMode={() => {}} />

      {/* Main Content */}
      <ParallaxWrapper enabled={true} intensity={0.8}>
        <div className="transition-all duration-300 flex flex-col h-screen">
          {/* Header */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-md border-b dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-xl shadow-lg">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                      Chatbot
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Try greetings, time, jokes, math, facts, or ask for advice!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl shadow-md max-w-lg text-sm transition-all animate-fadeInUp ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none"
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {msg.time}
                </span>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex items-center space-x-1 px-4 py-2 rounded-2xl bg-gray-200 dark:bg-gray-700 w-fit animate-fadeInUp">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-300"></span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="border-t dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-4">
            <div className="max-w-7xl mx-auto flex items-center space-x-2">
              <input
                type="text"
                className="flex-1 px-4 py-2 rounded-full border dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </ParallaxWrapper>
    </div>
  );
};

export default Chatbot;
