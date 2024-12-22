// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.0;

// // Import OpenZeppelin Contracts
// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";
// import "@openzeppelin/contracts/utils/Counters.sol";


// contract MyNFT is ERC721URIStorage, Ownable {
//     using Counters for Counters.Counter;
//     Counters.Counter private _tokenIds;

//     constructor() ERC721("MyNFT", "MNFT") {}

//     function mintNFT(address recipient, string memory cid) public onlyOwner returns (uint256) {
//         _tokenIds.increment();
//         uint256 newItemId = _tokenIds.current();

//         // Construct the full URI with the IPFS gateway
//         string memory tokenURI_ = string(abi.encodePacked("https://gateway.pinata.cloud/ipfs/", cid));

//         _mint(recipient, newItemId);
//         _setTokenURI(newItemId, tokenURI_);

//         return newItemId;
//     }

//     function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
//         return super.tokenURI(tokenId);
//     }

//     function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
//         super._burn(tokenId);
//     }
// }
