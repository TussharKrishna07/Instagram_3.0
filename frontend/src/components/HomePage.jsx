import { useState, useEffect } from 'react'
import {useWeb3}  from '../Context/Web3Context'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export default function HomePage() {
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
      setLoading(true)
      const postCount = await contract.getPostsCount()
      const fetchedPosts = []
      
      for (let i = 0; i < postCount; i++) {
        const [content, owner, likes, dislikes, timestamp] = await contract.getPost(i)
        const userName = await contract.getUserName(owner)
        fetchedPosts.push({
          id: i,
          content,
          owner,
          userName,
          likes: likes.length,
          dislikes: dislikes.length,
          timestamp: new Date(timestamp * 1000)
        })
      }
      
      setPosts(fetchedPosts.reverse())
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const createPost = async (e) => {
    e.preventDefault()
    if (!newPost.trim()) return

    try {
      setLoading(true)
      const tx = await contract.makePost(newPost)
      await tx.wait()
      setNewPost('')
      await fetchPosts()
    } catch (error) {
      console.error('Error creating post:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <form onSubmit={createPost} className="space-y-4">
          <Textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full"
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Posting...' : 'Create Post'}
          </Button>
        </form>
      </div>

      <div className="space-y-4">
        {loading && <p className="text-center">Loading posts...</p>}
        {posts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="font-bold">{post.userName}</h3>
                <span className="text-sm text-gray-500">
                  {post.timestamp.toLocaleDateString()}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{post.content}</p>
              <div className="flex gap-4">
                <span>👍 {post.likes}</span>
                <span>👎 {post.dislikes}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

