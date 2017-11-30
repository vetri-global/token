# Notes

This is a collection of small notes and explanations regarding security issues
of ERC20 and our token contract.

## ERC20 Approve/TransferFrom Race Condition

The ERC20 interface has a problem that enables a race condition [1] when using
the `approve`/`transferFrom` functions for letting a third party (the spender)
withdraw money. The race condition allows the spender to withdraw more tokens
than intended when `approve` is called multiple times for the same spender.

The issue can be mitigated by calling `approve` with an ammount of zero first,
then verifying that the spender didn't withdraw any tokens and then calling
`approve` again, to set the new allowed value.

Initially the smart contract tried to enforce this workflow by `throw`ing when
`approve` is called when the ammount is not zero. In this case the approver
still needs to take the steps described above and check how much tokens have
already been withdrawn by the spender. However since community consent changed
against implementing this check (e.g. OpenZeppelin first added, then removed
the checks after discussions in [2]), we also removed it.

[1] https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729  
[2] https://github.com/OpenZeppelin/zeppelin-solidity/issues/438

## ERC20 Short Address Attack Mitigation

The recommendation from [3] was followed, meaning the smart contract will not
check the payload size (`msg.data.length`), as it can cause problems when
interfacing with other contracts (e.g. multisignature wallets).

[3] https://blog.coinfabrik.com/smart-contract-short-address-attack-mitigation-failure/
