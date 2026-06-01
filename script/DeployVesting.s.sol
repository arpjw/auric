// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {TokenVesting} from "../src/TokenVesting.sol";

// Required env vars:
//   AUR_TOKEN_ADDRESS     - deployed Auric contract address
//   VESTING_BENEFICIARY   - address that will receive vested tokens
//
// Optional env vars (with defaults):
//   CLIFF_DURATION_SECONDS   - seconds until cliff (default: 30 days)
//   VESTING_DURATION_SECONDS - total vesting duration in seconds (default: 365 days)
//   VESTING_DEPOSIT_AMOUNT   - tokens to deposit immediately (default: 0, skip deposit)
//
// Deploy:
//   forge script script/DeployVesting.s.sol --rpc-url sepolia --broadcast --verify
contract DeployVesting is Script {
    function run() external returns (TokenVesting) {
        address tokenAddr = vm.envAddress("AUR_TOKEN_ADDRESS");
        address beneficiary = vm.envAddress("VESTING_BENEFICIARY");
        uint64 cliffDuration = uint64(vm.envOr("CLIFF_DURATION_SECONDS", uint256(30 days)));
        uint64 duration = uint64(vm.envOr("VESTING_DURATION_SECONDS", uint256(365 days)));
        uint256 depositAmount = vm.envOr("VESTING_DEPOSIT_AMOUNT", uint256(0));

        vm.startBroadcast();

        TokenVesting vesting = new TokenVesting(tokenAddr, beneficiary, cliffDuration, duration);

        console.log("TokenVesting deployed to:", address(vesting));
        console.log("Token (AUR):            ", tokenAddr);
        console.log("Beneficiary:            ", beneficiary);
        console.log("Start:                  ", vesting.start());
        console.log("Cliff timestamp:        ", vesting.cliff());
        console.log("End timestamp:          ", vesting.end());

        if (depositAmount > 0) {
            IERC20(tokenAddr).approve(address(vesting), depositAmount);
            vesting.deposit(depositAmount);
            console.log("Deposited (wei):        ", depositAmount);
        }

        vm.stopBroadcast();
        return vesting;
    }
}
