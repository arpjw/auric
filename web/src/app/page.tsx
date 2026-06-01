import Link from "next/link";

export default function Home() {
  return (
    <section className="hero">
      <div className="hero-orb hero-orb-1" />
      <div className="hero-orb hero-orb-2" />
      <div className="hero-orb hero-orb-3" />

      <div className="hero-content">
        <p className="hero-eyebrow">ERC-20 &middot; Sepolia Testnet</p>
        <h1 className="hero-headline">
          The DeFi primitive<br />stack, from scratch.
        </h1>
        <p className="hero-sub">
          Auric (AUR) is an ERC-20 token with token vesting, transfer tax, and a
          constant-product AMM — built from first principles with Foundry and OpenZeppelin.
        </p>
        <div className="hero-actions">
          <Link href="/app" className="btn-cta">Launch App</Link>
          <Link href="/about" className="btn-cta-ghost">Learn More</Link>
        </div>
      </div>
    </section>
  );
}
