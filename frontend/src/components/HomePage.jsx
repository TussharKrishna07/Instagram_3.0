import { useState, useEffect } from 'react'
import {useWeb3}  from '../Context/Web3Context'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

function HomePage() {
  const { account, contract, connectWallet, isSignedUp } = useWeb3()
  const [posts, setPosts] = useState([])
  const [newPost, setNewPost] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!account) {
      navigate('/login')
    } else if (!isSignedUp) {
      navigate('/signup')
    } else {
      fetchPosts()
    }
  }, [account, isSignedUp])

  const fetchPosts = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
   
      const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);

      const postCount = await contract.getPostsCount();
      console.log(postCount)
      const fetchedPosts = [];

      for (let i = 0; i < postCount; i++) {
        const [content, owner, likes, dislikes, time] = await contract.getPost(i);
        const username = await contract.getUserName(owner);
        fetchedPosts.push({ content, owner, likes, dislikes, time: new Date(time * 1000), username });
      }

      setPosts(fetchedPosts.reverse());
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);

      const tx = await contract.makePost(newPost);
      await tx.wait();

      setNewPost('');
      fetchPosts();
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Social Media Feed</h1>

          <form onSubmit={handleSubmit} className="mb-8">
            <div>
              <label htmlFor="post" className="block text-sm font-medium text-gray-700">
                Create a new post
              </label>
              <div className="mt-1">
                <textarea
                  id="post"
                  name="post"
                  rows={3}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                  placeholder="What's on your mind?"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                ></textarea>
              </div>
            </div>
            <div className="mt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isLoading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>

          <div className="space-y-6">
            {posts.map((post, index) => (
              <div key={index} className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">{post.username}</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    {post.time.toLocaleString()}
                  </p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                  <dl className="sm:divide-y sm:divide-gray-200">
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Content</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{post.content}</dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Likes</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{post.likes.length}</dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Dislikes</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{post.dislikes.length}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
export default HomePage;
