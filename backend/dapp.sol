// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SocialMedia {
    struct Post {
        string content;
        address owner;
        uint256 time;
        address[] likes;
        address[] dislikes;
    }

    struct User {
        string name;
        address userAddr;
    }

    mapping(address => User) public addrToUsers;
    Post[] internal posts;
    User[] internal users;

    modifier onlySignedUp() {
        require(bytes(addrToUsers[msg.sender].name).length > 0, "User not signed up");
        _;
    }

    function signUp(string memory name) public {
        require(bytes(addrToUsers[msg.sender].name).length == 0, "Already signed up");
        addrToUsers[msg.sender] = User(name, msg.sender);
        users.push(User(name, msg.sender));
    }

    function isSignedUp() public view returns (bool) {
        return bytes(addrToUsers[msg.sender].name).length > 0;
    }

    function getUserName(address addr) public view returns (string memory userName) {
        return addrToUsers[addr].name;
    }

    function makePost(string memory content) public onlySignedUp {
        posts.push(Post(content, msg.sender, block.timestamp, new address[](0),new address[](0) ));}

    function getPostsCount() public view returns (uint256) {
        return posts.length;
    }
    function getUsersCount() public view returns (uint256) {
        return users.length;
    }

    function getPost(uint256 i) 
        public 
        view 
        returns (
            string memory, 
            address, 
            address[] memory, 
            address[] memory, 
            uint256
        ) 
    {
        require(i < posts.length, "Post index out of range");
        Post storage post = posts[i];
        return (post.content, post.owner, post.likes, post.dislikes, post.time);
    }

    function getUser(uint256 index) public view returns (string memory name, address userAddr) {
        require(index < users.length, "User index out of range");
        User storage user = users[index];
        return (user.name, user.userAddr);
    }
}
