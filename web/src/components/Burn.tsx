"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, BaseError } from "viem";
import { AUR_ABI, AUR_ADDRESS } from "@/lib/abi";

export function Burn() {
  const [amount, setAmount] = useState("");

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const valid = Number(amount) > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    writeContract({
      address: AUR_ADDRESS,
      abi: AUR_ABI,
      functionName: "burn",
      args: [parseUnits(amount, 18)],
    });
  }

  return (
    <div className="card">
      <span className="label">Burn</span>
      <form onSubmit={submit} style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="Amount (AUR)"
          type="number"
          min="0"
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button className="btn-danger" type="submit" disabled={!valid || isPending || isConfirming}>
          {isPending || isConfirming ? "Burning…" : "Burn"}
        </button>
      </form>
      {isSuccess && <p className="status ok">Burn confirmed</p>}
      {error && <p className="status err">{error instanceof BaseError ? error.shortMessage : error.message}</p>}
    </div>
  );
}
