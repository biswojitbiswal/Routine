import { MongoClient } from "mongodb";
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("Missing MONGODB_URI in .env.local");
let promise;
if (process.env.NODE_ENV === "development") { if (!global._mongo) global._mongo = new MongoClient(uri).connect(); promise = global._mongo; } else promise = new MongoClient(uri).connect();
export async function db() { return (await promise).db(); }
