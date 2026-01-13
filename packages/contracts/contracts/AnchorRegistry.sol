// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

contract AnchorRegistry {
    event Anchored(bytes32 receiptHash, bytes32 anchorId, address sender, uint256 timestamp);

    mapping(bytes32 => bool) private anchored;

    function anchor(bytes32 receiptHash) external returns (bytes32 anchorId) {
        require(!anchored[receiptHash], "Already anchored");
        anchored[receiptHash] = true;
        anchorId = keccak256(abi.encodePacked(receiptHash, msg.sender, block.number));
        emit Anchored(receiptHash, anchorId, msg.sender, block.timestamp);
    }

    function isAnchored(bytes32 receiptHash) external view returns (bool) {
        return anchored[receiptHash];
    }
}
