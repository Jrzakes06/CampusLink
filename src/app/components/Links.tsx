import { Users, UserPlus, UserCheck, UserMinus, X, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_BASE, apiHeaders, apiJsonHeaders } from '../../../utils/api';
import { usePolling } from '../../../utils/usePolling';

interface LinkRequest {
  id: string;
  from: string;
  to: string;
  status: string;
  createdAt: number;
}

interface Connection {
  id: string;
  user1: string;
  user2: string;
  createdAt: number;
}

interface LinksProps {
  username: string;
}

export function Links({ username }: LinksProps) {
  const [activeTab, setActiveTab] = useState<'connections' | 'requests'>('connections');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [requests, setRequests] = useState<LinkRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConnections();
    fetchRequests();
  }, [username]);

  usePolling(() => {
    fetchConnections();
    fetchRequests();
  }, 30_000);

  const fetchConnections = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/links/connections/${username}`,
        {
          headers: apiHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections || []);
      }
    } catch (error) {
      console.log(`Error fetching connections: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/links/requests/${username}`,
        {
          headers: apiHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.log(`Error fetching requests: ${error}`);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/links/accept`,
        {
          method: 'POST',
          headers: apiJsonHeaders(),
          body: JSON.stringify({ requestId }),
        }
      );

      if (response.ok) {
        await fetchConnections();
        await fetchRequests();
      }
    } catch (error) {
      console.log(`Error accepting request: ${error}`);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/links/reject`,
        {
          method: 'POST',
          headers: apiJsonHeaders(),
          body: JSON.stringify({ requestId }),
        }
      );

      if (response.ok) {
        await fetchRequests();
      }
    } catch (error) {
      console.log(`Error rejecting request: ${error}`);
    }
  };

  const handleRemoveConnection = async (connectionUser: string) => {
    if (!confirm(`Remove ${connectionUser} from your links?`)) return;

    try {
      const response = await fetch(
        `${API_BASE}/links/${username}/${connectionUser}`,
        {
          method: 'DELETE',
          headers: apiHeaders(),
        }
      );

      if (response.ok) {
        await fetchConnections();
      }
    } catch (error) {
      console.log(`Error removing connection: ${error}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold">My Links</h2>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="grid grid-cols-2 gap-2 p-2">
          <button
            onClick={() => setActiveTab('connections')}
            className={`px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'connections'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserCheck className="w-5 h-5" />
              <span>Connections ({connections.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-3 rounded-lg font-medium transition-colors relative ${
              activeTab === 'requests'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserPlus className="w-5 h-5" />
              <span>Requests ({requests.length})</span>
            </div>
            {requests.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
        </div>
      </div>

      {/* Connections Tab */}
      {activeTab === 'connections' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Your Connections</h3>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading connections...</div>
          ) : connections.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="w-16 h-16 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 mb-2">No connections yet</p>
              <p className="text-sm text-gray-400">Start linking with other students and professionals</p>
            </div>
          ) : (
            <div className="space-y-3">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">@{connection.user2}</p>
                      <p className="text-sm text-gray-500">
                        Connected {Number(connection.createdAt) > 0 ? new Date(Number(connection.createdAt)).toLocaleDateString() : 'Invalid Date'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveConnection(connection.user2)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <UserMinus className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Link Requests</h3>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="w-16 h-16 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 mb-2">No pending requests</p>
              <p className="text-sm text-gray-400">You'll see link requests from other users here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <UserPlus className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">@{request.from}</p>
                      <p className="text-sm text-gray-500">
                        Sent {Number(request.createdAt) > 0 ? new Date(Number(request.createdAt)).toLocaleDateString() : 'Invalid Date'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAcceptRequest(request.id)}
                      className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
