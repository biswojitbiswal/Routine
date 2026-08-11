"use client";

import { useEffect, useMemo, useState } from "react";
import { Brain, Briefcase, CalendarDays, Check, ChefHat, ChevronLeft, ChevronRight, Code2, Coffee, Dumbbell, Heart, LogOut, Music, PersonStanding, Plus, Star, Utensils, X } from "lucide-react";

const palette = ["#168d2a", "#1266c5", "#f57c00", "#6d28c9", "#008b8b", "#d62970", "#d9463e", "#5865f2", "#0f766e", "#a16207"];
const icons = { walk: PersonStanding, exercise: Dumbbell, breakfast: Utensils, study: Brain, code: Code2, cook: ChefHat, health: Heart, coffee: Coffee, music: Music, work: Briefcase, star: Star };
const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

function RoutineIcon({ name, size = 21 }) {
  const Icon = icons[name] || Star;
  return <Icon size={size} strokeWidth={2.4} />;
}

export default function Dashboard() {
  const today = new Date();
  const [month, setMonth] = useState(today.toISOString().slice(0, 7));
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [color, setColor] = useState(palette[0]);
  const [icon, setIcon] = useState("star");
  const [year, monthNumber] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNumber, 0).getDate();

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    fetch("/api/dashboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month }),
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data) => setTasks(data.tasks || []))
      .catch((error) => { if (error.name !== "AbortError") console.error(error); })
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  }, [month]);

  const dates = Array.from({ length: daysInMonth }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`);
  const tasksByDate = useMemo(() => Object.groupBy(tasks, (task) => task.date), [tasks]);
  const routines = useMemo(() => [...new Map(tasks.filter((task) => task.templateId).map((task) => [task.templateId, { id: task.templateId, title: task.title, color: task.color, icon: task.icon }])).values()], [tasks]);

  function changeMonth(offset) {
    setMonth(new Date(year, monthNumber - 1 + offset, 1).toISOString().slice(0, 7));
  }

  function goToCurrentMonth() {
    setMonth(new Date().toISOString().slice(0, 7));
  }

  async function updateTask(url, body) {
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const response = await fetch("/api/dashboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ month }) });
    const data = await response.json();
    setTasks(data.tasks || []);
  }

  async function addRoutine(event) {
    event.preventDefault();
    await updateTask("/api/templates", { title, color, icon, frequency });
    setTitle("");
    setModalOpen(false);
  }

  async function logout() {
    await fetch("/api/auth/signout", { method: "POST" });
    location.href = "/signin";
  }

  return <main className="schedule-page">
    <div className="schedule-card">
      <header className="schedule-header">
        <h1>Daily Schedule Routine Track</h1>
        <button className="logout-button" onClick={logout}><LogOut size={17} />Logout</button>
      </header>
      <nav className="schedule-nav" aria-label="Month navigation">
        <button onClick={() => changeMonth(-1)} disabled={isLoading}><ChevronLeft />Previous</button>
        <button className="current-month" onClick={goToCurrentMonth} disabled={isLoading}><CalendarDays size={20} />{monthFormatter.format(new Date(year, monthNumber - 1, 1))}</button>
        <button onClick={() => changeMonth(1)} disabled={isLoading}>Next<ChevronRight /></button>
        <button className="add-routine" aria-label="Add routine" onClick={() => setModalOpen(true)}><Plus size={21} /></button>
      </nav>
      <div className={`tracker-wrap ${isLoading ? "is-loading" : ""}`}>
        <section className="tracker" style={{ gridTemplateColumns: `188px repeat(${Math.max(routines.length, 1)}, minmax(155px, 1fr))` }}>
          <div className="tracker-head date-head"><CalendarDays size={18} />Date</div>
          {routines.length ? routines.map((routine) => <div className="tracker-head routine-head" style={{ "--routine": routine.color }} key={routine.id}><RoutineIcon name={routine.icon} /><span>{routine.title}</span></div>) : <div className="tracker-head routine-head">Add your first routine</div>}
          {dates.map((date) => <div className="grid-row" key={date}>
            <div className="date-cell">{new Date(date + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" })}</div>
            {routines.length ? routines.map((routine) => {
              const task = (tasksByDate[date] || []).find((item) => item.templateId === routine.id);
              return <div className="routine-cell" style={{ "--routine": routine.color }} key={routine.id}>{task && <button className={`schedule-check ${task.completed ? "done" : ""}`} onClick={() => updateTask(`/api/tasks/${task._id}`, { action: "toggle", completed: !task.completed })}>{task.completed && <Check />}</button>}</div>;
            }) : <div className="routine-cell" />}
          </div>)}
          <div className="progress-label"><b>Monthly Progress</b><span>(Checked Days / {daysInMonth})</span></div>
          {routines.length ? routines.map((routine) => {
            const total = tasks.filter((task) => task.templateId === routine.id).length;
            const complete = tasks.filter((task) => task.templateId === routine.id && task.completed).length;
            const percent = total ? Math.round((complete / total) * 100) : 0;
            return <div className="progress-cell" style={{ "--routine": routine.color }} key={routine.id}><div><b>{percent}%</b><span>{complete} / {total}</span></div><svg viewBox="0 0 42 42"><circle className="track" cx="21" cy="21" r="16" /><circle className="meter" cx="21" cy="21" r="16" pathLength="100" strokeDasharray={`${percent} 100`} /></svg></div>;
          }) : <div className="progress-cell">0%</div>}
        </section>
      </div>
    </div>
    {modalOpen && <div className="overlay"><form className="routine-modal" onSubmit={addRoutine}><button type="button" className="close" onClick={() => setModalOpen(false)}><X /></button><h2>Add routine</h2><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Routine name" required /><div className="modal-section"><label>Repeat</label><div className="choice">{["daily", "weekly", "monthly", "yearly"].map((option) => <button type="button" onClick={() => setFrequency(option)} className={frequency === option ? "selected" : ""} key={option}>{option}</button>)}</div></div><div className="modal-section"><label>Colour</label><div className="palette">{palette.map((option) => <button type="button" onClick={() => setColor(option)} style={{ background: option }} className={color === option ? "selected" : ""} key={option} />)}</div></div><div className="modal-section"><label>Icon</label><div className="icon-picker">{Object.keys(icons).map((option) => <button type="button" onClick={() => setIcon(option)} className={icon === option ? "selected" : ""} key={option}><RoutineIcon name={option} size={19} /></button>)}</div></div><button className="save-routine">Add routine <Plus size={18} /></button></form></div>}
  </main>;
}
