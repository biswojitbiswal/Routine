"use client";

import { useEffect, useMemo, useState } from "react";
import { Brain, Briefcase, CalendarDays, Check, ChefHat, ChevronLeft, ChevronRight, Code2, Coffee, Dumbbell, Heart, LogOut, Music, Pencil, PersonStanding, Plus, Star, Trash2, Utensils, X } from "lucide-react";

const palette = ["#168d2a", "#1266c5", "#f57c00", "#6d28c9", "#008b8b", "#d62970", "#d9463e", "#5865f2", "#0f766e", "#a16207"];
const icons = { walk: PersonStanding, exercise: Dumbbell, breakfast: Utensils, study: Brain, code: Code2, cook: ChefHat, health: Heart, coffee: Coffee, music: Music, work: Briefcase, star: Star };
const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const localMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };

function RoutineIcon({ name, size = 21 }) { const Icon = icons[name] || Star; return <Icon size={size} strokeWidth={2.4} />; }

export default function Dashboard() {
  const [month, setMonth] = useState(localMonth);
  const [tasks, setTasks] = useState([]);
  const [planned, setPlanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [color, setColor] = useState(palette[0]);
  const [icon, setIcon] = useState("star");
  const [weekdays, setWeekdays] = useState([]);
  const [day, setDay] = useState(1);
  const [targetDate, setTargetDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [year, monthNumber] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const canEdit = month >= localMonth();
  console.log(day);
  

  async function loadMonth(signal) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/dashboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ month }), signal });
      const data = await response.json();
      setTasks(data.tasks || []);
      setPlanned(Boolean(data.planned));
    } catch (error) { if (error.name !== "AbortError") console.error(error); }
    finally { setIsLoading(false); }
  }
  useEffect(() => { const controller = new AbortController(); loadMonth(controller.signal); return () => controller.abort(); }, [month]);

  const dates = Array.from({ length: daysInMonth }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`);
  const tasksByDate = useMemo(() => Object.groupBy(tasks, task => task.date), [tasks]);
  const routines = useMemo(() => [...new Map(tasks.filter(task => task.templateId).map(task => [task.templateId, { id: task.templateId, title: task.title, color: task.color, icon: task.icon, frequency: task.frequency || "daily", weekdays: task.weekdays || [], day: task.day || 1, targetDate: task.targetDate || "", startDate: task.startDate || "", endDate: task.endDate || "", createdAt: task.templateCreatedAt || task.createdAt }])).values()].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt) || a.id.localeCompare(b.id)), [tasks]);

  function changeMonth(offset) { const target = new Date(Date.UTC(year, monthNumber - 1 + offset, 1)); setMonth(`${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, "0")}`); }
  function resetForm(routine = null) {
    setEditing(routine); setTitle(routine?.title || ""); setFrequency(routine?.frequency || "daily"); setColor(routine?.color || palette[0]); setIcon(routine?.icon || "star"); setWeekdays(routine?.weekdays || []); setDay(routine?.day || 1); setTargetDate(routine?.targetDate || ""); setStartDate(routine?.startDate || ""); setEndDate(routine?.endDate || ""); setModalOpen(true);
  }
  async function request(url, body) {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Something went wrong.");
    await loadMonth();
  }
  async function createPlan() { try { await request("/api/plans", { month }); } catch (error) { alert(error.message); } }
  async function updateTask(url, body) { try { await request(url, body); } catch (error) { alert(error.message); } }
  async function saveRoutine(event) {
    event.preventDefault();
    const body = { month, title, color, icon, frequency, weekdays, day, targetDate, startDate, endDate };
    try { await request(editing ? `/api/templates/${editing.id}` : "/api/templates", body); setModalOpen(false); } catch (error) { alert(error.message); }
  }
  async function removeRoutine(action) {
    if (!removeTarget) return;
    try { await request(`/api/templates/${removeTarget.id}`, { month, action }); setRemoveTarget(null); } catch (error) { alert(error.message); }
  }
  async function logout() { await fetch("/api/auth/signout", { method: "POST" }); location.href = "/signin"; }
  const toggleWeekday = value => setWeekdays(current => current.includes(value) ? current.filter(dayValue => dayValue !== value) : [...current, value]);

  return <main className="schedule-page"><div className="schedule-card">
    <header className="schedule-header"><h1>Daily Schedule Routine Track</h1><button className="logout-button" onClick={logout}><LogOut size={17} />Logout</button></header>
    <nav className="schedule-nav" aria-label="Month navigation"><button className="previous-month" onClick={() => changeMonth(-1)} disabled={isLoading}><ChevronLeft />Previous</button><button className="current-month" onClick={() => setMonth(localMonth())} disabled={isLoading}><CalendarDays size={20} />{monthFormatter.format(new Date(year, monthNumber - 1, 1))}</button><button className="next-month" onClick={() => changeMonth(1)} disabled={isLoading}>Next<ChevronRight /></button>{canEdit && (planned ? <button className="add-routine" onClick={() => resetForm()}><Plus size={20} />Add routine</button> : <button className="create-plan" onClick={createPlan}><Plus size={19} />Create month plan</button>)}</nav>
    {!planned && <div className="plan-empty"><CalendarDays size={24} /><div><b>{canEdit ? "This month has no plan yet." : "No plan was created for this month."}</b><span>{canEdit ? "Create a plan to copy your active routines, then adjust it as needed." : "Past months remain read-only."}</span></div></div>}
    <div className={`tracker-wrap ${isLoading ? "is-loading" : ""}`}><section className="tracker" style={{ gridTemplateColumns: `var(--date-column) repeat(${Math.max(routines.length, 1)}, minmax(var(--routine-column), 1fr))` }}>
      <div className="tracker-head date-head"><CalendarDays size={18} />Date</div>
      {routines.length ? routines.map(routine => <div className="tracker-head routine-head" style={{ "--routine": routine.color }} key={routine.id}><RoutineIcon name={routine.icon} /><span title={routine.title}>{routine.title}</span>{canEdit && <div className="routine-actions"><button title={`Edit ${routine.title}`} aria-label={`Edit ${routine.title}`} onClick={() => resetForm(routine)}><Pencil size={13} /></button><button title={`Remove ${routine.title}`} aria-label={`Remove ${routine.title}`} onClick={() => setRemoveTarget(routine)}><Trash2 size={13} /></button></div>}</div>) : <div className="tracker-head routine-head">{planned ? "Add your first routine" : "No routines"}</div>}
      {dates.map(date => <div className="grid-row" key={date}><div className="date-cell">{`${date.slice(8, 10)}-${date.slice(5, 7)}-${date.slice(0, 4)}`}</div>{routines.length ? routines.map(routine => { const task = (tasksByDate[date] || []).find(item => item.templateId === routine.id); return <div className="routine-cell" style={{ "--routine": routine.color }} key={routine.id}>{task && <button disabled={!canEdit} className={`schedule-check ${task.completed ? "done" : ""}`} onClick={() => updateTask(`/api/tasks/${task._id}`, { action: "toggle", completed: !task.completed })}>{task.completed && <Check />}</button>}</div>; }) : <div className="routine-cell" />}</div>)}
      <div className="progress-label"><b>Monthly Progress</b><span>(Checked Days / {daysInMonth})</span></div>{routines.length ? routines.map(routine => { const total = tasks.filter(task => task.templateId === routine.id).length, complete = tasks.filter(task => task.templateId === routine.id && task.completed).length, percent = total ? Math.round(complete / total * 100) : 0; return <div className="progress-cell" style={{ "--routine": routine.color }} key={routine.id}><div><b>{percent}%</b><span>{complete} / {total}</span></div><svg viewBox="0 0 42 42"><circle className="track" cx="21" cy="21" r="16" /><circle className="meter" cx="21" cy="21" r="16" pathLength="100" strokeDasharray={`${percent} 100`} /></svg></div>; }) : <div className="progress-cell">0%</div>}
    </section></div>
  </div>
  {modalOpen && <div className="overlay"><form className="routine-modal" onSubmit={saveRoutine}><button type="button" className="close" onClick={() => setModalOpen(false)}><X /></button><h2 className="text-green-700">{editing ? "Edit routine" : "Add routine"}</h2><input autoFocus value={title} onChange={event => setTitle(event.target.value)} placeholder="Routine name" required /><div className="modal-section"><label>Repeat</label><div className="choice">{["daily", "weekly", "date-range", "yearly", "once"].map(option => <button type="button" onClick={() => setFrequency(option)} className={frequency === option ? "selected" : ""} key={option}>{option === "date-range" ? "date range" : option}</button>)}</div></div>{frequency === "weekly" && <div className="modal-section"><label>Days of the week</label><div className="choice">{weekdayLabels.map((label, value) => <button type="button" className={weekdays.includes(value) ? "selected" : ""} onClick={() => toggleWeekday(value)} key={label}>{label}</button>)}</div></div>}{frequency === "once" && <div className="modal-section"><label>Specific date</label><input type="date" value={targetDate} onChange={event => setTargetDate(event.target.value)} required /></div>}<div className="modal-section date-range"><label>{frequency === "date-range" ? "Date range (a task is created every day)" : "Optional date range"}</label><div><input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} required={frequency === "date-range"} /><span>to</span><input type="date" value={endDate} onChange={event => setEndDate(event.target.value)} required={frequency === "date-range"} /></div></div><div className="modal-section"><label>Colour</label><div className="palette">{palette.map(option => <button type="button" onClick={() => setColor(option)} style={{ background: option }} className={color === option ? "selected" : ""} key={option} />)}</div></div><div className="modal-section"><label>Icon</label><div className="icon-picker">{Object.keys(icons).map(option => <button type="button" onClick={() => setIcon(option)} className={icon === option ? "selected" : ""} key={option}><RoutineIcon name={option} size={19} /></button>)}</div></div><button className="save-routine">{editing ? "Save changes" : "Add routine"}<Plus size={18} /></button>{editing && <button type="button" className="remove-month" onClick={() => { setModalOpen(false); setRemoveTarget(editing); }}>Remove from this month</button>}</form></div>}
  {removeTarget && <div className="overlay"><section className="remove-dialog" role="dialog" aria-modal="true" aria-labelledby="remove-title"><button className="close" onClick={() => setRemoveTarget(null)}><X /></button><Trash2 size={27} /><h2 id="remove-title">Remove {removeTarget.title}?</h2><p>Choose how this routine should be removed from <b>{monthFormatter.format(new Date(year, monthNumber - 1, 1))}</b>.</p><button className="stop-routine" onClick={() => removeRoutine("stop")}>Stop from today <span>Keep completed days</span></button><button className="remove-month" onClick={() => removeRoutine("remove-month")}>Remove from this month <span>Delete all entries for this month</span></button><button className="cancel-remove" onClick={() => setRemoveTarget(null)}>Cancel</button></section></div>}
  </main>;
}
