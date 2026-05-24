"use client";

import React, { useState, useEffect, useRef } from "react";
import socket from "@/lib/socket";
import { apiFetch } from "@/lib/api/config";

// --- Types ---
interface ChatCustomerProfile {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  sessionId?: string;
}

interface UserProfile {
  id: string;
  userName: string;
  role: string;
  fullName: string;
  email: string;
  phone: string;
}

interface Conversation {
  id: string;
  chatCustomer: ChatCustomerProfile;
  consultant?: {
    id: string;
    fullName: string;
  };
  status: "WAITING" | "ACTIVE" | "CLOSED";
}

interface Message {
  id?: string;
  conversationId: string;
  senderType: "CUSTOMER" | "AGENT" | "SYSTEM";
  senderId?: string;
  content: string;
  messageType: "TEXT" | "IMAGE" | "FILE" | "TOUR_LINK";
  createdAt?: string;
}

interface ChatWidgetProps {
  currentTourId?: string;
  currentTourName?: string;
  currentTourPrice?: string;
}

export default function ChatWidget({
  currentTourId,
  currentTourName,
  currentTourPrice,
}: ChatWidgetProps) {
  // --- UI States ---
  const [isOpen, setIsOpen] = useState(false);
  const [showPreChatForm, setShowPreChatForm] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [tourContext, setTourContext] = useState<{
    tourId: string;
    tourName: string;
    tourPrice: string | number;
  } | null>(null);

  // --- Form States ---
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // --- Active Chat States ---
  const [chatCustomer, setChatCustomer] = useState<ChatCustomerProfile | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // --- Initial Phase: Load Existing Session ---
  const loadActiveSession = (force = false) => {
    if (localStorage.getItem("chatSessionReset") === "true" && !force) {
      setChatCustomer(null);
      setConversation(null);
      setMessages([]);
      setShowPreChatForm(true);
      return;
    }

    if (loading && !force) return;
    if (conversation && !force) return;

    // 1. Get logged-in user if exists (Hyper-robust checking for all structures)
    let storedUser: any = null;
    try {
      const rawUser = localStorage.getItem("currentUser") || localStorage.getItem("user");
      if (rawUser) {
        storedUser = JSON.parse(rawUser);
      }
    } catch (e) {
      console.error("Failed to parse logged-in user", e);
    }

    // 2. Get local ChatCustomer profile if exists
    let storedCustomer: ChatCustomerProfile | null = null;
    try {
      const rawCustomer = localStorage.getItem("chatCustomer");
      if (rawCustomer) {
        storedCustomer = JSON.parse(rawCustomer) as ChatCustomerProfile;
        setChatCustomer(storedCustomer);
      }
    } catch (e) {
      console.error("Failed to parse local chat customer", e);
    }

    if (storedUser) {
      const userId = storedUser.id || storedUser.userId;
      const fullName = storedUser.fullName || storedUser.name || storedUser.userName || "Khách hàng";
      
      // User is logged-in, auto-register/retrieve chat session
      initiateChatSession({
        userId: userId,
        fullName: fullName,
        email: storedUser.email || undefined,
        phone: storedUser.phone || undefined,
      });
    } else if (storedCustomer) {
      // Returning guest user, auto-register/retrieve chat session
      initiateChatSession({
        chatCustomerId: storedCustomer.id,
        fullName: storedCustomer.fullName,
        email: storedCustomer.email,
        phone: storedCustomer.phone,
        sessionId: storedCustomer.sessionId,
      });
    } else {
      // Clear any cached guest details and reset state
      setChatCustomer(null);
      setConversation(null);
      setMessages([]);
      setShowPreChatForm(true);
    }
  };

  useEffect(() => {
    loadActiveSession();

    // Listen to custom auth changes (e.g. login, logout) reactively
    const handleAuthChange = () => {
      loadActiveSession(true);
    };

    window.addEventListener("auth-state-change", handleAuthChange);

    return () => {
      window.removeEventListener("auth-state-change", handleAuthChange);
    };
  }, [conversation]);

  // --- Socket.io Listeners ---
  useEffect(() => {
    if (!conversation) return;

    // Set auth parameters before connecting so the /customer namespace identifies this client
    const customerId = chatCustomer?.id || conversation.chatCustomer?.id;
    if (customerId) {
      socket.auth = { customerId };
    }

    // Force connect or reconnect if auth details changed
    if (!socket.connected) {
      socket.connect();
    }

    setIsConnected(socket.connected);

    const onConnect = () => {
      setIsConnected(true);
      console.log(`⚡ [CUSTOMER] Socket connected, joining room ${conversation.id}`);
      socket.emit("join-conversation", { conversationId: conversation.id });
    };

    const onDisconnect = () => setIsConnected(false);

    // 1. Listen for new real-time messages
    const onReceiveMessage = (data: Message) => {
      // Only append if it belongs to this conversation
      if (data.conversationId === conversation.id) {
        setMessages((prev) => {
          // Replace optimistic temp message from self (same text, tmp- prefix)
          const tempIdx = prev.findIndex(
            (m) => m.id?.startsWith('tmp-') && m.content === (data.content || (data as any).text) && m.senderType === data.senderType
          );
          if (tempIdx !== -1) {
            const updated = [...prev];
            updated[tempIdx] = { ...data, content: data.content || (data as any).text };
            return updated;
          }
          // Prevent duplicates by real ID
          if (data.id && prev.some((m) => m.id === data.id)) return prev;
          return [...prev, { ...data, content: data.content || (data as any).text }];
        });
        scrollToBottom();
      }
    };

    const onStatusUpdated = (data: { conversationId: string; status: string }) => {
      console.log("📢 [CUSTOMER] Conversation status updated", data);
      if (data.conversationId === conversation.id) {
        setConversation((prev) => prev ? { ...prev, status: data.status as any } : null);
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("receive-message", onReceiveMessage);
    socket.on("conversation-status-updated", onStatusUpdated);

    // If socket is already connected, join the room immediately
    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("receive-message", onReceiveMessage);
      socket.off("conversation-status-updated", onStatusUpdated);
    };
  }, [conversation, chatCustomer]);

  // --- Logic API Functions ---

  const initiateChatSession = async (payload: {
    userId?: string;
    chatCustomerId?: string;
    sessionId?: string;
    fullName: string;
    email?: string;
    phone?: string;
    tourId?: string;
  }) => {
    // Clear explicit reset flag since we are now starting a conversation
    localStorage.removeItem("chatSessionReset");

    setLoading(true);
    try {
      // Generate standard session ID for guests
      const sessionId = payload.sessionId || `session_${Math.random().toString(36).substr(2, 9)}`;

      // 1. Create or retrieve Conversation & ChatCustomer from Backend
      const dto = {
        chatCustomerId: payload.chatCustomerId,
        userId: payload.userId,
        sessionId: sessionId,
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        tourId: payload.tourId || tourContext?.tourId || currentTourId,
      };

      const res = await apiFetch<Conversation>("/conversations", {
        method: "POST",
        body: JSON.stringify(dto),
      });

      if (res && res.id) {
        setConversation(res);
        setChatCustomer(res.chatCustomer);
        setShowPreChatForm(false);

        // Cache customer details in LocalStorage
        localStorage.setItem("chatCustomer", JSON.stringify(res.chatCustomer));

        // Set auth on socket so ChatServer knows who this customer is
        socket.auth = { customerId: res.chatCustomer.id };

        // Notify consultants of new conversation
        if (socket.connected) {
          socket.emit("new-conversation", res);
        }

        // 2. Fetch history
        fetchMessageHistory(res.id);
      }
    } catch (e) {
      console.error("Failed to initiate chat conversation session", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessageHistory = async (conversationId: string) => {
    try {
      const history = await apiFetch<Message[]>(
        `/messages/conversation/${conversationId}/ordered`
      );
      if (history) {
        setMessages(history);
        scrollToBottom();
      }
    } catch (e) {
      console.error("Failed to fetch message history", e);
    }
  };

  const handlePreChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    initiateChatSession({
      fullName: fullName.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
    });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !conversation || !chatCustomer) return;

    const text = inputValue.trim();
    setInputValue("");

    // Show message optimistically so UI feels instant
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      conversationId: conversation.id,
      senderType: "CUSTOMER",
      senderId: chatCustomer.id,
      content: text,
      messageType: "TEXT",
    } as any;
    setMessages((prev) => [...prev, optimistic]);
    scrollToBottom();

    if (socket.connected) {
      // Socket path: server saves + broadcasts with real DB ID → onReceiveMessage replaces temp
      socket.emit("send-message", {
        conversationId: conversation.id,
        text,
        senderType: "CUSTOMER",
        customerId: chatCustomer.id,
      });
    } else {
      // Fallback: direct REST when socket is offline
      try {
        const savedMsg = await apiFetch<Message>("/messages", {
          method: "POST",
          body: JSON.stringify({
            conversationId: conversation.id,
            senderType: "CUSTOMER",
            chatCustomerId: chatCustomer.id,
            text,
            content: text,
            messageType: "TEXT",
            isActive: true,
            isRead: false,
          }),
        });
        if (savedMsg) {
          setMessages((prev) => prev.map((m) => m.id === optimistic.id ? { ...savedMsg, content: savedMsg.content || text } : m));
        }
      } catch (e) {
        console.error("Failed to persist message", e);
      }
    }
  };

  const sendTourLinkContext = async (tourId?: string, tourName?: string, tourPrice?: string | number) => {
    const tId = tourId || currentTourId || tourContext?.tourId;
    const tName = tourName || currentTourName || tourContext?.tourName;
    const tPrice = tourPrice || currentTourPrice || tourContext?.tourPrice;

    if (!conversation || !chatCustomer || !tId) return;

    const contentText = `[TOUR_LINK:tourId=${tId}&name=${tName}&price=${tPrice}]`;

    try {
      if (socket.connected) {
        socket.emit("send-message", {
          conversationId: conversation.id,
          text: contentText,
          senderType: "CUSTOMER",
          customerId: chatCustomer.id,
        });
      }
      
      const savedMsg = await apiFetch<Message>("/messages", {
        method: "POST",
        body: JSON.stringify({
          conversationId: conversation.id,
          senderType: "CUSTOMER",
          chatCustomerId: chatCustomer.id,
          text: contentText,
          content: contentText,
          messageType: "TOUR_LINK",
          isActive: true,
          isRead: false,
        }),
      });
      if (savedMsg) {
        setMessages((prev) => [...prev, { ...savedMsg, content: savedMsg.content || contentText }]);
        scrollToBottom();
      }
    } catch (e) {
      console.error("Failed to send tour contextual context", e);
    }
  };

  const handleStartNewChat = () => {
    localStorage.removeItem("chatSessionReset");
    localStorage.removeItem("chatCustomer");
    setChatCustomer(null);
    setConversation(null);
    setMessages([]);
    setTourContext(null);
    setShowPreChatForm(true);
    if (socket.connected) {
      socket.disconnect();
    }
  };

  const handleResetSession = () => {
    if (conversation) {
      // Direct REST API to close conversation in Backend
      apiFetch(`/conversations/${conversation.id}/close`, {
        method: "POST",
      }).catch(console.error);

      // Emit close-conversation to Socket so ChatServer disconnects/updates rooms
      if (socket.connected) {
        socket.emit("close-conversation", { conversationId: conversation.id });
      }

      // Update local state to CLOSED so they see the ended screen
      setConversation((prev) => prev ? { ...prev, status: "CLOSED" } : null);
    } else {
      handleStartNewChat();
    }
  };

  // Listen to the custom DOM event to open chat with tour context
  useEffect(() => {
    const handleOpenChatTour = async (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        console.log("🎒 [CUSTOMER] Received open-chat-tour event", detail);
        setIsOpen(true);
        setTourContext(detail);
        
        // Remove reset flag since we are opening the chat explicitly
        localStorage.removeItem("chatSessionReset");

        // Parse existing credentials
        let storedUser: any = null;
        try {
          const rawUser = localStorage.getItem("currentUser") || localStorage.getItem("user");
          if (rawUser) storedUser = JSON.parse(rawUser);
        } catch (err) {}

        let storedCustomer: ChatCustomerProfile | null = null;
        try {
          const rawCustomer = localStorage.getItem("chatCustomer");
          if (rawCustomer) storedCustomer = JSON.parse(rawCustomer);
        } catch (err) {}

        if (conversation) {
          // If conversation already active, just send context link
          sendTourLinkContext(detail.tourId, detail.tourName, detail.tourPrice);
        } else if (storedUser) {
          const userId = storedUser.id || storedUser.userId;
          const fullName = storedUser.fullName || storedUser.name || storedUser.userName || "Khách hàng";
          await initiateChatSession({
            userId,
            fullName,
            email: storedUser.email || undefined,
            phone: storedUser.phone || undefined,
            tourId: detail.tourId,
          } as any);
        } else if (storedCustomer) {
          await initiateChatSession({
            chatCustomerId: storedCustomer.id,
            fullName: storedCustomer.fullName,
            email: storedCustomer.email,
            phone: storedCustomer.phone,
            sessionId: storedCustomer.sessionId,
            tourId: detail.tourId,
          } as any);
        } else {
          setShowPreChatForm(true);
        }
      }
    };

    window.addEventListener("open-chat-tour", handleOpenChatTour);
    return () => {
      window.removeEventListener("open-chat-tour", handleOpenChatTour);
    };
  }, [conversation, chatCustomer, tourContext]);

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            loadActiveSession();
            scrollToBottom();
          }}
          className="w-14 h-14 bg-[#0EA5E9] hover:bg-[#0284C7] hover:scale-105 transition-all text-white rounded-full flex items-center justify-center shadow-xl cursor-pointer relative group border border-white/20"
        >
          <svg
            className="w-7 h-7 animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span className="absolute right-16 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none">
            Hỗ trợ trực tuyến!
          </span>
        </button>
      )}

      {/* Main Chat Box Container */}
      {isOpen && (
        <div className="w-[380px] h-[550px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] text-white px-5 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-lg border border-white/10">
                  💬
                </div>
                {isConnected && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">Hỗ trợ Du Lịch Việt</h3>
                <span className="text-[11px] text-sky-100 flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-300 animate-ping" : "bg-gray-300"}`}></span>
                  {isConnected ? "Trực tuyến" : "Đang kết nối..."}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {conversation && (
                <button
                  onClick={handleResetSession}
                  title="Xóa phiên cũ"
                  className="p-1.5 rounded-full hover:bg-white/15 text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/15 text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body Section */}
          <div className="flex-1 overflow-y-auto bg-gray-50 flex flex-col relative">
            {loading && !conversation ? (
              /* Loading Spinner for auto-login / initiation */
              <div className="flex-1 flex flex-col items-center justify-center bg-white p-6">
                <div className="w-10 h-10 border-4 border-[#0EA5E9] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-gray-500 mt-4 font-semibold animate-pulse">
                  Đang kết nối hỗ trợ viên...
                </p>
              </div>
            ) : conversation?.status === "CLOSED" ? (
              /* Conversation Ended screen */
              <div className="flex-1 flex flex-col items-center justify-center bg-white p-6 text-center animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center text-3xl mb-4 shadow-sm border border-emerald-100">
                  ✓
                </div>
                <h4 className="text-base font-bold text-gray-800">Trò chuyện đã kết thúc</h4>
                <p className="text-xs text-gray-500 mt-2 max-w-[240px] leading-relaxed">
                  Cảm ơn bạn đã trò chuyện với chúng tôi. Cuộc trò chuyện này đã được kết thúc thành công.
                </p>
                <button
                  onClick={handleStartNewChat}
                  className="mt-6 px-6 py-2.5 bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer font-sans"
                >
                  Bắt đầu cuộc trò chuyện mới
                </button>
              </div>
            ) : showPreChatForm ? (
              /* Pre-Chat Form UI */
              <div className="flex-1 flex flex-col justify-center px-6 py-8 bg-white">
                <div className="text-center mb-6">
                  <h4 className="text-lg font-bold text-gray-800">Xin chào bạn! 👋</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Vui lòng để lại tên và số điện thoại để tư vấn viên kết nối và giải đáp cho bạn nhé.
                  </p>
                </div>
                <form onSubmit={handlePreChatSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Họ và Tên <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      placeholder="09XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="customer@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-[#0EA5E9] hover:bg-[#0284C7] disabled:bg-gray-300 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-md mt-2 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      "Bắt đầu trò chuyện"
                    )}
                  </button>
                </form>
              </div>
            ) : (
              /* Chat Message Window */
              <div className="flex-1 p-4 space-y-3 flex flex-col">
                {/* Embedded contextual Tour preview if applicable */}
                {currentTourId && (
                  <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 shadow-sm flex items-center justify-between text-xs animate-in slide-in-from-top duration-300">
                    <div className="flex-1 pr-2">
                      <span className="text-[10px] uppercase font-bold text-sky-600">Đang xem Tour:</span>
                      <h5 className="font-bold text-gray-800 line-clamp-1 mt-0.5">{currentTourName}</h5>
                    </div>
                    <button
                      onClick={sendTourLinkContext}
                      className="px-2.5 py-1.5 bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer shadow-sm"
                    >
                      Chia sẻ Tour
                    </button>
                  </div>
                )}

                {/* Messages List */}
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {messages.length === 0 ? (
                    <div className="text-center text-xs text-gray-400 py-10">
                      Chưa có tin nhắn. Hãy bắt đầu trò chuyện nhé!
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isMe = msg.senderType === "CUSTOMER";
                      const isSystem = msg.senderType === "SYSTEM";

                      if (isSystem) {
                        return (
                          <div key={index} className="flex justify-center my-2">
                            <span className="bg-gray-100 text-[10px] text-gray-500 font-semibold px-3 py-1 rounded-full text-center max-w-[80%] shadow-sm">
                              {msg.content}
                            </span>
                          </div>
                        );
                      }

                      // Parse tour details if it's a tour link
                      const isTourLink = msg.messageType === "TOUR_LINK" || msg.content?.startsWith("[TOUR_LINK:");
                      let tourId = "";
                      let tourName = "";
                      let tourPrice = "";

                      if (isTourLink) {
                        const match = msg.content?.match(/\[TOUR_LINK:tourId=(.*?)&name=(.*?)&price=(.*?)\]/);
                        if (match) {
                          tourId = match[1];
                          tourName = match[2];
                          tourPrice = match[3];
                        } else {
                          const nameMatch = msg.content?.match(/\*(.*?)\*/);
                          const priceMatch = msg.content?.match(/\((.*?) VND\)/);
                          tourName = nameMatch ? nameMatch[1] : "Chi tiết Tour";
                          tourPrice = priceMatch ? priceMatch[1] : "";
                          tourId = conversation?.tour?.id || currentTourId || "";
                        }
                      }

                      return (
                        <div
                          key={index}
                          className={`flex items-start gap-2 ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          {/* Profile Avatar for Agent */}
                          {!isMe && (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#0EA5E9] to-sky-400 text-white font-bold flex items-center justify-center text-xs shadow-sm flex-shrink-0">
                              A
                            </div>
                          )}
                          <div className="flex flex-col max-w-[70%]">
                            {/* Sender label */}
                            {!isMe && (
                              <span className="text-[9px] font-bold text-gray-400 ml-1 mb-0.5 flex items-center gap-1">
                                Consultant
                                <span className="bg-sky-100 text-[#0EA5E9] text-[8px] font-bold px-1 rounded-sm">Agent</span>
                              </span>
                            )}
                            {isMe && (
                              <span className="text-[9px] font-bold text-gray-400 mr-1 mb-0.5 text-right">
                                Bạn
                              </span>
                            )}
                            {/* Message Bubble */}
                            {isTourLink ? (
                              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm w-full my-1 flex flex-col gap-3 border-l-4 border-l-amber-500 text-left">
                                <div className="flex gap-2.5">
                                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                                    🌴
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-[8px] uppercase font-bold text-amber-700 tracking-wider block">
                                      Tour đang quan tâm
                                    </span>
                                    <h5 className="font-extrabold text-slate-800 text-[11px] leading-snug line-clamp-2 mt-0.5">
                                      {tourName}
                                    </h5>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between border-t border-amber-100/70 pt-2.5 mt-0.5">
                                  <div className="flex flex-col">
                                    <span className="text-[8px] uppercase font-bold text-slate-400">Giá tham khảo</span>
                                    <span className="text-xs font-black text-amber-600">
                                      {tourPrice ? `${Number(tourPrice.replace(/[^0-9]/g, "")).toLocaleString("vi-VN")} đ` : "Liên hệ"}
                                    </span>
                                  </div>
                                  {tourId && (
                                    <a
                                      href={`/tours/detail?id=${tourId}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-[10px] font-bold rounded-lg transition-all shadow-sm active:scale-95 text-center cursor-pointer font-sans"
                                    >
                                      Xem chi tiết →
                                    </a>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`px-3 py-2 text-xs shadow-sm ${
                                  isMe
                                    ? "bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] text-white rounded-2xl rounded-tr-none"
                                    : "bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-none"
                                }`}
                              >
                                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}
          </div>

          {/* Footer Input Form (only when session initialized) */}
          {!showPreChatForm && (
            <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2 shadow-inner">
              <input
                type="text"
                placeholder="Nhập nội dung nhắn tin..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-all"
              />
              <button
                onClick={handleSendMessage}
                className="w-8 h-8 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white flex items-center justify-center shadow-md hover:scale-105 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
