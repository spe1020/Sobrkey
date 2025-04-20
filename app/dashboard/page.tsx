"use client"

import { useState, useEffect, useRef } from "react"
import { useNostr } from "@/lib/nostr"
import { publishNote, publishReaction, publishComment, publishZapRequest, subscribeToTag, subscribeToComments, subscribeToZaps } from "@/lib/nostr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { LogOut, Send, KeySquare, ThumbsUp, MessageCircle, Zap, Plus, Search } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { QuoteGenerator } from "@/components/QuoteGenerator"
import { useRouter } from "next/navigation"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { MobileNav } from "@/components/mobile-nav"
import { FloatingActionButton } from "@/components/floating-action-button"
import { motion } from "framer-motion"
import { Textarea } from "@/components/ui/textarea"

type Tab = "public" | "chat-with-mira" | "lets-talk" | "about" | "12steps" | "private-journal" | "emergency" | "profile"

// These are the tabs that will be shown in the top navigation
const visibleTabs: Tab[] = ["public", "lets-talk", "about", "12steps", "private-journal", "emergency"]

interface EmojiSelection {
  id: string;
  name: string;
  native: string | null;
  unified: string;
  keywords: string[];
  emoticons: string[];
}

interface Note {
  id: string;
  content: string;
  created_at: number;
  pubkey: string;
  tags?: string[][];
  reactions: {
    [key: string]: {
      emoji: string;
      count: number;
    }
  };
  comments: Comment[];
  zaps: { amount: number; comment?: string }[];
  aggregatedCounts: {
    reactions: number;
    comments: number;
    zaps: number;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: number;
  pubkey: string;
  replies?: Comment[];
}

const CUTOFF_DATE = new Date('2025-04-19T20:00:00-04:00').getTime() / 1000; // Convert to Unix timestamp

// Update the ZapEvent interface
interface ZapEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
  amount: number;
}

interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("public")
  const [content, setContent] = useState("")
  const [notes, setNotes] = useState<Note[]>([])
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({})
  const [expandedComments, setExpandedComments] = useState<{ [key: string]: boolean }>({})
  const [zapAmounts, setZapAmounts] = useState<{ [key: string]: string }>({})
  const [zapComments, setZapComments] = useState<{ [key: string]: string }>({})
  const [isPostingNote, setIsPostingNote] = useState(false)
  const { privateKey, publicKey, logout } = useNostr()
  const { toast } = useToast()
  const router = useRouter()
  const [isZapDialogOpen, setIsZapDialogOpen] = useState(false)
  const [zapAmount, setZapAmount] = useState("")
  const [zapComment, setZapComment] = useState("")
  const [localResources, setLocalResources] = useState<any[]>([])
  const [isLoadingLocal, setIsLoadingLocal] = useState(false)
  const [aggregatedNotes, setAggregatedNotes] = useState<{ [key: string]: Note['aggregatedCounts'] }>({})
  const [emojiReactions, setEmojiReactions] = useState<{ [key: string]: { [emoji: string]: number } }>({})
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [activePublicView, setActivePublicView] = useState<"notes" | "replies">("notes")
  const [selectedParentNote, setSelectedParentNote] = useState<Note | null>(null)
  const [selectedComment, setSelectedComment] = useState<{ comment: Comment; parentNote: Note } | null>(null)
  const [isNewNoteDialogOpen, setIsNewNoteDialogOpen] = useState(false)
  const [newNoteContent, setNewNoteContent] = useState("")
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const tabParam = searchParams.get('tab') as Tab | null

  useEffect(() => {
    if (tabParam && visibleTabs.includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    router.push(`/dashboard?tab=${tab}`)
  }

  const handleLogout = () => {
    logout()
    window.location.href = "/"
  }

  const fetchLocalResources = async () => {
    setIsLoadingLocal(true)
    try {
      // Using SAMHSA's treatment locator API
      const response = await fetch('https://findtreatment.samhsa.gov/locator/listing')
      const data = await response.json()
      setLocalResources(data.slice(0, 5)) // Get top 5 nearest resources
    } catch (error) {
      console.error('Failed to fetch local resources:', error)
    } finally {
      setIsLoadingLocal(false)
    }
  }

  const updateNoteCounts = async (noteId: string) => {
    try {
      // Subscribe to reactions for this note
      const unsubReactions = subscribeToTag(`${noteId}-reaction`, (event) => {
        if (event.kind === 7) {
          const emoji = (event.content || '👍').trim(); // Ensure we have a valid string
          setEmojiReactions(prev => ({
            ...prev,
            [noteId]: {
              ...(prev[noteId] || {}),
              [emoji]: ((prev[noteId] || {})[emoji] || 0) + 1
            }
          }));
          
          setAggregatedNotes(prev => ({
            ...prev,
            [noteId]: {
              ...prev[noteId] || { reactions: 0, comments: 0, zaps: 0 },
              reactions: (prev[noteId]?.reactions || 0) + 1
            }
          }));
        }
      });

      // Subscribe to comments for this note
      const unsubComments = subscribeToComments(noteId, (event) => {
        setAggregatedNotes(prev => ({
          ...prev,
          [noteId]: {
            ...prev[noteId] || { reactions: 0, comments: 0, zaps: 0 },
            comments: (prev[noteId]?.comments || 0) + 1
          }
        }));
      });

      // Subscribe to zaps for this note
      const unsubZaps = subscribeToZaps(noteId, (event) => {
        // Extract zap amount from event tags
        const zapAmount = event.tags.find(tag => tag[0] === 'amount')?.[1];
        if (zapAmount) {
          setAggregatedNotes(prev => ({
            ...prev,
            [noteId]: {
              ...prev[noteId] || { reactions: 0, comments: 0, zaps: 0 },
              zaps: (prev[noteId]?.zaps || 0) + parseInt(zapAmount, 10)
            }
          }));
        }
      });

      return () => {
        unsubReactions();
        unsubComments();
        unsubZaps();
      };
    } catch (error) {
      console.error('Error updating note counts:', error);
    }
  };

  useEffect(() => {
    if (!publicKey) return;

    const unsubscribe = subscribeToTag("sobrkey", (event) => {
      if (event.kind === 1) {
        if (event.created_at >= CUTOFF_DATE) {
          const newNote = {
            ...event,
            reactions: {},
            comments: [],
            zaps: [],
            aggregatedCounts: {
              reactions: 0,
              comments: 0,
              zaps: 0
            }
          };
          
          setNotes(prevNotes => [newNote, ...prevNotes]);
          
          // Start aggregating counts for the new note
          updateNoteCounts(event.id);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [publicKey]);

  useEffect(() => {
    console.log('Cutoff date:', new Date(CUTOFF_DATE * 1000).toLocaleString());
    console.log('Notes:', notes.map(note => ({
      date: new Date(note.created_at * 1000).toLocaleString(),
      timestamp: note.created_at,
      content: note.content
    })));
  }, [notes]);

  const handlePublish = async () => {
    if (!publicKey || !privateKey || !newNoteContent.trim()) return;

    try {
      setIsPostingNote(true);
      const event = await publishNote(newNoteContent, privateKey);
      if (!event) throw new Error("Failed to publish note");

      const newNote: Note = {
        id: event.id,
        content: event.content,
        created_at: event.created_at,
        pubkey: event.pubkey,
        reactions: {},
        comments: [],
        zaps: [],
        aggregatedCounts: {
          reactions: 0,
          comments: 0,
          zaps: 0
        }
      };

      setNotes(prev => [newNote, ...prev]);
      setNewNoteContent("");
      setIsNewNoteDialogOpen(false);
      toast({
        title: "Success",
        description: "Your note has been published!",
      });

      // Set up subscriptions for the new note
      updateNoteCounts(event.id);
    } catch (error) {
      console.error("Error publishing note:", error);
      toast({
        title: "Error",
        description: "Failed to publish note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPostingNote(false);
    }
  };

  const handleReaction = async (noteId: string) => {
    if (!privateKey) return

    try {
      await publishReaction(privateKey, noteId)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to react to note: " + (error as Error).message,
        variant: "destructive",
      })
    }
  }

  const handleComment = async (noteId: string, parentCommentId?: string) => {
    if (!privateKey || !publicKey) {
      toast({
        title: "Error",
        description: "Please log in to post comments",
        variant: "destructive",
      });
      return;
    }

    const commentContent = commentInputs[parentCommentId || noteId]
    if (!commentContent?.trim()) return

    try {
      // Publish the comment to Nostr
      await publishComment(privateKey, noteId, commentContent, parentCommentId)
      
      // Create a temporary comment
      const tempComment = {
        id: Date.now().toString(),
        content: commentContent,
        created_at: Math.floor(Date.now() / 1000),
        pubkey: publicKey,
        replies: []
      };

      // Update local state with the new comment
      setNotes(prevNotes => prevNotes.map(note => {
        if (note.id === noteId) {
          if (parentCommentId) {
            // Helper function to recursively update comments
            const updateReplies = (comments: Comment[]): Comment[] => {
              return comments.map(comment => {
                if (comment.id === parentCommentId) {
                  return {
                    ...comment,
                    replies: [...(comment.replies || []), tempComment]
                  };
                }
                if (comment.replies?.length) {
                  return {
                    ...comment,
                    replies: updateReplies(comment.replies)
                  };
                }
                return comment;
              });
            };

            return {
              ...note,
              comments: updateReplies(note.comments)
            };
          } else {
            // Add as a top-level comment
            return {
              ...note,
              comments: [...(note.comments || []), tempComment]
            };
          }
        }
        return note;
      }));
      
      // Clear the input
      setCommentInputs(prev => {
        const newInputs = { ...prev };
        delete newInputs[parentCommentId || noteId];
        return newInputs;
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post comment: " + (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const isDuplicateComment = (comments: Comment[], newComment: Comment): boolean => {
    // Check if comment already exists at current level
    const isDuplicate = comments.some(
      existing => 
        existing.id === newComment.id || 
        (existing.content === newComment.content && 
         existing.created_at === newComment.created_at &&
         existing.pubkey === newComment.pubkey)
    );

    if (isDuplicate) return true;

    // Recursively check replies
    return comments.some(comment => 
      comment.replies && comment.replies.length > 0 && 
      isDuplicateComment(comment.replies, newComment)
    );
  };

  const toggleComments = (noteId: string) => {
    setExpandedComments(prev => ({ ...prev, [noteId]: !prev[noteId] }));
    
    if (!expandedComments[noteId]) {
      // Subscribe to comments when expanding
      const unsubscribe = subscribeToComments(noteId, (event) => {
        // Create the new comment object
        const newComment = {
          id: event.id,
          content: event.content,
          created_at: event.created_at,
          pubkey: event.pubkey,
          replies: []
        };

        // Find if this is a reply and to which comment
        const replyToTag = event.tags.find(tag => tag[0] === 'e' && tag[2] === 'reply');
        const parentId = replyToTag ? replyToTag[1] : null;

        setNotes(prevNotes => prevNotes.map(note => {
          if (note.id === noteId) {
            let updatedComments = [...(note.comments || [])];
            
            if (parentId) {
              // This is a reply - find the parent comment and add the reply
              const addReplyToComment = (comments: Comment[]): Comment[] => {
                return comments.map(comment => {
                  if (comment.id === parentId) {
                    // Check if reply already exists
                    const replyExists = comment.replies?.some(reply => reply.id === newComment.id);
                    if (!replyExists) {
                      return {
                        ...comment,
                        replies: [...(comment.replies || []), newComment]
                      };
                    }
                  }
                  // Recursively check replies
                  if (comment.replies?.length) {
                    return {
                      ...comment,
                      replies: addReplyToComment(comment.replies)
                    };
                  }
                  return comment;
                });
              };
              updatedComments = addReplyToComment(updatedComments);
            } else {
              // This is a top-level comment
              const commentExists = updatedComments.some(comment => comment.id === newComment.id);
              if (!commentExists) {
                updatedComments.push(newComment);
              }
            }

            // Sort comments by timestamp (newest first)
            const sortByTimestamp = (comments: Comment[]): Comment[] => {
              const sorted = [...comments].sort((a, b) => b.created_at - a.created_at);
              return sorted.map(comment => ({
                ...comment,
                replies: comment.replies?.length ? sortByTimestamp(comment.replies) : []
              }));
            };

            return {
              ...note,
              comments: sortByTimestamp(updatedComments)
            };
          }
          return note;
        }));
      });

      return unsubscribe;
    }
  };

  const handleZap = async (noteId: string) => {
    if (!privateKey) return

    const amount = parseInt(zapAmounts[noteId] || "0")
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    try {
      await publishZapRequest(privateKey, noteId, amount, zapComments[noteId])
      toast({
        title: "Success",
        description: "Zap request sent!",
      })
      setZapAmounts(prev => ({ ...prev, [noteId]: "" }))
      setZapComments(prev => ({ ...prev, [noteId]: "" }))
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send zap: " + (error as Error).message,
        variant: "destructive",
      })
    }
  }

  const handleZapUs = async () => {
    if (!privateKey) return

    const amount = parseInt(zapAmount || "0")
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    try {
      // Using a special note ID for the development zap
      await publishZapRequest(privateKey, "development", amount, zapComment)
      toast({
        title: "Thank You!",
        description: "Your support helps us continue building Sobrkey.",
      })
      setZapAmount("")
      setZapComment("")
      setIsZapDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send zap: " + (error as Error).message,
        variant: "destructive",
      })
    }
  }

  const handleEmojiSelect = async (noteId: string, emoji: EmojiSelection) => {
    if (!privateKey) {
      toast({
        title: "Error",
        description: "Please log in to add reactions",
        variant: "destructive",
      });
      return;
    }

    try {
      const emojiNative = emoji.native;
      if (!emojiNative) {
        throw new Error('No emoji selected');
      }
      
      await publishReaction(privateKey, noteId, emojiNative);
      
      // Update local state
      setEmojiReactions(prev => ({
        ...prev,
        [noteId]: {
          ...(prev[noteId] || {}),
          [emojiNative]: ((prev[noteId] || {})[emojiNative] || 0) + 1
        }
      }));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add reaction: " + (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const renderComment = (noteId: string, comment: Comment, parentNote: Note) => {
    const inputValue = commentInputs[comment.id] || "";
    const isReplying = replyingTo === comment.id;
    
    return (
      <div key={comment.id} className="space-y-3">
        <div 
          className="bg-gray-50 rounded p-3 cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedComment({ comment, parentNote });
          }}
        >
          <div className="text-xs text-gray-500 mb-1">
            {new Date(comment.created_at * 1000).toLocaleString()}
          </div>
          <p className="text-sm text-gray-900">{comment.content}</p>
          <div className="mt-2 flex items-center space-x-2">
            <Button 
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setReplyingTo(isReplying ? null : comment.id);
              }}
              className="text-xs"
            >
              {isReplying ? 'Cancel' : 'Reply'}
            </Button>
          </div>
          {isReplying && (
            <div className="mt-2 relative" onClick={e => e.stopPropagation()}>
              <Input
                value={inputValue}
                onChange={(e) => setCommentInputs(prev => ({ ...prev, [comment.id]: e.target.value }))}
                placeholder="Write your reply..."
                className="text-sm pr-12"
              />
              <Button 
                size="sm"
                className="absolute right-1 top-1 h-7"
                onClick={(e) => {
                  e.stopPropagation();
                  handleComment(noteId, comment.id);
                  setReplyingTo(null);
                }}
                disabled={!inputValue.trim()}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div className="pl-4 border-l-2 border-gray-200 space-y-3">
            {comment.replies.map(reply => renderComment(noteId, reply, parentNote))}
          </div>
        )}
      </div>
    );
  };

  const renderPublicContent = () => {
    const visibleNotes = notes.filter(note => note.created_at >= CUTOFF_DATE);
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Community Feed</h2>
        </div>
        {/* Selected Comment Context */}
        {selectedComment && (
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Original Post</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedComment(null)}
                >
                  Close
                </Button>
              </div>
              <div className="text-xs text-gray-500 mb-3">
                {new Date(selectedComment.parentNote.created_at * 1000).toLocaleString()}
              </div>
              <p className="text-gray-900 whitespace-pre-wrap text-base">{selectedComment.parentNote.content}</p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-sm font-medium text-gray-500">Selected Comment:</div>
                <div className="mt-2 bg-purple-50 rounded p-3 border border-purple-100">
                  <div className="text-xs text-gray-500 mb-1">
                    {new Date(selectedComment.comment.created_at * 1000).toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-900">{selectedComment.comment.content}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Feed */}
        <div className="space-y-6">
          {visibleNotes.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No posts available yet
            </div>
          ) : (
            visibleNotes
              .sort((a, b) => b.created_at - a.created_at)
              .map((note) => (
                <div
                  key={note.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
                >
                  <div 
                    className="p-6 cursor-pointer"
                    onClick={() => toggleComments(note.id)}
                  >
                    <div className="text-xs text-gray-500 mb-3">
                      {new Date(note.created_at * 1000).toLocaleString()}
                    </div>
                    <p className="text-gray-900 whitespace-pre-wrap text-base mb-4">{note.content}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600" onClick={e => e.stopPropagation()}>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="flex items-center space-x-1.5 hover:text-purple-600 transition-colors">
                            <ThumbsUp className="h-4 w-4" />
                            <div className="flex items-center space-x-1">
                              {Object.entries(emojiReactions[note.id] || {}).map(([emoji, count], index) => (
                                <span key={emoji} className="inline-flex items-center">
                                  {emoji}<span className="ml-1">{count}</span>
                                  {index < Object.entries(emojiReactions[note.id] || {}).length - 1 && " "}
                                </span>
                              ))}
                              {!Object.keys(emojiReactions[note.id] || {}).length && (
                                <span>{aggregatedNotes[note.id]?.reactions || 0}</span>
                              )}
                            </div>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 border-none" align="start">
                          <Picker
                            data={data}
                            onEmojiSelect={(emoji: EmojiSelection) => handleEmojiSelect(note.id, emoji)}
                            theme="light"
                            set="native"
                            showPreview={false}
                            showSkinTones={false}
                            emojiSize={22}
                            emojiButtonSize={32}
                            maxFrequentRows={0}
                          />
                        </PopoverContent>
                      </Popover>
                      <div className="flex items-center space-x-1.5">
                        <MessageCircle className="h-4 w-4" />
                        <span>{aggregatedNotes[note.id]?.comments || 0}</span>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="flex items-center space-x-1.5 hover:text-purple-600 transition-colors">
                            <Zap className="h-4 w-4" />
                            <span>{aggregatedNotes[note.id]?.zaps || 0}</span>
                          </button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Send Zap</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Amount (sats)</label>
                              <Input
                                type="number"
                                value={zapAmounts[note.id] || ""}
                                onChange={(e) => setZapAmounts(prev => ({ ...prev, [note.id]: e.target.value }))}
                                placeholder="Enter amount in sats"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Comment (optional)</label>
                              <Input
                                value={zapComments[note.id] || ""}
                                onChange={(e) => setZapComments(prev => ({ ...prev, [note.id]: e.target.value }))}
                                placeholder="Add a comment with your zap"
                                className="mt-1"
                              />
                            </div>
                            <Button
                              className="w-full"
                              onClick={() => handleZap(note.id)}
                              disabled={!zapAmounts[note.id] || parseInt(zapAmounts[note.id]) <= 0}
                            >
                              Send Zap
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {/* Comments Section */}
                  {expandedComments[note.id] && (
                    <div className="border-t border-gray-100">
                      <div className="p-6">
                        <div className="space-y-4">
                          <div className="relative">
                            <Input
                              value={commentInputs[note.id] || ""}
                              onChange={(e) => setCommentInputs(prev => ({ ...prev, [note.id]: e.target.value }))}
                              placeholder="Write a comment..."
                              className="text-sm pr-12"
                              onClick={e => e.stopPropagation()}
                            />
                            <Button 
                              size="sm"
                              className="absolute right-1 top-1 h-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleComment(note.id);
                              }}
                              disabled={!commentInputs[note.id]?.trim()}
                            >
                              <Send className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <div className="space-y-4" onClick={e => e.stopPropagation()}>
                            {note.comments?.map(comment => renderComment(note.id, comment, note))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "lets-talk":
        return (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
                  <svg
                    className="w-8 h-8 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Let's Talk</h2>
                <p className="text-gray-600">
                  Coming soon: Connect with others in real-time through our community spaces.
                </p>
                <div className="space-y-4 text-left">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Live Audio Spaces</h3>
                      <p className="text-sm text-gray-600">
                        Join moderated discussions and share your experiences in a safe, supportive environment.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Scheduled Events</h3>
                      <p className="text-sm text-gray-600">
                        Participate in regular meetings, workshops, and special guest sessions.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Anonymous Participation</h3>
                      <p className="text-sm text-gray-600">
                        Join discussions while maintaining your privacy and anonymity.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <p className="text-sm text-gray-500">
                    Stay tuned for updates on this exciting new feature!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      case "about":
        return (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h2 className="text-2xl font-bold mb-4">About Sobrkey</h2>
              <div className="prose prose-gray max-w-none">
                <p className="mb-4">
                  Sobrkey is a decentralized community built on the Nostr protocol. It's a space for individuals navigating sobriety, recovery, and personal growth — powered by connection, anonymity, and support.
                </p>
                <p className="mb-4">
                  The platform is inspired by the principles of the 12-step program but reimagined for an open, peer-driven world. Here, you can journal privately, reflect publicly, or just listen.
                </p>
                <div className="mt-6 space-y-3 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">💬</span>
                    <span>Powered by Nostr + Mira, the AI companion</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">⚡</span>
                    <span>Zaps optional, support is free</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🛠️</span>
                    <span>Built with care, not for profit</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      case "12steps":
        return (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
                  <svg
                    className="w-8 h-8 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Your Recovery Journey</h2>
                <p className="text-gray-600">
                  Take the next step in your recovery with our guided 12-step program.
                </p>
                <Button
                  onClick={() => router.push('/12steps')}
                  className="mt-4 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                >
                  Begin Your Journey
                </Button>
              </div>
            </div>
          </div>
        )
      case "private-journal":
        return (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
                  <svg
                    className="w-8 h-8 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Private Journal</h2>
                <p className="text-gray-600">
                  Coming soon: A private space for your personal reflections and thoughts.
                </p>
                <div className="space-y-4 text-left">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">End-to-End Encryption</h3>
                      <p className="text-sm text-gray-600">
                        Your private thoughts will be encrypted and accessible only to you.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Daily Prompts</h3>
                      <p className="text-sm text-gray-600">
                        Receive personalized prompts to guide your reflection and growth.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Progress Tracking</h3>
                      <p className="text-sm text-gray-600">
                        Track your emotional and recovery journey over time.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <p className="text-sm text-gray-500">
                    Stay tuned for updates on this exciting new feature!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      case "emergency":
        return (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                    <svg
                      className="w-8 h-8 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Emergency Resources</h2>
                  <p className="text-gray-600">
                    Immediate help and support is available. You are not alone.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-red-900">National Suicide Prevention Lifeline</h3>
                        <p className="text-red-800 mb-2">Available 24/7</p>
                        <a href="tel:988" className="text-red-600 hover:text-red-700 font-medium">
                          Call or Text: 988
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-purple-900">SAMHSA National Helpline</h3>
                        <p className="text-purple-800 mb-2">Treatment Referral and Information</p>
                        <a href="tel:18006624357" className="text-purple-600 hover:text-purple-700 font-medium">
                          Call: 1-800-662-HELP (4357)
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-blue-900">Crisis Text Line</h3>
                        <p className="text-blue-800 mb-2">Text for immediate support</p>
                        <a href="sms:741741" className="text-blue-600 hover:text-blue-700 font-medium">
                          Text HOME to 741741
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-green-900">Local Emergency Services</h3>
                        <p className="text-green-800 mb-2">For immediate medical assistance</p>
                        <a href="tel:911" className="text-green-600 hover:text-green-700 font-medium">
                          Call: 911
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-900">Local Treatment Centers</h3>
                      <p className="text-yellow-800 mb-2">Find help near you</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchLocalResources}
                        className="text-yellow-600 hover:text-yellow-700"
                      >
                        {isLoadingLocal ? 'Loading...' : 'Find Local Help'}
                      </Button>
                      {localResources.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {localResources.map((resource, index) => (
                            <div key={index} className="text-sm">
                              <p className="font-medium">{resource.name}</p>
                              <p className="text-yellow-700">{resource.address}</p>
                              <a href={`tel:${resource.phone}`} className="text-yellow-600 hover:text-yellow-700">
                                {resource.phone}
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Additional Resources</h3>
                      <div className="mt-2 space-y-2">
                        <a href="https://www.aa.org" className="block text-gray-600 hover:text-gray-900">
                          Alcoholics Anonymous
                        </a>
                        <a href="https://www.na.org" className="block text-gray-600 hover:text-gray-900">
                          Narcotics Anonymous
                        </a>
                        <a href="https://www.smartrecovery.org" className="block text-gray-600 hover:text-gray-900">
                          SMART Recovery
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-500">
                  <p>These services are available 24/7. Please reach out if you need help.</p>
                  <p className="mt-2">Remember: Your life is valuable, and help is always available.</p>
                </div>
              </div>
            </div>
          </div>
        )
      case "public":
        return renderPublicContent();
      default:
        return null
    }
  }

  if (!privateKey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Not logged in</h1>
          <Button onClick={() => window.location.href = "/"}>
            Go to login page
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 pb-16">
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
              Sobrkey
            </h1>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                className="bg-gradient-to-r from-purple-600 to-orange-500 text-white hover:opacity-90"
                onClick={() => setIsZapDialogOpen(true)}
              >
                <Zap className="h-4 w-4 mr-2" />
                Zap Sobrkey
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
            {visibleTabs.map((tab) => (
              <Button
                key={tab}
                onClick={() => handleTabChange(tab)}
                variant={activeTab === tab ? "default" : "ghost"}
                className={`
                  whitespace-nowrap
                  ${activeTab === tab ? 
                    'bg-gradient-to-r from-purple-600 to-orange-500 text-white' : 
                    'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                {tab}
              </Button>
            ))}
          </div>

          {/* Content */}
          <div className="space-y-4">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
      <FloatingActionButton onClick={() => setIsNewNoteDialogOpen(true)} />

      {/* Zap Dialog */}
      <Dialog open={isZapDialogOpen} onOpenChange={setIsZapDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:from-orange-600 hover:to-purple-700"
          >
            <Zap className="h-4 w-4 mr-2" />
            Zap Sobrkey
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Support Sobrkey Development</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Amount (sats)</label>
              <Input
                type="number"
                value={zapAmount}
                onChange={(e) => setZapAmount(e.target.value)}
                placeholder="Enter amount in sats"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Message (optional)</label>
              <Input
                value={zapComment}
                onChange={(e) => setZapComment(e.target.value)}
                placeholder="Add a message with your zap"
                className="mt-1"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleZapUs}
              disabled={!zapAmount || parseInt(zapAmount) <= 0}
            >
              Send Zap
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Note Dialog */}
      <Dialog open={isNewNoteDialogOpen} onOpenChange={setIsNewNoteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="What's on your mind?"
              className="min-h-[200px] resize-none"
              autoFocus
            />
            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-orange-500 text-white hover:opacity-90 disabled:opacity-50"
              onClick={handlePublish}
              disabled={!newNoteContent.trim() || isPostingNote}
            >
              {isPostingNote ? "Publishing..." : "Publish Note"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 