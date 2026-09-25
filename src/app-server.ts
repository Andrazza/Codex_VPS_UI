import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface } from "node:readline";

type RpcMessage = { id?: number; method?: string; params?: any; result?: any; error?: { message?: string } };
type Pending = { resolve: (value: any) => void; reject: (error: Error) => void; timer: NodeJS.Timeout };
export type UsageWindow = { label: string; remainingPercent: number; usedPercent: number; windowDurationMins: number; resetsAt: number | null };
export type UsageSummary = { windows: UsageWindow[]; updatedAt: string; source: "codex" };

export class CodexAppServer {
  private child: ChildProcessWithoutNullStreams | null = null;
  private nextId = 1;
  private pending = new Map<number, Pending>();
  private starting: Promise<void> | null = null;
  private cache: { value: UsageSummary; expires: number } | null = null;
  private listeners = new Set<(message: RpcMessage) => void>();

  onEvent(listener: (message: RpcMessage) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  async rateLimits(): Promise<UsageSummary> {
    if (this.cache && this.cache.expires > Date.now()) return this.cache.value;
    await this.start(); const result = await this.request("account/rateLimits/read", null, 12_000);
    const snapshot = result.rateLimitsByLimitId?.codex ?? result.rateLimits;
    const windows = [snapshot?.primary, snapshot?.secondary].filter((w: any) => typeof w?.usedPercent === "number" && typeof w?.windowDurationMins === "number").map((w: any) => ({ label: w.windowDurationMins === 300 ? "5 часов" : w.windowDurationMins === 10080 ? "Неделя" : `${w.windowDurationMins} мин.`, remainingPercent: Math.max(0, Math.min(100, 100 - w.usedPercent)), usedPercent: w.usedPercent, windowDurationMins: w.windowDurationMins, resetsAt: w.resetsAt ?? null })).sort((a: UsageWindow, b: UsageWindow) => a.windowDurationMins - b.windowDurationMins);
    const value: UsageSummary = { windows, updatedAt: new Date().toISOString(), source: "codex" }; this.cache = { value, expires: Date.now() + 30_000 }; return value;
  }
  async models(): Promise<any[]> { await this.start(); const result = await this.request("model/list", { limit: 50, includeHidden: false }, 12_000); return Array.isArray(result.data) ? result.data : []; }
  async startThread(cwd: string): Promise<string> { await this.start(); const result = await this.request("thread/start", { cwd, sandbox: "workspace-write", approvalPolicy: "on-request" }, 12_000); return result.thread.id; }
  async startTurn(threadId: string, text: string, model?: string, effort?: string): Promise<string> { await this.start(); const result = await this.request("turn/start", { threadId, input: [{ type: "text", text }], model: model ?? null, effort: effort ?? null }, 12_000); return result.turn.id; }
  async interrupt(threadId: string, turnId: string): Promise<void> { await this.start(); await this.request("turn/interrupt", { threadId, turnId }, 12_000); }
  private async start(): Promise<void> {
    if (this.child) return; if (this.starting) return this.starting;
    this.starting = (async () => { const child = spawn("codex", ["app-server", "--stdio"], { stdio: ["pipe", "pipe", "pipe"], env: process.env }); this.child = child; createInterface({ input: child.stdout }).on("line", (line) => this.onLine(line)); child.stderr.on("data", (chunk: Buffer) => { const msg = chunk.toString().replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "").trim(); if (msg) console.error(`codex app-server: ${msg.slice(0, 500)}`); }); child.once("exit", () => this.reset(new Error("Codex app-server stopped"))); child.once("error", (error) => this.reset(error)); await this.request("initialize", { clientInfo: { name: "codex_web_ui", title: "Codex Desk", version: "0.3.0" } }, 12_000); this.notify("initialized", {}); })();
    try { await this.starting; } finally { this.starting = null; }
  }
  private onLine(line: string): void { let message: RpcMessage; try { message = JSON.parse(line); } catch { return; } if (message.method === "account/rateLimits/updated") this.cache = null; if (typeof message.id === "number" && this.pending.has(message.id)) { const pending = this.pending.get(message.id)!; clearTimeout(pending.timer); this.pending.delete(message.id); message.error ? pending.reject(new Error(message.error.message ?? "Codex RPC error")) : pending.resolve(message.result); return; } if (message.method) for (const listener of this.listeners) listener(message); }
  private request(method: string, params: unknown, timeoutMs: number): Promise<any> { if (!this.child) return Promise.reject(new Error("Codex app-server is unavailable")); const id = this.nextId++; return new Promise((resolve, reject) => { const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`${method} timed out`)); }, timeoutMs); this.pending.set(id, { resolve, reject, timer }); this.child!.stdin.write(`${JSON.stringify({ method, id, params })}\n`); }); }
  private notify(method: string, params: unknown): void { this.child?.stdin.write(`${JSON.stringify({ method, params })}\n`); }
  private reset(error: Error): void { this.child = null; this.cache = null; for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(error); } this.pending.clear(); }
}