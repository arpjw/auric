"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@/components/ConnectButton";
import { Balance } from "@/components/Balance";
import { Transfer } from "@/components/Transfer";
import { Mint } from "@/components/Mint";
import { Burn } from "@/components/Burn";
import { AUR_ADDRESS } from "@/lib/abi";

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <>
      <header style={{
        borderBottom: "1px solid var(--border)",
        padding: "0 32px",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        background: "var(--bg)",
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <span style={{
            fontFamily: "var(--font-serif)",
            fontSize: 22,
            fontWeight: 700,
            color: "var(--text)",
            letterSpacing: "-0.01em",
          }}>
            Auric
          </span>
          <a
            href={`https://sepolia.etherscan.io/token/${AUR_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11,
              color: "var(--muted)",
              fontFamily: "monospace",
              letterSpacing: "0.03em",
            }}
          >
            {AUR_ADDRESS.slice(0, 6)}…{AUR_ADDRESS.slice(-4)}
          </a>
        </div>
        <ConnectButton />
      </header>

      <main style={{ maxWidth: 600, margin: "0 auto", padding: "56px 32px 80px" }}>
        {!isConnected ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <h2 style={{
              fontFamily: "var(--font-serif)",
              fontSize: 36,
              fontWeight: 400,
              color: "var(--text)",
              marginBottom: 16,
              letterSpacing: "-0.02em",
            }}>
              Welcome to Auric
            </h2>
            <p style={{ color: "var(--muted)", marginBottom: 40, lineHeight: 1.7, fontSize: 15 }}>
              Connect your wallet to view your AUR balance<br />and manage your tokens on Sepolia.
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
          </>
        )}
      </main>
    </>
  );
}
