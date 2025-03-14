// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SocialMedia {
    struct Post {
        uint256 postId;
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

    struct Comment {
        uint256 commentId;
        uint256 postId;
        string content;
        address commenter;
        uint256 timestamp;
    }
    
    mapping(address => User) public addrToUsers;
    Post[] internal posts;
    User[] internal users;
    mapping(address => address[]) public followers; // Track followers for each user
    mapping(address => address[]) public following; // Track users being followed by each user
    mapping(address => Post[]) public userAddrToPosts;
    mapping(uint256 => Comment[]) public postComments;
    uint256 public nextPostId = 0;
    uint256 public nextCommentId = 0;
    mapping(uint256 => Post) public postIdToPost;

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
        Post memory newPost = Post(nextPostId,content, imageURI, msg.sender, block.timestamp, new address[](0), new address[](0));
        posts.push(newPost);
        postIdToPost[nextPostId]=newPost;  // Add post to user's posts mapping
        userAddrToPosts[msg.sender].push(newPost);
        nextPostId++;
    }

    function getPostsCount() public view returns (uint256) {
        return posts.length;
    }

    function getUserPostsCount(address userAddress) public view returns(uint256){
        return userAddrToPosts[userAddress].length;
    }
    function getUsersCount() public view returns (uint256) {
        return users.length;
    }

    function getPost(uint256 i) 
        public 
        view 
        returns (
            uint256,
            string memory, 
            string memory,      
            address, 
            address[] memory, 
            address[] memory, 
            uint256
        ) 
    {
        // require(i < posts.length, "Post index out of range");
        Post storage post = postIdToPost[i];
        return (
            post.postId,
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

    function getUserPost(uint256 i,address userAddress) 
        public 
        view 
        returns (
            uint256,
            string memory, 
            string memory,      
            address, 
            address[] memory, 
            address[] memory, 
            uint256
        ) 
    {
        require(i < userAddrToPosts[userAddress].length, "Post index out of range"); // this is for optimazation
        Post storage post = userAddrToPosts[userAddress][i];
        return (
            post.postId,
            post.content, 
            post.imageURI,        
            post.owner, 
            post.likes, 
            post.dislikes, 
            post.time
        );
    }

   function likePost(address userAddress, uint256 postId) public onlySignedUp {
        Post storage post = postIdToPost[postId];

        // Unlike
        bool alreadyLiked = false;
        for (uint256 i = 0; i < post.likes.length; i++) {
            if (post.likes[i] == msg.sender) {
                post.likes[i] = post.likes[post.likes.length - 1];
                post.likes.pop();
                alreadyLiked = true;

                // Remove like from userAddrToPosts mapping
                for (uint256 j = 0; j < userAddrToPosts[userAddress].length; j++) {
                    if (userAddrToPosts[userAddress][j].postId == postId) {
                        for (uint256 k = 0; k < userAddrToPosts[userAddress][j].likes.length; k++) {
                            if (userAddrToPosts[userAddress][j].likes[k] == msg.sender) {
                                userAddrToPosts[userAddress][j].likes[k] = userAddrToPosts[userAddress][j].likes[userAddrToPosts[userAddress][j].likes.length - 1];
                                userAddrToPosts[userAddress][j].likes.pop();
                                break;
                            }
                        }
                        break;
                    }
                }
                return;
            }
        }

        // Check if the user disliked the post, remove from dislikes if needed
        for (uint256 i = 0; i < post.dislikes.length; i++) {
            if (post.dislikes[i] == msg.sender) {
                post.dislikes[i] = post.dislikes[post.dislikes.length - 1];
                post.dislikes.pop();

                // Remove dislike from userAddrToPosts mapping
                for (uint256 j = 0; j < userAddrToPosts[userAddress].length; j++) {
                    if (userAddrToPosts[userAddress][j].postId == postId) {
                        for (uint256 k = 0; k < userAddrToPosts[userAddress][j].dislikes.length; k++) {
                            if (userAddrToPosts[userAddress][j].dislikes[k] == msg.sender) {
                                userAddrToPosts[userAddress][j].dislikes[k] = userAddrToPosts[userAddress][j].dislikes[userAddrToPosts[userAddress][j].dislikes.length - 1];
                                userAddrToPosts[userAddress][j].dislikes.pop();
                                break;
                            }
                        }
                        break;
                    }
                }
                break;
            }
        }
        
        // Like
        if (!alreadyLiked) {
            for (uint256 i = 0; i < userAddrToPosts[userAddress].length; i++) {
                if (userAddrToPosts[userAddress][i].postId == postId) {
                    userAddrToPosts[userAddress][i].likes.push(msg.sender);
                    postIdToPost[postId].likes.push(msg.sender);
                    break;
                }
            }
        }
    }

    function dislikePost(address userAddress, uint256 postId) public onlySignedUp {
        Post storage post = postIdToPost[postId];

        // Undislike
        bool alreadyDisliked = false;
        for (uint256 i = 0; i < post.dislikes.length; i++) {
            if (post.dislikes[i] == msg.sender) {
                post.dislikes[i] = post.dislikes[post.dislikes.length - 1];
                post.dislikes.pop();
                alreadyDisliked = true;

                // Remove dislike from userAddrToPosts mapping
                for (uint256 j = 0; j < userAddrToPosts[userAddress].length; j++) {
                    if (userAddrToPosts[userAddress][j].postId == postId) {
                        for (uint256 k = 0; k < userAddrToPosts[userAddress][j].dislikes.length; k++) {
                            if (userAddrToPosts[userAddress][j].dislikes[k] == msg.sender) {
                                userAddrToPosts[userAddress][j].dislikes[k] = userAddrToPosts[userAddress][j].dislikes[userAddrToPosts[userAddress][j].dislikes.length - 1];
                                userAddrToPosts[userAddress][j].dislikes.pop();
                                break;
                            }
                        }
                        break;
                    }
                }
                return;
            }
        }

        // Check if the user liked the post, remove like if needed
        for (uint256 i = 0; i < post.likes.length; i++) {
            if (post.likes[i] == msg.sender) {
                post.likes[i] = post.likes[post.likes.length - 1];
                post.likes.pop();

                // Remove like from userAddrToPosts mapping
                for (uint256 j = 0; j < userAddrToPosts[userAddress].length; j++) {
                    if (userAddrToPosts[userAddress][j].postId == postId) {
                        for (uint256 k = 0; k < userAddrToPosts[userAddress][j].likes.length; k++) {
                            if (userAddrToPosts[userAddress][j].likes[k] == msg.sender) {
                                userAddrToPosts[userAddress][j].likes[k] = userAddrToPosts[userAddress][j].likes[userAddrToPosts[userAddress][j].likes.length - 1];
                                userAddrToPosts[userAddress][j].likes.pop();
                                break;
                            }
                        }
                        break;
                    }
                }
                break;
            }
        }

        // Add the user to the dislikes array
        if (!alreadyDisliked) {
            for (uint256 i = 0; i < userAddrToPosts[userAddress].length; i++) {
                if (userAddrToPosts[userAddress][i].postId == postId) {
                    userAddrToPosts[userAddress][i].dislikes.push(msg.sender);
                    postIdToPost[postId].dislikes.push(msg.sender);
                    break;
                }
            }
        }
    }

    function followUser(address userToFollow) public onlySignedUp {
        // Prevent user from following themselves
        require(userToFollow != msg.sender, "Cannot follow yourself");

        // Check if the user is already being followed
        address[] storage currentFollowers = followers[userToFollow];
        bool alreadyFollowing = false;
        for (uint256 i = 0; i < currentFollowers.length; i++) {
            if (currentFollowers[i] == msg.sender) {
                // If already following, remove from the list (unfollow)
                currentFollowers[i] = currentFollowers[currentFollowers.length - 1];
                currentFollowers.pop();

                // Remove from the following list as well
                address[] storage currentFollowing = following[msg.sender];
                for (uint256 j = 0; j < currentFollowing.length; j++) {
                    if (currentFollowing[j] == userToFollow) {
                        currentFollowing[j] = currentFollowing[currentFollowing.length - 1];
                        currentFollowing.pop();
                        break;
                    }
                }

                alreadyFollowing = true;
                break;
            }
        }

        // Add the user to the followers list if not already following
        if (!alreadyFollowing) {
            followers[userToFollow].push(msg.sender);
            following[msg.sender].push(userToFollow);
        }
    }

    

    function unfollowUser(address userToUnfollow) public onlySignedUp {
        // Prevent user from unfollowing themselves
        require(userToUnfollow != msg.sender, "Cannot unfollow yourself");

        // Remove the user from the followers list
        for (uint256 i = 0; i < followers[userToUnfollow].length; i++) {
            if (followers[userToUnfollow][i] == msg.sender) {
                followers[userToUnfollow][i] = followers[userToUnfollow][followers[userToUnfollow].length - 1];
                followers[userToUnfollow].pop();
                break;
            }
        }

        // Remove the user from the following list
        for (uint256 i = 0; i < following[msg.sender].length; i++) {
            if (following[msg.sender][i] == userToUnfollow) {
                following[msg.sender][i] = following[msg.sender][following[msg.sender].length - 1];
                following[msg.sender].pop();
                break;
            }
        }
    }

    function getFollowers(address userAddress) public view returns (address[] memory) {
        return followers[userAddress];
    }
    function getFollowing(address userAddress) public view returns (address[] memory) {
        return following[userAddress];
    }

    function addComment(uint256 postId, string memory content) public onlySignedUp {
        Comment memory newComment = Comment(nextCommentId,postId, content, msg.sender, block.timestamp);
        postComments[postId].push(newComment);
        nextCommentId++;
    }

    function getComments(uint256 postId) public view returns (Comment[] memory) {
        return postComments[postId];
    }
}
