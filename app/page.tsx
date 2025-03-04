"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

const VideoPlayer = dynamic(() => import("./component/video-player"), {
  ssr: false,
  loading: () => <div className="aspect-video bg-gray-800 animate-pulse" />
})

interface ChatMessage {
  type: 'message' | 'system'
  user: string
  content: string
  timestamp: number
}

export default function StreamingPlatform() {
  // Sample stream URLs - in a real app, these would come from your API
  const streamSources = [
   
    "https://sendgbxt.ruscfd.lat/720p.m3u8",
  ]

  const [currentStreamUrl, setCurrentStreamUrl] = useState(streamSources[0])
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [username, setUsername] = useState('')
  const [showUsernameForm, setShowUsernameForm] = useState(true)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    wsRef.current = new WebSocket('wss://node-chat-2-8oue.onrender.com')
    
    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.type === 'userList') {
        // Handle user list updates if needed
      }
      setMessages(prev => [...prev, message])
    }

    return () => {
      wsRef.current?.close()
    }
  }, [])

  const handleSetUsername = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim() && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'setUsername',
        username: username.trim()
      }))
      setShowUsernameForm(false)
    }
  }

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (messageInput.trim() && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        content: messageInput.trim()
      }))
      setMessageInput('')
    }
  }

  const refreshStream = () => {
    setIsLoading(true)
    // Simulate fetching a new stream URL
    const randomIndex = Math.floor(Math.random() * streamSources.length)
    setTimeout(() => {
      setCurrentStreamUrl(streamSources[randomIndex])
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
     
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Live Stream</h1>
          <Button
            onClick={refreshStream}
            variant="outline"
            className="flex items-center gap-2 bg-transparent border-purple-500 text-purple-400 hover:bg-purple-900 hover:text-purple-100"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Stream
          </Button>
        </div>

        <div className="rounded-lg overflow-hidden shadow-2xl border border-purple-900/50">
          <VideoPlayer streamUrl={currentStreamUrl} key={currentStreamUrl} />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800/50 p-6 rounded-lg border border-purple-900/30 backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-3 text-purple-300">Stream Info</h2>
            <p className="text-gray-300">Currently playing: Stream {streamSources.indexOf(currentStreamUrl) + 1}</p>
            <p className="text-gray-400 text-sm mt-2">Quality: 1080p</p>
          </div>

          <div className="bg-gray-800/50 p-6 rounded-lg border border-purple-900/30 backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-3 text-purple-300">Chat</h2>
            {showUsernameForm ? (
              <form onSubmit={handleSetUsername} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter your name..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700" type="submit">
                  Join
                </Button>
              </form>
            ) : (
              <>
                <div className="h-40 overflow-y-auto bg-gray-900/70 rounded p-3 mb-3">
                  {messages.map((msg, i) => (
                    <div key={i} className={`text-sm mb-2 ${msg.user === username ? 'text-purple-300' : ''}`}>
                      {msg.type === 'system' ? (
                        <span className="text-gray-400 italic">{msg.content}</span>
                      ) : (
                        <>
                          <span className="font-medium">{msg.user}:</span>
                          <span className="ml-2">{msg.content}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700" type="submit">
                    Send
                  </Button>
                </form>
              </>
            )}
          </div>

          <div className="bg-gray-800/50 p-6 rounded-lg border border-purple-900/30 backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-3 text-purple-300">Upcoming Streams</h2>
            <ul className="space-y-3">
              <li className="flex justify-between">
                <span>Gaming Marathon</span>
                <span className="text-purple-400">Tomorrow, 8PM</span>
              </li>
              <li className="flex justify-between">
                <span>Tech Talk</span>
                <span className="text-purple-400">Friday, 6PM</span>
              </li>
              <li className="flex justify-between">
                <span>Music Session</span>
                <span className="text-purple-400">Saturday, 9PM</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}

