// ── src/pages/protected/Admin/AdminComponents.jsx ────────────
import { useEffect, useState } from "react";

// ── Badge ─────────────────────────────────────────────────────
export function Badge({ children, color = "gray" }) {
  const themes = {
    green:  { background: "rgba(34,197,94,0.12)",   color: "#22c55e" },
    red:    { background: "rgba(239,68,68,0.12)",    color: "#ef4444" },
    orange: { background: "rgba(255,92,26,0.12)",    color: "#FF5C1A" },
    yellow: { background: "rgba(245,158,11,0.12)",   color: "#f59e0b" },
    blue:   { background: "rgba(59,130,246,0.12)",   color: "#3b82f6" },
    purple: { background: "rgba(168,85,247,0.12)",   color: "#a855f7" },
    gray:   { background: "rgba(148,163,184,0.12)",  color: "#94a3b8" },
  };
  return (
    <span style={{
      padding: "0.2rem 0.55rem",
      borderRadius: 6,
      fontSize: "0.65rem",
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      display: "inline-block",
      ...(themes[color] ?? themes.gray),
    }}>
      {children}
    </span>
  );
}

// ── Btn ───────────────────────────────────────────────────────
export function Btn({ onClick, color = "orange", children, disabled, type = "button", style = {} }) {
  const bg = {
    orange: "#FF5C1A",
    green:  "#22c55e",
    red:    "#ef4444",
    blue:   "#3b82f6",
    purple: "#a855f7",
    gray:   "rgba(255,255,255,0.08)",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "0.45rem 0.9rem",
        borderRadius: 8,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: disabled ? "rgba(255,255,255,0.05)" : (bg[color] ?? bg.orange),
        color: "#fff",
        fontSize: "0.72rem",
        fontWeight: 700,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        opacity: disabled ? 0.5 : 1,
        transition: "opacity 0.2s",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ── StatCard ──────────────────────────────────────────────────
export function StatCard({ label, value, sub, color = "#FF5C1A", icon }) {
  return (
    <div style={{
      background: "#0F1217",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14,
      padding: "1.25rem 1.5rem",
    }}>
      <div style={{
        fontSize: "0.55rem",
        fontWeight: 800,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "#525D72",
        marginBottom: "0.5rem",
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
      }}>
        {icon && <span style={{ color, display: "flex" }}>{icon}</span>}
        {label}
      </div>
      <div style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: "2rem",
        fontWeight: 900,
        color,
        lineHeight: 1,
      }}>
        {value ?? "—"}
      </div>
      {sub && (
        <div style={{ fontSize: "0.72rem", color: "#525D72", marginTop: "0.35rem" }}>{sub}</div>
      )}
    </div>
  );
}

// ── Field (form input / select / textarea) ────────────────────
export function Field({ label, value, onChange, type = "text", options, rows, placeholder }) {
  const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: "0.5rem 0.75rem",
    color: "#F0F2F5",
    fontSize: "0.8rem",
    outline: "none",
  };
  return (
    <div>
      <label style={{
        display: "block",
        fontSize: "0.6rem",
        fontWeight: 800,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "#525D72",
        marginBottom: 4,
      }}>
        {label}
      </label>
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)}
          style={{ ...inputStyle, background: "#1A1E28" }}>
          {options.map(o => (
            <option key={typeof o === "object" ? o.value : o} value={typeof o === "object" ? o.value : o}>
              {typeof o === "object" ? o.label : o}
            </option>
          ))}
        </select>
      ) : rows ? (
        <textarea value={value} onChange={e => onChange(e.target.value)}
          rows={rows} placeholder={placeholder}
          style={{ ...inputStyle, resize: "vertical" }} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} style={inputStyle} />
      )}
    </div>
  );
}

// ── SectionCard ───────────────────────────────────────────────
export function SectionCard({ title, children, action }) {
  return (
    <div style={{
      background: "#0F1217",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14,
      padding: "1.25rem 1.5rem",
      marginTop: "1.25rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h3 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "0.9rem",
          fontWeight: 900,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#F0F2F5",
          margin: 0,
        }}>
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

// ── Table primitives ──────────────────────────────────────────
export function TH({ children }) {
  return (
    <th style={{
      padding: "0.75rem 1rem",
      textAlign: "left",
      fontSize: "0.6rem",
      fontWeight: 800,
      letterSpacing: "0.15em",
      textTransform: "uppercase",
      color: "#525D72",
      whiteSpace: "nowrap",
    }}>
      {children}
    </th>
  );
}

export function TD({ children, bold, accent, muted }) {
  return (
    <td style={{
      padding: "0.75rem 1rem",
      fontSize: bold ? "0.82rem" : "0.78rem",
      color: accent ? "#FF5C1A" : bold ? "#F0F2F5" : muted ? "#525D72" : "#9AA3B4",
      fontWeight: bold || accent ? 700 : 400,
      whiteSpace: "nowrap",
    }}>
      {children ?? "—"}
    </td>
  );
}

// ── Shimmer row (loading placeholder) ────────────────────────
export function ShimmerRows({ cols = 5, rows = 6 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i}>
      <td colSpan={cols} style={{ padding: "0.875rem 1rem" }}>
        <div style={{
          height: 16,
          borderRadius: 6,
          background: "rgba(255,255,255,0.05)",
          animation: "shimmer 1.5s infinite",
        }} />
      </td>
    </tr>
  ));
}

// ── Pagination ────────────────────────────────────────────────
export function Pagination({ page, pages, total, limit, onPrev, onNext }) {
  return (
    <div style={{
      padding: "0.875rem 1rem",
      borderTop: "1px solid rgba(255,255,255,0.07)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      <span style={{ fontSize: "0.72rem", color: "#525D72" }}>
        Page {page + 1} of {pages} · {total} records
      </span>
      <div style={{ display: "flex", gap: "0.4rem" }}>
        <Btn onClick={onPrev} disabled={page === 0}          color="gray">← Prev</Btn>
        <Btn onClick={onNext} disabled={page >= pages - 1}   color="gray">Next →</Btn>
      </div>
    </div>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────
export function Modal({ onClose, children, width = 480, title }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#161A23",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          padding: "1.75rem",
          width,
          maxWidth: "90vw",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <h3 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "1.1rem",
            fontWeight: 900,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#F0F2F5",
            marginBottom: "1.25rem",
          }}>
            {title}
          </h3>
        )}
        {children}
      </div>
    </div>
  );
}


// ── Spinner ───────────────────────────────────────────────────
export function Spinner({ size = 32, color = "#FF5C1A" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animation: "spin 0.75s linear infinite", flexShrink: 0 }}
    >
      <path d="M12 2a10 10 0 0 1 10 10" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

// ── Toast ─────────────────────────────────────────────────────
const TOAST_ICONS = {
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

const TOAST_THEME = {
  success: { bg: "#0F2318", border: "rgba(34,197,94,0.3)",  icon: "#22c55e", bar: "#22c55e" },
  error:   { bg: "#1F0F0F", border: "rgba(239,68,68,0.3)",  icon: "#ef4444", bar: "#ef4444" },
  warning: { bg: "#1E1800", border: "rgba(245,158,11,0.3)", icon: "#f59e0b", bar: "#f59e0b" },
};

const DURATION = 3500; // ms

export function Toast({ msg, type = "success", onDone }) {
  const [visible,  setVisible]  = useState(false);
  const [progress, setProgress] = useState(100);

  const theme = TOAST_THEME[type] ?? TOAST_THEME.success;

  // Animate in
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Progress bar countdown
  useEffect(() => {
    const start = Date.now();
    const frame = () => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(pct);
      if (pct > 0) requestAnimationFrame(frame);
    };
    const raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Auto-dismiss
  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, DURATION);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.75rem",
        right: "1.75rem",
        zIndex: 9999,
        minWidth: 280,
        maxWidth: 380,
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        transform: visible ? "translateY(0) scale(1)" : "translateY(16px) scale(0.97)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.25s cubic-bezier(.4,0,.2,1), opacity 0.25s ease",
      }}
    >
      {/* Body */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.875rem 1rem" }}>

        {/* Icon */}
        <div style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: 8,
          background: `${theme.icon}1a`,
          color: theme.icon,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          {TOAST_ICONS[type] ?? TOAST_ICONS.success}
        </div>

        {/* Message */}
        <div style={{ flex: 1, paddingTop: 2 }}>
          <div style={{
            fontSize: "0.55rem",
            fontWeight: 800,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: theme.icon,
            marginBottom: "0.2rem",
          }}>
            {type === "success" ? "Success" : type === "error" ? "Error" : "Warning"}
          </div>
          <div style={{ fontSize: "0.82rem", color: "#F0F2F5", lineHeight: 1.45 }}>{msg}</div>
        </div>

        {/* Close button */}
        <button
          onClick={() => { setVisible(false); setTimeout(onDone, 300); }}
          style={{
            flexShrink: 0,
            width: 20,
            height: 20,
            borderRadius: 6,
            border: "none",
            background: "transparent",
            color: "#525D72",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            fontSize: "0.85rem",
            lineHeight: 1,
          }}
        >×</button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: "rgba(255,255,255,0.06)" }}>
        <div style={{
          height: "100%",
          width: `${progress}%`,
          background: theme.bar,
          transition: "width 0.1s linear",
          boxShadow: `0 0 6px ${theme.bar}`,
        }} />
      </div>
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────────
// columns: [{ key, label, render?(value, row) => ReactNode }]
export function Table({ rows = [], columns = [], loading = false, emptyMsg = "No data.", shimmerRows = 5 }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            {columns.map(col => (
              <th key={col.key} style={{
                padding: "0.65rem 1rem",
                textAlign: "left",
                fontSize: "0.58rem",
                fontWeight: 800,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#525D72",
                whiteSpace: "nowrap",
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: shimmerRows }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={columns.length} style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ height: 14, borderRadius: 6, background: "rgba(255,255,255,0.05)", animation: "shimmer 1.5s infinite" }} />
                  </td>
                </tr>
              ))
            : rows.length === 0
              ? (
                <tr>
                  <td colSpan={columns.length} style={{ padding: "2rem 1rem", textAlign: "center", fontSize: "0.8rem", color: "#525D72" }}>
                    {emptyMsg}
                  </td>
                </tr>
              )
              : rows.map((row, i) => (
                  <tr key={row.id ?? i}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    {columns.map(col => (
                      <td key={col.key} style={{ padding: "0.65rem 1rem", fontSize: "0.78rem", color: "#9AA3B4", whiteSpace: "nowrap" }}>
                        {col.render ? col.render(row[col.key], row) : (row[col.key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))
          }
        </tbody>
      </table>
    </div>
  );
}