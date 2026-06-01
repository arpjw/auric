import { AUR_ADDRESS } from "@/lib/abi";

const ETHERSCAN = `https://sepolia.etherscan.io/token/${AUR_ADDRESS}`;
const SOURCIFY = `https://sourcify.dev/#/lookup/${AUR_ADDRESS}`;
const GITHUB = "https://github.com/arpjw/auric";

export default function About() {
  return (
    <main className="about-main">
      <div className="about-grid">
        {/* Project */}
        <div>
          <span className="label">Project</span>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 44,
              fontWeight: 700,
              letterSpacing: "-0.025em",
              color: "var(--text)",
              margin: "8px 0 20px",
              lineHeight: 1.1,
            }}
          >
            Auric
          </h1>
          <p style={{ color: "var(--muted)", lineHeight: 1.8, fontSize: 14, marginBottom: 36 }}>
            A minimal, complete DeFi primitive stack built from scratch on Ethereum Sepolia.
            Auric demonstrates how ERC-20 tokens, token vesting, and constant-product AMMs
            compose in a single codebase — implemented with Foundry and OpenZeppelin.
          </p>

          <span className="label" style={{ display: "block", marginBottom: 10 }}>
            Stack
          </span>
          <ul className="about-stack">
            {[
              "Solidity ^0.8.20",
              "Foundry (forge, cast, anvil)",
              "OpenZeppelin Contracts v5",
              "Next.js + wagmi + viem",
              "Sepolia testnet",
            ].map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div style={{ marginTop: 36 }}>
            <span className="label" style={{ display: "block", marginBottom: 10 }}>
              Contract
            </span>
            <div className="about-contract">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
                  Auric (AUR)
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--muted)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  Sepolia
                </span>
              </div>
              <code
                style={{
                  display: "block",
                  fontSize: 11,
                  color: "var(--muted)",
                  fontFamily: "monospace",
                  letterSpacing: "0.02em",
                  wordBreak: "break-all",
                }}
              >
                {AUR_ADDRESS}
              </code>
            </div>

            <div style={{ display: "flex", gap: 20, marginTop: 16, flexWrap: "wrap" }}>
              <a href={ETHERSCAN} target="_blank" rel="noopener noreferrer" className="about-ext-link">
                Etherscan ↗
              </a>
              <a href={SOURCIFY} target="_blank" rel="noopener noreferrer" className="about-ext-link">
                Sourcify ↗
              </a>
              <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="about-ext-link">
                GitHub ↗
              </a>
            </div>
          </div>
        </div>

        {/* Builder */}
        <div>
          <span className="label">Builder</span>
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--text)",
              margin: "8px 0 24px",
              lineHeight: 1.15,
            }}
          >
            Arya Somu
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <a
              href="https://aryasomu.com"
              target="_blank"
              rel="noopener noreferrer"
              className="about-ext-link"
            >
              aryasomu.com ↗
            </a>
            <a
              href="https://x.com/arrrrrryaa"
              target="_blank"
              rel="noopener noreferrer"
              className="about-ext-link"
            >
              @arrrrrryaa ↗
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
