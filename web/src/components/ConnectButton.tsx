"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

export function ConnectButton() {
  const { address, isConnected, chain } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontSize: 10,
            color: "var(--muted)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}>
            {chain?.name ?? "Unknown"}
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text)", marginTop: 2 }}>
            {address.slice(0, 6)}…{address.slice(-4)}
          </div>
        </div>
        <button className="btn-ghost" onClick={() => disconnect()} style={{ fontSize: 12 }}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      className="btn-primary"
      disabled={isPending}
      onClick={() => connect({ connector: injected() })}
    >
      {isPending ? "Connecting…" : "Connect Wallet"}
    </button>
  );
}
