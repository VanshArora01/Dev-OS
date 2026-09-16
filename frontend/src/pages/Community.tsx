import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Users, Send, MessageSquare, Clock, User, Loader2, Share2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { communityService } from "@/lib/communityService";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserProfile {
    displayName: string;
    profession: string;
    avatar: string;
}

interface Thought {
    _id: string;
    userId: string;
    content: string;
    userName: string;
    userAvatar: string;
    createdAt: string;
}

interface Comment {
    _id: string;
    thoughtId: string;
    userId: string;
    userName: string;
    userAvatar: string;
    content: string;
    createdAt: string;
}

export default function Community() {
    const { user } = useUser();
    const { toast } = useToast();
    const [thoughts, setThoughts] = useState<Thought[]>([]);
    const [newThought, setNewThought] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
    const [comments, setComments] = useState<Record<string, Comment[]>>({});
    const [newComments, setNewComments] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchThoughts();
        if (user?.id) {
            fetchMyProfile();
        }
    }, [user?.id]);

    const fetchMyProfile = async () => {
        try {
            const data = await communityService.getProfile(user!.id);
            setProfile(data);
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    };

    const fetchThoughts = async () => {
        try {
            const data = await communityService.getAllThoughts();
            setThoughts(data);
        } catch (error) {
            console.error("Error fetching thoughts:", error);
        } finally {
            setFetching(false);
        }
    };

    const handlePostThought = async () => {
        if (!newThought.trim() || !user) return;

        setLoading(true);
        try {
            const thoughtData = {
                userId: user.id,
                content: newThought,
                userName: profile?.displayName || user.fullName || "Anonymous",
                userAvatar: user.imageUrl
            };
            const post = await communityService.createThought(thoughtData);
            setThoughts([post, ...thoughts]);
            setNewThought("");
            toast({
                title: "Thought shared",
                description: "Your thought is now visible to the community.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to post thought. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(true);
            // Small delay to simulate processing and make it feel more "substantial"
            setTimeout(() => setLoading(false), 500);
        }
    };

    const fetchComments = async (thoughtId: string) => {
        try {
            const data = await communityService.getComments(thoughtId);
            setComments(prev => ({ ...prev, [thoughtId]: data }));
        } catch (error) {
            console.error("Error fetching comments:", error);
        }
    };

    const toggleComments = (thoughtId: string) => {
        if (activeCommentId === thoughtId) {
            setActiveCommentId(null);
        } else {
            setActiveCommentId(thoughtId);
            if (!comments[thoughtId]) {
                fetchComments(thoughtId);
            }
        }
    };

    const handlePostComment = async (thoughtId: string) => {
        const commentText = newComments[thoughtId];
        if (!commentText?.trim() || !user) return;

        try {
            const commentData = {
                thoughtId,
                userId: user.id,
                content: commentText,
                userName: profile?.displayName || user.fullName || "Anonymous",
                userAvatar: user.imageUrl
            };
            const post = await communityService.createComment(commentData);
            setComments(prev => ({
                ...prev,
                [thoughtId]: [...(prev[thoughtId] || []), post]
            }));
            setNewComments(prev => ({ ...prev, [thoughtId]: "" }));
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to post comment.",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-3xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-white/5 rounded-3xl border border-white/10 ring-8 ring-white/[0.02]">
                        <Users className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-tight">
                            Community<span className="text-white/20">.</span>
                        </h1>
                        <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-xs">
                            Climate Intelligence & Strategy Network
                        </p>
                    </div>
                </div>

                {/* Share Thought */}
                <Card className="bg-white/5 border-white/10 overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="pb-2 relative">
                        <CardTitle className="text-[10px] uppercase font-black tracking-widest text-white/40">Share your insight</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 relative">
                        <Textarea
                            placeholder="What's on your mind regarding climate resilience?"
                            value={newThought}
                            onChange={(e) => setNewThought(e.target.value)}
                            className="bg-transparent border-none text-white font-medium text-lg min-h-[100px] focus-visible:ring-0 p-0 resize-none placeholder:text-white/20"
                        />
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6 border border-white/10">
                                    <AvatarImage src={user?.imageUrl} />
                                    <AvatarFallback><User /></AvatarFallback>
                                </Avatar>
                                <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">
                                    Post as {profile?.displayName || user?.fullName}
                                </span>
                            </div>
                            <Button
                                onClick={handlePostThought}
                                disabled={loading || !newThought.trim()}
                                className="bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest rounded-full px-6 transition-all"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                Share Insight
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Feed */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/60">Community Feed</h2>
                        <span className="text-[10px] uppercase font-bold text-white/20">{thoughts.length} Thoughts</span>
                    </div>

                    {fetching ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-10 h-10 text-white/20 animate-spin" />
                            <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Loading Network...</p>
                        </div>
                    ) : thoughts.length === 0 ? (
                        <div className="py-20 text-center space-y-4">
                            <p className="text-white/20 font-black text-4xl uppercase italic">No activity yet</p>
                            <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Be the first to share a thought.</p>
                        </div>
                    ) : (
                        thoughts.map((thought) => (
                            <div key={thought._id} className="group relative">
                                <div className="absolute -left-4 top-0 bottom-0 w-px bg-white/10 group-hover:bg-white/30 transition-colors" />

                                <div className="space-y-4 pl-4">
                                    {/* User Info */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-10 h-10 border border-white/10 ring-4 ring-white/5">
                                                <AvatarImage src={thought.userAvatar} />
                                                <AvatarFallback><User /></AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-black uppercase text-xs tracking-wider group-hover:text-white transition-colors">
                                                    {thought.userName}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-white/20 uppercase tracking-tighter">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDistanceToNow(new Date(thought.createdAt), { addSuffix: true })}
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="text-white/20 hover:text-white hover:bg-white/5">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    {/* Content */}
                                    <div className="text-lg font-medium text-white/80 leading-relaxed pl-1">
                                        {thought.content}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-6 pt-2">
                                        <button
                                            onClick={() => toggleComments(thought._id)}
                                            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group/btn"
                                        >
                                            <div className="p-2 bg-white/5 rounded-lg group-hover/btn:bg-white/10 transition-colors">
                                                <MessageSquare className="w-4 h-4" />
                                            </div>
                                            <span className="text-[10px] uppercase font-black tracking-widest">
                                                {comments[thought._id]?.length || 0} Discussions
                                            </span>
                                        </button>
                                        <button className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group/btn">
                                            <div className="p-2 bg-white/5 rounded-lg group-hover/btn:bg-white/10 transition-colors">
                                                <Share2 className="w-4 h-4" />
                                            </div>
                                            <span className="text-[10px] uppercase font-black tracking-widest">Share</span>
                                        </button>
                                    </div>

                                    {/* Comments Section */}
                                    {activeCommentId === thought._id && (
                                        <div className="mt-8 space-y-6 pt-6 border-t border-white/5 animate-in fade-in slide-in-from-top-4 duration-500">
                                            {/* Scrollable Comments */}
                                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                {comments[thought._id]?.map((comment) => (
                                                    <div key={comment._id} className="flex gap-3 items-start bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                                        <Avatar className="w-6 h-6 border border-white/10 mt-1">
                                                            <AvatarImage src={comment.userAvatar} />
                                                            <AvatarFallback><User /></AvatarFallback>
                                                        </Avatar>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black uppercase text-white/80">{comment.userName}</span>
                                                                <span className="text-[8px] font-bold text-white/20 uppercase">
                                                                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-white/60 leading-normal">{comment.content}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Post Comment Input */}
                                            <div className="relative">
                                                <Input
                                                    placeholder="Contribute to discussion..."
                                                    value={newComments[thought._id] || ""}
                                                    onChange={(e) => setNewComments(prev => ({ ...prev, [thought._id]: e.target.value }))}
                                                    onKeyDown={(e) => e.key === 'Enter' && handlePostComment(thought._id)}
                                                    className="bg-white/5 border-white/10 text-white font-medium h-12 pr-12 rounded-xl focus:ring-0 focus:border-white/20"
                                                />
                                                <Button
                                                    onClick={() => handlePostComment(thought._id)}
                                                    className="absolute right-1 top-1 bottom-1 bg-white text-black hover:bg-white/90 rounded-lg w-10 p-0"
                                                >
                                                    <Send className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
