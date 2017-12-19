pragma solidity ^0.4.2;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/ValidToken.sol";


contract TestValidToken {
    function testInitialBalanceUsingDeployedContract() public {
        ValidToken valid = ValidToken(DeployedAddresses.ValidToken());
        Assert.equal(valid.balanceOf(tx.origin), 0, "No coins minted initially");
    }

    function testInitialBalanceWithNewValidToken() public {
        ValidToken valid = new ValidToken();
        Assert.equal(valid.balanceOf(tx.origin), 0, "No coins minted initially");
    }
}
