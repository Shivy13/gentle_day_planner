import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Printer } from "lucide-react";

type Goal = { text: string; complete: boolean };
type MonthData = {
  goals: Goal[];
  importantDates: string;
  mantra: string;
  notes: Record<string, string>;
  reflections: boolean[];
};
type StoredMonths = Record<string, MonthData>;
type IndianHoliday = {
  key: string;
  name: string;
};

const STORAGE_KEY = "a-gentle-month:planner:v1";
const MONTHS = Array.from({ length: 12 }, (_, index) =>
  new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date(2020, index, 1)),
);
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const REFLECTIONS = ["I made room for what mattered", "I noticed a small beautiful thing", "I can carry one kindness forward"];
const INDIAN_HOLIDAYS: IndianHoliday[] = [
  { key: "-01-26", name: "Republic Day" },
  { key: "-08-15", name: "Independence Day" },
  { key: "-10-02", name: "Gandhi Jayanti" },
  { key: "2026-02-15", name: "Maha Shivaratri" },
  { key: "2026-03-04", name: "Holi" },
  { key: "2026-03-20", name: "Eid al-Fitr" },
  { key: "2026-04-02", name: "Mahavir Jayanti" },
  { key: "2026-04-03", name: "Good Friday" },
  { key: "2026-05-01", name: "Buddha Purnima" },
  { key: "2026-05-27", name: "Eid al-Adha" },
  { key: "2026-06-26", name: "Muharram" },
  { key: "2026-09-04", name: "Janmashtami" },
  { key: "2026-09-14", name: "Ganesh Chaturthi" },
  { key: "2026-10-20", name: "Dussehra" },
  { key: "2026-11-08", name: "Diwali" },
  { key: "2026-11-24", name: "Guru Nanak Jayanti" },
  { key: "2026-12-25", name: "Christmas Day" },
];
const defaultData = (): MonthData => ({
  goals: [
    { text: "", complete: false },
    { text: "", complete: false },
    { text: "", complete: false },
  ],
  importantDates: "",
  mantra: "Let it be enough.",
  notes: {},
  reflections: REFLECTIONS.map(() => false),
});

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function holidayForDate(key: string) {
  const fixedMatch = INDIAN_HOLIDAYS.find((holiday) => holiday.key === key.slice(4));
  return fixedMatch ?? INDIAN_HOLIDAYS.find((holiday) => holiday.key === key);
}

function readStorage(): StoredMonths {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) as StoredMonths : {};
  } catch {
    return {};
  }
}

function formatSelectedDate(key: string) {
  const date = new Date(`${key}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(date);
}

function App() {
  const now = new Date();
  const [viewDate, setViewDate] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [data, setData] = useState<MonthData>(() => readStorage()[monthKey(new Date(now.getFullYear(), now.getMonth(), 1))] ?? defaultData());
  const [selectedKey, setSelectedKey] = useState(() => dateKey(now.getFullYear(), now.getMonth(), now.getDate()));
  const [dayDraft, setDayDraft] = useState("");
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");

  useEffect(() => {
    document.title = "A Gentle Month — Personal Monthly Planner";
    let description = document.querySelector('meta[name="description"]');
    if (!description) {
      description = document.createElement("meta");
      description.setAttribute("name", "description");
      document.head.appendChild(description);
    }
    description.setAttribute("content", "A calm, editable monthly planning ritual for noticing the shape of your days.");
  }, []);

  const key = monthKey(viewDate);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(viewDate);
  const todayKey = dateKey(now.getFullYear(), now.getMonth(), now.getDate());

  const calendarCells = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPreviousMonth = new Date(year, month, 0).getDate();
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const total = Math.ceil((mondayOffset + daysInMonth) / 7) * 7;
    return Array.from({ length: total }, (_, index) => {
      const dateNumber = index - mondayOffset + 1;
      if (dateNumber < 1) {
        const day = daysInPreviousMonth + dateNumber;
        return { day, key: dateKey(year, month - 1, day), muted: true };
      }
      if (dateNumber > daysInMonth) {
        const day = dateNumber - daysInMonth;
        return { day, key: dateKey(year, month + 1, day), muted: true };
      }
      return { day: dateNumber, key: dateKey(year, month, dateNumber), muted: false };
    });
  }, [month, year]);
  const selectedHoliday = holidayForDate(selectedKey);

  useEffect(() => {
    const stored = readStorage()[key];
    const next = stored ?? defaultData();
    setData(next);
    const fallback = `${key}-01`;
    setSelectedKey(next.notes[selectedKey] !== undefined && selectedKey.startsWith(key) ? selectedKey : fallback);
    setDayDraft(next.notes[selectedKey] !== undefined && selectedKey.startsWith(key) ? next.notes[selectedKey] : (next.notes[fallback] ?? ""));
    setSaveState("saved");
  }, [key]);

  useEffect(() => {
    setDayDraft(data.notes[selectedKey] ?? "");
  }, [data.notes, selectedKey]);

  const persist = (next: MonthData) => {
    setData(next);
    setSaveState("saving");
    const stored = readStorage();
    stored[key] = next;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    window.setTimeout(() => setSaveState("saved"), 350);
  };

  const updateGoal = (index: number, changes: Partial<Goal>) => {
    const goals = data.goals.map((goal, goalIndex) => goalIndex === index ? { ...goal, ...changes } : goal);
    persist({ ...data, goals });
  };

  const selectDay = (dayKey: string) => {
    setSelectedKey(dayKey);
    setDayDraft(data.notes[dayKey] ?? "");
  };

  const saveDayNote = () => {
    const notes = { ...data.notes };
    if (dayDraft.trim()) notes[selectedKey] = dayDraft;
    else delete notes[selectedKey];
    persist({ ...data, notes });
  };

  const changeMonth = (amount: number) => {
    setViewDate(new Date(year, month + amount, 1));
  };

  const resetMonth = () => {
    if (!window.confirm(`Clear everything written for ${monthLabel}? This cannot be undone.`)) return;
    const cleared = defaultData();
    persist(cleared);
    setSelectedKey(`${key}-01`);
    setDayDraft("");
  };

  const handleMonthInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const [nextYear, nextMonth] = event.target.value.split("-").map(Number);
    if (nextYear && nextMonth) setViewDate(new Date(nextYear, nextMonth - 1, 1));
  };

  return (
    <main className="planner-stage">
      <div className="workspace-chrome" aria-label="Planner controls">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">a</span>
          <span>A Gentle Month</span>
        </div>
        <div className="chrome-actions">
          <span className="status-cue" role="status" data-testid="status-save">
            <span className={`status-dot ${saveState === "saving" ? "is-saving" : ""}`} aria-hidden="true" />
            {saveState === "saving" ? "Saving locally" : "Saved locally"}
          </span>
          <button className="print-button" type="button" onClick={() => window.print()} data-testid="button-print">
            <Printer size={13} strokeWidth={1.5} aria-hidden="true" /> Print
          </button>
        </div>
      </div>

      <section className="planner-page" aria-label={`${monthLabel} planner`}>
        <div className="page-top">
          <header>
            <div className="eyebrow">A wider view</div>
            <h1 className="page-title">The<br />month</h1>
            <p className="subtitle">Notice the shape of your days.</p>
            <hr className="rule" />
          </header>
          <div className="month-control">
            <label htmlFor="month-picker">Choose month</label>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button className="clear-note-button" type="button" onClick={() => changeMonth(-1)} aria-label="Previous month" data-testid="button-previous-month">
                <ChevronLeft size={14} aria-hidden="true" />
              </button>
              <input id="month-picker" className="month-input" type="month" value={key} onChange={handleMonthInput} data-testid="input-month" />
              <button className="clear-note-button" type="button" onClick={() => changeMonth(1)} aria-label="Next month" data-testid="button-next-month">
                <ChevronRight size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div className="writing-grid">
          <section>
            <h2 className="section-label">Goals</h2>
            <div className="goal-card">
              {data.goals.map((goal, index) => (
                <label className="goal-row" key={index}>
                  <input
                    className="goal-check"
                    type="checkbox"
                    checked={goal.complete}
                    onChange={(event) => updateGoal(index, { complete: event.target.checked })}
                    aria-label={`Mark goal ${index + 1} complete`}
                    data-testid={`checkbox-goal-${index + 1}`}
                  />
                  <input
                    className="line-input"
                    value={goal.text}
                    onChange={(event) => updateGoal(index, { text: event.target.value })}
                    placeholder={["A steady practice", "Something to look forward to", "A place to soften"][index]}
                    aria-label={`Goal ${index + 1}`}
                    data-testid={`input-goal-${index + 1}`}
                  />
                </label>
              ))}
            </div>
          </section>
          <section>
            <h2 className="section-label">Important dates</h2>
            <textarea className="lined-area" value={data.importantDates} onChange={(event) => persist({ ...data, importantDates: event.target.value })} placeholder="Appointments, birthdays, beginnings..." aria-label="Important dates" data-testid="textarea-important-dates" />
          </section>
          <section>
            <h2 className="section-label">Monthly mantra</h2>
            <div className="mantra-box">
              <input className="mantra-input" value={data.mantra} onChange={(event) => persist({ ...data, mantra: event.target.value })} placeholder="A phrase to return to..." aria-label="Monthly mantra" data-testid="input-monthly-mantra" />
            </div>
          </section>
        </div>

        <section aria-labelledby="calendar-title">
          <div className="calendar-heading">
            <h2 className="section-label" id="calendar-title">The calendar</h2>
            <span className="calendar-hint">Indian holidays are marked · select a day to leave a note</span>
          </div>
          <div className="month-grid" role="grid" aria-label={`${monthLabel} calendar`}>
            {WEEKDAYS.map((day) => <div className="weekday" role="columnheader" key={day}>{day}</div>)}
            {calendarCells.map((cell) => (
              <div className={`day-cell ${cell.muted ? "is-muted" : ""} ${selectedKey === cell.key ? "is-selected" : ""} ${todayKey === cell.key ? "is-today" : ""}`} role="gridcell" key={cell.key}>
                <button className="day-cell-button" type="button" onClick={() => selectDay(cell.key)} aria-label={`${formatSelectedDate(cell.key)}${holidayForDate(cell.key) ? `, ${holidayForDate(cell.key)?.name}` : ""}${cell.muted ? " (outside selected month)" : ""}`} aria-pressed={selectedKey === cell.key} data-testid={`button-day-${cell.key}`}>
                  <span className="date-number">{cell.day}</span>
                  {holidayForDate(cell.key) && <span className="holiday-label">{holidayForDate(cell.key)?.name}</span>}
                  {data.notes[cell.key] && <span className="day-preview">{data.notes[cell.key]}</span>}
                  {data.notes[cell.key] && <span className="note-mark" aria-label="Has note" />}
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="lower-grid">
          <section className="selected-panel" aria-labelledby="selected-day-title">
            <h2 className="section-label" id="selected-day-title">A note for the day</h2>
            <p className="selected-date" data-testid="text-selected-date">{formatSelectedDate(selectedKey)}</p>
            {selectedHoliday && <p className="selected-holiday"><span>India holiday</span>{selectedHoliday.name}</p>}
            <textarea className="day-note" value={dayDraft} onChange={(event) => setDayDraft(event.target.value)} placeholder="What would you like to remember?" aria-label={`Note for ${formatSelectedDate(selectedKey)}`} data-testid="textarea-day-note" />
            <div className="panel-actions">
              <span className="calendar-hint">Your notes stay on this device.</span>
              <div style={{ display: "flex", gap: 7 }}>
                <button className="clear-note-button" type="button" onClick={() => {
                  setDayDraft("");
                  const notes = { ...data.notes };
                  delete notes[selectedKey];
                  persist({ ...data, notes });
                }} data-testid="button-clear-day-note">Clear</button>
                <button className="save-note-button" type="button" onClick={saveDayNote} data-testid="button-save-day-note">Save note</button>
              </div>
            </div>
          </section>
          <section className="reflection-panel" aria-labelledby="reflection-title">
            <h2 className="section-label" id="reflection-title">A little reflection</h2>
            <div className="reflection-list">
              {REFLECTIONS.map((reflection, index) => (
                <label className="reflection-row" key={reflection}>
                  <input className="reflection-check" type="checkbox" checked={data.reflections[index]} onChange={(event) => {
                    const reflections = [...data.reflections];
                    reflections[index] = event.target.checked;
                    persist({ ...data, reflections });
                  }} aria-label={reflection} data-testid={`checkbox-reflection-${index + 1}`} />
                  <span>{reflection}</span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <div className="reset-row">
          <span>Begin again whenever you need to.</span>
          <button className="reset-button" type="button" onClick={resetMonth} data-testid="button-reset-month">Reset this month</button>
        </div>
        <footer className="planner-footer">
          <span>A gentle day · personal planner</span>
          <strong>MONTH</strong>
        </footer>

        <svg className="butterfly" viewBox="0 0 40 32" aria-hidden="true">
          <path d="M20 15C13 3 2 1 4 10c1 5 7 8 14 7M20 15c7-12 18-14 16-5-1 5-7 8-14 7M20 14v14M16 29h8" />
        </svg>
        <svg className="botanical" viewBox="0 0 220 170" aria-hidden="true">
          <path d="M20 164C76 132 86 79 106 12M74 139c-6-28 4-47 31-55M51 148c-22-8-31-22-28-42M91 101c19-12 36-11 51 1M103 75c-9-20-5-36 10-49M61 125c-20-3-32-13-38-29" />
          <ellipse className="petal" cx="31" cy="103" rx="13" ry="22" transform="rotate(-28 31 103)" />
          <ellipse className="petal" cx="51" cy="123" rx="12" ry="20" transform="rotate(-65 51 123)" />
          <ellipse className="petal" cx="140" cy="102" rx="12" ry="22" transform="rotate(72 140 102)" />
          <ellipse className="petal" cx="114" cy="29" rx="11" ry="19" transform="rotate(33 114 29)" />
        </svg>
      </section>
    </main>
  );
}

export default App;