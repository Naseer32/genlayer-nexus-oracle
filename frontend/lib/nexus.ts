import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

export const CONTRACT = (process.env.NEXT_PUBLIC_NEXUS_ADDRESS || "0x7a5C0D691B95bC2cbEEd2C238cFa30371c333C4e") as `0x${string}`;
export const MIN_BOND = 0.01;

export type Opp = {
  id: string; title: string; category: string; source_url: string; submitter: string; bond: string;
  status: string; verdict: string; reward_tier: string; deadline_status: string; reason: string;
};

const plain = (v: any): any =>
  v instanceof Map ? Object.fromEntries(Array.from(v.entries()).map(([k, x]) => [k, plain(x)]))
  : Array.isArray(v) ? v.map(plain)
  : typeof v === "bigint" ? v.toString()
  : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, plain(x)]))
  : v;

const client = (address?: string | null): any =>
  createClient({ chain: studionet, ...(address ? { account: address as `0x${string}` } : {}) } as any);

export async function getOpps(): Promise<Opp[]> {
  const data = plain(await client().readContract({ address: CONTRACT, functionName: "get_opportunities", args: [] }));
  return (data as any[]).map((o) => ({
    id: String(o.id ?? ""), title: String(o.title ?? ""), category: String(o.category ?? ""),
    source_url: String(o.source_url ?? ""), submitter: String(o.submitter ?? ""), bond: String(o.bond ?? "0"),
    status: String(o.status ?? ""), verdict: String(o.verdict ?? ""), reward_tier: String(o.reward_tier ?? ""),
    deadline_status: String(o.deadline_status ?? ""), reason: String(o.reason ?? ""),
  }));
}

export async function getStats(): Promise<{ count: number; treasury_wei: string }> {
  const s = plain(await client().readContract({ address: CONTRACT, functionName: "get_stats", args: [] }));
  return { count: Number(s.count ?? 0), treasury_wei: String(s.treasury_wei ?? "0") };
}

export async function send(address: string, fn: string, args: any[], value: bigint, onStage: (s: string) => void) {
  const c = client(address);
  onStage("Confirm the transaction in your wallet...");
  const hash = await c.writeContract({ address: CONTRACT, functionName: fn, args, value });
  onStage("Validators are fetching the source and reaching consensus (up to a few minutes)...");
  await c.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED, interval: 4000, retries: 90 });
  return hash as string;
}
