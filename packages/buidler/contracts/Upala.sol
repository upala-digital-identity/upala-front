pragma solidity >=0.6.0 <0.7.0;

import "@nomiclabs/buidler/console.sol";

contract Upala {

    mapping(address => uint160) public holderToIdentity;
    uint160 counter = 2;

    address public savedMsgSender;

    function newIdentity(address identityHolder) external {
        savedMsgSender = msg.sender;
        counter++;
        holderToIdentity[identityHolder] = counter;
    }

    function myId() external view returns(uint160) {
        return holderToIdentity[msg.sender]; //holderToIdentity[msg.sender];
    }
}