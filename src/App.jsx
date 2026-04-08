import { useState, useEffect } from "react";

const HABITS = [
  { id: "english",   label: "英文を読む",           icon: "🌐", color: "#6B9E8A" },
  { id: "current",   label: "時事学習",              icon: "📰", color: "#C4875A" },
  { id: "it_biz",    label: "ITビジネスニュース",    icon: "💡", color: "#5A7EC4" },
  { id: "kencho",    label: "県庁だより",            icon: "🏛️", color: "#9E6B9E" },
  { id: "interview", label: "県職員インタビュー",    icon: "🎤", color: "#9E8A6B" },
  { id: "suuteki",   label: "数的処理1問",           icon: "🔢", color: "#C45A5A" },
];

const STORAGE_KEY = "habit-tracker-data";

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

// ---------- Storage helpers (localStorage) ----------
function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveRecords(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {}
}

// ---------- Root ----------
export default function HabitTracker() {
  const today   = new Date();
  const todayKey = toDateKey(today);

  const [records,     setRecords]     = useState(loadRecords);
  const [view,        setView]        = useState("today");
  const [calMonth,    setCalMonth]    = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDay, setSelectedDay] = useState(null);
  const [graphHabit,  setGraphHabit]  = useState(HABITS[0].id);

  useEffect(() => { saveRecords(records); }, [records]);

  // ---- record helpers ----
  const getRecord = (dateKey) => records[dateKey] || {};

  const setCount = (dateKey, habitId, delta) => {
    setRecords(prev => {
      const day     = { ...(prev[dateKey] || {}) };
      const current = day[habitId] || { done: false, count: 0 };
      const newCount = Math.max(0, (current.count || 0) + delta);
      day[habitId]  = { done: newCount > 0, count: newCount };
      return { ...prev, [dateKey]: day };
    });
  };

  const toggleDone = (dateKey, habitId) => {
    setRecords(prev => {
      const day     = { ...(prev[dateKey] || {}) };
      const current = day[habitId] || { done: false, count: 0 };
      const newDone = !current.done;
      day[habitId]  = { done: newDone, count: newDone ? Math.max(current.count || 0, 1) : 0 };
      return { ...prev, [dateKey]: day };
    });
  };

  const dayScore = (dateKey) => {
    const rec  = getRecord(dateKey);
    const done = HABITS.filter(h => rec[h.id]?.done).length;
    return done / HABITS.length;
  };

  // last-30-days data for one habit
  const graphData = (habitId) => {
    return Array.from({ length: 30 }, (_, i) => {
      const d   = new Date(today);
      d.setDate(d.getDate() - (29 - i));
      const key = toDateKey(d);
      const rec = records[key] || {};
      return { label: `${d.getMonth() + 1}/${d.getDate()}`, count: rec[habitId]?.count || 0, key };
    });
  };

  // ---- nav tabs ----
  const tabs = [
    { id: "today",    label: "今日の記録" },
    { id: "calendar", label: "カレンダー" },
    { id: "graph",    label: "グラフ" },
  ];

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.eyebrow}>STUDY HABIT TRACKER</div>
        <h1 style={styles.h1}>📖 学習記録帳</h1>
        <div style={styles.dateStr}>
          {today.getFullYear()}年{today.getMonth() + 1}月{today.getDate()}日（
          {["日","月","火","水","木","金","土"][today.getDay()]}）
        </div>
        <nav style={styles.nav}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              style={{ ...styles.navBtn, ...(view === tab.id ? styles.navBtnActive : {}) }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main style={styles.main}>
        {view === "today" && (
          <TodayView
            todayKey={todayKey}
            getRecord={getRecord}
            toggleDone={toggleDone}
            setCount={setCount}
          />
        )}
        {view === "calendar" && (
          <CalendarView
            calMonth={calMonth}
            setCalMonth={setCalMonth}
            records={records}
            dayScore={dayScore}
            today={today}
            todayKey={todayKey}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            getRecord={getRecord}
            toggleDone={toggleDone}
            setCount={setCount}
          />
        )}
        {view === "graph" && (
          <GraphView
            graphHabit={graphHabit}
            setGraphHabit={setGraphHabit}
            graphData={graphData}
            records={records}
            today={today}
          />
        )}
      </main>
    </div>
  );
}

// ===================== Today =====================
function TodayView({ todayKey, getRecord, toggleDone, setCount }) {
  const rec = getRecord(todayKey);

  return (
    <div>
      <p style={styles.hint}>各項目のチェックと達成数を入力してください</p>
      {HABITS.map((habit, i) => (
        <HabitRow
          key={habit.id}
          habit={habit}
          item={rec[habit.id] || { done: false, count: 0 }}
          onToggle={() => toggleDone(todayKey, habit.id)}
          onDelta={(d) => setCount(todayKey, habit.id, d)}
          animDelay={i * 0.06}
        />
      ))}
      <TodaySummary rec={rec} />
    </div>
  );
}

function HabitRow({ habit, item, onToggle, onDelta, animDelay = 0 }) {
  return (
    <div style={{
      ...styles.habitRow,
      background:   item.done ? `${habit.color}18` : "rgba(255,255,255,0.7)",
      border:       `1.5px solid ${item.done ? habit.color : "rgba(44,33,22,0.12)"}`,
      animation:    `fadeUp 0.3s ease ${animDelay}s both`,
    }}>
      {/* Checkbox */}
      <button onClick={onToggle} style={{
        ...styles.check,
        border:     `2px solid ${item.done ? habit.color : "rgba(44,33,22,0.25)"}`,
        background: item.done ? habit.color : "transparent",
      }}>
        {item.done && <span style={{ color: "#fff", fontSize: 13 }}>✓</span>}
      </button>

      {/* Label */}
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 16 }}>{habit.icon}</span>{" "}
        <span style={{ fontSize: 14, fontWeight: item.done ? 700 : 400 }}>{habit.label}</span>
      </div>

      {/* Counter */}
      <div style={styles.counter}>
        <CountBtn onClick={() => onDelta(-1)}>−</CountBtn>
        <span style={{ width: 32, textAlign: "center", fontSize: 18, fontWeight: 700, color: item.count > 0 ? habit.color : "#aaa" }}>
          {item.count || 0}
        </span>
        <CountBtn onClick={() => onDelta(1)}>＋</CountBtn>
      </div>
    </div>
  );
}

function CountBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={styles.countBtn}>{children}</button>
  );
}

function TodaySummary({ rec }) {
  const done  = HABITS.filter(h => rec[h.id]?.done).length;
  const total = HABITS.reduce((s, h) => s + (rec[h.id]?.count || 0), 0);
  const pct   = Math.round((done / HABITS.length) * 100);

  return (
    <div style={styles.summary}>
      <div style={styles.summaryLabel}>TODAY'S PROGRESS</div>
      <div style={styles.summaryRow}>
        <StatBlock value={`${done}/6`} label="達成項目" color={done === 6 ? "#6B9E8A" : "#2C2116"} />
        <div style={styles.divider} />
        <StatBlock value={total}       label="合計本数"  color="#5A7EC4" />
        <div style={styles.divider} />
        <StatBlock value={`${pct}%`}   label="達成率"    color={pct === 100 ? "#C4875A" : "#2C2116"} />
      </div>
      {done === 6 && <div style={styles.allDone}>🎉 全項目達成！素晴らしい！</div>}
    </div>
  );
}

function StatBlock({ value, label, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: "#8B7355", fontFamily: "sans-serif" }}>{label}</div>
    </div>
  );
}

// ===================== Calendar =====================
function CalendarView({ calMonth, setCalMonth, records, dayScore, today, todayKey, selectedDay, setSelectedDay, getRecord, toggleDone, setCount }) {
  const { year, month } = calMonth;
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDayOfMonth(year, month);

  const prev = () => {
    setCalMonth(p => p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 });
    setSelectedDay(null);
  };
  const next = () => {
    setCalMonth(p => p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 });
    setSelectedDay(null);
  };

  const scoreColor = (score) => {
    if (score === 0)    return "transparent";
    if (score < 0.4)   return "rgba(196,135,90,0.3)";
    if (score < 0.8)   return "rgba(107,158,138,0.4)";
    return "rgba(107,158,138,0.85)";
  };

  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div>
      {/* Month nav */}
      <div style={styles.monthNav}>
        <button onClick={prev} style={styles.arrowBtn}>‹</button>
        <span style={{ fontSize: 16, fontWeight: 700 }}>{year}年{month + 1}月</span>
        <button onClick={next} style={styles.arrowBtn}>›</button>
      </div>

      {/* Weekday header */}
      <div style={styles.calGrid}>
        {["日","月","火","水","木","金","土"].map((d, i) => (
          <div key={d} style={{ textAlign: "center", fontSize: 11, fontFamily: "sans-serif", padding: "4px 0",
            color: i === 0 ? "#C45A5A" : i === 6 ? "#5A7EC4" : "#8B7355" }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ ...styles.calGrid, gap: 3 }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />;
          const key      = `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const score    = dayScore(key);
          const isToday  = key === todayKey;
          const isSel    = key === selectedDay;
          const doneCount = HABITS.filter(h => (records[key] || {})[h.id]?.done).length;

          return (
            <button key={key} onClick={() => setSelectedDay(isSel ? null : key)} style={{
              aspectRatio: "1", borderRadius: 8, cursor: "pointer",
              border:      isSel ? "2px solid #6B9E8A" : isToday ? "2px solid #C4875A" : "1.5px solid rgba(44,33,22,0.1)",
              background:  scoreColor(score),
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
              transition:  "all 0.15s",
            }}>
              <span style={{ fontSize: 13, fontWeight: isToday ? 700 : 400,
                color: isToday ? "#C4875A" : idx % 7 === 0 ? "#C45A5A" : "#2C2116" }}>{day}</span>
              {doneCount > 0 && (
                <span style={{ fontSize: 9, fontFamily: "sans-serif", fontWeight: 700,
                  color: score >= 0.8 ? "#fff" : "#6B9E8A" }}>{doneCount}/6</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 12, fontFamily: "sans-serif", fontSize: 10, color: "#8B7355" }}>
        {[["未記録","transparent"],["一部達成","rgba(196,135,90,0.3)"],["半分以上","rgba(107,158,138,0.4)"],["ほぼ完璧","rgba(107,158,138,0.85)"]].map(([lbl, bg]) => (
          <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: bg, border: "1px solid rgba(44,33,22,0.15)" }} />
            {lbl}
          </div>
        ))}
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div style={{ marginTop: 20, animation: "fadeUp 0.2s ease both" }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, textAlign: "center", color: "#8B7355" }}>
            {selectedDay.replace(/-/g, "/")} の記録
          </div>
          {HABITS.map(habit => (
            <HabitRow
              key={habit.id}
              habit={habit}
              item={getRecord(selectedDay)[habit.id] || { done: false, count: 0 }}
              onToggle={() => toggleDone(selectedDay, habit.id)}
              onDelta={(d) => setCount(selectedDay, habit.id, d)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ===================== Graph =====================
function GraphView({ graphHabit, setGraphHabit, graphData, records, today }) {
  const data  = graphData(graphHabit);
  const habit = HABITS.find(h => h.id === graphHabit);
  const maxCount = Math.max(...data.map(d => d.count), 1);

  const showLabel = (i) => i === 0 || i === 29 || i % 7 === 0;

  const calcStreak = () => {
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = toDateKey(d);
      if ((records[key] || {})[graphHabit]?.done) streak++;
      else break;
    }
    return streak;
  };

  const streak     = calcStreak();
  const totalDone  = data.filter(d => d.count > 0).length;
  const totalCount = data.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      {/* Habit selector */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 20 }}>
        {HABITS.map(h => (
          <button key={h.id} onClick={() => setGraphHabit(h.id)} style={{
            padding: "5px 12px", borderRadius: 16, fontSize: 12, cursor: "pointer", fontFamily: "sans-serif",
            border:      `1.5px solid ${h.color}`,
            background:  graphHabit === h.id ? h.color : "transparent",
            color:       graphHabit === h.id ? "#fff" : h.color,
            transition:  "all 0.2s",
          }}>{h.icon} {h.label}</button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[["🔥","継続streak",`${streak}日`],["✅","30日達成",`${totalDone}日`],["📚","合計本数",`${totalCount}`]].map(([icon, lbl, val]) => (
          <div key={lbl} style={{ flex: 1, background: "rgba(255,255,255,0.7)", border: `1.5px solid ${habit.color}40`, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 16 }}>{icon}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: habit.color }}>{val}</div>
            <div style={{ fontSize: 10, color: "#8B7355", fontFamily: "sans-serif" }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ background: "rgba(255,255,255,0.6)", border: "1.5px solid rgba(44,33,22,0.12)", borderRadius: 12, padding: "16px 12px 8px" }}>
        <div style={{ fontSize: 11, color: "#8B7355", fontFamily: "sans-serif", marginBottom: 12, textAlign: "center", letterSpacing: "0.1em" }}>
          過去30日間の達成数
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 120, position: "relative" }}>
          {[0.25,0.5,0.75,1].map(r => (
            <div key={r} style={{ position: "absolute", left: 0, right: 0, bottom: r * 120, borderTop: "1px dashed rgba(44,33,22,0.08)" }} />
          ))}
          {data.map((d, i) => {
            const isMax = d.count === Math.max(...data.map(x => x.count)) && d.count > 0;
            return (
              <div key={d.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{
                  width: "100%",
                  height: d.count > 0 ? (d.count / maxCount) * 112 + 4 : 0,
                  background: d.count > 0 ? `linear-gradient(to top, ${habit.color}, ${habit.color}aa)` : "rgba(44,33,22,0.06)",
                  borderRadius: "3px 3px 0 0",
                  position: "relative",
                  minHeight: d.count > 0 ? 4 : 0,
                }}>
                  {isMax && (
                    <div style={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: habit.color, fontFamily: "sans-serif", fontWeight: 700, whiteSpace: "nowrap" }}>
                      {d.count}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 2, marginTop: 4 }}>
          {data.map((d, i) => (
            <div key={d.key} style={{ flex: 1, textAlign: "center", fontSize: 8, color: "#8B7355", fontFamily: "sans-serif" }}>
              {showLabel(i) ? d.label : ""}
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap */}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 11, color: "#8B7355", fontFamily: "sans-serif", marginBottom: 10, textAlign: "center", letterSpacing: "0.1em" }}>
          全項目 達成マップ（過去30日）
        </div>
        {HABITS.map(h => (
          <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <div style={{ fontSize: 14, width: 20, textAlign: "center", flexShrink: 0 }}>{h.icon}</div>
            <div style={{ display: "flex", gap: 2, flex: 1 }}>
              {graphData(h.id).map(d => (
                <div key={d.key} title={`${d.label}: ${d.count}`} style={{
                  flex: 1, height: 14, borderRadius: 2,
                  background: d.count > 0 ? h.color : "rgba(44,33,22,0.08)",
                  opacity: d.count > 0 ? Math.min(0.4 + d.count * 0.2, 1) : 1,
                }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== Styles =====================
const styles = {
  page: {
    minHeight: "100vh",
    background: "#F5F0E8",
    backgroundImage: `
      radial-gradient(ellipse at 20% 80%, rgba(139,115,85,0.08) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 20%, rgba(107,158,138,0.08) 0%, transparent 50%)
    `,
  },
  header: {
    padding: "28px 24px 20px",
    textAlign: "center",
    borderBottom: "1.5px solid rgba(44,33,22,0.12)",
  },
  eyebrow: {
    fontSize: 11, letterSpacing: "0.25em", color: "#8B7355",
    marginBottom: 4, fontFamily: "sans-serif",
  },
  h1: { margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "0.08em" },
  dateStr: { fontSize: 12, color: "#8B7355", marginTop: 6 },
  nav: { display: "flex", justifyContent: "center", gap: 6, marginTop: 16 },
  navBtn: {
    padding: "6px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer",
    border: "1.5px solid rgba(44,33,22,0.2)", background: "transparent",
    color: "#2C2116", fontFamily: "sans-serif", transition: "all 0.2s",
  },
  navBtnActive: {
    border: "1.5px solid #6B9E8A", background: "#6B9E8A", color: "#fff",
  },
  main: { maxWidth: 480, margin: "0 auto", padding: "24px 16px 48px" },
  hint: { fontSize: 13, color: "#8B7355", marginBottom: 16, textAlign: "center", fontFamily: "sans-serif" },
  habitRow: {
    borderRadius: 12, padding: "14px 16px", marginBottom: 10,
    display: "flex", alignItems: "center", gap: 12, transition: "all 0.25s",
  },
  check: {
    width: 28, height: 28, borderRadius: "50%", cursor: "pointer",
    flexShrink: 0, transition: "all 0.2s",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  counter: { display: "flex", alignItems: "center", gap: 6, flexShrink: 0 },
  countBtn: {
    width: 26, height: 26, borderRadius: "50%", cursor: "pointer", fontSize: 15,
    border: "1.5px solid rgba(44,33,22,0.2)", background: "rgba(255,255,255,0.8)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  summary: {
    marginTop: 20, background: "rgba(255,255,255,0.6)",
    border: "1.5px solid rgba(44,33,22,0.12)", borderRadius: 12, padding: "16px 20px", textAlign: "center",
  },
  summaryLabel: { fontSize: 12, letterSpacing: "0.15em", color: "#8B7355", fontFamily: "sans-serif", marginBottom: 8 },
  summaryRow: { display: "flex", justifyContent: "center", gap: 28 },
  divider: { width: 1, background: "rgba(44,33,22,0.12)" },
  allDone: { marginTop: 12, fontSize: 13, color: "#6B9E8A", fontWeight: 700 },
  monthNav: { display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 16 },
  arrowBtn: { background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#8B7355" },
  calGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 },
};
