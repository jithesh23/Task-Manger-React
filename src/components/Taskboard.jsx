import { useState, useEffect, useRef } from "react";

const CATEGORIES = ["Personal", "Work", "Study", "Health"];
const CAT_COLORS = {
  Personal: { bg: "#fde68a", text: "#92400e", dot: "#f59e0b" },
  Work:     { bg: "#bfdbfe", text: "#1e3a5f", dot: "#3b82f6" },
  Study:    { bg: "#d9f99d", text: "#3a5a0e", dot: "#84cc16" },
  Health:   { bg: "#fecaca", text: "#7f1d1d", dot: "#ef4444" },
};
const COLS = ["To Do", "In Progress", "Done"];

const seed = [
  { id: 1, title: "Read design systems book", note: "Chapter 4 onwards", category: "Study", col: "To Do", ts: Date.now() - 3600000 * 5 },
  { id: 2, title: "Morning run 5km", note: "Track with Strava", category: "Health", col: "In Progress", ts: Date.now() - 3600000 * 2 },
  { id: 3, title: "Submit project report", note: "Due Friday EOD", category: "Work", col: "Done", ts: Date.now() - 3600000 * 8 },
];

function timeAgo(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function TaskBoard() {
  const [tasks, setTasks] = useState(seed);
  const [form, setForm] = useState({ title: "", note: "", category: "Work" });
  const [errors, setErrors] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [flash, setFlash] = useState(null);
  const [mounted, setMounted] = useState(false);
  const titleRef = useRef();

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (showForm && titleRef.current) titleRef.current.focus(); }, [showForm]);

  const notify = (msg, ok = true) => {
    setFlash({ msg, ok });
    setTimeout(() => setFlash(null), 2200);
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Please write a task title.";
    else if (form.title.trim().length < 3) e.title = "At least 3 characters.";
    else if (form.title.trim().length > 70) e.title = "Keep it under 70 characters.";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) return setErrors(e);
    setErrors({});
    if (editId !== null) {
      setTasks(t => t.map(x => x.id === editId ? { ...x, ...form } : x));
      notify("Task updated ✓");
    } else {
      setTasks(t => [{ id: Date.now(), ...form, col: "To Do", ts: Date.now() }, ...t]);
      notify("Task added ✓");
    }
    setForm({ title: "", note: "", category: "Work" });
    setEditId(null);
    setShowForm(false);
  };

  const startEdit = (task) => {
    setForm({ title: task.title, note: task.note, category: task.category });
    setEditId(task.id);
    setShowForm(true);
  };

  const deleteTask = (id) => {
    setTasks(t => t.filter(x => x.id !== id));
    notify("Removed.", false);
  };

  const moveCol = (id, col) => setTasks(t => t.map(x => x.id === id ? { ...x, col } : x));

  const onDragStart = (id) => setDragging(id);
  const onDrop = (col) => {
    if (dragging !== null) moveCol(dragging, col);
    setDragging(null);
    setDragOver(null);
  };

  const counts = COLS.reduce((a, c) => ({ ...a, [c]: tasks.filter(t => t.col === c).length }), {});

  return (
    <div style={{
      minHeight: "100vh",
      background: "#faf6f0",
      backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c9b99a' fill-opacity='0.12'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      fontFamily: "'Lora', Georgia, serif",
      paddingBottom: 80,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Caveat:wght@500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .board-col {
          background: #fff9f2;
          border: 1.5px solid #e8ddd0;
          border-radius: 16px;
          min-height: 280px;
          transition: background 0.2s, border-color 0.2s;
          flex: 1;
          min-width: 0;
        }
        .board-col.drag-over {
          background: #fff3e0;
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px #f59e0b22;
        }

        .task-card {
          background: #fff;
          border: 1.5px solid #ede4d8;
          border-radius: 12px;
          padding: 14px 16px;
          cursor: grab;
          transition: box-shadow 0.2s, transform 0.15s, border-color 0.2s;
          position: relative;
        }
        .task-card:hover {
          box-shadow: 4px 6px 18px #c9b99a44;
          transform: translateY(-2px) rotate(0.3deg);
          border-color: #c9b99a;
        }
        .task-card:active { cursor: grabbing; }
        .task-card.dragging { opacity: 0.4; }

        .slide-down { animation: slideDown 0.28s cubic-bezier(.22,.68,0,1.2) both; }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-14px) scaleY(0.92); }
          to   { opacity: 1; transform: translateY(0) scaleY(1); }
        }

        .pop-in { animation: popIn 0.35s cubic-bezier(.22,.68,0,1.2) both; }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }

        .stagger { animation: fadeSlide 0.5s ease both; }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .ink-btn {
          font-family: 'Caveat', cursive;
          font-size: 17px;
          font-weight: 600;
          border: 2px solid;
          border-radius: 8px;
          cursor: pointer;
          padding: 7px 22px;
          transition: all 0.15s;
          letter-spacing: 0.02em;
        }
        .ink-btn:hover { transform: translateY(-1px); filter: brightness(0.94); }
        .ink-btn:active { transform: scale(0.97); }

        .ink-input {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 2px solid #c9b99a;
          border-radius: 0;
          padding: 6px 2px;
          font-family: 'Lora', Georgia, serif;
          font-size: 15px;
          color: #3d2b1a;
          outline: none;
          transition: border-color 0.2s;
        }
        .ink-input:focus { border-bottom-color: #92400e; }
        .ink-input::placeholder { color: #c9b99a; font-style: italic; }
        .ink-input.err { border-bottom-color: #ef4444; }

        .cat-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 99px;
          font-size: 11px;
          font-family: 'Caveat', cursive;
          font-weight: 600;
          letter-spacing: 0.04em;
        }

        .col-move-btn {
          background: none;
          border: 1px solid #e8ddd0;
          border-radius: 6px;
          padding: 3px 8px;
          font-size: 11px;
          color: #9a7b5a;
          cursor: pointer;
          font-family: 'Caveat', cursive;
          font-weight: 600;
          transition: all 0.15s;
        }
        .col-move-btn:hover { background: #fef3c7; border-color: #f59e0b; color: #92400e; }

        .icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #c9b99a;
          font-size: 14px;
          padding: 3px 5px;
          border-radius: 5px;
          transition: all 0.15s;
          line-height: 1;
        }
        .icon-btn:hover { color: #3d2b1a; background: #f5ede4; }
        .icon-btn.del:hover { color: #ef4444; background: #fef2f2; }

        .toast {
          position: fixed;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          padding: 10px 26px;
          border-radius: 99px;
          font-family: 'Caveat', cursive;
          font-size: 17px;
          font-weight: 600;
          z-index: 999;
          animation: toastIn 0.3s ease;
          pointer-events: none;
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e0d4c4; border-radius: 3px; }

        select.ink-input { appearance: none; cursor: pointer; }
      `}</style>

      {/* Toast */}
      {flash && (
        <div className="toast" style={{
          background: flash.ok ? "#fef3c7" : "#fee2e2",
          border: `1.5px solid ${flash.ok ? "#f59e0b" : "#fca5a5"}`,
          color: flash.ok ? "#92400e" : "#991b1b",
        }}>{flash.msg}</div>
      )}

      {/* Header */}
      <div style={{ background: "#fff9f2", borderBottom: "1.5px solid #ede4d8", padding: "20px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontFamily: "'Caveat', cursive", fontSize: 36, fontWeight: 700, color: "#3d2b1a", letterSpacing: "-0.01em", lineHeight: 1 }}>
              My Task Board
            </h1>
            <p style={{ fontSize: 13, color: "#9a7b5a", fontStyle: "italic", marginTop: 3 }}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {COLS.map(c => (
              <div key={c} style={{ textAlign: "center", padding: "6px 14px", background: "#fff", border: "1.5px solid #ede4d8", borderRadius: 10 }}>
                <div style={{ fontFamily: "'Caveat', cursive", fontSize: 24, fontWeight: 700, color: c === "Done" ? "#84cc16" : "#3d2b1a", lineHeight: 1 }}>{counts[c]}</div>
                <div style={{ fontSize: 10, color: "#9a7b5a", letterSpacing: "0.06em", marginTop: 1 }}>{c.toUpperCase()}</div>
              </div>
            ))}
            <button className="ink-btn" onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ title: "", note: "", category: "Work" }); setErrors({}); }}
              style={{ background: "#3d2b1a", color: "#fef3c7", borderColor: "#3d2b1a", marginLeft: 8 }}>
              {showForm ? "✕ Close" : "+ Add Task"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 32px 0" }}>

        {/* Form */}
        {showForm && (
          <div className="slide-down" style={{
            background: "#fff",
            border: "1.5px solid #e8ddd0",
            borderRadius: 16,
            padding: "24px 28px",
            marginBottom: 28,
            boxShadow: "4px 8px 32px #c9b99a22",
            position: "relative",
          }}>
            {/* paper line decoration */}
            <div style={{ position: "absolute", left: 52, top: 0, bottom: 0, width: 1, background: "#fde68a55", pointerEvents: "none" }} />
            <div style={{ fontFamily: "'Caveat', cursive", fontSize: 13, color: "#c9b99a", letterSpacing: "0.1em", marginBottom: 18 }}>
              {editId ? "— EDITING TASK —" : "— NEW TASK —"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 28px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 11, color: "#9a7b5a", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>TASK TITLE *</label>
                <input ref={titleRef} className={`ink-input${errors.title ? " err" : ""}`} placeholder="What needs to be done?" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  onKeyDown={e => e.key === "Enter" && handleSave()}
                  maxLength={70} style={{ fontSize: 17 }} />
                {errors.title && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 4, fontStyle: "italic" }}>{errors.title}</div>}
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#9a7b5a", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>NOTE</label>
                <input className="ink-input" placeholder="Any extra details…" value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#9a7b5a", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>CATEGORY</label>
                <select className="ink-input select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button className="ink-btn" onClick={handleSave}
                style={{ background: "#92400e", color: "#fef3c7", borderColor: "#92400e" }}>
                {editId ? "Save Changes" : "Add to Board"}
              </button>
              <button className="ink-btn" onClick={() => { setShowForm(false); setEditId(null); setErrors({}); }}
                style={{ background: "transparent", color: "#9a7b5a", borderColor: "#c9b99a" }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Category legend */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
          {CATEGORIES.map(c => (
            <span key={c} className="cat-chip" style={{ background: CAT_COLORS[c].bg, color: CAT_COLORS[c].text }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: CAT_COLORS[c].dot, display: "inline-block" }} />
              {c}
            </span>
          ))}
          <span style={{ fontSize: 11, color: "#c9b99a", fontStyle: "italic", marginLeft: 4, alignSelf: "center" }}>drag cards to move between columns</span>
        </div>

        {/* Board */}
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          {COLS.map((col, ci) => {
            const colTasks = tasks.filter(t => t.col === col);
            const colIcons = ["○", "◑", "●"];
            const colAccents = ["#3b82f6", "#f59e0b", "#84cc16"];
            return (
              <div key={col}
                className={`board-col${dragOver === col ? " drag-over" : ""}`}
                onDragOver={e => { e.preventDefault(); setDragOver(col); }}
                onDrop={() => onDrop(col)}
                onDragLeave={() => setDragOver(null)}
              >
                {/* Column header */}
                <div style={{ padding: "16px 16px 12px", borderBottom: "1.5px solid #ede4d8", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16, color: colAccents[ci] }}>{colIcons[ci]}</span>
                  <span style={{ fontFamily: "'Caveat', cursive", fontSize: 19, fontWeight: 700, color: "#3d2b1a" }}>{col}</span>
                  <span style={{
                    marginLeft: "auto",
                    background: colTasks.length ? colAccents[ci] + "22" : "#f5ede4",
                    color: colTasks.length ? colAccents[ci] : "#c9b99a",
                    borderRadius: 99, padding: "1px 9px", fontSize: 12,
                    fontFamily: "'Caveat', cursive", fontWeight: 600,
                  }}>{colTasks.length}</span>
                </div>

                {/* Cards */}
                <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10, minHeight: 200 }}>
                  {colTasks.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px 16px", color: "#ddd0c4", fontStyle: "italic", fontSize: 13 }}>
                      Drop tasks here
                    </div>
                  )}
                  {colTasks.map((task, ti) => {
                    const cc = CAT_COLORS[task.category];
                    const prevCol = COLS[ci - 1];
                    const nextCol = COLS[ci + 1];
                    return (
                      <div key={task.id}
                        className={`task-card pop-in${dragging === task.id ? " dragging" : ""}`}
                        style={{ animationDelay: `${ti * 0.07}s` }}
                        draggable
                        onDragStart={() => onDragStart(task.id)}
                        onDragEnd={() => { setDragging(null); setDragOver(null); }}
                      >
                        {/* Top row */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6, marginBottom: 8 }}>
                          <span className="cat-chip" style={{ background: cc.bg, color: cc.text, fontSize: 10 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: cc.dot, display: "inline-block" }} />
                            {task.category}
                          </span>
                          <div style={{ display: "flex", gap: 3 }}>
                            <button className="icon-btn" title="Edit" onClick={() => startEdit(task)}>✎</button>
                            <button className="icon-btn del" title="Delete" onClick={() => deleteTask(task.id)}>✕</button>
                          </div>
                        </div>

                        {/* Title */}
                        <div style={{
                          fontFamily: "'Lora', Georgia, serif",
                          fontSize: 14, fontWeight: 500,
                          color: task.col === "Done" ? "#b0a090" : "#3d2b1a",
                          textDecoration: task.col === "Done" ? "line-through" : "none",
                          lineHeight: 1.4, marginBottom: task.note ? 6 : 10,
                        }}>{task.title}</div>

                        {task.note && (
                          <div style={{ fontSize: 12, color: "#9a7b5a", fontStyle: "italic", marginBottom: 10, lineHeight: 1.4 }}>{task.note}</div>
                        )}

                        {/* Footer */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px dashed #ede4d8", paddingTop: 8 }}>
                          <span style={{ fontSize: 10, color: "#c9b99a" }}>{timeAgo(task.ts)}</span>
                          <div style={{ display: "flex", gap: 4 }}>
                            {prevCol && <button className="col-move-btn" onClick={() => moveCol(task.id, prevCol)}>← {prevCol.split(" ")[0]}</button>}
                            {nextCol && <button className="col-move-btn" onClick={() => moveCol(task.id, nextCol)}>{nextCol.split(" ")[0]} →</button>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer count */}
        <div style={{ textAlign: "center", marginTop: 28, fontFamily: "'Caveat', cursive", fontSize: 15, color: "#c9b99a" }}>
          {tasks.length} task{tasks.length !== 1 ? "s" : ""} total · {counts["Done"]} completed
        </div>
      </div>
    </div>
  );
}