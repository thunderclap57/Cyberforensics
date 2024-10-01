// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EvidenceChain {
    // Mapping to store evidence CIDs and their verification status
    mapping(string => bool) public evidenceHashes;

    // Event to signal that evidence has been uploaded
    event EvidenceUploaded(string cid, address indexed uploader);

    // Function to upload new evidence
    function uploadEvidence(string memory cid) public {
        // Store the CID of the evidence
        evidenceHashes[cid] = true;
        // Emit an event to log the evidence upload
        emit EvidenceUploaded(cid, msg.sender);
    }

    // Function to verify if evidence is unaltered
    function verifyEvidence(string memory cid) public view returns (bool) {
        // Return true if the CID exists, indicating the evidence is valid
        return evidenceHashes[cid];
    }
}
