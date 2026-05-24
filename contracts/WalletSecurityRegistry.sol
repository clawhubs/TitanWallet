// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract WalletSecurityRegistry {
    struct WalletSecurityRecord {
        address owner;
        string action;
        string storageId;
        bytes32 sourceTxHash;
        bytes32 integrityHash;
        string context;
        uint64 timestamp;
    }

    uint256 public recordCount;
    mapping(uint256 => WalletSecurityRecord) private records;

    event WalletSecurityLogged(
        uint256 indexed logId,
        address indexed owner,
        bytes32 indexed actionHash,
        string action,
        string storageId,
        bytes32 sourceTxHash,
        bytes32 integrityHash,
        string context,
        uint64 timestamp
    );

    function recordWalletSecurity(
        string calldata action,
        string calldata storageId,
        bytes32 sourceTxHash,
        bytes32 integrityHash,
        string calldata context
    ) external returns (uint256 logId) {
        require(bytes(action).length > 0, "Empty action");
        require(bytes(storageId).length > 0, "Empty storageId");
        require(sourceTxHash != bytes32(0), "Empty sourceTxHash");
        require(integrityHash != bytes32(0), "Empty integrityHash");

        logId = ++recordCount;
        uint64 timestamp = uint64(block.timestamp);
        bytes32 actionHash = keccak256(bytes(action));

        records[logId] = WalletSecurityRecord({
            owner: msg.sender,
            action: action,
            storageId: storageId,
            sourceTxHash: sourceTxHash,
            integrityHash: integrityHash,
            context: context,
            timestamp: timestamp
        });

        emit WalletSecurityLogged(
            logId,
            msg.sender,
            actionHash,
            action,
            storageId,
            sourceTxHash,
            integrityHash,
            context,
            timestamp
        );
    }

    function getRecord(
        uint256 logId
    ) external view returns (WalletSecurityRecord memory) {
        return records[logId];
    }
}
