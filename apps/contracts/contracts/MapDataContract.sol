// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MapDataContract {
    ERC20 public b3trToken;
    // ERC721 public mapNFT;

    struct MapDataPoint {
        address poster;
        int256 longitude;
        int256 latitude;
        string name;
        string description;
        string image;
        uint256 count;
        uint256 timePosted;
    }

    MapDataPoint[] public mapDataPoints;
    mapping(address => bool) public firstTimeUsers;
    mapping(address => uint256) public userPostCount;
    mapping(address => uint256) public userPayments;

    uint256 public constant TOKENS_PER_POST = 10;
    uint256 public constant TOKENS_TO_VIEW = 2;
    uint256 public constant POSTS_FOR_NFT = 3;

    constructor() {
        b3trToken = new B3TRToken();
        // mapNFT = new MapNFT();
        b3trToken.transfer(msg.sender, 1000000 * 10**b3trToken.decimals()); // Mint 1,000,000 B3TR tokens to the deployer
    }

    function postLocation(int256 _long, int256 _lat, string memory _name, string memory _description, string memory _image) public {
        mapDataPoints.push(MapDataPoint({
            poster: msg.sender,
            longitude: _long,
            latitude: _lat,
            name: _name,
            description: _description,
            image: _image,
            count: 1,
            timePosted: block.timestamp
        }));

        // Mint 10 tokens to the user for posting
        b3trToken.transfer(msg.sender, TOKENS_PER_POST * 10**b3trToken.decimals());

        userPostCount[msg.sender]++;

        // Mint NFT if user has 3 postings
        // if (userPostCount[msg.sender] == POSTS_FOR_NFT) {
        //     _mintNFT(msg.sender);
        // }
    }

    function payToView() public {
        require(b3trToken.balanceOf(msg.sender) >= TOKENS_TO_VIEW * 10**b3trToken.decimals(), "Insufficient tokens to view locations");
        
        if (!firstTimeUsers[msg.sender]) {
            firstTimeUsers[msg.sender] = true;
        } else {
            b3trToken.transferFrom(msg.sender, address(this), TOKENS_TO_VIEW * 10**b3trToken.decimals());
            userPayments[msg.sender] += TOKENS_TO_VIEW;
        }
    }

    function getLocations() public view returns (MapDataPoint[] memory, uint256) {
        require(userPayments[msg.sender] >= TOKENS_TO_VIEW || !firstTimeUsers[msg.sender], "Insufficient payment to view locations");
        return (mapDataPoints, userPayments[msg.sender]);
    }

    // function _mintNFT(address recipient) internal {
    //     _tokenIds.increment();
    //     uint256 newItemId = _tokenIds.current();
    //     mapNFT.safeMint(recipient, newItemId);
    // }
}

contract B3TRToken is ERC20 {
    constructor() ERC20("B3TR", "B3TR") {
        _mint(msg.sender, 1000000 * 10**decimals());
    }
}

// contract MapNFT is ERC721 {
//     using Counters for Counters.Counter;
//     Counters.Counter private _tokenIds;

//     constructor() ERC721("MapNFT", "MNF") {}

//     function safeMint(address to, uint256 tokenId) public {
//         _safeMint(to, tokenId);
//     }
// }