pragma solidity ^0.4.2;


import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/SovereignCoin.sol";


contract TestSovereigncoin {

    function testInitialBalanceUsingDeployedContract() {
        SovereignCoin sov = SovereignCoin(DeployedAddresses.SovereignCoin());
        Assert.equal(sov.balanceOf(tx.origin), 0, "No coins minted initially");

    }

    function testInitialBalanceWithNewSovereignCoin() {
        SovereignCoin sov = new SovereignCoin();
        Assert.equal(sov.balanceOf(tx.origin), 0, "No coins minted initially");
    }

    function testMintingWithoutGoldAmount() {
        SovereignCoin sov = new SovereignCoin();

        Assert.isFalse(sov.mint(tx.origin, 10), "Cannot mint without gold amount");
    }

    function testGoldAmountOracle() {
        SovereignCoin sov = new SovereignCoin();
        sov.setTotalGoldSupply(10);
        Assert.equal(sov.totalGoldSupply(), 10, "Our goldreserves match");
        Assert.equal(sov.totalSupply(), 0, "No coins in circulation yet");
        Assert.isTrue(sov.mint(tx.origin, 5), "Can only mint less than gold reserves");
        Assert.equal(sov.totalSupply(), 5, "Just minted 5 coins");
        Assert.equal(sov.balanceOf(tx.origin), 5, "Correct address received 5 coins");

        Assert.isFalse(sov.mint(tx.origin, 6), "Can not mint more than gold reserves");
        Assert.equal(sov.totalSupply(), 5, "Just minted 5 coins");

        Assert.isTrue(sov.mint(tx.origin, 5), "Can only mint less than gold reserves");
        Assert.equal(sov.totalSupply(), sov.totalGoldSupply(), "Supplies match");

        Assert.isFalse(sov.mint(tx.origin, 1), "No more minting possible");
    }

    function testTokenTransfers() {
        address feeReceiver = 0x26e4d7F7f5bBF9A1De205C540f4Faf4410fe2615;
        address transferReceiver = 0x77A562Df2B17E8b0aa78571597a78b32D7d5c86E;
        address contractOwner = address(this);

        SovereignCoin sov = new SovereignCoin();
        sov.setTotalGoldSupply(100000);
        sov.setIsTokenTransferLocked(false);
        sov.setFeeReceiver(feeReceiver);

        Assert.equal(sov.balanceOf(contractOwner), 0, "Owner address has no balance");
        Assert.equal(sov.balanceOf(transferReceiver), 0, "Receiver address has 0 balance");
        Assert.equal(sov.balanceOf(feeReceiver), 0, "Fee Receiver address has 0 balance");

        Assert.isTrue(sov.mint(contractOwner, 100000), "Can only mint less than gold reserves");
        Assert.equal(sov.totalSupply(), 100000, "Our tokensupplies match");
        Assert.equal(sov.totalGoldSupply(), 100000, "Our goldreserves match");

        Assert.equal(sov.balanceOf(contractOwner), 100000, "Owner address has 100000 balance");
        Assert.equal(sov.balanceOf(transferReceiver), 0, "Receiver address has 0 balance");
        Assert.equal(sov.balanceOf(feeReceiver), 0, "Receiver address has 0 balance");

        Assert.isTrue(sov.transfer(transferReceiver, 10000), "Transfer is successful");

        Assert.equal(sov.balanceOf(contractOwner), 90000, "Owner address has everyhting less transferred");
        Assert.equal(sov.balanceOf(transferReceiver), 9990, "Receiver address has balance less fee");
        Assert.equal(sov.balanceOf(feeReceiver), 10, "Fee Receiver address has fee balance");
    }

}
