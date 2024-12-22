// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Import OpenZeppelin Contracts
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title MyNFT
 * @dev ERC721 Token that allows minting NFTs with metadata stored on IPFS via Pinata.
 */
contract MyNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    /**
     * @dev Initializes the contract by setting a `name` and a `symbol` for the token collection.
     */
    constructor() ERC721("MyNFT", "MNFT") {}

    /**
     * @dev Mints a new NFT to the specified address with the given IPFS CID.
     * @param recipient The address that will receive the minted NFT.
     * @param cid The Content Identifier (CID) from Pinata IPFS where the metadata is stored.
     * @return The newly minted token ID.
     */
    function mintNFT(address recipient, string memory cid) public onlyOwner returns (uint256) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();

        // Construct the full URI with the IPFS gateway
        string memory tokenURI_ = string(abi.encodePacked("https://gateway.pinata.cloud/ipfs/", cid));

        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI_);

        return newItemId;
    }

    /**
     * @dev Returns the URI for a given token ID.
     * Overrides the ERC721URIStorage implementation.
     * @param tokenId The token ID to query.
     * @return The token URI string.
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Burns a specific ERC721 token.
     * Overrides the ERC721URIStorage implementation.
     * @param tokenId The token ID to burn.
     */
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
}
