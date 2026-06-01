# Deployment Reference

## Auric Token (deployed)

| Field | Value |
|---|---|
| Contract | `0x650b1AdD632D1a3f09168FdF617F65d8D88d88db` |
| Network | Sepolia |
| Chain ID | 11155111 |
| Etherscan | https://sepolia.etherscan.io/token/0x650b1AdD632D1a3f09168FdF617F65d8D88d88db |
| Sourcify | https://sourcify.dev/#/lookup/0x650b1AdD632D1a3f09168FdF617F65d8D88d88db |
| Deploy tx | `0x3bc9e95fab3ec6f6a92a18968c022e84527c7cb2e4d4188d450b91c2b6577fdf` |
| Block | 10,969,615 |
| Gas paid | 0.00122975 ETH |

## Deploy Commands

### Environment variables

All scripts read from `.env` via `vm.env*`. Required vars per contract:

**Auric**
```
DEPLOYER_ADDRESS=<owner and initial mint recipient>
TREASURY_ADDRESS=<tax recipient>
```

**TokenVesting**
```
AUR_TOKEN_ADDRESS=<deployed Auric address>
VESTING_BENEFICIARY=<address that receives vested tokens>
CLIFF_DURATION_SECONDS=<optional, default 2592000 (30 days)>
VESTING_DURATION_SECONDS=<optional, default 31536000 (365 days)>
VESTING_DEPOSIT_AMOUNT=<optional, default 0 — skip deposit>
```

**AuricAMM**
```
AUR_TOKEN_ADDRESS=<deployed Auric address>
```

---

### 1. Auric

```bash
forge script script/Deploy.s.sol \
  --rpc-url sepolia \
  --broadcast \
  --verify
```

### 2. TokenVesting

```bash
forge script script/DeployVesting.s.sol \
  --rpc-url sepolia \
  --broadcast \
  --verify
```

### 3. AuricAMM

No Forge script exists for AuricAMM. Deploy with `forge create`:

```bash
forge create src/AuricAMM.sol:AuricAMM \
  --rpc-url sepolia \
  --broadcast \
  --verify \
  --constructor-args $AUR_TOKEN_ADDRESS
```

---

## Notes

- All scripts use `vm.startBroadcast()` with the key derived from the shell environment (set `PRIVATE_KEY` or use `--ledger`).
- `--verify` submits to Etherscan; ensure `ETHERSCAN_API_KEY` is set in `.env` or the environment.
- AuricAMM requires `taxBps == 0` on the Auric token; set it with `cast send` before seeding the pool.
