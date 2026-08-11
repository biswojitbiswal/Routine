import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { clearSession, currentUserId, setSession } from "@/lib/auth";
import { materializeMonth } from "@/lib/month";

const ok = data => NextResponse.json(data);
const fail = (error, status = 400) => NextResponse.json({ error }, { status });
const todayMonth = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; };
const todayDate = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; };
const editableMonth = month => /^\d{4}-\d{2}$/.test(month || "") && month >= todayMonth();

export async function POST(req, { params }) {
  const { path } = await params;
  const body = await req.json().catch(() => ({}));
  const database = await db();

  if (path[0] === "auth") {
    if (path[1] === "signout") { await clearSession(); return ok({ ok: true }); }
    if (path[1] === "signup") {
      const { name, email, password } = body;
      if (!name || !email || password?.length < 6) return fail("Use a name, email, and 6+ character password.");
      if (await database.collection("users").findOne({ email: email.toLowerCase() })) return fail("An account already uses this email.");
      const user = { name, email: email.toLowerCase(), password: await bcrypt.hash(password, 12), createdAt: new Date() };
      const result = await database.collection("users").insertOne(user);
      await setSession({ ...user, _id: result.insertedId });
      return ok({ ok: true });
    }
    const user = await database.collection("users").findOne({ email: body.email?.toLowerCase() });
    if (path[1] === "forgot-password") return ok({ ok: true, message: "Sign in, then use Change password in Account." });
    if (!user || !(await bcrypt.compare(body.password || "", user.password))) return fail("Incorrect email or password.", 401);
    await setSession(user);
    return ok({ ok: true });
  }

  const uid = await currentUserId();
  if (!uid) return fail("Please sign in.", 401);
  const userId = new ObjectId(uid);

  if (path[0] === "dashboard") {
    const month = body.month || todayMonth();
    const tasks = await database.collection("tasks").find({ userId, date: { $regex: `^${month}` } }).sort({ date: 1, title: 1 }).toArray();
    const plan = await database.collection("monthPlans").findOne({ userId, month });
    return ok({ planned: Boolean(plan) || tasks.length > 0, tasks: tasks.map(task => ({ ...task, _id: task._id.toString(), templateId: task.templateId?.toString() })) });
  }

  if (path[0] === "plans") {
    const month = body.month;
    if (!editableMonth(month)) return fail("Past months are read-only.", 403);
    await database.collection("monthPlans").updateOne({ userId, month }, { $setOnInsert: { userId, month, createdAt: new Date() } }, { upsert: true });
    await materializeMonth(database, uid, month);
    return ok({ ok: true });
  }

  if (path[0] === "tasks" && path[1]) {
    const task = await database.collection("tasks").findOne({ _id: new ObjectId(path[1]), userId });
    if (!task) return fail("Task not found.", 404);
    if (!editableMonth(task.date.slice(0, 7))) return fail("Past months are read-only.", 403);
    if (body.action === "toggle") await database.collection("tasks").updateOne({ _id: task._id }, { $set: { completed: Boolean(body.completed) } });
    return ok({ ok: true });
  }

  if (path[0] === "templates") {
    const month = body.month;
    if (!editableMonth(month)) return fail("Past months are read-only.", 403);
    if (!await database.collection("monthPlans").findOne({ userId, month })) return fail("Create this month’s plan first.", 409);

    if (path[1]) {
      const templateId = new ObjectId(path[1]);
      if (body.action === "stop") {
        const fromDate = month === todayMonth() ? todayDate() : `${month}-01`;
        await database.collection("tasks").deleteMany({ userId, templateId, date: { $gte: fromDate, $regex: `^${month}` } });
        return ok({ ok: true });
      }
      if (body.action === "remove-month") {
        await database.collection("tasks").deleteMany({ userId, templateId, date: { $regex: `^${month}` } });
        return ok({ ok: true });
      }
      const changes = { title: body.title, color: body.color, icon: body.icon, frequency: body.frequency, weekdays: body.weekdays || [], day: Number(body.day) || 1, targetDate: body.targetDate || null, startDate: body.startDate || null, endDate: body.endDate || null };
      await database.collection("taskTemplates").updateOne({ _id: templateId, userId }, { $set: changes });
      await database.collection("tasks").deleteMany({ userId, templateId, date: { $regex: `^${month}` } });
      await materializeMonth(database, uid, month);
      return ok({ ok: true });
    }

    const now = new Date();
    const template = { userId, title: body.title, color: body.color || "#168d2a", icon: body.icon || "star", frequency: body.frequency || "daily", weekdays: body.weekdays || [], day: Number(body.day) || 1, targetDate: body.targetDate || null, startDate: body.startDate || null, endDate: body.endDate || null, active: true, createdAt: now };
    const result = await database.collection("taskTemplates").insertOne(template);
    await materializeMonth(database, uid, month);
    return ok({ ok: true, id: result.insertedId.toString() });
  }

  return fail("Not found", 404);
}
