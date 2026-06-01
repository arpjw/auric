"use client";

import { useState, useMemo, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, parseUnits, formatUnits, formatEther, BaseError } from "viem";
import { AMM_ADDRESS, AMM_ABI, AUR_ADDRESS, AUR_ABI } from "@/lib/abi";

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtAUR(wei: bigint) {
  return Number(formatUnits(wei, 18)).toLocaleString(undefined, { maximumFractionDigits: 4 });
}
function fmtETH(wei: bigint) {
  return Number(formatEther(wei)).toLocaleString(undefined, { maximumFractionDigits: 6 });
}
function fmtShares(s: bigint) {
  return Number(formatUnits(s, 18)).toLocaleString(undefined, { maximumFractionDigits: 6 });
}

type SwapDir = "eth-to-aur" | "aur-to-eth";
type LiqTab  = "add" | "remove";

// ── AMM root ──────────────────────────────────────────────────────────────────

export function AMM() {
  const [tab, setTab] = useState<"swap" | "liquidity">("swap");

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <span className="label" style={{ marginBottom: 0 }}>AMM</span>
        <div className="tab-bar">
          <button className={tab === "swap" ? "active" : ""} onClick={() => setTab("swap")}>Swap</button>
          <button className={tab === "liquidity" ? "active" : ""} onClick={() => setTab("liquidity")}>Liquidity</button>
        </div>
      </div>
      {tab === "swap" ? <SwapPanel /> : <LiquidityPanel />}
    </div>
  );
}

// ── SwapPanel ─────────────────────────────────────────────────────────────────

function SwapPanel() {
  const { address } = useAccount();
  const [dir, setDir]         = useState<SwapDir>("eth-to-aur");
  const [amount, setAmount]   = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const isEthToAur = dir === "eth-to-aur";

  const { data: reserveToken } = useReadContract({ address: AMM_ADDRESS, abi: AMM_ABI, functionName: "reserveToken" });
  const { data: reserveEth }   = useReadContract({ address: AMM_ADDRESS, abi: AMM_ABI, functionName: "reserveEth" });
  const poolEmpty = !reserveEth || reserveEth === 0n;

  const amountIn = useMemo(() => {
    try {
      if (!amount || Number(amount) <= 0) return null;
      return isEthToAur ? parseEther(amount) : parseUnits(amount, 18);
    } catch { return null; }
  }, [amount, isEthToAur]);

  const { data: estimatedOut } = useReadContract({
    address: AMM_ADDRESS,
    abi: AMM_ABI,
    functionName: "getAmountOut",
    args: amountIn && reserveEth && reserveToken
      ? [amountIn, isEthToAur ? reserveEth : reserveToken, isEthToAur ? reserveToken : reserveEth]
      : undefined,
    query: { enabled: !!amountIn && !poolEmpty && !!reserveToken && !!reserveEth },
  });

  const minOut = useMemo(() => {
    if (!estimatedOut) return 0n;
    const bps = Math.min(Math.round(Number(slippage) * 100), 9999);
    return (estimatedOut * BigInt(10000 - bps)) / 10000n;
  }, [estimatedOut, slippage]);

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: AUR_ADDRESS,
    abi: AUR_ABI,
    functionName: "allowance",
    args: address ? [address, AMM_ADDRESS] : undefined,
    query: { enabled: !!address && !isEthToAur },
  });

  const needsApproval = !isEthToAur && !!amountIn && (allowance === undefined || allowance < amountIn);

  const { writeContract: doApprove, data: approveHash, isPending: approvePending, error: approveError } = useWriteContract();
  const { isLoading: approveConfirming, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
  useEffect(() => { if (approveSuccess) refetchAllowance(); }, [approveSuccess]);

  const { writeContract: doSwap, data: swapHash, isPending: swapPending, error: swapError } = useWriteContract();
  const { isLoading: swapConfirming, isSuccess: swapSuccess } = useWaitForTransactionReceipt({ hash: swapHash });
  useEffect(() => { if (swapSuccess) setAmount(""); }, [swapSuccess]);

  const busy  = approvePending || approveConfirming || swapPending || swapConfirming;
  const valid = !!amountIn && !poolEmpty;
  const error = approveError ?? swapError;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Pool stats */}
      {!poolEmpty && reserveToken && reserveEth ? (
        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "8px 12px", fontSize: 12, color: "var(--muted)", display: "flex", gap: 24 }}>
          <span>{fmtETH(reserveEth)} ETH</span>
          <span>{fmtAUR(reserveToken)} AUR</span>
        </div>
      ) : (
        <p style={{ fontSize: 12, color: "var(--muted)" }}>Pool is empty — add liquidity first.</p>
      )}

      {/* Direction */}
      <div style={{ display: "flex", gap: 6 }}>
        {(["eth-to-aur", "aur-to-eth"] as const).map((d) => (
          <button
            key={d}
            className={dir === d ? "btn-primary" : "btn-ghost"}
            style={{ flex: 1, fontSize: 12, padding: "7px 0" }}
            onClick={() => { setDir(d); setAmount(""); }}
          >
            {d === "eth-to-aur" ? "ETH → AUR" : "AUR → ETH"}
          </button>
        ))}
      </div>

      {/* Amount */}
      <input
        type="number"
        min="0"
        step="any"
        placeholder={`Amount (${isEthToAur ? "ETH" : "AUR"})`}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      {/* Estimate */}
      {estimatedOut !== undefined && amountIn && (
        <div style={{ fontSize: 12, color: "var(--muted)", paddingLeft: 2 }}>
          ≈ {isEthToAur ? `${fmtAUR(estimatedOut)} AUR` : `${fmtETH(estimatedOut)} ETH`}
        </div>
      )}

      {/* Slippage */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0 }}>
          Slippage
        </span>
        <input
          type="number"
          min="0.1"
          max="50"
          step="0.1"
          value={slippage}
          onChange={(e) => setSlippage(e.target.value)}
          style={{ width: 64, padding: "6px 8px", fontSize: 12 }}
        />
        <span style={{ fontSize: 12, color: "var(--muted)" }}>%</span>
      </div>

      {/* CTA */}
      {needsApproval ? (
        <button
          className="btn-primary"
          disabled={!valid || busy}
          onClick={() => amountIn && doApprove({ address: AUR_ADDRESS, abi: AUR_ABI, functionName: "approve", args: [AMM_ADDRESS, amountIn] })}
        >
          {approvePending || approveConfirming ? "Approving…" : "Approve AUR"}
        </button>
      ) : (
        <button
          className="btn-primary"
          disabled={!valid || busy}
          onClick={() => {
            if (!amountIn) return;
            if (isEthToAur) {
              doSwap({ address: AMM_ADDRESS, abi: AMM_ABI, functionName: "swapETHForTokens", args: [minOut], value: amountIn });
            } else {
              doSwap({ address: AMM_ADDRESS, abi: AMM_ABI, functionName: "swapTokensForETH", args: [amountIn, minOut] });
            }
          }}
        >
          {swapPending || swapConfirming ? "Swapping…" : `Swap ${isEthToAur ? "ETH → AUR" : "AUR → ETH"}`}
        </button>
      )}

      {approveSuccess && <p className="status ok">Approval confirmed</p>}
      {swapSuccess    && <p className="status ok">Swap confirmed</p>}
      {error && <p className="status err">{error instanceof BaseError ? error.shortMessage : error.message}</p>}
    </div>
  );
}

// ── LiquidityPanel ────────────────────────────────────────────────────────────

function LiquidityPanel() {
  const { address } = useAccount();
  const [liqTab, setLiqTab] = useState<LiqTab>("add");

  const { data: reserveToken }                        = useReadContract({ address: AMM_ADDRESS, abi: AMM_ABI, functionName: "reserveToken" });
  const { data: reserveEth }                          = useReadContract({ address: AMM_ADDRESS, abi: AMM_ABI, functionName: "reserveEth" });
  const { data: totalShares }                         = useReadContract({ address: AMM_ADDRESS, abi: AMM_ABI, functionName: "totalShares" });
  const { data: userShares, refetch: refetchShares }  = useReadContract({
    address: AMM_ADDRESS,
    abi: AMM_ABI,
    functionName: "shares",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const poolEmpty = !totalShares || totalShares === 0n;

  return (
    <div>
      {/* Pool stats */}
      <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "var(--muted)", display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>ETH reserve</span>
          <span>{reserveEth   !== undefined ? fmtETH(reserveEth)       : "—"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>AUR reserve</span>
          <span>{reserveToken !== undefined ? fmtAUR(reserveToken)     : "—"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Your shares</span>
          <span>{userShares   !== undefined ? fmtShares(userShares)    : "—"}</span>
        </div>
      </div>

      <div className="tab-bar" style={{ marginBottom: 16 }}>
        <button className={liqTab === "add"    ? "active" : ""} onClick={() => setLiqTab("add")}>Add</button>
        <button className={liqTab === "remove" ? "active" : ""} onClick={() => setLiqTab("remove")}>Remove</button>
      </div>

      {liqTab === "add"
        ? <AddPanel poolEmpty={poolEmpty} reserveToken={reserveToken} reserveEth={reserveEth} />
        : <RemovePanel userShares={userShares} refetchShares={refetchShares} />
      }
    </div>
  );
}

// ── AddPanel ──────────────────────────────────────────────────────────────────

function AddPanel({ poolEmpty, reserveToken, reserveEth }: {
  poolEmpty: boolean;
  reserveToken: bigint | undefined;
  reserveEth:   bigint | undefined;
}) {
  const { address } = useAccount();
  const [ethAmount,   setEthAmount]   = useState("");
  const [tokenAmount, setTokenAmount] = useState("");

  const ethParsed = useMemo(() => {
    try { return ethAmount && Number(ethAmount) > 0 ? parseEther(ethAmount) : null; }
    catch { return null; }
  }, [ethAmount]);

  const tokenParsed = useMemo(() => {
    try { return tokenAmount && Number(tokenAmount) > 0 ? parseUnits(tokenAmount, 18) : null; }
    catch { return null; }
  }, [tokenAmount]);

  // For an existing pool, derive required tokens from the current ratio + 0.5% slippage buffer.
  const requiredToken = useMemo(() => {
    if (poolEmpty || !ethParsed || !reserveToken || !reserveEth || reserveEth === 0n) return null;
    return (ethParsed * reserveToken) / reserveEth;
  }, [poolEmpty, ethParsed, reserveToken, reserveEth]);

  // tokenCap is what we approve and pass to addLiquidity as the slippage cap.
  const tokenCap = poolEmpty
    ? tokenParsed
    : requiredToken !== null ? requiredToken + (requiredToken / 200n) : null; // +0.5%

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: AUR_ADDRESS,
    abi: AUR_ABI,
    functionName: "allowance",
    args: address ? [address, AMM_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  const needsApproval = !!tokenCap && (allowance === undefined || allowance < tokenCap);

  const { writeContract: doApprove, data: approveHash, isPending: approvePending, error: approveError } = useWriteContract();
  const { isLoading: approveConfirming, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
  useEffect(() => { if (approveSuccess) refetchAllowance(); }, [approveSuccess]);

  const { writeContract: doAdd, data: addHash, isPending: addPending, error: addError } = useWriteContract();
  const { isLoading: addConfirming, isSuccess: addSuccess } = useWaitForTransactionReceipt({ hash: addHash });
  useEffect(() => { if (addSuccess) { setEthAmount(""); setTokenAmount(""); } }, [addSuccess]);

  const busy  = approvePending || approveConfirming || addPending || addConfirming;
  const valid = !!ethParsed && !!tokenCap;
  const error = approveError ?? addError;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <input
        type="number"
        min="0"
        step="any"
        placeholder="ETH amount"
        value={ethAmount}
        onChange={(e) => setEthAmount(e.target.value)}
      />

      {poolEmpty ? (
        <input
          type="number"
          min="0"
          step="any"
          placeholder="AUR amount (sets initial price)"
          value={tokenAmount}
          onChange={(e) => setTokenAmount(e.target.value)}
        />
      ) : requiredToken !== null && (
        <div style={{ fontSize: 12, color: "var(--muted)", paddingLeft: 2 }}>
          Required: {fmtAUR(requiredToken)} AUR (current ratio)
        </div>
      )}

      {needsApproval ? (
        <button
          className="btn-primary"
          disabled={!valid || busy}
          onClick={() => tokenCap && doApprove({ address: AUR_ADDRESS, abi: AUR_ABI, functionName: "approve", args: [AMM_ADDRESS, tokenCap] })}
        >
          {approvePending || approveConfirming ? "Approving…" : "Approve AUR"}
        </button>
      ) : (
        <button
          className="btn-primary"
          disabled={!valid || busy}
          onClick={() => {
            if (!ethParsed || !tokenCap) return;
            doAdd({ address: AMM_ADDRESS, abi: AMM_ABI, functionName: "addLiquidity", args: [tokenCap], value: ethParsed });
          }}
        >
          {addPending || addConfirming ? "Adding…" : "Add Liquidity"}
        </button>
      )}

      {approveSuccess && <p className="status ok">Approval confirmed</p>}
      {addSuccess     && <p className="status ok">Liquidity added</p>}
      {error && <p className="status err">{error instanceof BaseError ? error.shortMessage : error.message}</p>}
    </div>
  );
}

// ── RemovePanel ───────────────────────────────────────────────────────────────

function RemovePanel({ userShares, refetchShares }: {
  userShares:    bigint | undefined;
  refetchShares: () => void;
}) {
  const [shares, setShares] = useState("");

  const sharesParsed = useMemo(() => {
    try { return shares && Number(shares) > 0 ? parseUnits(shares, 18) : null; }
    catch { return null; }
  }, [shares]);

  const valid = !!sharesParsed && !!userShares && sharesParsed <= userShares;

  const { writeContract: doRemove, data: removeHash, isPending: removePending, error: removeError } = useWriteContract();
  const { isLoading: removeConfirming, isSuccess: removeSuccess } = useWaitForTransactionReceipt({ hash: removeHash });
  useEffect(() => { if (removeSuccess) { refetchShares(); setShares(""); } }, [removeSuccess]);

  const noShares = userShares !== undefined && userShares === 0n;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {noShares ? (
        <p style={{ fontSize: 12, color: "var(--muted)" }}>You have no LP shares to remove.</p>
      ) : userShares !== undefined && (
        <div style={{ fontSize: 12, color: "var(--muted)", paddingLeft: 2 }}>
          Your shares: {fmtShares(userShares)}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="number"
          min="0"
          step="any"
          placeholder="Shares to burn"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          disabled={noShares}
        />
        {!noShares && userShares !== undefined && (
          <button className="btn-ghost" style={{ whiteSpace: "nowrap" }} onClick={() => setShares(formatUnits(userShares, 18))}>
            Max
          </button>
        )}
      </div>

      <button
        className="btn-danger"
        disabled={!valid || removePending || removeConfirming}
        onClick={() => sharesParsed && doRemove({ address: AMM_ADDRESS, abi: AMM_ABI, functionName: "removeLiquidity", args: [sharesParsed] })}
      >
        {removePending || removeConfirming ? "Removing…" : "Remove Liquidity"}
      </button>

      {removeSuccess && <p className="status ok">Liquidity removed</p>}
      {removeError && <p className="status err">{removeError instanceof BaseError ? removeError.shortMessage : removeError.message}</p>}
    </div>
  );
}
