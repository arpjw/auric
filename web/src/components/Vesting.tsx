"use client";

import { useMemo } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { formatUnits, BaseError } from "viem";
import { VESTING_ADDRESS, VESTING_ABI } from "@/lib/abi";

function fmtDate(ts: bigint) {
  return new Date(Number(ts) * 1000).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function fmtAUR(wei: bigint) {
  return Number(formatUnits(wei, 18)).toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 12, color: "var(--muted)" }}>{label}</span>
      <span style={{ fontSize: 13, color: "var(--text)", textAlign: "right" }}>{children}</span>
    </div>
  );
}

export function Vesting() {
  const nowTs = useMemo(() => BigInt(Math.floor(Date.now() / 1000)), []);

  const { data: cliff }       = useReadContract({ address: VESTING_ADDRESS, abi: VESTING_ABI, functionName: "cliff" });
  const { data: end }         = useReadContract({ address: VESTING_ADDRESS, abi: VESTING_ABI, functionName: "end" });
  const { data: totalAmount } = useReadContract({ address: VESTING_ADDRESS, abi: VESTING_ABI, functionName: "totalAmount" });
  const { data: deposited }   = useReadContract({ address: VESTING_ADDRESS, abi: VESTING_ABI, functionName: "deposited" });
  const { data: vested }      = useReadContract({
    address: VESTING_ADDRESS,
    abi: VESTING_ABI,
    functionName: "vestedAmount",
    args: [nowTs],
  });
  const { data: releasable, refetch: refetchReleasable } = useReadContract({
    address: VESTING_ADDRESS,
    abi: VESTING_ABI,
    functionName: "releasable",
  });

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const canRelease = releasable !== undefined && releasable > 0n;

  return (
    <div className="card">
      <span className="label">Vesting</span>

      <div style={{ marginBottom: 16 }}>
        <Row label="Contract">
          <code style={{ fontSize: 11, fontFamily: "monospace", color: "var(--muted)" }}>
            {VESTING_ADDRESS.slice(0, 10)}…{VESTING_ADDRESS.slice(-8)}
          </code>
        </Row>
        <Row label="Cliff">
          {cliff !== undefined ? fmtDate(cliff) : "—"}
        </Row>
        <Row label="End">
          {end !== undefined ? fmtDate(end) : "—"}
        </Row>
        <Row label="Total">
          {totalAmount !== undefined ? `${fmtAUR(totalAmount)} AUR` : "—"}
        </Row>
        <Row label="Vested">
          {vested !== undefined ? `${fmtAUR(vested)} AUR` : "—"}
        </Row>
        <Row label="Releasable">
          <span style={{ color: canRelease ? "var(--green)" : undefined }}>
            {releasable !== undefined ? `${fmtAUR(releasable)} AUR` : "—"}
          </span>
        </Row>
      </div>

      {deposited === false && (
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
          No tokens deposited yet. Call <code style={{ fontSize: 11 }}>deposit(amount)</code> on the contract to begin vesting.
        </p>
      )}

      <button
        className="btn-primary"
        style={{ width: "100%" }}
        disabled={!canRelease || isPending || isConfirming}
        onClick={() => {
          writeContract({ address: VESTING_ADDRESS, abi: VESTING_ABI, functionName: "release" });
        }}
      >
        {isPending || isConfirming ? "Releasing…" : "Release Vested Tokens"}
      </button>

      {isSuccess && <p className="status ok">Release confirmed</p>}
      {error && <p className="status err">{error instanceof BaseError ? error.shortMessage : error.message}</p>}
    </div>
  );
}
