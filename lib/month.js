import { ObjectId } from "mongodb";
export const datesOf = m => { const [y, x] = m.split("-").map(Number); return Array.from({ length: new Date(y, x, 0).getDate() }, (_, i) => new Date(Date.UTC(y, x - 1, i + 1))) };
const applies = (t, d) => {
  const iso = d.toISOString().slice(0, 10);
  if (t.startDate && iso < t.startDate || t.endDate && iso > t.endDate) return false;
  if (t.frequency === "once") return t.targetDate === iso;
  if (t.frequency === "daily" || t.frequency === "date-range") return true;
  if (t.frequency === "weekly") return (t.weekdays || [t.weekday]).includes(d.getUTCDay());
  if (t.frequency === "monthly") return d.getUTCDate() === t.day;
  return t.frequency === "yearly" && d.getUTCDate() === t.day && d.getUTCMonth() === t.month;
};

const belongsToMonth = (template, month) => {
  if ((template.excludedMonths || []).includes(month)) return false;

  const monthStart = `${month}-01`;
  const monthEnd = datesOf(month).at(-1).toISOString().slice(0, 10);

  // An explicit range is the only repeating configuration that may cross months.
  if (template.startDate || template.endDate) {
    return (!template.startDate || template.startDate <= monthEnd) &&
      (!template.endDate || template.endDate >= monthStart);
  }

  // A one-time routine belongs to the month containing its selected date.
  if (template.frequency === "once" && template.targetDate) {
    return template.targetDate.startsWith(`${month}-`);
  }

  return template.scopeMonth === month;
};

// Migrate templates created before month scoping existed. Their earliest task
// identifies the month where they were originally configured.
export async function normalizeLegacyTemplates(database, userId) {
  const objectUserId = typeof userId === "string" ? new ObjectId(userId) : userId;
  const legacyTemplates = await database.collection("taskTemplates").find({
    userId: objectUserId,
    scopeMonth: { $exists: false },
    startDate: null,
    endDate: null,
  }).toArray();

  for (const template of legacyTemplates) {
    const firstTask = await database.collection("tasks").findOne(
      { userId: objectUserId, templateId: template._id },
      { sort: { date: 1 } }
    );
    const scopeMonth = template.frequency === "once" && template.targetDate
      ? template.targetDate.slice(0, 7)
      : firstTask?.date?.slice(0, 7);
    if (!scopeMonth) continue;

    const monthStart = `${scopeMonth}-01`;
    const monthEnd = datesOf(scopeMonth).at(-1).toISOString().slice(0, 10);
    await database.collection("taskTemplates").updateOne({ _id: template._id, userId: objectUserId }, { $set: { scopeMonth } });
    await database.collection("tasks").deleteMany({
      userId: objectUserId,
      templateId: template._id,
      $or: [{ date: { $lt: monthStart } }, { date: { $gt: monthEnd } }],
    });
  }
}

export async function materializeMonth(database, userId, month) {
  const objectUserId = new ObjectId(userId);
  await normalizeLegacyTemplates(database, objectUserId);
  const templates = await database.collection("taskTemplates").find({ userId: objectUserId, active: true }).toArray();
  const rows = [];

  for (const template of templates.filter(item => belongsToMonth(item, month))) {
    for (const date of datesOf(month)) {
      if (!applies(template, date)) continue;
      rows.push({ userId: objectUserId, templateId: template._id, date: date.toISOString().slice(0, 10), title: template.title, color: template.color, icon: template.icon || "star", frequency: template.frequency, weekdays: template.weekdays || [], day: template.day, targetDate: template.targetDate || null, startDate: template.startDate || null, endDate: template.endDate || null, completed: false, createdAt: new Date() });
    }
  }

  if (rows.length) await database.collection("tasks").bulkWrite(rows.map(row => ({ updateOne: { filter: { userId: row.userId, templateId: row.templateId, date: row.date }, update: { $setOnInsert: row }, upsert: true } })));
}
