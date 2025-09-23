"use client"

import { useState, useEffect, useRef } from "react"
import { useNostr } from "@/lib/nostr"
import { publishNote, publishReaction, publishComment, subscribeToTag, subscribeToMultipleTags, subscribeToComments, RECOVERY_HASHTAGS } from "@/lib/nostr"
import { extractMediaFromContent } from "@/lib/media"
import { extractLinkPreviews } from "@/lib/links"
import { MediaDisplay } from "@/components/MediaDisplay"
import { LinkPreviews } from "@/components/LinkPreviews"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { LogOut, Send, KeySquare, ThumbsUp, MessageCircle, Plus, Search } from "lucide-react"
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
import { MobileNav } from "@/components/mobile-nav"
import { FloatingActionButton } from "@/components/floating-action-button"
import { motion } from "framer-motion"
import { Textarea } from "@/components/ui/textarea"

type Tab = "public" | "mira" | "meet" | "about" | "12steps" | "emergency" | "profile"

// These are the tabs that will be shown in the top navigation
const visibleTabs: Tab[] = ["public", "mira", "meet", "about", "12steps", "emergency"]

interface Note {
  id: string;
  content: string;
  created_at: number;
  pubkey: string;
  tags?: string[][];
  reactions: {
    likes: number;
  };
  comments: Comment[];
  aggregatedCounts: {
    reactions: number;
    comments: number;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: number;
  pubkey: string;
  kind: number;
  tags?: string[][];
}

interface CommentRelationship {
  parentId: string | null;
  childIds: string[];
}

const CUTOFF_DATE = new Date('2025-04-23T20:00:00-04:00').getTime() / 1000; // April 23, 2025 at 8PM ET

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

type NostrSubscription = () => void;

interface SubscriptionMap {
  [key: string]: (() => void)[];
}

const getReplyParentId = (comment: Comment): string | null => {
  // find the 'reply' tag; if absent, this is a direct comment on the note
  const replyTag = comment.tags?.find(t => t[0] === 'e' && t[2] === 'reply')
  return replyTag ? replyTag[1] : null
}

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>("public")
  const [content, setContent] = useState("")
  const [notes, setNotes] = useState<Note[]>([])
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({})
  const [expandedComments, setExpandedComments] = useState<{ [key: string]: boolean }>({})
  const [isPostingNote, setIsPostingNote] = useState(false)
  const { privateKey, publicKey, logout } = useNostr()
  const { toast } = useToast()
  const router = useRouter()
  const [localResources, setLocalResources] = useState<any[]>([])
  const [isLoadingLocal, setIsLoadingLocal] = useState(false)
  const [aggregatedNotes, setAggregatedNotes] = useState<{ [key: string]: Note['aggregatedCounts'] }>({})
  const [reactions, setReactions] = useState<{ [key: string]: number }>({})
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [activePublicView, setActivePublicView] = useState<"notes" | "replies">("notes")
  const [selectedParentNote, setSelectedParentNote] = useState<Note | null>(null)
  const [selectedComment, setSelectedComment] = useState<{ comment: Comment; parentNote: Note } | null>(null)
  const [isNewNoteDialogOpen, setIsNewNoteDialogOpen] = useState(false)
  const [newNoteContent, setNewNoteContent] = useState("")
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const tabParam = searchParams.get('tab') as Tab | null
  const [isDarkMode, setIsDarkMode] = useState(false)
  const commentSubscriptions = useRef<Map<string, () => void>>(new Map())
  const processedCommentIds = useRef<Set<string>>(new Set())
  const processedNoteIds = useRef<Set<string>>(new Set())
  const noteSubscription = useRef<(() => void) | null>(null)
  const [commentsByNoteId, setCommentsByNoteId] = useState<Record<string, Record<string, Comment>>>({})
  const [commentRelationships, setCommentRelationships] = useState<Record<string, CommentRelationship>>({})

  // Add debug logging for comment state changes
  useEffect(() => {
    console.log('Comment state changed:', {
      commentsByNoteId: Object.entries(commentsByNoteId).map(([noteId, comments]) => ({
        noteId,
        commentCount: Object.keys(comments).length,
        comments: Object.entries(comments).map(([id, comment]) => ({
          id,
          content: comment.content,
          kind: comment.kind,
          tags: comment.tags,
          created_at: new Date(comment.created_at * 1000).toISOString()
        }))
      })),
      commentRelationships: Object.entries(commentRelationships)
        .map(([id, rel]) => ({
          id,
          parentId: rel.parentId,
          childCount: rel.childIds.length,
          childIds: rel.childIds
        })),
      expandedComments: Object.entries(expandedComments)
        .filter(([_, isExpanded]) => isExpanded)
        .map(([noteId]) => noteId)
    });
  }, [commentsByNoteId, commentRelationships, expandedComments]);

  // Add debug logging for note expansion and comment loading
  useEffect(() => {
    const expandedNoteIds = Object.entries(expandedComments)
      .filter(([_, isExpanded]) => isExpanded)
      .map(([noteId]) => noteId);

    console.log('Note expansion state:', {
      expandedNotes: expandedNoteIds,
      expandedNoteCount: expandedNoteIds.length,
      totalNotes: notes.length,
      notesWithComments: Object.keys(commentsByNoteId).length
    });

    // Log detailed information for each expanded note
    expandedNoteIds.forEach(noteId => {
      const noteComments = commentsByNoteId[noteId] || {};
      const topLevelComments = getTopLevelComments(noteId);
      
      console.log(`Note ${noteId} details:`, {
        totalComments: Object.keys(noteComments).length,
        topLevelComments: topLevelComments.length,
        commentIds: Object.keys(noteComments),
        relationships: Object.entries(commentRelationships)
          .filter(([_, rel]) => rel.parentId === noteId)
          .map(([id, rel]) => ({
            id,
            childCount: rel.childIds.length,
            childIds: rel.childIds
          }))
      });
    });
  }, [expandedComments, notes, commentsByNoteId, commentRelationships]);

  // Add debug logging for comment subscription changes
  useEffect(() => {
    console.log('Comment subscription state:', {
      activeSubscriptions: commentSubscriptions.current.size,
      processedCommentIds: processedCommentIds.current.size,
      processedNoteIds: processedNoteIds.current.size
    });
  }, [commentSubscriptions.current, processedCommentIds.current, processedNoteIds.current]);

  // Add debug logging for comment input changes
  useEffect(() => {
    const activeInputs = Object.entries(commentInputs)
      .filter(([_, value]) => value.trim().length > 0)
      .map(([noteId, value]) => ({
        noteId,
        length: value.length
      }));

    console.log('Comment input state:', {
      activeInputs,
      totalInputs: Object.keys(commentInputs).length
    });
  }, [commentInputs]);

  // Add debug logging for reply state
  useEffect(() => {
    if (replyingTo) {
      console.log('Reply state:', {
        replyingTo,
        parentComment: commentsByNoteId[replyingTo]?.[replyingTo],
        parentNoteId: Object.keys(commentsByNoteId).find(noteId => 
          commentsByNoteId[noteId]?.[replyingTo] !== undefined
        )
      });
    }
  }, [replyingTo, commentsByNoteId]);

  useEffect(() => {
    if (tabParam && visibleTabs.includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  useEffect(() => {
    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(savedDarkMode)
    if (savedDarkMode) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem('darkMode', String(newDarkMode))
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

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

  const updateNoteCounts = (noteId: string) => {
    const noteComments = commentsByNoteId[noteId] || {};
    const commentIds = Object.keys(noteComments);
    
    // Get all kind 1111 comments for this note
    const allComments = commentIds
      .map(id => noteComments[id])
      .filter(comment => comment.kind === 1111);
    
    // Count comments
    const totalComments = allComments.length;

    console.log(`Updating counts for note ${noteId}:`, {
      totalComments,
      commentIds: commentIds.length,
      kind1111Comments: allComments.length,
      relationships: Object.keys(commentRelationships).length
    });
    
    setAggregatedNotes(prev => ({
      ...prev,
      [noteId]: {
        ...prev[noteId],
        comments: totalComments
      }
    }));
  };

  // Helper functions for comment management
  const getTopLevelComments = (noteId: string): string[] => {
    const commentIds = Object.keys(commentsByNoteId[noteId] || {});
    return commentIds.filter(id => {
      const comment = commentsByNoteId[noteId][id];
      // Only show kind 1111 comments that are direct replies to the note
      return comment.kind === 1111 && comment.tags?.some(t => 
        t[0] === 'e' && t[1] === noteId && t[2] === 'root'
      );
    });
  };

  const getChildComments = (commentId: string): string[] => {
    const childIds = commentRelationships[commentId]?.childIds || [];
    return childIds.filter(id => {
      // Find the note this comment belongs to by searching through all notes
      const foundNoteId = Object.keys(commentsByNoteId).find((currentNoteId: string) => 
        commentsByNoteId[currentNoteId][id] !== undefined
      );
      
      if (!foundNoteId) return false;
      
      const comment = commentsByNoteId[foundNoteId][id];
      // Only return kind 1111 events (threaded comments)
      return comment.kind === 1111;
    });
  };

  const toggleComments = (noteId: string) => {
    console.log('Toggling comments for note:', noteId, {
      currentState: expandedComments[noteId],
      hasComments: commentsByNoteId[noteId] !== undefined
    });

    setExpandedComments(prev => {
      const newState = {
        ...prev,
        [noteId]: !prev[noteId]
      };

      // If we're expanding the note and it has no comments yet, trigger a comment load
      if (!prev[noteId] && !commentsByNoteId[noteId]) {
        console.log('Note expanded without comments, triggering comment load');
        // The subscription will handle loading comments
      }

      return newState;
    });
  };

  const handleComment = async (noteId: string, commentContent: string, parentCommentId?: string) => {
    if (!privateKey) {
      console.error('Cannot publish comment: private key not available');
      return;
    }

    try {
      // All comments in the thread should be kind 1111
      const kind = 1111;
      
      // Create the appropriate tags
      const tags = parentCommentId
        ? [['e', noteId, 'root'], ['e', parentCommentId, 'reply']]
        : [['e', noteId, 'root']];

      console.log('Publishing comment:', {
        kind,
        tags,
        parentCommentId: parentCommentId || 'none'
      });

      // Publish the comment and get the event
      const event = await publishComment(privateKey, noteId, commentContent, parentCommentId || '', kind);
      
      if (!event) {
        throw new Error('Failed to publish comment');
      }

      // Create a temporary comment object
      const newComment: Comment = {
        id: event.id,
        content: event.content,
        created_at: event.created_at,
        pubkey: event.pubkey,
        kind,
        tags
      };

      // Update commentsByNoteId
      setCommentsByNoteId(prev => {
        const noteComments = {...(prev[noteId] || {})};
        noteComments[event.id] = newComment;
        return {...prev, [noteId]: noteComments};
      });

      // Update relationships
      setCommentRelationships(prev => {
        if (parentCommentId) {
          // Update parent's childIds
          const parentRel = prev[parentCommentId] || {parentId: noteId, childIds: []};
          return {
            ...prev,
            [parentCommentId]: {
              ...parentRel,
              childIds: [...new Set([...parentRel.childIds, event.id])]
            },
            [event.id]: {parentId: parentCommentId, childIds: []}
          };
        } else {
          // This is a top-level comment
          return {
            ...prev,
            [event.id]: {parentId: noteId, childIds: []}
          };
        }
      });

      // Clear the input field for the specific note or comment
      setCommentInputs(prev => {
        const newInputs = {...prev};
        if (parentCommentId) {
          // Clear reply input
          delete newInputs[parentCommentId];
        } else {
          // Clear note input
          delete newInputs[noteId];
        }
        return newInputs;
      });
      
      // Update counts immediately
      setTimeout(() => updateNoteCounts(noteId), 100);

      // Ensure the note is expanded to show the new comment
      if (!expandedComments[noteId]) {
        setExpandedComments(prev => ({
          ...prev,
          [noteId]: true
        }));
      }
    } catch (error) {
      console.error('Error publishing comment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to publish comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Add effect to handle comment input state
  useEffect(() => {
    // When a note is collapsed, clear its comment input
    Object.entries(expandedComments).forEach(([noteId, isExpanded]) => {
      if (!isExpanded && commentInputs[noteId]) {
        setCommentInputs(prev => {
          const newInputs = {...prev};
          delete newInputs[noteId];
          return newInputs;
        });
      }
    });
  }, [expandedComments, commentInputs]);

  // Add effect to handle comment loading when notes are expanded
  useEffect(() => {
    const expandedNoteIds = Object.entries(expandedComments)
      .filter(([_, isExpanded]) => isExpanded)
      .map(([noteId]) => noteId);

    console.log('Handling expanded notes:', {
      expandedNoteIds,
      notesWithComments: Object.keys(commentsByNoteId)
    });

    // Ensure subscriptions are active for expanded notes
    expandedNoteIds.forEach(noteId => {
      if (!commentSubscriptions.current.has(noteId)) {
        console.log('Setting up subscription for expanded note:', noteId);
        // The subscription will be handled by the existing subscription effect
      }
    });
  }, [expandedComments, commentsByNoteId]);

  // Subscribe to comments for all notes on mount
  useEffect(() => {
    const subscribeToAllComments = async () => {
      for (const note of notes) {
        if (!commentSubscriptions.current.has(note.id)) {
          const unsubscribe = await subscribeToComments(note.id, (event) => {
            if (!processedCommentIds.current.has(event.id)) {
              processedCommentIds.current.add(event.id);
              
              // Extract media and links from comment content
              const { media, cleanContent: mediaCleanContent } = extractMediaFromContent(event.content);
              const { links, cleanContent: linksCleanContent } = extractLinkPreviews(mediaCleanContent);
              
              // Batch state updates
              setCommentsByNoteId(prev => {
                const noteComments = {...(prev[note.id] || {})};
                noteComments[event.id] = {
                  id: event.id,
                  content: event.content,
                  created_at: event.created_at,
                  pubkey: event.pubkey,
                  kind: event.kind,
                  tags: event.tags,
                  media: media,
                  links: links,
                  cleanContent: linksCleanContent
                };
                return {...prev, [note.id]: noteComments};
              });

              // Only update relationships for kind 1111 events
              if (event.kind === 1111) {
                const replyTag = event.tags.find(t => t[0] === 'e' && t[2] === 'reply');
                const rootTag = event.tags.find(t => t[0] === 'e' && t[2] === 'root');
                if (replyTag && rootTag) {
                  setCommentRelationships(prev => ({
                    ...prev,
                    [replyTag[1]]: {
                      parentId: rootTag[1],
                      childIds: [...(prev[replyTag[1]]?.childIds || []), event.id]
                    }
                  }));
                }
              }
            }
          });
          commentSubscriptions.current.set(note.id, unsubscribe);
        }
      }
    };

    subscribeToAllComments();

    // Cleanup function
    return () => {
      commentSubscriptions.current.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
      commentSubscriptions.current.clear();
      processedCommentIds.current.clear();
    };
  }, [notes]);

  useEffect(() => {
    console.log('Cutoff date:', new Date(CUTOFF_DATE * 1000).toLocaleString());
    console.log('Notes:', notes.map(note => ({
      date: new Date(note.created_at * 1000).toLocaleString(),
      timestamp: note.created_at,
      content: note.content
    })));
  }, [notes]);

  // Add debug logging for notes state changed
  useEffect(() => {
    console.log('Notes state changed:', {
      count: notes.length,
      notes: notes.map(note => ({
        id: note.id,
        content: note.content,
        created_at: note.created_at
      }))
    });
  }, [notes]);

  // Subscribe to notes on mount
  useEffect(() => {
    const subscribeToNotes = async () => {
      if (noteSubscription.current) return; // Prevent duplicate subscriptions

      // Subscribe to multiple recovery-related hashtags
      const unsubscribe = subscribeToMultipleTags(RECOVERY_HASHTAGS, (event: NostrEvent) => {
        if (!processedNoteIds.current.has(event.id)) {
          processedNoteIds.current.add(event.id);
          
          setNotes(prevNotes => {
            if (prevNotes.some(note => note.id === event.id)) {
              return prevNotes;
            }
            
            // Extract media and links from content
            const { media, cleanContent: mediaCleanContent } = extractMediaFromContent(event.content);
            const { links, cleanContent: linksCleanContent } = extractLinkPreviews(mediaCleanContent);
            
            const newNote: Note = {
              id: event.id,
              content: event.content,
              created_at: event.created_at,
              pubkey: event.pubkey,
              media: media,
              links: links,
              cleanContent: linksCleanContent,
              reactions: {
                likes: 0
              },
              comments: [],
              aggregatedCounts: {
                reactions: 0,
                comments: 0
              }
            };

            return [newNote, ...prevNotes];
          });
        }
      });
      
      noteSubscription.current = unsubscribe;
    };

    subscribeToNotes();

    return () => {
      if (noteSubscription.current) {
        noteSubscription.current();
        noteSubscription.current = null;
      }
      processedNoteIds.current.clear();
    };
  }, []);

  const handlePublish = async () => {
    if (!publicKey || !privateKey || !newNoteContent.trim()) {
      toast({
        title: "Error",
        description: "Please write something before publishing",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsPostingNote(true);
      const event = await publishNote(newNoteContent.trim(), privateKey);
      
      if (!event) {
        throw new Error("Failed to publish note");
      }

      setNotes(prevNotes => {
        if (prevNotes.some(note => note.id === event.id)) {
          return prevNotes;
        }
        
        const newNote: Note = {
          id: event.id,
          content: event.content,
          created_at: event.created_at,
          pubkey: event.pubkey,
          reactions: {
            likes: 0
          },
          comments: [],
          aggregatedCounts: {
            reactions: 0,
            comments: 0
          }
        };

        return [newNote, ...prevNotes];
      });
      
      setNewNoteContent("");
      setIsNewNoteDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Your note has been published!",
      });
    } catch (error) {
      console.error("Error publishing note:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to publish note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPostingNote(false);
    }
  };

  const handleReaction = async (noteId: string) => {
    if (!privateKey) {
      toast({
        title: "Error",
        description: "Please log in to add reactions",
        variant: "destructive",
      });
      return;
    }

    try {
      await publishReaction(privateKey, noteId);
      
      // Update both the reactions state and the note's reaction count
      setReactions(prev => ({
        ...prev,
        [noteId]: (prev[noteId] || 0) + 1
      }));

      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === noteId 
            ? {
                ...note,
                reactions: {
                  ...note.reactions,
                  likes: (note.reactions.likes || 0) + 1
                }
              }
            : note
        )
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add reaction: " + (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const getShortKey = (pubkey: string) => {
    return pubkey.slice(-4);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getNpub = (pubkey: string) => {
    return pubkey.slice(0, 8) + '...' + pubkey.slice(-8);
  };

  const handleReply = (noteId: string, commentId: string) => {
    setReplyingTo(replyingTo === commentId ? null : commentId);
  };

  const renderComment = (noteId: string, commentId: string, depth: number = 0) => {
    const comment = commentsByNoteId[noteId]?.[commentId];
    if (!comment) return null;

    const relationship = commentRelationships[commentId] || { parentId: null, childIds: [] };
    const childComments = relationship.childIds
      .filter(id => commentsByNoteId[noteId]?.[id] !== undefined);

    return (
      <div key={commentId} className={`mt-2 ${depth > 0 ? 'ml-4' : ''}`}>
        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(comment.created_at * 1000).toLocaleString()}
            </span>
            <span className="text-sm font-medium">
              {comment.pubkey.slice(0, 8) + '...' + comment.pubkey.slice(-8)}
            </span>
          </div>
          <p className="mt-1 text-sm">{comment.content}</p>
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => handleReply(noteId, commentId)}
              className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Reply
            </button>
            {childComments.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {childComments.length} {childComments.length === 1 ? 'reply' : 'replies'}
              </span>
            )}
          </div>
        </div>
        {expandedComments[noteId] && childComments.length > 0 && (
          <div className="mt-2">
            {childComments.map(childId => renderComment(noteId, childId, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderPublicContent = () => {
    const visibleNotes = notes
      .filter(note => note.created_at >= CUTOFF_DATE)
      .sort((a, b) => b.created_at - a.created_at);
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Community Support</h2>
        </div>
        <div className="space-y-6">
          {visibleNotes.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No posts available yet
            </div>
          ) : (
            visibleNotes.map((note) => (
              <div
                key={note.id}
                className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
              >
                <div 
                  className="p-6 cursor-pointer"
                  onClick={() => toggleComments(note.id)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-xs text-gray-500">
                      {new Date(note.created_at * 1000).toLocaleString()}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-xs font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                        {note.pubkey.slice(-4)}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-900 whitespace-pre-wrap text-base mb-4">{note.cleanContent || note.content}</p>
                  
                  {/* Display media if present */}
                  {note.media && note.media.length > 0 && (
                    <div className="mb-4">
                      <MediaDisplay media={note.media} />
                    </div>
                  )}
                  
                  {/* Display link previews if present */}
                  {note.links && note.links.length > 0 && (
                    <div className="mb-4">
                      <LinkPreviews urls={note.links} />
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReaction(note.id)
                      }}
                      className="flex items-center space-x-1.5 hover:text-purple-600 transition-colors"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span>{note.reactions.likes || 0}</span>
                    </button>
                    <div className="flex items-center space-x-1.5">
                      <MessageCircle className="h-4 w-4" />
                      <span>{aggregatedNotes[note.id]?.comments || 0}</span>
                    </div>
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
                              e.stopPropagation()
                              handleComment(note.id, commentInputs[note.id] || "", undefined)
                            }}
                            disabled={!commentInputs[note.id]?.trim()}
                          >
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="space-y-4" onClick={e => e.stopPropagation()}>
                          {getTopLevelComments(note.id).map(commentId => 
                            renderComment(note.id, commentId)
                          )}
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
      case "mira":
        return (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-100 to-orange-100 mb-4">
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
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Chat with Mira</h2>
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    className="bg-gradient-to-r from-purple-100 to-orange-100 border-purple-200 text-purple-600 hover:from-purple-200 hover:to-orange-200"
                  >
                    Coming Soon
                  </Button>
                </div>
                <p className="text-gray-600 max-w-md mx-auto">
                  Mira, your AI companion for recovery, is coming soon. She'll be here to provide support, guidance, and a listening ear 24/7.
                </p>
                <div className="space-y-4 text-left max-w-md mx-auto">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Personalized Support</h3>
                      <p className="text-sm text-gray-600">
                        Get tailored guidance and support based on your unique journey and needs.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">24/7 Availability</h3>
                      <p className="text-sm text-gray-600">
                        Access support anytime, anywhere - Mira is always here to help.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Private & Secure</h3>
                      <p className="text-sm text-gray-600">
                        Your conversations with Mira are completely private and secure.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <p className="text-sm text-gray-500">
                    We're working hard to bring Mira to you. Stay tuned for updates!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      case "meet":
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
                <h2 className="text-2xl font-bold text-gray-900">Let's Meet</h2>
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
      case "profile":
        return renderProfileContent()
      default:
        return renderPublicContent()
    }
  }

  const renderProfileContent = () => {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h2>
          
          <div className="space-y-6">
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Public Key</label>
                  <div className="mt-1">
                    <Input
                      value={publicKey || ''}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="w-full sm:w-auto"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#663399] to-orange-500 bg-clip-text text-transparent">
                Sobrkey
              </h1>
            </div>
            <div className="flex items-center gap-2">
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
          {visibleTabs.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
              {visibleTabs.map((tab) => (
                <Button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  variant={activeTab === tab ? "default" : "ghost"}
                  className={`
                    whitespace-nowrap
                    ${activeTab === tab ? 
                      'bg-gradient-to-r from-[#663399] to-orange-500 text-white' : 
                      'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  {tab}
                </Button>
              ))}
            </div>
          )}

          {/* Content */}
          <div className="space-y-4">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
      <FloatingActionButton onClick={() => setIsNewNoteDialogOpen(true)} />

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
              className="w-full bg-gradient-to-r from-[#663399] to-orange-500 text-white hover:opacity-90 disabled:opacity-50"
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

export default DashboardPage 
