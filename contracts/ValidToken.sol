pragma solidity ^0.4.18;


/**
 * @title ERC20 Token Interface
 */
contract ERC20 {
    function totalSupply() public view returns (uint _totalSupply);
    function balanceOf(address _owner) public view returns (uint balance);
    function transfer(address _to, uint _value) public returns (bool success);
    function transferFrom(address _from, address _to, uint _value) public returns (bool success);
    function approve(address _spender, uint _value) public returns (bool success);
    function allowance(address _owner, address _spender) public view returns (uint remaining);
    event Transfer(address indexed _from, address indexed _to, uint _value);
    event Approval(address indexed _owner, address indexed _spender, uint _value);
}


/**
 * @title VALID Token
 * @dev ERC20 compatible smart contract for the VALID token. Closely follows
 *      ConsenSys StandardToken.
 */
contract ValidToken is ERC20 {
    // token metadata
    string public constant name = "VALID";
    string public constant symbol = "VLD";
    uint8 public constant decimals = 18;

    // total supply and maximum amount of tokens
    uint256 public totalSupply = 0;
    uint256 constant maxSupply = 10**9 * 10**uint256(decimals);
    // note: this equals 10**27, which is smaller than uint256 max value (~10**77)

    // token accounting
    mapping(address => uint256) balances;
    mapping(address => mapping(address => uint256)) allowed;

    // ownership
    address public owner;
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    // minting
    bool public mintingDone = false;
    modifier mintingFinished() {
        require(mintingDone == true);
        _;
    }

    // constructor
    function ValidToken() public {
        owner = msg.sender;
    }

    /**
     * @dev Allows the current owner to transfer the ownership.
     * @param _newOwner The address to transfer ownership to.
     */
    function transferOwnership(address _newOwner) public onlyOwner {
        owner = _newOwner;
    }

    // minting functionality

    function mint(address[] _recipients, uint256[] _amounts) public onlyOwner {
        require(mintingDone == false);

        require(_recipients.length == _amounts.length);
        require(_recipients.length < 256);

        for (uint8 i = 0; i < _recipients.length; i++) {
            address recipient = _recipients[i];
            uint256 amount = _amounts[i];

            // enforce maximum token supply
            require(totalSupply + amount >= totalSupply);
            require(totalSupply + amount <= maxSupply);

            balances[recipient] += amount;
            totalSupply += amount;

            Transfer(msg.sender, recipient, amount);
        }
    }

    function finishMinting() public onlyOwner {
        require(mintingDone == false);

        // check hard cap again
        require(totalSupply <= maxSupply);

        mintingDone = true;
    }

    // ERC20 functionality

    function balanceOf(address _owner) public view returns (uint256) {
        return balances[_owner];
    }

    function transfer(address _to, uint256 _value) public mintingFinished returns (bool) {
        require(balances[msg.sender] >= _value);
        require(balances[_to] + _value >= balances[_to]); // receiver balance overflow check

        balances[msg.sender] -= _value;
        balances[_to] += _value;

        Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public mintingFinished returns (bool) {
        uint256 allowance = allowed[_from][msg.sender];
        require(balances[_from] >= _value && allowance >= _value);
        require(balances[_to] + _value >= balances[_to]); // receiver balance overflow check

        allowed[_from][msg.sender] -= _value;
        balances[_from] -= _value;
        balances[_to] += _value;

        Transfer(_from, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool) {
        // no check for zero allowance, see NOTES.md

        allowed[msg.sender][_spender] = _value;

        Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) public view returns (uint256) {
        return allowed[_owner][_spender];
    }
}
