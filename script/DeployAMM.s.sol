// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {AuricAMM} from "../src/AuricAMM.sol";

// Required env vars:
//   AUR_TOKEN_ADDRESS - deployed Auric contract address
//
// Deploy:
//   forge script script/DeployAMM.s.sol --rpc-url sepolia --broadcast --verify
contract DeployAMM is Script {
    function run() external returns (AuricAMM) {
        address tokenAddr = vm.envAddress("AUR_TOKEN_ADDRESS");

        vm.startBroadcast();

        AuricAMM amm = new AuricAMM(tokenAddr);

        console.log("AuricAMM deployed to:", address(amm));
        console.log("Token (AUR):         ", tokenAddr);
        console.log("Fee numerator:       ", amm.FEE_NUMERATOR());
        console.log("Fee denominator:     ", amm.FEE_DENOMINATOR());

        vm.stopBroadcast();
        return amm;
    }
}
