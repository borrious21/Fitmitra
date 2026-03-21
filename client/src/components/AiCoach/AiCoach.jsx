// src/components/AiCoach/AiCoach.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import { analyzeDay, chatWithCoach } from "../../services/aiCoachService";
import styles from "./AiCoach.module.css";

const SUGGESTIONS = [
  "Analyze my day",
  "What should I eat post-workout?",
  "How can I improve my sleep?",
  "Am I hitting my protein goal?",
  "Tips to reduce my calorie deficit",
  "Best recovery exercises for rest day",
];

function CoachMessage({ text, isStreaming }) {
  if (!text) return null;
  const lines = text.split("\n").filter(Boolean);
  return (
    <div className={styles.coachBody}>
      {lines.map((line, i) => {
        const isInsight = line.startsWith("🔥");
        const isAction  = line.startsWith("👉");
        const isCoach   = line.startsWith("💬");
        if (isInsight || isAction || isCoach) {
          const colon = line.indexOf(":");
          const label = line.slice(0, colon);
          const rest  = line.slice(colon + 1);
          const color = isInsight ? "#FF5C1A" : isAction ? "#00C8E0" : "#B8F000";
          const isLast = i === lines.length - 1;
          return (
            <div key={i} className={styles.coachLine}>
              <span className={styles.coachLineLabel} style={{ color }}>{label}:</span>
              <span className={styles.coachLineText}>
                {rest}
                {isStreaming && isLast && <span className={styles.streamCursor} />}
              </span>
            </div>
          );
        }
        const isLast = i === lines.length - 1;
        return (
          <div key={i} className={styles.coachPlain}>
            {line}
            {isStreaming && isLast && <span className={styles.streamCursor} />}
          </div>
        );
      })}
    </div>
  );
}

function TypingDots() {
  return (
    <div className={styles.typingRow}>
      <div className={styles.typingAvatar}>🏋️</div>
      <div className={styles.typingBubble}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    </div>
  );
}

function StatsStrip({ d }) {
  const calOver = Number(d.calories) > Number(d.target_calories);
  const protOk  = Number(d.protein)  >= Number(d.protein_goal);
  const waterOk = parseFloat(d.water) >= 2.5;
  const sleepOk = parseFloat(d.sleep) >= 7;
  const items = [
    { label: "Cals",    val: `${d.calories}/${d.target_calories}`, color: calOver ? "#ef4444" : "#4ade80" },
    { label: "Protein", val: `${d.protein}g`,                      color: protOk  ? "#4ade80" : "#fb923c" },
    { label: "Carbs",   val: `${d.carbs}g`,                        color: "#94a3b8" },
    { label: "Water",   val: `${d.water}L`,                        color: waterOk ? "#4ade80" : "#facc15" },
    { label: "Sleep",   val: `${d.sleep}h`,                        color: sleepOk ? "#4ade80" : "#ef4444" },
    { label: "Streak",  val: `🔥${d.streak}d`,                     color: "#FF5C1A" },
  ];
  return (
    <div className={styles.statsStrip}>
      {items.map(({ label, val, color }) => (
        <div key={label} className={styles.statItem}>
          <span className={styles.statLabel}>{label}</span>
          <span className={styles.statVal} style={{ color }}>{val}</span>
        </div>
      ))}
    </div>
  );
}

export default function AiCoach({ fitnessData }) {
  const [open,      setOpen]      = useState(false);
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState("");
  const [streaming, setStreaming] = useState(false);
  const [analyzed,  setAnalyzed]  = useState(false);
  const [hasNew,    setHasNew]    = useState(false);
  const [error,     setError]     = useState("");

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const abortRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setHasNew(false);
      setError("");
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  const appendDelta = useCallback((delta) => {
    setMessages((prev) => {
      if (!prev.length) return prev;
      const copy = [...prev];
      copy[copy.length - 1] = {
        ...copy[copy.length - 1],
        content: copy[copy.length - 1].content + delta,
      };
      return copy;
    });
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const pushAssistantPlaceholder = () =>
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

  const runAnalysis = useCallback(async () => {
    if (streaming || !fitnessData) return;
    setError("");
    setStreaming(true);
    setAnalyzed(true);
    setMessages((prev) => [...prev, { role: "user", content: "📊 Analyze today's fitness data" }]);
    pushAssistantPlaceholder();
    abortRef.current = new AbortController();
    try {
      await analyzeDay(fitnessData, appendDelta, abortRef.current.signal);
    } catch (e) {
      if (e.name !== "AbortError") {
        setError(e.message || "Something went wrong. Try again.");
        setMessages((prev) => prev.slice(0, -1));
      }
    } finally {
      setStreaming(false);
      if (!open) setHasNew(true);
    }
  }, [fitnessData, streaming, open, appendDelta]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;
    setInput("");
    setError("");
    if (trimmed.toLowerCase() === "analyze my day" && !analyzed) {
      runAnalysis(); return;
    }
    const updatedHistory = [...messages, { role: "user", content: trimmed }];
    setMessages(updatedHistory);
    pushAssistantPlaceholder();
    setStreaming(true);
    const apiMsgs = updatedHistory.map((m) => ({ role: m.role, content: m.content }));
    abortRef.current = new AbortController();
    try {
      await chatWithCoach(apiMsgs, appendDelta, abortRef.current.signal);
    } catch (e) {
      if (e.name !== "AbortError") {
        setError(e.message || "Something went wrong. Try again.");
        setMessages((prev) => prev.slice(0, -1));
      }
    } finally {
      setStreaming(false);
      if (!open) setHasNew(true);
    }
  }, [messages, streaming, open, analyzed, appendDelta, runAnalysis]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };
  const handleClose = () => { abortRef.current?.abort(); setOpen(false); };
  const handleClear = () => {
    abortRef.current?.abort();
    setMessages([]); setAnalyzed(false); setStreaming(false); setError("");
  };
  const handleSuggestion = (s) => {
    if (s === "Analyze my day") runAnalysis(); else sendMessage(s);
  };

  const lastIdx = messages.length - 1;

  return (
    <>
      {/* FAB */}
      <button
        className={`${styles.fab} ${open ? styles.fabOpen : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle AI Coach"
      >
        <span className={styles.fabIcon}>{open ? "✕" : "🏋️"}</span>
        <span className={styles.fabLabel}>{open ? "Close" : "AI Coach"}</span>
        {hasNew && !open && <span className={styles.fabPing} />}
      </button>

      {/* Panel */}
      <div className={`${styles.panel} ${open ? styles.panelOpen : ""}`}>

        {/* Header */}
        <div className={styles.panelHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerAvatar}>🏋️</div>
            <div>
              <div className={styles.headerTitle}>Fitmitra Coach</div>
              <div className={styles.headerSub}>
                {streaming
                  ? <span className={styles.headerTyping}>Coach is typing…</span>
                  // ✅ Updated from "Mistral · Hugging Face" → "Llama 3.1 · Groq"
                  : <span>Llama 3.1 · Groq</span>
                }
              </div>
            </div>
          </div>
          <div className={styles.headerActions}>
            {messages.length > 0 && (
              <button className={styles.headerBtn} onClick={handleClear} title="Clear chat">↺</button>
            )}
            <button className={styles.headerBtn} onClick={handleClose} title="Close">✕</button>
          </div>
        </div>

        {/* Messages */}
        <div className={styles.messages}>
          {messages.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyAvatar}>🏋️</div>
              <div className={styles.emptyTitle}>Your AI Coach is ready</div>
              <div className={styles.emptySub}>
                I have your today's data loaded.<br />
                Tap "Analyze my day" or ask anything.
              </div>
              <div className={styles.suggestions}>
                {SUGGESTIONS.map((s) => (
                  <button key={s} className={styles.suggChip} onClick={() => handleSuggestion(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => {
            const isStreamingThis = streaming && i === lastIdx && m.role === "assistant";
            return (
              <div key={i} className={`${styles.msgRow} ${m.role === "user" ? styles.msgUser : styles.msgAssistant}`}>
                {m.role === "assistant" && <div className={styles.msgAvatar}>🏋️</div>}
                <div className={styles.msgBubble}>
                  {m.role === "assistant"
                    ? <CoachMessage text={m.content} isStreaming={isStreamingThis} />
                    : <span className={styles.userMsgText}>{m.content}</span>
                  }
                </div>
              </div>
            );
          })}

          {streaming && messages[lastIdx]?.content === "" && <TypingDots />}

          {error && (
            <div className={styles.errorMsg}>
              <span>⚠️</span><span>{error}</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Stats strip */}
        {fitnessData && <StatsStrip d={fitnessData} />}

        {/* Input */}
        <div className={styles.inputArea}>
          {!analyzed && (
            <button className={styles.analyzeBtn} onClick={runAnalysis} disabled={streaming || !fitnessData}>
              🔥 Analyze My Day
            </button>
          )}
          <div className={styles.inputRow}>
            <textarea
              ref={inputRef}
              className={styles.textarea}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your coach anything…"
              rows={1}
              disabled={streaming}
            />
            <button className={styles.sendBtn} onClick={() => sendMessage(input)} disabled={streaming || !input.trim()}>
              ↑
            </button>
          </div>
        </div>
      </div>

      {open && <div className={styles.backdrop} onClick={handleClose} />}
    </>
  );
}