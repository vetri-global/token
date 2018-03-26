var ValidToken = artifacts.require('./ValidToken.sol')
var utils = require('./support/minting.js')


contract('ValidToken', (accounts) => {
    // redeploy token contract before each test
    var contract
    beforeEach(function () {
        return ValidToken.new()
            .then(function (instance) {
                contract = instance;
            });
    })

    const evmThrewRevertError = (err) => {
        if (err.toString().includes('Error: VM Exception while processing transaction: revert')) {
            return true
        }
        if (err.toString().includes('invalid opcode')) {
            return true
        }
        return false
    }


    // time manipulation helpers

    const getBlockTime = () => {
        return web3.eth.getBlock(web3.eth.blockNumber).timestamp
    }

    const increaseTime = (seconds) => {
        return new Promise((resolve, reject) => {
          web3.currentProvider.sendAsync({
            jsonrpc: '2.0',
            method: 'evm_increaseTime',
            params: [seconds],
            id: new Date().getTime(),
          }, (err, result) => {
            if (err) {
              return reject(err)
            }

            web3.currentProvider.sendAsync({
              jsonrpc: '2.0',
              method: 'evm_mine',
              id: new Date().getTime(),
            }, (err, result) => {
              if (err) {
                return reject(err)
              }

              resolve()
            })
          })
        })
    }

    const advanceTimeTo = async (time) => {
        let difference = time - getBlockTime()

        if (difference > 0) {
          await increaseTime(difference)
          return true
        }

        return false
    }


    describe("ERC20 Basic Functionality", () => {
        it("test ERC20 basic functionality", function () {
            return ValidToken.deployed().then(function (instance) {
                return utils.testMint(contract, accounts, 1000, 0, 0);
            }).then(function (retVal) {
                return contract.transfer(accounts[1], 1, {from: accounts[0]});
            }).then(function (retVal) {
                assert.equal(false, "account 1 does not have any tokens");
            }).catch(function (e) {
                return contract.transfer(accounts[1], 0, {from: accounts[1]});
            }).then(function (retVal) {
                assert.equal(false, "cannot transfor 0 tokens");
            }).catch(function (e) {
                return contract.transfer(accounts[1], -1, {from: accounts[1]});
            }).then(function (retVal) {
                assert.equal(false, "negative values are not possible");
            }).catch(function (e) {
                return contract.transfer(accounts[0], 1, {from: accounts[1]});
            }).then(function (retVal) {
                assert.equal(false, "cannot steal tokens from another account");
            }).catch(function (e) {
                return contract.transfer(accounts[0], 1001, {from: accounts[1]});
            }).then(function (retVal) {
                assert.equal(false, "account 0 only has 1000 tokens, cannot transfor 1001");
            }).catch(function (e) {
                return contract.transfer(accounts[0], 1000, {from: accounts[0]});
            }).then(function (retVal) {
                //transfer was successful
                return contract.balanceOf(accounts[0], {from: accounts[0]});
            }).then(function (balance) {
                assert.equal(balance.valueOf(), 1000, "we sent from account 0 to account 0, so account 0 has 1000 tokens");
                return contract.transfer(accounts[1], 1000, {from: accounts[0]});
            }).then(function (retVal) {
                return contract.balanceOf(accounts[0], {from: accounts[1]});
            }).then(function (balance) {
                assert.equal(balance.valueOf(), 0, "we transfer all tokens to account 1");
                return contract.balanceOf(accounts[1], {from: accounts[2]});
            }).then(function (balance) {
                assert.equal(balance.valueOf(), 1000, "account 1 has 1000 tokenscd ");
            }).catch((err) => {
                throw new Error(err)
            })
        })

        it('creation: should create an initial balance of 0 for everyone', function () {
            ValidToken.new({from: accounts[0]}).then(function (ctr) {
                return ctr.balanceOf(accounts[0])
            }).then(function (result) {
                assert.strictEqual(result.toNumber(), 0)
            }).catch((err) => {
                throw new Error(err)
            })
        })
    })


    describe("ERC20 Regular Transfers", () => {
        // this is not *good* enough as the contract could still throw an error otherwise.
        // ideally one should check balances before and after, but estimateGas currently always throws an error.
        // it's not giving estimate on gas used in the event of an error.
        it('transfers: ether transfer should be reversed.', function () {
            var ctr
            return ValidToken.new({from: accounts[0]}).then(function (result) {
                ctr = result
                return web3.eth.sendTransaction({from: accounts[0], to: ctr.address, value: web3.toWei('10', 'Ether')})
            }).catch(function (result) {
                assert(true)
            }).catch((err) => {
                throw new Error(err)
            })
        })

        it('transfers: should transfer 10000 to accounts[1] with accounts[0] having 10000', function () {
            return ValidToken.deployed().then(function (instance) {
                return utils.testMint(contract, accounts, 10000, 0, 0);
            }).then(function (result) {
                return contract.transfer(accounts[1], 10000, {from: accounts[0]})
            }).then(function (result) {
                return contract.balanceOf(accounts[1])
            }).then(function (result) {
                assert.strictEqual(result.toNumber(), 10000)
            }).catch((err) => {
                throw new Error(err)
            })
        })

        it('transfers: should fail when trying to transfer 10001 to accounts[1] with accounts[0] having 10000', function () {
            return ValidToken.deployed().then(function (instance) {
                return utils.testMint(contract, accounts, 10000, 0, 0);
            }).then(function (result) {
                return contract.transfer(accounts[1], 10001, {from: accounts[0]})
            }).then(function (result) {
                assert(false, 'The preceding call should have thrown an error.')
            }).catch((err) => {
                assert(evmThrewRevertError(err), 'the EVM did not throw an error or did not ' +
                    'throw the expected error')
            })
        })

        it('transfers: should fail when trying to transfer to contract address', function () {
            return ValidToken.deployed().then(function (instance) {
                return utils.testMint(contract, accounts, 10000, 0, 0);
            }).then(function (result) {
                return contract.transfer(contract.address, 5000, {from: accounts[0]})
            }).then(function (result) {
                assert(false, 'The preceding call should have thrown an error.')
            }).catch((err) => {
                assert(evmThrewRevertError(err), 'the EVM did not throw an error or did not ' +
                    'throw the expected error')
            })
        })

        it('transfers: should fail when trying to transfer to 0x0', function () {
            return ValidToken.deployed().then(function (instance) {
                return utils.testMint(contract, accounts, 10000, 0, 0);
            }).then(function (result) {
                return contract.transfer(0x0, 5000, {from: accounts[0]})
            }).then(function (result) {
                assert(false, 'The preceding call should have thrown an error.')
            }).catch((err) => {
                assert(evmThrewRevertError(err), 'the EVM did not throw an error or did not ' +
                    'throw the expected error')
            })
        })

        // NOTE: testing uint256 wrapping is impossible in this standard token since you can't supply > 2^256 -1.
    })


    describe("ERC20 Approvals", () => {
        it('approvals: msg.sender should approve 100 to accounts[1]', function () {
            return ValidToken.deployed().then(function (instance) {
                return utils.testMint(contract, accounts, 10000, 0, 0);
            }).then(function (result) {
                return contract.approve(accounts[1], 100, {from: accounts[0]})
            }).then(function (result) {
                return contract.allowance(accounts[0], accounts[1])
            }).then(function (result) {
                assert.strictEqual(result.toNumber(), 100)
            }).catch((err) => {
                throw new Error(err)
            })
        })

        it('approvals: msg.sender approves accounts[1] of 100 & withdraws 20 once.', function () {
            return ValidToken.deployed().then(function (instance) {
                return utils.testMint(contract, accounts, 10000, 0, 0);
            }).then(function (result) {
                return contract.balanceOf(accounts[0])
            }).then(function (result) {
                assert.strictEqual(result.toNumber(), 10000)
                return contract.approve(accounts[1], 100, {from: accounts[0]})
            }).then(function (result) {
                return contract.balanceOf(accounts[2])
            }).then(function (result) {
                assert.strictEqual(result.toNumber(), 0)
                return contract.allowance(accounts[0], accounts[1])
            }).then(function (result) {
                assert.strictEqual(result.toNumber(), 100)
                return contract.transferFrom(accounts[0], accounts[2], 20, {from: accounts[1]})
            }).then(function (result) {
                return contract.allowance(accounts[0], accounts[1])
            }).then(function (result) {
                assert.strictEqual(result.toNumber(), 80)
                return contract.balanceOf(accounts[2])
            }).then(function (result) {
                assert.strictEqual(result.toNumber(), 20)
                return contract.balanceOf(accounts[1])
            }).then(function (result) {
                assert.strictEqual(result.toNumber(), 0)
                return contract.balanceOf(accounts[0])
            }).then(function (result) {
                assert.strictEqual(result.toNumber(), 9980)
            }).catch((err) => {
                throw new Error(err)
            })
        })

        // should approve 100 of msg.sender & withdraw 50, twice. (should succeed)
        it('approvals: msg.sender approves accounts[1] of 100 & withdraws 20 twice.', function () {
            return ValidToken.deployed().then(function (instance) {
                return utils.testMint(contract, accounts, 10000, 0, 0);
            }).then(function (result) {
                return contract.approve(accounts[1], 100, {from: accounts[0]})
            }).then(function (result) {
                return contract.allowance(accounts[0], accounts[1])
            }).then(function (result) {
                assert.strictEqual(result.toNumber(), 100)
                return contract.transferFrom(accounts[0], accounts[2], 20, {from: accounts[1]})
            }).then(function (result) {
                return contract.allowance(accounts[0], accounts[1])
            }).then(function (result) {
                assert.strictEqual(result.toNumber(), 80)
                return contract.balanceOf(accounts[2])
            }).then(function (result) {
                assert.strictEqual(result.toNumber(), 20)
                return contract.balanceOf(accounts[0])
            }).then(function (result) {
                assert.strictEqual(result.toNumber(), 9980)
                // FIRST tx done.
                // onto next.
                return contract.transferFrom(accounts[0], accounts[2], 20, {from: accounts[1]})
            }).then(function (result) {
                return contract.allowance(accounts[0], accounts[1])
            }).then(function (result) {
                assert.strictEqual(result.toNumber(), 60)
                return contract.balanceOf(accounts[2])
            }).then(function (result) {
                assert.strictEqual(result.toNumber(), 40)
                return contract.balanceOf(accounts[0])
            }).then(function (result) {
                assert.strictEqual(result.toNumber(), 9960)
            }).catch((err) => {
                throw new Error(err)
            })
        })

        // should approve 100 of msg.sender & withdraw 50 & 60 (should fail).
        it('approvals: msg.sender approves accounts[1] of 100 & withdraws 50 & 60 (2nd tx should fail)', function () {
            return ValidToken.deployed().then(function (instance) {
                return utils.testMint(contract, accounts, 10000, 0, 0);
            }).then(function (result) {
                return contract.approve(accounts[1], 100, {from: accounts[0]})
            }).then(function (result) {
                return contract.allowance(accounts[0], accounts[1])
            }).then(function (result) {
                assert.strictEqual(result.toNumber(), 100)
                return contract.transferFrom(accounts[0], accounts[2], 50, {from: accounts[1]})
            }).then(function (result) {
                return contract.allowance(accounts[0], accounts[1])
            }).then(function (result) {
                assert.strictEqual(result.toNumber(), 50)
                return contract.balanceOf(accounts[2])
            }).then(function (result) {
                assert.strictEqual(result.toNumber(), 50)
                return contract.balanceOf(accounts[0])
            }).then(function (result) {
                assert.strictEqual(result.toNumber(), 9950)
                // FIRST tx done.
                // onto next.
                return contract.transferFrom(accounts[0], accounts[2], 60, {from: accounts[1]})
            }).then(function (result) {
                assert(false, 'The preceding call should have thrown an error.')
            }).catch((err) => {
                assert(evmThrewRevertError(err), 'the EVM did not throw an error or did not ' +
                    'throw the expected error')
            })
        })

        it('approvals: attempt withdrawal from acconut with no allowance (should fail)', function () {
            return ValidToken.deployed().then(function (instance) {
                return utils.testMint(contract, accounts, 10000, 0, 0);
            }).then(function (result) {
                return contract.transferFrom(accounts[0], accounts[2], 60, {from: accounts[1]})
            }).then(function (result) {
                assert(false, 'The preceding call should have thrown an error.')
            }).catch((err) => {
                assert(evmThrewRevertError(err), 'the EVM did not throw an error or did not ' +
                    'throw the expected error')
            })
        })

        it('approvals: allow accounts[1] 100 to withdraw from accounts[0]. Withdraw 60 and then approve 0 & attempt transfer.', function () {
            return ValidToken.deployed().then(function (instance) {
                return utils.testMint(contract, accounts, 10000, 0, 0);
            }).then(function (result) {
                return contract.approve(accounts[1], 100, {from: accounts[0]})
            }).then(function (result) {
                return contract.transferFrom(accounts[0], accounts[2], 60, {from: accounts[1]})
            }).then(function (result) {
                return contract.approve(accounts[1], 0, {from: accounts[0]})
            }).then(function (result) {
                return contract.transferFrom(accounts[0], accounts[2], 10, {from: accounts[1]})
            }).then(function (result) {
                assert(false, 'The preceding call should have thrown an error.')
            }).catch((err) => {
                assert(evmThrewRevertError(err), 'the EVM did not throw an error or did not ' +
                    'throw the expected error')
            })
        })

        it('approvals: approve max (2^256 - 1)', function () {
            return ValidToken.deployed().then(function (instance) {
                return utils.testMint(contract, accounts, 10000, 0, 0);
            }).then(function (result) {
                return contract.approve(accounts[1], '115792089237316195423570985008687907853269984665640564039457584007913129639935', {from: accounts[0]})
            }).then(function (result) {
                return contract.allowance(accounts[0], accounts[1])
            }).then(function (result) {
                var match = result.equals('1.15792089237316195423570985008687907853269984665640564039457584007913129639935e+77')
                assert.isTrue(match)
            }).catch((err) => {
                throw new Error(err)
            })
        })

        it('approve: should fail when trying to transfer to contract address', function () {
            return ValidToken.deployed().then(function (instance) {
                return utils.testMint(contract, accounts, 10000, 0, 0);
            }).then(function (result) {
                return contract.approve(accounts[1], 100, {from: accounts[0]})
            }).then(function (result) {
                return contract.transferFrom(accounts[0], contract.address, 100, {from: accounts[1]})
            }).then(function (result) {
                assert(false, 'The preceding call should have thrown an error.')
            }).catch((err) => {
                assert(evmThrewRevertError(err), 'the EVM did not throw an error or did not ' +
                    'throw the expected error')
            })
        })

        it('approve: should fail when trying to transfer to 0x0', function () {
            return ValidToken.deployed().then(function (instance) {
                return utils.testMint(contract, accounts, 10000, 0, 0);
            }).then(function (result) {
                return contract.approve(accounts[1], 100, {from: accounts[0]})
            }).then(function (result) {
                return contract.transferFrom(accounts[0], 0x0, 100, {from: accounts[1]})
            }).then(function (result) {
                assert(false, 'The preceding call should have thrown an error.')
            }).catch((err) => {
                assert(evmThrewRevertError(err), 'the EVM did not throw an error or did not ' +
                    'throw the expected error')
            })
        })
    })


    describe("ERC20 Events", () => {
        it('events: minting should fire Transfer event properly', function () {
            return ValidToken.deployed().then(function (instance) {
                return contract.mint([accounts[0]], [1000])
            }).then(function (result) {
                let evt = result.logs[0].args
                assert.strictEqual(result.logs[0].event, 'Transfer')
                assert.strictEqual(evt._from, '0x0000000000000000000000000000000000000000')
                assert.strictEqual(evt._to, accounts[0])
                assert.strictEqual(evt._value.toString(), '1000')
            }).catch((err) => {
                throw new Error(err)
            })
        })

        it('events: should fire Transfer event properly', function () {
            return ValidToken.deployed().then(function (instance) {
                return utils.testMint(contract, accounts, 10000, 0, 0);
            }).then(function (result) {
                return contract.transfer(accounts[1], '2666', {from: accounts[0]})
            }).then(function (result) {
                assert.strictEqual(result.logs[0].args._from, accounts[0])
                assert.strictEqual(result.logs[0].args._to, accounts[1])
                assert.strictEqual(result.logs[0].args._value.toString(), '2666')
            }).catch((err) => {
                throw new Error(err)
            })
        })

        it('events: should generate an event on zero-transfers', function () {
            return ValidToken.deployed().then(function (instance) {
                return utils.testMint(contract, accounts, 10000, 0, 0);
            }).then(function (result) {
                return contract.transfer(accounts[1], '0', {from: accounts[0]})
            }).then(function (result) {
                assert.strictEqual(result.logs[0].args._from, accounts[0])
                assert.strictEqual(result.logs[0].args._to, accounts[1])
                assert.strictEqual(result.logs[0].args._value.toString(), '0')
            }).catch((err) => {
                throw new Error(err);
            })
        })

        it('events: should fail on minting max tokens', function () {
            return ValidToken.deployed().then(function (instance) {
                return utils.testMint(contract, accounts, (new web3.BigNumber(10)).pow(27).add(1), 0, 0);
            }).then(function (result) {
                assert(false, 'The preceding call should have thrown an error.')
            }).catch((err) => {
                assert(evmThrewRevertError(err), 'the EVM did not throw an error or did not ' +
                    'throw the expected error:' + err)
            })
        })
        it('events: should not fail on minting max tokens', function () {
            return ValidToken.deployed().then(function (instance) {
                return utils.testMint(contract, accounts, (new web3.BigNumber(10)).pow(27), 0, 0);
            }).then(function (result) {
                assert(true, 'The preceding call should not have thrown an error.')
            }).catch((err) => {
                assert(evmThrewRevertError(err), 'the EVM did not throw an error or did not ' +
                    'throw the expected error:' + err)
            })
        })

        it('events: should fire Approval event properly', function () {
            return ValidToken.deployed().then(function (instance) {
                return utils.testMint(contract, accounts, 10000, 0, 0);
            }).then(function (result) {
                return contract.approve(accounts[1], '2666', {from: accounts[0]})
            }).then(function (result) {
                var approvalLog = result.logs.find((element) => {
                    if (element.event.match('Approval')) {return true} else {return false}
                })
                assert.strictEqual(approvalLog.args._owner, accounts[0])
                assert.strictEqual(approvalLog.args._spender, accounts[1])
                assert.strictEqual(approvalLog.args._value.toString(), '2666')
            }).catch((err) => {
                throw new Error(err)
            })
        })

        it('events: should fire transferFrom event properly', function () {
            return ValidToken.deployed().then(function (instance) {
                return utils.testMint(contract, accounts, 10000, 0, 0);
            }).then(function (result) {
                return contract.approve(accounts[1], '2666', {from: accounts[0]})
            }).then(function (result) {
                return contract.transferFrom(accounts[0], accounts[2], '2666', {from: accounts[1]})
            }).then(function (result) {
                assert.strictEqual(result.logs[0].args._from, accounts[0])
                assert.strictEqual(result.logs[0].args._to, accounts[2])
                assert.strictEqual(result.logs[0].args._value.toString(), '2666')
            }).catch((err) => {
                throw new Error(err)
            })
        })
    })


    describe("Lockups", () => {
        let startTime

        beforeEach(async () => {
            await contract.mint(
              [accounts[0], accounts[1], accounts[2]],
              [1000, 100, 10]
            )

            startTime = getBlockTime()
            await contract.lockTokens(
              [accounts[0], accounts[1], accounts[2]],
              [startTime+1000, startTime+2000, startTime+3000]
            )

            await contract.finishMinting()
        })

        it('should not be able to withdraw funds before lockup is over', async () => {
            await assertActionThrows(async () => {
              await contract.transfer(accounts[3], 1, { from: accounts[0] })
            })

            // increase time to just before lockup expires
            assert.equal(await advanceTimeTo(startTime + 999), true)
            await assertActionThrows(async () => {
              await contract.transfer(accounts[3], 1, { from: accounts[0] })
            })

            // also check a second account
            await assertActionThrows(async () => {
              await contract.transfer(accounts[3], 1, { from: accounts[1] })
            })
        })

        it('should not be able to withdraw funds before lockup is over with transferFrom', async () => {
            await contract.approve(accounts[3], 1000, { from: accounts[0] });
            await assertActionThrows(async () => {
                await contract.transferFrom(accounts[0], accounts[3], 1000, { from: accounts[3] })
            })

            // increase time to just before lockup expires
            assert.equal(await advanceTimeTo(startTime + 999), true)
            await assertActionThrows(async () => {
                await contract.transferFrom(accounts[0], accounts[3], 1000, { from: accounts[3] })
            })
        })

        it('should be able to withdraw funds after lockup expires', async () => {
            // increase time to end of accounts[0] lockup (1, 2 should still be locked)
            assert.equal(true, await advanceTimeTo(startTime + 1000))

            // check transfers from all accounts with lockups
            await contract.transfer(accounts[3], 1, { from: accounts[0] })
            await assertActionThrows(async () => {
              await contract.transfer(accounts[3], 1, { from: accounts[1] })
            })
            await assertActionThrows(async () => {
              await contract.transfer(accounts[3], 1, { from: accounts[2] })
            })

            // increase time to end of all lockups
            assert.equal(true, await advanceTimeTo(startTime + 3000))

            // check transfers from all accounts with lockups again
            let transfers = [
              await contract.transfer(accounts[3], 1, { from: accounts[0] }),
              await contract.transfer(accounts[3], 1, { from: accounts[1] }),
              await contract.transfer(accounts[3], 1, { from: accounts[2] }),
            ]
        })

        it('should be able to withdraw funds after lockup is over with transferFrom', async () => {
            await contract.approve(accounts[3], 1000, { from: accounts[0] });
            await assertActionThrows(async () => {
                await contract.transferFrom(accounts[0], accounts[3], 1000, { from: accounts[3] })
            })

            // increase time to end of accounts[0] lockup
            assert.equal(await advanceTimeTo(startTime + 1000), true)
            // withdraw tokens
            await contract.transferFrom(accounts[0], accounts[3], 1000, { from: accounts[3] })
        })

        // accounts without lockups should be covered by regular ERC20 tests
    })

})
