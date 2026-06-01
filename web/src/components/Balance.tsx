"use client";

import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { AUR_ABI, AUR_ADDRESS } from "@/lib/abi";

export function Balance() {
  const { address } = useAccount();

  const { data: balance, isLoading } = useReadContract({
    address: AUR_ADDRESS,
    abi: AUR_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  if (!address) return null;

  const formatted =
    isLoading || balance === undefined
      ? "—"
      : Number(formatUnits(balance, 18)).toLocaleString(undefined, { maximumFractionDigits: 4 });

  return (
    <section>
      <span className="label">AUR Balance</span>
      <div className="balance-amount">
        {formatted}
      </div>
      <div style={{ color: "var(--muted)", fontSize: 13, letterSpacing: "0.01em" }}>
        Auric &middot; Sepolia Testnet
      </div>
    </section>
  );
}
