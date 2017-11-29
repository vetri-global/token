pragma solidity ^0.4.18;

/**
 * @title ERC20 Token Interface
 */
contract ERC20 {
    function totalSupply() view returns (uint totalSupply);
    function balanceOf(address _owner) view returns (uint balance);
    function transfer(address _to, uint _value) returns (bool success);
    function transferFrom(address _from, address _to, uint _value) returns (bool success);
    function approve(address _spender, uint _value) returns (bool success);
    function allowance(address _owner, address _spender) view returns (uint remaining);
    event Transfer(address indexed _from, address indexed _to, uint _value);
    event Approval(address indexed _owner, address indexed _spender, uint _value);
}

/**
 * @title VALID Token
 * @dev ERC20 compatible smart contract for the VALID token.
 */
contract ValidToken is ERC20 {
    // token metadata
    string public constant name = "VALID";
    string public constant symbol = "VLD";
    uint8 public constant decimals = 18;

    // maximum amount of tokens
    uint256 constant _totalSupply = 10**9 * 10**decimals;
    // note: this equals 10**27, which is smaller than uint256 max value (~10**77)

    address public owner;

    // token accounting
    mapping(address => uint256) balances;
    mapping(address => mapping(address => uint256)) allowed;

    // constructor
    function ValidToken() {
        owner = msg.sender;
        balances[msg.sender] = _totalSupply; // TODO
    }

    // ERC20 functionality

    function totalSupply() view returns (uint256 totalSupply) {
        return _totalSupply;
    }

    function balanceOf(address _owner) view returns (uint256 balance) {
        balance = balances[_owner];
    }

    function transfer(address _to, uint256 _value) returns (bool success) {
        require(balances[msg.sender] >= _value);
        require(balances[_to] + _value >= balances[_to]); // receiver balance overflow check

        balances[msg.sender] -= _value;
        balances[_to] += _value;

        Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) returns (bool success) {
        uint256 allowance = allowed[_from][msg.sender];
        require(balances[_from] >= _value && allowance >= _value);
        require(balances[_to] + _value >= balances[_to]); // receiver balance overflow check

        allowed[_from][msg.sender] -= _value;
        balances[_from] -= _value;
        balances[_to] += _value;

        Transfer(_from, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) returns (bool success) {
        // require the approved amount to be set to zero before allowing to
        // change it, this is a required step to mitigate a race condition (see
        // https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729)
        require(_value == 0 || allowed[msg.sender][_spender] == 0);

        allowed[msg.sender][_spender] = _value;

        Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) view returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }
}
