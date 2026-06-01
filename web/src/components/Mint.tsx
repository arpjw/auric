"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, isAddress, BaseError } from "viem";
import { AUR_ABI, AUR_ADDRESS } from "@/lib/abi";

export function Mint() {
  const { address } = useAccount();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");

  const { data: owner } = useReadContract({
    address: AUR_ADDRESS,
    abi: AUR_ABI,
    functionName: "owner",
    query: { enabled: !!address },
  });

  const isOwner = address && owner && address.toLowerCase() === owner.toLowerCase();

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const valid = isAddress(to) && Number(amount) > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    writeContract({
      address: AUR_ADDRESS,
      abi: AUR_ABI,
      functionName: "mint",
      args: [to as `0x${string}`, parseUnits(amount, 18)],
    });
  }

  if (!isOwner) {
    return (
      <div className="card" style={{ opacity: 0.45 }}>
        <span className="label">Mint</span>
        <p style={{ color: "var(--muted)", fontSize: 13 }}>
          Only the contract owner can mint.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <span className="label" style={{ color: "var(--gold)" }}>Mint &middot; Owner</span>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          placeholder="Recipient address (0x…)"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          spellCheck={false}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="Amount (AUR)"
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button className="btn-primary" type="submit" disabled={!valid || isPending || isConfirming}>
            {isPending || isConfirming ? "Minting…" : "Mint"}
          </button>
        </div>
      </form>
      {isSuccess && <p className="status ok">Mint confirmed</p>}
      {error && <p className="status err">{error instanceof BaseError ? error.shortMessage : error.message}</p>}
    </div>
  );
}
