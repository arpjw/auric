// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Auric is ERC20, Ownable {
    error TaxTooHigh();

    event TaxUpdated(uint16 oldBps, uint16 newBps);

    uint16 public constant MAX_TAX_BPS = 1_000; // 10%

    address public immutable treasury;
    uint16 public taxBps; // 0 by default (no tax)

    constructor(address initialOwner, address _treasury) ERC20("Auric", "AUR") Ownable(initialOwner) {
        treasury = _treasury;
        _mint(initialOwner, 1_000_000 * 10 ** decimals());
    }

    function setTaxBps(uint16 newBps) external onlyOwner {
        if (newBps > MAX_TAX_BPS) revert TaxTooHigh();
        emit TaxUpdated(taxBps, newBps);
        taxBps = newBps;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /// Intercepts all token movements. Tax is applied only on transfers
    /// (not mint or burn) and only when taxBps > 0.
    function _update(address from, address to, uint256 value) internal override {
        if (from != address(0) && to != address(0) && taxBps > 0) {
            uint256 tax = (value * taxBps) / 10_000;
            if (tax > 0) {
                super._update(from, treasury, tax);
            }
            super._update(from, to, value - tax);
        } else {
            super._update(from, to, value);
        }
    }
}
