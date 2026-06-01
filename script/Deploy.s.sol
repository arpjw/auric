// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {Auric} from "../src/Auric.sol";

contract DeployAuric is Script {
    function run() external returns (Auric) {
        address deployer = vm.envAddress("DEPLOYER_ADDRESS");
        address _treasury = vm.envAddress("TREASURY_ADDRESS");
        vm.startBroadcast();
        Auric token = new Auric(deployer, _treasury);
        console.log("Auric deployed to:", address(token));
        console.log("Owner:", token.owner());
        console.log("Treasury:", token.treasury());
        console.log("Total supply:", token.totalSupply());
        vm.stopBroadcast();
        return token;
    }
}
