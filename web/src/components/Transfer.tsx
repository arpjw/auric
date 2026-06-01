"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, isAddress, BaseError } from "viem";
import { AUR_ABI, AUR_ADDRESS } from "@/lib/abi";

export function Transfer() {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const valid = isAddress(to) && Number(amount) > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    writeContract({
      address: AUR_ADDRESS,
      abi: AUR_ABI,
      functionName: "transfer",
      args: [to as `0x${string}`, parseUnits(amount, 18)],
    });
  }

  return (
    <div className="card">
      <span className="label">Transfer</span>
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
            {isPending || isConfirming ? "Sending…" : "Send"}
          </button>
        </div>
      </form>
      {isSuccess && <p className="status ok">Transfer confirmed</p>}
      {error && <p className="status err">{error instanceof BaseError ? error.shortMessage : error.message}</p>}
    </div>
  );
}
