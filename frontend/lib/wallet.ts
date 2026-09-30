"use client";
import { useCallback, useEffect, useState } from "react";
import { studionet } from "genlayer-js/chains";

const eth = () => (typeof window !== "undefined" ? (window as any).ethereum : undefined);

export function useAccount() {
  const [address, setAddress] = useState<string | null>(null);
  useEffect(() => {
    const e = eth();
    if (!e) return;
    e.request({ method: "eth_accounts" }).then((a: string[]) => setAddress(a[0] ?? null)).catch(() => {});
    const h = (a: string[]) => setAddress(a[0] ?? null);
    e.on?.("accountsChanged", h);
    return () => e.removeListener?.("accountsChanged", h);
  }, []);
  const connect = useCallback(async () => {
    const e = eth();
    if (!e) throw new Error("No wallet found. Open this page in the MetaMask browser.");
    const a = await e.request({ method: "eth_requestAccounts" });
    const c: any = studionet;
    const chainId = "0x" + Number(c.id).toString(16);
    try {
      await e.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] });
    } catch {
      await e.request({ method: "wallet_addEthereumChain", params: [{ chainId, chainName: c.name, nativeCurrency: c.nativeCurrency, rpcUrls: c.rpcUrls.default.http }] });
    }
    setAddress(a[0] ?? null);
  }, []);
  return { address, connect };
}
