import { initializeApp, cert } from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "login-page-144f8";
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

export let db: any;
export let auth: any;

const isFirebaseConfigured = !!(projectId && clientEmail && privateKey && clientEmail.trim() !== "" && privateKey.trim() !== "");

// Mock Database Storage class for dev fallback
class MockFirestore {
  private filepath: string;
  private data: Record<string, Record<string, any>> = {};

  constructor() {
    this.filepath = path.join(__dirname, "../db_mock.json");
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.filepath)) {
        const fileContent = fs.readFileSync(this.filepath, "utf8");
        this.data = JSON.parse(fileContent);
      } else {
        this.data = {};
        this.save();
      }
    } catch (err) {
      console.error("Error loading mock Firestore JSON file:", err);
      this.data = {};
    }
  }

  private save() {
    try {
      fs.writeFileSync(this.filepath, JSON.stringify(this.data, null, 2), "utf8");
    } catch (err) {
      console.error("Error saving mock Firestore JSON file:", err);
    }
  }

  public collection(name: string) {
    return new MockCollection(name, this);
  }

  // Raw helpers
  public getRawData(coll: string): Record<string, any> {
    return this.data[coll] || {};
  }

  public setRawData(coll: string, docId: string, docData: any) {
    if (!this.data[coll]) {
      this.data[coll] = {};
    }
    this.data[coll][docId] = docData;
    this.save();
  }

  public deleteRawData(coll: string, docId: string) {
    if (this.data[coll] && this.data[coll][docId]) {
      delete this.data[coll][docId];
      this.save();
    }
  }
}

class MockCollection {
  constructor(private name: string, private store: MockFirestore) {}

  public doc(id?: string) {
    const docId = id || "doc_" + Math.random().toString(36).substring(2, 15);
    return new MockDocumentReference(this.name, docId, this.store);
  }

  public async add(data: any) {
    const docId = "doc_" + Math.random().toString(36).substring(2, 15);
    const docRef = new MockDocumentReference(this.name, docId, this.store);
    await docRef.set(data);
    return { id: docId, get: () => docRef.get() };
  }

  public async get() {
    const raw = this.store.getRawData(this.name);
    const docs = Object.entries(raw).map(([id, val]) => new MockDocumentSnapshot(id, val, true));
    return new MockQuerySnapshot(docs);
  }

  public orderBy(field: string, direction: "asc" | "desc" = "asc") {
    return new MockQuery(this.name, this.store, [{ type: "order", field, direction }]);
  }

  public where(field: string, op: string, val: any) {
    return new MockQuery(this.name, this.store, [{ type: "where", field, op, val }]);
  }

  public limit(num: number) {
    return new MockQuery(this.name, this.store, [{ type: "limit", limit: num }]);
  }
}

class MockQuery {
  constructor(
    private collectionName: string,
    private store: MockFirestore,
    private clauses: any[] = []
  ) {}

  public orderBy(field: string, direction: "asc" | "desc" = "asc") {
    return new MockQuery(this.collectionName, this.store, [...this.clauses, { type: "order", field, direction }]);
  }

  public where(field: string, op: string, val: any) {
    return new MockQuery(this.collectionName, this.store, [...this.clauses, { type: "where", field, op, val }]);
  }

  public limit(num: number) {
    return new MockQuery(this.collectionName, this.store, [...this.clauses, { type: "limit", limit: num }]);
  }

  public async get() {
    const raw = this.store.getRawData(this.collectionName);
    let items = Object.entries(raw).map(([id, val]) => ({ id, data: val }));

    // Apply where filters
    for (const clause of this.clauses) {
      if (clause.type === "where") {
        const { field, op, val } = clause;
        items = items.filter(item => {
          const itemVal = item.data[field];
          if (op === "==" || op === "equals") return itemVal === val;
          if (op === ">") return itemVal > val;
          if (op === "<") return itemVal < val;
          if (op === ">=") return itemVal >= val;
          if (op === "<=") return itemVal <= val;
          if (op === "array-contains") return Array.isArray(itemVal) && itemVal.includes(val);
          return true;
        });
      }
    }

    // Apply orderBy sorting
    for (const clause of this.clauses) {
      if (clause.type === "order") {
        const { field, direction } = clause;
        items.sort((a, b) => {
          const valA = a.data[field];
          const valB = b.data[field];
          if (valA === undefined) return 1;
          if (valB === undefined) return -1;
          if (typeof valA === "string" && typeof valB === "string") {
            return direction === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
          }
          return direction === "asc" ? valA - valB : valB - valA;
        });
      }
    }

    // Apply limit
    for (const clause of this.clauses) {
      if (clause.type === "limit") {
        items = items.slice(0, clause.limit);
      }
    }

    const docs = items.map(item => new MockDocumentSnapshot(item.id, item.data, true));
    return new MockQuerySnapshot(docs);
  }
}

class MockDocumentReference {
  constructor(
    private collectionName: string,
    private id: string,
    private store: MockFirestore
  ) {}

  public async get() {
    const raw = this.store.getRawData(this.collectionName);
    const exists = !!raw[this.id];
    return new MockDocumentSnapshot(this.id, raw[this.id] || {}, exists);
  }

  public async set(data: any, options?: { merge: boolean }) {
    const raw = this.store.getRawData(this.collectionName);
    const existing = raw[this.id] || {};
    const finalData = options?.merge ? { ...existing, ...data } : data;
    this.store.setRawData(this.collectionName, this.id, finalData);
  }

  public async update(data: any) {
    const raw = this.store.getRawData(this.collectionName);
    const existing = raw[this.id] || {};
    // Merge updates
    const finalData = { ...existing, ...data };
    this.store.setRawData(this.collectionName, this.id, finalData);
  }

  public async delete() {
    this.store.deleteRawData(this.collectionName, this.id);
  }
}

class MockDocumentSnapshot {
  constructor(
    public id: string,
    private docData: any,
    public exists: boolean
  ) {}

  public data() {
    return this.exists ? { ...this.docData, id: this.id } : undefined;
  }
}

class MockQuerySnapshot {
  constructor(public docs: MockDocumentSnapshot[]) {}
  public get size() {
    return this.docs.length;
  }
  public get empty() {
    return this.docs.length === 0;
  }
  public forEach(callback: (snapshot: MockDocumentSnapshot) => void) {
    this.docs.forEach(callback);
  }
}

if (isFirebaseConfigured) {
  try {
    const formattedPrivateKey = privateKey!.replace(/\\n/g, "\n");
    const app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey
      })
    });
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("Firebase Admin successfully initialized with production credentials.");
  } catch (error) {
    console.error("Failed to initialize Firebase Admin, falling back to mock database:", error);
    db = new MockFirestore();
    auth = {
      getUser: async (uid: string) => ({ uid, email: "operator@orbit.io" }),
      verifyIdToken: async (token: string) => ({ uid: "mock-uid", email: "operator@orbit.io" })
    };
  }
} else {
  console.warn("Firebase Admin credentials missing. Initializing high-fidelity mock database.");
  db = new MockFirestore();
  auth = {
    getUser: async (uid: string) => ({ uid, email: "operator@orbit.io" }),
    verifyIdToken: async (token: string) => ({ uid: "mock-uid", email: "operator@orbit.io" })
  };
}
