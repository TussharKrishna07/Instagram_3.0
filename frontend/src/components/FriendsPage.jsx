import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, 
  faCompass, 
  faUser, 
  faPlus,
  faArrowLeft,
  faCircle,
  faComment,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import { useChat } from '../context/chatContext';

function FriendsPage() {
  const { 
    friends, 
    isLoading, 
    openChat, 
    onlineFriends, 
    unreadMessages,
    currentUser,
    fetchFriends
  } = useChat();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      fetchFriends(currentUser.address);
    }
  }, [currentUser]);

  const isOnline = (address) => {
    return onlineFriends.includes(address);
  };

  const getUnreadCount = (address) => {
    return unreadMessages[address] || 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 fixed w-full z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button 
                onClick={() => navigate(-1)} 
                className="mr-2 text-gray-500"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Friends</h1>
            </div>
            <div className="flex items-center">
              <Link to="/HomePage" className="p-2 rounded-full hover:bg-gray-100">
                <FontAwesomeIcon icon={faHome} className="text-gray-700" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-16 pb-20">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="focus:ring-pink-500 focus:border-pink-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                placeholder="Search friends..."
              />
            </div>
          </div>

          {/* Friends List */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <svg className="animate-spin h-10 w-10 text-pink-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : friends.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-10 text-center">
              <div className="text-5xl text-gray-300 mb-4">
                <FontAwesomeIcon icon={faComment} />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Friends Yet</h3>
              <p className="text-gray-500 mb-4">
                When you and another user follow each other, they'll appear here as friends.
              </p>
              <Link 
                to="/HomePage" 
                className="inline-block px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
              >
                Find People to Follow
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {friends.map((friend) => (
                  <li key={friend.address} className="px-4 py-4 hover:bg-gray-50">
                    <button 
                      className="w-full flex items-center justify-between"
                      onClick={() => openChat(friend)}
                    >
                      <div className="flex items-center">
                        <div className="relative">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                            {friend.username.charAt(0).toUpperCase()}
                          </div>
                          {isOnline(friend.address) && (
                            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white bg-green-400"></span>
                          )}
                        </div>
                        <div className="ml-4 text-left">
                          <h3 className="text-sm font-medium text-gray-900">{friend.username}</h3>
                          <p className="text-xs text-gray-500 truncate">{friend.address}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {getUnreadCount(friend.address) > 0 && (
                          <span className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-white bg-pink-600 rounded-full">
                            {getUnreadCount(friend.address)}
                          </span>
                        )}
                        <FontAwesomeIcon icon={faComment} className="text-gray-400" />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 py-3">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-around">
            <Link to="/HomePage" className="text-gray-500 hover:text-gray-700">
              <FontAwesomeIcon icon={faHome} size="lg" />
            </Link>
            <button className="text-gray-500 hover:text-gray-700">
              <FontAwesomeIcon icon={faCompass} size="lg" />
            </button>
            <Link 
              to="/HomePage" 
              className="bg-pink-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
            >
              <FontAwesomeIcon icon={faPlus} />
            </Link>
            <Link to="/friends" className="text-pink-600">
              <FontAwesomeIcon icon={faComment} size="lg" />
            </Link>
            <Link to={`/ProfilePage/${currentUser?.address}`} className="text-gray-500 hover:text-gray-700">
              <FontAwesomeIcon icon={faUser} size="lg" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FriendsPage;