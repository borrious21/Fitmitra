import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./Chatbot.module.css";
import { apiFetch } from "../../services/apiClient";

// ── Typing indicator dots ──
function TypingDots() {
  return (
    <div className={styles.typingBubble}>
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span className={styles.dot} />
    </div>
  );
}

// ── Individual message bubble ──
function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`${styles.msgRow} ${isUser ? styles.msgRowUser : styles.msgRowAI}`}>
      {!isUser && (
        <div className={styles.aiAvatar}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
            <line x1="6" y1="1" x2="6" y2="4" />
            <line x1="10" y1="1" x2="10" y2="4" />
            <line x1="14" y1="1" x2="14" y2="4" />
          </svg>
        </div>
      )}
      <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAI}`}>
        <p className={styles.bubbleText}>{msg.content}</p>
        <span className={styles.bubbleTime}>
          {new Date(msg.created_at ?? Date.now()).toLocaleTimeString("en-IN", {
            hour: "2-digit", minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

// ── Session list item ──
function SessionItem({ session, active, onClick, onDelete }) {
  return (
    <div
      className={`${styles.sessionItem} ${active ? styles.sessionActive : ""}`}
      onClick={onClick}
    >
      <div className={styles.sessionItemInner}>
        <span className={styles.sessionIcon}>💬</span>
        <div className={styles.sessionInfo}>
          <span className={styles.sessionTitle}>{session.title}</span>
          <span className={styles.sessionCount}>{session.message_count ?? 0} messages</span>
        </div>
      </div>
      <button
        className={styles.sessionDelete}
        onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
        title="Delete session"
      >
        ×
      </button>
    </div>
  );
}

// ── QUICK SUGGESTIONS ──
const SUGGESTIONS = [
  "How many calories should I eat today? 🥗",
  "Give me a quick 20-min home workout 💪",
  "What's the best pre-workout meal? 🍌",
  "How can I improve my sleep quality? 😴",
];

export default function Chatbot() {
  const [open, setOpen]               = useState(false);
  const [view, setView]               = useState("chat");   // "chat" | "sessions"
  const [sessions, setSessions]       = useState([]);
  const [activeSession, setActive]    = useState(null);   // { id, title }
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [sessLoading, setSessLoading] = useState(false);
  const [error, setError]             = useState(null);
  const [unread, setUnread]           = useState(0);

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const panelRef   = useRef(null);

  // ── Auto-scroll to bottom on new messages ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Focus input when chat opens ──
  useEffect(() => {
    if (open && view === "chat") {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open, view]);

  // ── Load sessions when opening ──
  useEffect(() => {
    if (open) fetchSessions();
  }, [open]);

  // ── Clear unread on open ──
  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  const fetchSessions = useCallback(async () => {
    setSessLoading(true);
    try {
      const res = await apiFetch("/chat/sessions");
      const list = res?.sessions ?? res?.data?.sessions ?? [];
      setSessions(list);
      // Auto-load the most recent session if none active
      if (!activeSession && list.length > 0) {
        await loadSession(list[0]);
      }
    } catch {
      setError("Could not load sessions.");
    } finally {
      setSessLoading(false);
    }
  }, [activeSession]);

  const loadSession = async (session) => {
    setActive(session);
    setView("chat");
    setError(null);
    try {
      const res = await apiFetch(`/chat/sessions/${session.id}/history`);
      const msgs = res?.messages ?? res?.data?.messages ?? [];
      setMessages(msgs);
    } catch {
      setMessages([]);
    }
  };

  const createSession = async () => {
    try {
      const res = await apiFetch("/chat/sessions", { method: "POST", body: JSON.stringify({ title: "New Chat" }) });
      const session = res?.session ?? res?.data?.session;
      if (session) {
        setSessions(prev => [session, ...prev]);
        setActive(session);
        setMessages([]);
        setView("chat");
      }
    } catch {
      setError("Could not create session.");
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      await apiFetch(`/chat/sessions/${sessionId}`, { method: "DELETE" });
      const updated = sessions.filter(s => s.id !== sessionId);
      setSessions(updated);
      if (activeSession?.id === sessionId) {
        setActive(updated[0] ?? null);
        if (updated[0]) await loadSession(updated[0]);
        else setMessages([]);
      }
    } catch {
      setError("Could not delete session.");
    }
  };

  const sendMessage = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    // Ensure a session exists
    let session = activeSession;
    if (!session) {
      try {
        const res = await apiFetch("/chat/sessions", {
          method: "POST",
          body: JSON.stringify({ title: msg.slice(0, 60) }),
        });
        session = res?.session ?? res?.data?.session;
        setActive(session);
        setSessions(prev => [session, ...prev]);
      } catch {
        setError("Could not start a session.");
        return;
      }
    }

    // Optimistic UI
    const optimistic = { role: "user", content: msg, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch("/chat", {
        method: "POST",
        body: JSON.stringify({ message: msg, sessionId: session.id }),
      });
      const reply = res?.reply ?? res?.data?.reply ?? "Sorry, I couldn't respond.";
      const aiMsg = { role: "assistant", content: reply, created_at: new Date().toISOString() };
      setMessages(prev => [...prev, aiMsg]);

      // Update session title if it was auto-set
      setSessions(prev =>
        prev.map(s => s.id === session.id ? { ...s, title: s.title === "New Chat" ? msg.slice(0, 60) : s.title, message_count: (s.message_count ?? 0) + 2 } : s)
      );

      if (!open) setUnread(n => n + 1);
    } catch {
      setError("Failed to get a response. Try again.");
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m !== optimistic));
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isEmpty = messages.length === 0 && !loading;

  return (
    <>
      {/* ── FLOATING BUTTON ── */}
      <button
        className={`${styles.fab} ${open ? styles.fabOpen : ""}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Open FitMitra AI"
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
              <line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
            </svg>
            {unread > 0 && <span className={styles.fabBadge}>{unread}</span>}
          </>
        )}
        <span className={styles.fabRing} />
      </button>

      {/* ── CHAT PANEL ── */}
      <div
        ref={panelRef}
        className={`${styles.panel} ${open ? styles.panelOpen : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="FitMitra AI Chat"
      >
        {/* ── HEADER ── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerAvatar}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                <line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
              </svg>
              <span className={styles.headerOnline} />
            </div>
            <div>
              <div className={styles.headerName}>FitMitra AI</div>
              <div className={styles.headerSub}>
                {loading ? "Thinking…" : "Your personal fitness coach"}
              </div>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button
              className={`${styles.headerBtn} ${view === "sessions" ? styles.headerBtnActive : ""}`}
              onClick={() => setView(v => v === "sessions" ? "chat" : "sessions")}
              title="Sessions"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>
            <button className={styles.headerBtn} onClick={createSession} title="New chat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── SESSION PANEL ── */}
        {view === "sessions" && (
          <div className={styles.sessionPanel}>
            <div className={styles.sessionPanelHead}>
              <span className={styles.sessionPanelLabel}>Chat History</span>
              <button className={styles.newSessionBtn} onClick={createSession}>+ New Chat</button>
            </div>
            {sessLoading ? (
              <div className={styles.sessLoading}>
                <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
              </div>
            ) : sessions.length === 0 ? (
              <div className={styles.sessEmpty}>No sessions yet. Start a new chat!</div>
            ) : (
              <div className={styles.sessionList}>
                {sessions.map(s => (
                  <SessionItem
                    key={s.id}
                    session={s}
                    active={activeSession?.id === s.id}
                    onClick={() => loadSession(s)}
                    onDelete={deleteSession}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MESSAGES ── */}
        {view === "chat" && (
          <>
            <div className={styles.messages}>
              {isEmpty && (
                <div className={styles.emptyChat}>
                  <div className={styles.emptyChatIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                      <line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
                    </svg>
                  </div>
                  <p className={styles.emptyChatTitle}>Hey, I'm FitMitra AI 👋</p>
                  <p className={styles.emptyChatSub}>Ask me anything about fitness, nutrition, or your workout plan.</p>
                  <div className={styles.suggestions}>
                    {SUGGESTIONS.map(s => (
                      <button key={s} className={styles.suggestionChip} onClick={() => sendMessage(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} />
              ))}

              {loading && (
                <div className={`${styles.msgRow} ${styles.msgRowAI}`}>
                  <div className={styles.aiAvatar}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                      <line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
                    </svg>
                  </div>
                  <TypingDots />
                </div>
              )}

              {error && (
                <div className={styles.errorChip}>⚠️ {error}</div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* ── INPUT ── */}
            <div className={styles.inputArea}>
              {activeSession && (
                <div className={styles.sessionTag}>
                  <span className={styles.sessionTagDot} />
                  <span>{activeSession.title}</span>
                </div>
              )}
              <div className={styles.inputRow}>
                <textarea
                  ref={inputRef}
                  className={styles.textarea}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask FitMitra AI…"
                  rows={1}
                  disabled={loading}
                />
                <button
                  className={`${styles.sendBtn} ${(!input.trim() || loading) ? styles.sendBtnDisabled : ""}`}
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  aria-label="Send"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
              <p className={styles.inputHint}>Press Enter to send · Shift+Enter for new line</p>
            </div>
          </>
        )}
      </div>
    </>
  );
}