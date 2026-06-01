"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@/components/ConnectButton";
import { Balance } from "@/components/Balance";
import { Transfer } from "@/components/Transfer";
import { Mint } from "@/components/Mint";
import { Burn } from "@/components/Burn";
import { Vesting } from "@/components/Vesting";
import { AMM } from "@/components/AMM";

export default function AppPage() {
  const { isConnected } = useAccount();

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: "96px clamp(20px, 5vw, 32px) 80px" }}>
      {!isConnected ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 36,
              fontWeight: 400,
              color: "var(--text)",
              marginBottom: 16,
              letterSpacing: "-0.02em",
            }}
          >
            Token Interface
          </h2>
          <p style={{ color: "var(--muted)", marginBottom: 40, lineHeight: 1.7, fontSize: 15 }}>
            Connect your wallet to view your AUR balance
            <br />
            and manage your tokens on Sepolia.
          </p>
          <ConnectButton />
        </div>
      ) : (
        <>
          <Balance />
          <hr className="divider" />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Transfer />
            <Mint />
            <Burn />
          </div>
          <hr className="divider" />
          <Vesting />
          <hr className="divider" />
          <AMM />
        </>
      )}
    </main>
  );
}
