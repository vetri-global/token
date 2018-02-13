var Utils = {
    testMint(contract, accounts, account0, account1, account2) {
        return contract.mint([accounts[0]], [account0])
            .then(function () {
                return contract.finishMinting()
            }).catch((err) => {
                throw new Error(err) });
    }
}
module.exports = Utils