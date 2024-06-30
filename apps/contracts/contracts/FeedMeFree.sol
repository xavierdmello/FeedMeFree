// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MapDataContract is ERC20, ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

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

    constructor() ERC20("B3TR", "B3TR") ERC721("MapNFT", "MNF") {
        // Deploy ERC20 token in constructor
        _mint(msg.sender, 1000000 * 10**decimals()); // Mint 1,000,000 B3TR tokens to the deployer
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
        _mint(msg.sender, TOKENS_PER_POST * 10**decimals());

        userPostCount[msg.sender]++;

        // Mint NFT if user has 3 postings
        if (userPostCount[msg.sender] == POSTS_FOR_NFT) {
            _mintNFT(msg.sender);
        }
    }

    function payToView() public {
        require(balanceOf(msg.sender) >= TOKENS_TO_VIEW * 10**decimals(), "Insufficient tokens to view locations");
        
        if (!firstTimeUsers[msg.sender]) {
            firstTimeUsers[msg.sender] = true;
        } else {
            _burn(msg.sender, TOKENS_TO_VIEW * 10**decimals());
            userPayments[msg.sender] += TOKENS_TO_VIEW;
        }
    }

    function getLocations() public view returns (MapDataPoint[] memory, uint256) {
        require(userPayments[msg.sender] >= TOKENS_TO_VIEW || !firstTimeUsers[msg.sender], "Insufficient payment to view locations");
        return (mapDataPoints, userPayments[msg.sender]);
    }

    function _mintNFT(address recipient) internal {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _safeMint(recipient, newItemId);
        _setTokenURI(newItemId, "https://media.istockphoto.com/id/1199025903/vector/congratulations-greeting-card-vector-lettering.jpg?s=612x612&w=0&k=20&c=JBjYOnkRerY0uxBrYAtKccIk6tdiBCuzwClegCucpmw=");
    }
}