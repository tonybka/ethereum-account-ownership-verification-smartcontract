pragma solidity >=0.4.21 <0.6.0;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

contract AddressOwnershipVerification is Ownable {

    mapping(address => bool) _transactors;
    mapping(address => bool) _transactees;

    // contain all verification's state
    mapping(address => mapping(address => string)) _otpcodes; // transactor address => (transactee address => otp code)
    mapping(address => mapping(address => string)) _verifications; // transactor address => (transactee address => otp code)

    event NewOwnershipVerification(address indexed transactor, address indexed transactee, string otpCode);

    modifier isTransactor() {
        require(_transactors[msg.sender], "Only transactor can call this function");
        _;
    }

    modifier isTransactee() {
        require(_transactees[msg.sender], "Only transactee can call this function");
        _;
    }

    function addTransactor(address transactor) public onlyOwner {
        _transactors[transactor] = true;
    }

    function removeTransactor(address transactor) public onlyOwner {
        _transactors[transactor] = false;
    }

    // Request to verify owner of an address as transactor
    function request(address transactee, string memory otpCode) public isTransactor {
        if (transactee == msg.sender) {
            revert("Transactor can't verify for themself.");
        }
        _otpcodes[msg.sender][transactee] = otpCode;
        _transactees[transactee] = true;
        emit NewOwnershipVerification(msg.sender, transactee, otpCode);
    }

    function validateYourself(address transactor, string memory otpCode) public isTransactee {
        _verifications[transactor][msg.sender] = otpCode;
    }

    function isRightAddressOwnership(address transactee) public view isTransactor returns (bool) {
        return keccak256(abi.encodePacked(_verifications[msg.sender][transactee])) ==
            keccak256(abi.encodePacked(_otpcodes[msg.sender][transactee]));
    }

}