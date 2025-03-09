// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SocialMedia {
    struct Post {
        string content;
        string imageURI;       // New field for image URL
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
    mapping(address => address[]) public followers; // Track followers for each user
    mapping(address => address[]) public following; // Track users being followed by each user

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

    function makePost(string memory content, string memory imageURI) public onlySignedUp {
        posts.push(Post(content, imageURI, msg.sender, block.timestamp, new address[](0), new address[](0)));
    }

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
            string memory,      
            address, 
            address[] memory, 
            address[] memory, 
            uint256
        ) 
    {
        require(i < posts.length, "Post index out of range");
        Post storage post = posts[i];
        return (
            post.content, 
            post.imageURI,        
            post.owner, 
            post.likes, 
            post.dislikes, 
            post.time
        );
    }

    function getUser(uint256 index) public view returns (string memory name, address userAddr) {
        require(index < users.length, "User index out of range");
        User storage user = users[index];
        return (user.name, user.userAddr);
    }

    function likePost(uint256 index) public onlySignedUp {
        require(index < posts.length, "Post index out of range");
        Post storage post = posts[index];

        // Check if the user already liked the post
        for (uint256 i = 0; i < post.likes.length; i++) {
            if (post.likes[i] == msg.sender) {
                // Unlike: Remove the address from the likes array
                post.likes[i] = post.likes[post.likes.length - 1];
                post.likes.pop();
                return;
            }
        }

        // Check if the user disliked the post, remove from dislikes if needed
        for (uint256 i = 0; i < post.dislikes.length; i++) {
            if (post.dislikes[i] == msg.sender) {
                post.dislikes[i] = post.dislikes[post.dislikes.length - 1];
                post.dislikes.pop();
                break;
            }
        }

        // Add the user to the likes array
        post.likes.push(msg.sender);
    }

    function dislikePost(uint256 index) public onlySignedUp {
        require(index < posts.length, "Post index out of range");
        Post storage post = posts[index];

        // Check if the user already disliked the post
        for (uint256 i = 0; i < post.dislikes.length; i++) {
            if (post.dislikes[i] == msg.sender) {
                // Undislike: Remove the address from the dislikes array
                post.dislikes[i] = post.dislikes[post.dislikes.length - 1];
                post.dislikes.pop();
                return;
            }
        }

        // Check if the user liked the post, remove from likes if needed
        for (uint256 i = 0; i < post.likes.length; i++) {
            if (post.likes[i] == msg.sender) {
                post.likes[i] = post.likes[post.likes.length - 1];
                post.likes.pop();
                break;
            }
        }

        // Add the user to the dislikes array
        post.dislikes.push(msg.sender);
    }

    function followUser(address userToFollow) public onlySignedUp {
        // Prevent user from following themselves
        require(userToFollow != msg.sender, "Cannot follow yourself");

        // Check if the user is already being followed
        // address[] storage currentFollowers = followers[msg.sender];
        // for (uint256 i = 0; i < currentFollowers.length; i++) {
        //     if (currentFollowers[i] == userToFollow) {
        //         // If already following, remove from the list (unfollow)
        //         currentFollowers[i] = currentFollowers[currentFollowers.length - 1];
        //         currentFollowers.pop();
        //         return;
        //     }
        // }

        // Add the user to the followers list
        followers[userToFollow].push(msg.sender);
        following[msg.sender].push(userToFollow);
    }

    function getFollowers(address userAddress) public view returns (address[] memory) {
        return followers[userAddress];
    }
    function getFollowing(address userAddress) public view returns (address[] memory) {
        return following[userAddress];
    }
    
}
