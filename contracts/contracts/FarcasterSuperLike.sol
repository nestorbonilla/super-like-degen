// SPDX-License-Identifier: MIT

pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "./eas/IEAS.sol";

contract FarcasterSuperLike is Context {
    struct TimeCount {
        uint64 expirationTime;
        uint256 times;
    }

    struct AvailableToken {
        bool available;
        uint256 taxUnit;
    }
    
    address public poolWallet;

    IEAS public eas;

    bytes32 public easSchema;

    mapping(address => AvailableToken) public availableTokens;

    mapping(address => TimeCount) public timesCounter;

    constructor(address _poolWallet, address _eas, bytes32 _easSchema) {
        poolWallet = _poolWallet;
        eas = IEAS(_eas);
        easSchema = _easSchema;
    }

    function execute(address _to, bytes memory _data, address _currency, uint256 _amount) external payable {
        _payment(_currency, _amount, _to);
        _writeEAS(_to, _data);
    }

    function _payment(address currency, uint256 amount, address _to) internal {
        TimeCount storage timeCounter = timesCounter[_msgSender()];
        if (timeCounter.expirationTime < block.timestamp) {
            timeCounter.expirationTime = uint64(block.timestamp + 1 days);
            timeCounter.times = 1;
        } else {
            timeCounter.times++;
        }

        uint256 taxUnit = _taxUnit(currency);
        uint256 tax = taxUnit;
        
        if (timeCounter.expirationTime > block.timestamp) {
            tax = (timeCounter.times ^ 2) * taxUnit;
        }

        if (currency == address(0)) {
            require(msg.value == amount + tax, "Forwarder: not enough");
            // transfer eth from this contract
            (bool sentTax, bytes memory dataTax) = poolWallet.call{value: tax}("");
            (bool sent, bytes memory data) = _to.call{value: amount}("");
            require(sent && sentTax, "Failed to send Ether");
        } else {
            require(availableTokens[currency].available, "Forwarder: the token is not available");
            IERC20 token = IERC20(currency);
            token.transferFrom(_msgSender(), poolWallet, amount);
            token.transferFrom(_msgSender(), poolWallet, tax);
        }
    }

    function _writeEAS(address _to, bytes memory _data) internal {
        AttestationRequest memory request = AttestationRequest({
            schema: easSchema,
            data: AttestationRequestData({
                recipient: _to,
                expirationTime: uint64(block.timestamp + 100 days),
                revocable: true,
                refUID: "",
                data: _data,
                value: 0
            })
        });
        eas.attest(request);
    }

    function calcTax(address currency) view external returns (uint256) {
        TimeCount memory timeCounter = timesCounter[_msgSender()];
        uint256 taxUnit = _taxUnit(currency);
        uint256 tax = taxUnit;

        if (timeCounter.expirationTime > block.timestamp) {
            tax = (timeCounter.times ^ 2) * taxUnit;
        }

        return tax;
    }

    function _taxUnit(address currency) view internal returns (uint256) {
        if (currency == address(0)) {
            return 5000;
        } else {
            return availableTokens[currency].taxUnit;
        }
    }

    // ToDo: ownable
    function setAvailableToken(address token, uint256 __taxUnit, bool available) external {
        availableTokens[token] = AvailableToken({
            available: available,
            taxUnit: __taxUnit
        });
    }
}