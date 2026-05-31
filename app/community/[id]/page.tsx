"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserSession } from "../../hooks/useUserSession";
import { uploadFile } from "@/lib/upload";

import CommunityVisitorView, {
  CommunityDetails,
} from "../../components/CommunityVisitorView";
import PostCard, { PostItem } from "../../components/PostCard";
import CommentsDrawer, { CommentItem } from "../../components/CommentsDrawer";
import ImageLightbox from "../../components/ImageLightbox";

interface PostApiData {
  id: string;
  title: string | null;
  content: string;
  isAnonymous: boolean;
  tag: string | null;
  imageUrl: string | null;
  post_image_url?: string | null;
  eventName: string | null;
  eventDate: string | null;
  eventTime: string | null;
  eventLocation: string | null;
  createdAt: string;
  likedByCurrentUser?: boolean;
  author?: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    likes: number;
    comments: number;
  };
  permissions?: {
    canEdit: boolean;
  };
}

interface MemberApiData {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    nim: string;
    prodi: string;
    angkatan: number;
  };
}

interface CommentApiData {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  permissions?: {
    canEdit: boolean;
    canDelete: boolean;
  };
  replies?: CommentApiData[];
}

const parseRulesAndTags = (rulesString: string | null) => {
  if (!rulesString) return { tags: [], rules: "" };
  const tagsMatch = rulesString.match(/\[TAGS\](.*?)\[RULES\]/);
  if (tagsMatch) {
    const tagsPart = tagsMatch[1].trim();
    const rulesPart = rulesString.replace(/\[TAGS\].*?\[RULES\]/, "").trim();
    const tags = tagsPart
      ? tagsPart.split(" ").filter((t) => t.startsWith("#"))
      : [];
    return { tags, rules: rulesPart };
  }
  const tags: string[] = [];
  const cleanRules = rulesString
    .replace(/(#[a-zA-Z0-9_]+)/g, (match) => {
      tags.push(match);
      return "";
    })
    .trim();
  return { tags, rules: cleanRules || rulesString };
};

const parsePostEventAndContent = (content: string) => {
  if (!content) return { event: null, content: "" };
  const eventMatch = content.match(
    /\[EVENT\] Title: (.*?) \| Time: (.*?) \| Location: (.*?) \[CONTENT\] (.*)/s,
  );
  if (eventMatch) {
    return {
      event: {
        title: eventMatch[1].trim(),
        time: eventMatch[2].trim(),
        location: eventMatch[3].trim(),
        isRegistered: false,
      },
      content: eventMatch[4].trim(),
    };
  }
  return { event: null, content };
};

export default function CommunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user, loading } = useUserSession();
  const { id } = use(params);

  // States
  const [community, setCommunity] = useState<CommunityDetails | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [activeTab, setActiveTab] = useState("Postingan");
  const [postText, setPostText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [composerType, setComposerType] = useState<"post" | "event">("post");
  const [joining, setJoining] = useState(false);
  const [successToast, setSuccessToast] = useState("");
  const [memberRole, setMemberRole] = useState<string>("MEMBER");

  // Comments Tray State
  const [activeCommentPost, setActiveCommentPost] = useState<PostItem | null>(
    null,
  );
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Comment Action States
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyingToAuthorName, setReplyingToAuthorName] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");

  // Edit Community Details States
  const [showEditInfoModal, setShowEditInfoModal] = useState(false);
  const [editInfoName, setEditInfoName] = useState("");
  const [editInfoDescription, setEditInfoDescription] = useState("");
  const [editInfoRules, setEditInfoRules] = useState("");
  const [editInfoTags, setEditInfoTags] = useState<string[]>([]);
  const [editInfoTagInput, setEditInfoTagInput] = useState("");
  const [savingEditInfo, setSavingEditInfo] = useState(false);

  // Event creation form state
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [postImage, setPostImage] = useState<string | null>(null);
  const [postImageFile, setPostImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Leave community modal states
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leavingCommunity, setLeavingCommunity] = useState(false);

  // Member action confirm modal states
  const [memberActionConfirm, setMemberActionConfirm] = useState<{
    type: "kick" | "promote" | "demote";
    userId: string;
    userName: string;
  } | null>(null);
  const [processingMemberAction, setProcessingMemberAction] = useState(false);

  // Edit post states
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostText, setEditPostText] = useState("");

  // Route protection
  useEffect(() => {
    if (!loading && (!user || !user.isLoggedIn)) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Load Community & Posts
  useEffect(() => {
    let active = true;

    async function loadRealData() {
      try {
        // Fetch Community Details (which has isJoined and permissions calculated on server)
        const commRes = await fetch(`/api/communities/${id}`);
        if (!commRes.ok) throw new Error("Gagal mengambil data komunitas");
        const commData = await commRes.json();

        // Fetch Posts
        let postsData = [];
        try {
          const postsRes = await fetch(`/api/posts?communityId=${id}`);
          if (postsRes.ok) {
            postsData = await postsRes.json();
          }
        } catch (e) {
          console.warn("Failed to fetch posts:", e);
        }

        if (!active) return;

        // Set role based on backend permissions
        const isJoined = commData.isJoined;
        if (commData.permissions?.isCommunityAdmin) {
          setMemberRole("ADMIN");
        } else {
          setMemberRole("MEMBER");
        }

        // Map Category Avatar Color
        const avatarColorMap: Record<string, string> = {
          AKADEMIK: "bg-emerald-700 text-white",
          HOBI: "bg-red-800 text-white",
          KARIR: "bg-indigo-900 text-white",
          ORGANISASI: "bg-amber-600 text-white",
          EVENT: "bg-blue-800 text-white",
        };

        setCommunity({
          id: commData.id,
          name: commData.name,
          slug: commData.slug,
          description: commData.description,
          category: commData.category,
          membersCount: commData._count?.members || 0,
          initials: commData.name
            .split(" ")
            .map((w: string) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
          isJoined,
          avatarColor:
            avatarColorMap[commData.category] || "bg-emerald-700 text-white",
          onlineCount: Math.max(
            1,
            Math.floor((commData._count?.members || 1) / 5),
          ),
          rules: commData.rules || "",
          tags: commData.tags || [],
          coverImage:
            commData.coverImage || commData.community_image_url || null,
          creatorId: commData.creatorId,
          permissions: commData.permissions || {
            canEdit: false,
            canDelete: false,
            canManageMembers: false,
            isCommunityAdmin: false,
            isCommunityOwner: false,
          },
        });

        // Map posts
        const mappedPosts: PostItem[] = postsData.map((post: PostApiData) => {
          const postAuthor = post.author;
          const authorName = post.isAnonymous
            ? "Anonymous"
            : postAuthor?.name || "Mahasiswa";
          const avatarLetter = post.isAnonymous
            ? "?"
            : authorName
                .split(" ")
                .map((w: string) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

          // Prefer structured event fields; fallback to content-encoded for legacy posts
          let event = null;
          let displayContent = post.content;
          if (post.eventName) {
            const dateStr = post.eventDate || "";
            const timeStr = post.eventTime || "";
            let formattedTime = "";
            if (dateStr) {
              try {
                const d = new Date(`${dateStr}T${timeStr || "00:00"}`);
                formattedTime = d.toLocaleDateString("id-ID", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                }) + " WIB";
              } catch { formattedTime = `${dateStr} ${timeStr}`; }
            }
            event = {
              title: post.eventName,
              time: formattedTime,
              location: post.eventLocation || "Online",
              isRegistered: typeof window !== "undefined" && !!localStorage.getItem(`event-registered-${post.id}`),
            };
          } else {
            const parsed = parsePostEventAndContent(post.content);
            if (parsed.event) {
              parsed.event.isRegistered = typeof window !== "undefined" && !!localStorage.getItem(`event-registered-${post.id}`);
              event = parsed.event;
              displayContent = parsed.content;
            }
          }

          return {
            id: post.id,
            authorName,
            authorEmail: postAuthor?.email || "",
            authorNim: "",
            avatarLetter,
            timeAgo: new Date(post.createdAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            content: displayContent,
            isAnonymous: post.isAnonymous,
            likes: post._count?.likes || 0,
            commentsCount: post._count?.comments || 0,
            isLiked: post.likedByCurrentUser || false,
            canEdit: post.permissions?.canEdit || false,
            imageUrl: post.imageUrl || post.post_image_url || undefined,
            event: event || undefined,
          };
        });

        setPosts(mappedPosts);
      } catch (err) {
        console.error("Real API error:", err);
      }
    }

    if (user?.isLoggedIn) {
      loadRealData();
    }

    return () => {
      active = false;
    };
  }, [id, user]);

  // Lazy load members list when the "Anggota" tab is active
  const [membersList, setMembersList] = useState<MemberApiData[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    if (
      activeTab === "Anggota" &&
      membersList.length === 0 &&
      user?.isLoggedIn
    ) {
      async function fetchMembers() {
        setLoadingMembers(true);
        try {
          const res = await fetch(`/api/communities/${id}/members`);
          if (res.ok) {
            const data = await res.json();
            setMembersList(data);
          }
        } catch (e) {
          console.warn("Failed to lazy load members:", e);
        } finally {
          setLoadingMembers(false);
        }
      }
      fetchMembers();
    }
  }, [activeTab, id, membersList.length, user]);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 3000);
  };

  // Join Community Handler
  const handleJoinCommunity = async () => {
    setJoining(true);
    try {
      const res = await fetch(`/api/communities/${id}/join`, {
        method: "POST",
      });
      if (res.ok) {
        triggerToast(`Berhasil bergabung! 🎉`);
        setCommunity((prev) =>
          prev
            ? {
                ...prev,
                isJoined: true,
                membersCount: prev.membersCount + 1,
              }
            : null,
        );
      } else {
        const err = await res.json();
        triggerToast(err.error || "Gagal bergabung dengan komunitas");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Gagal menyambungkan ke server.");
    } finally {
      setJoining(false);
    }
  };

  // Handler to load and validate post attachment image
  const handlePostImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      triggerToast("Ukuran lampiran gambar maksimal 5MB!");
      return;
    }

    setPostImageFile(file);
    // Generate local preview URL (no base64 sent to server)
    setPostImage(URL.createObjectURL(file));
  };

  // Create post or event handler
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const contentToSubmit = composerType === "event"
      ? (postText.trim() || "Ayo ikuti event seru ini!")
      : postText.trim();

    if (composerType === "event") {
      if (!eventTitle.trim() || !eventDate.trim()) {
        triggerToast("Nama event dan tanggal wajib diisi!");
        return;
      }
    } else {
      if (!contentToSubmit) return;
    }

    setSubmittingPost(true);
    try {
      // Upload image to Supabase Storage if a file is selected
      let imageUrl: string | undefined = undefined;
      if (postImageFile) {
        try {
          setUploadingImage(true);
          imageUrl = await uploadFile(postImageFile, "postImage", () => {});
        } catch (uploadErr: unknown) {
          const err = uploadErr as Error;
          triggerToast(err.message || "Gagal mengunggah gambar.");
          setUploadingImage(false);
          setSubmittingPost(false);
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      const payload: Record<string, unknown> = {
        content: contentToSubmit,
        isAnonymous: isAnonymous,
        communityId: id,
        imageUrl: imageUrl || "",
      };

      if (composerType === "event") {
        payload.eventName = eventTitle.trim();
        payload.eventDate = eventDate;
        payload.eventTime = eventTime;
        payload.eventLocation = eventLocation.trim() || "Online";
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const newPostRaw = await res.json();
        const postAuthor = newPostRaw.author || {};
        const authorName = newPostRaw.isAnonymous
          ? "Anonymous"
          : postAuthor.name || user.name;
        const avatarLetter = newPostRaw.isAnonymous
          ? "?"
          : authorName
              .split(" ")
              .map((w: string) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

        // Build event from structured fields if present
        let newEvent = undefined;
        if (newPostRaw.eventName) {
          const dateStr = newPostRaw.eventDate || "";
          const timeStr = newPostRaw.eventTime || "";
          let formattedTime = "";
          if (dateStr) {
            try {
              const d = new Date(`${dateStr}T${timeStr || "00:00"}`);
              formattedTime = d.toLocaleDateString("id-ID", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              }) + " WIB";
            } catch { formattedTime = `${dateStr} ${timeStr}`; }
          }
          newEvent = {
            title: newPostRaw.eventName,
            time: formattedTime,
            location: newPostRaw.eventLocation || "Online",
            isRegistered: false,
          };
        }

        const newPostItem: PostItem = {
          id: newPostRaw.id,
          authorName,
          authorEmail: postAuthor.email || user.email,
          authorNim: user.nim || "",
          avatarLetter,
          timeAgo: "Baru saja",
          content: newPostRaw.content,
          isAnonymous: newPostRaw.isAnonymous,
          likes: 0,
          commentsCount: 0,
          isLiked: false,
          imageUrl: newPostRaw.imageUrl || undefined,
          event: newEvent,
        };
        setPosts((prev) => [newPostItem, ...prev]);
        setPostText("");
        setEventTitle("");
        setEventDate("");
        setEventTime("");
        setEventLocation("");
        setIsAnonymous(false);
        setPostImage(null);
        setPostImageFile(null);
        setComposerType("post");
        triggerToast(
          composerType === "event"
            ? "Event baru berhasil diterbitkan!"
            : "Postingan berhasil diterbitkan!",
        );
      } else {
        const err = await res.json();
        triggerToast(err.error || "Gagal menerbitkan postingan");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Gagal menghubungi server.");
    } finally {
      setSubmittingPost(false);
    }
  };

  // Delete post handler
  const handleDeletePost = async (postId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus postingan ini?")) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        triggerToast("Postingan berhasil dihapus!");
      } else {
        const err = await res.json();
        triggerToast(err.error || "Gagal menghapus postingan");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Gagal menghubungi server.");
    }
  };

  // Edit post handler
  const handleEditPost = async (postId: string) => {
    if (!editPostText.trim()) return;
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editPostText.trim() }),
      });
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id === postId) {
              return { ...p, content: editPostText.trim() };
            }
            return p;
          }),
        );
        setEditingPostId(null);
        setEditPostText("");
        triggerToast("Postingan berhasil diperbarui!");
      } else {
        const err = await res.json();
        triggerToast(err.error || "Gagal memperbarui postingan");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Gagal menghubungi server.");
    }
  };

  // Toggle pin handler (Admin Privilege)
  const handleTogglePin = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isPinned = !p.isPinned;
          triggerToast(
            isPinned
              ? "Postingan berhasil disematkan!"
              : "Sematkan dibatalkan.",
          );
          return { ...p, isPinned };
        }
        return p;
      }),
    );
  };

  // Register for event handler with Local Storage persistence
  const handleRegisterEvent = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId && post.event) {
          const isRegistered = !post.event.isRegistered;
          if (typeof window !== "undefined") {
            if (isRegistered) {
              localStorage.setItem(`event-registered-${postId}`, "true");
              triggerToast("Anda berhasil mendaftar untuk event ini!");
            } else {
              localStorage.removeItem(`event-registered-${postId}`);
              triggerToast("Pendaftaran event dibatalkan.");
            }
          }
          return {
            ...post,
            event: {
              ...post.event,
              isRegistered,
            },
          };
        }
        return post;
      }),
    );
  };

  // Like handler
  const handleLike = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id === postId) {
              return {
                ...p,
                isLiked: data.liked,
                likes: data.likeCount,
              };
            }
            return p;
          }),
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // COMMENTS DRAWER SYSTEM
  // ==========================================
  const mapComment = (comment: CommentApiData): CommentItem => {
    const author = comment.author || {};
    const authorName = author.name || "Mahasiswa";
    const avatarLetter = authorName
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    return {
      id: comment.id,
      postId: comment.postId,
      parentId: comment.parentId,
      content: comment.content,
      createdAt: new Date(comment.createdAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      }),
      authorName,
      avatarLetter,
      isAnonymous: false,
      permissions: comment.permissions || { canEdit: false, canDelete: false },
      replies: comment.replies ? comment.replies.map(mapComment) : [],
    };
  };

  const handleOpenComments = async (post: PostItem) => {
    setActiveCommentPost(post);
    setCommentText("");
    setReplyingToCommentId(null);
    setReplyingToAuthorName(null);
    setEditingCommentId(null);
    setEditCommentText("");

    try {
      const res = await fetch(`/api/comments?postId=${post.id}`);
      if (res.ok) {
        const data = await res.json();
        const mappedComments: CommentItem[] = data.map(mapComment);
        setComments(mappedComments);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeCommentPost || !commentText.trim()) return;

    setSubmittingComment(true);

    const payload = {
      content: commentText.trim(),
      postId: activeCommentPost.id,
      parentId: replyingToCommentId || null,
    };

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const newCommentRaw = await res.json();
        const mappedNewComment = mapComment(newCommentRaw);

        if (replyingToCommentId) {
          setComments((prev) =>
            prev.map((c) => {
              if (c.id === replyingToCommentId) {
                return {
                  ...c,
                  replies: [...(c.replies || []), mappedNewComment],
                };
              }
              return c;
            })
          );
        } else {
          setComments((prev) => [...prev, mappedNewComment]);
        }

        // Update comment count in posts state
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id === activeCommentPost.id) {
              return { ...p, commentsCount: p.commentsCount + 1 };
            }
            return p;
          }),
        );

        setCommentText("");
        setReplyingToCommentId(null);
        setReplyingToAuthorName(null);
        triggerToast("Komentar berhasil ditambahkan!");
      } else {
        const err = await res.json();
        triggerToast(err.error || "Gagal mengirim komentar");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Gagal menghubungi server.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSaveEditComment = async (commentId: string) => {
    if (!editCommentText.trim()) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editCommentText.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === commentId) {
              return { ...c, content: updated.content };
            }
            if (c.replies) {
              return {
                ...c,
                replies: c.replies.map((r) =>
                  r.id === commentId ? { ...r, content: updated.content } : r
                ),
              };
            }
            return c;
          })
        );
        setEditingCommentId(null);
        setEditCommentText("");
        triggerToast("Komentar berhasil diperbarui!");
      } else {
        const err = await res.json();
        triggerToast(err.error || "Gagal diperbarui");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Gagal menghubungi server.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus komentar ini?")) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setComments((prev) => {
          let deletedCount = 0;
          const nextComments = prev.filter((c) => {
            if (c.id === commentId) {
              deletedCount += 1 + (c.replies?.length || 0);
              return false;
            }
            if (c.replies) {
              const originalLength = c.replies.length;
              c.replies = c.replies.filter((r) => r.id !== commentId);
              deletedCount += originalLength - c.replies.length;
            }
            return true;
          });

          if (activeCommentPost && deletedCount > 0) {
            setPosts((postsPrev) =>
              postsPrev.map((p) =>
                p.id === activeCommentPost.id
                  ? { ...p, commentsCount: Math.max(0, p.commentsCount - deletedCount) }
                  : p
              )
            );
          }
          return nextComments;
        });
        triggerToast("Komentar berhasil dihapus!");
      } else {
        const err = await res.json();
        triggerToast(err.error || "Gagal menghapus komentar");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Gagal menghubungi server.");
    }
  };

  const handleKickMember = async (userId: string) => {
    try {
      const res = await fetch(`/api/communities/${id}/members/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMembersList((prev) => prev.filter((m) => m.user.id !== userId));
        setCommunity((prev) =>
          prev ? { ...prev, membersCount: Math.max(1, prev.membersCount - 1) } : null
        );
        triggerToast("Anggota berhasil dikeluarkan.");
      } else {
        const err = await res.json();
        triggerToast(err.error || "Gagal mengeluarkan anggota");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Gagal menghubungi server.");
    }
  };

  const handleUpdateMemberRole = async (userId: string, newRole: "ADMIN" | "MEMBER") => {
    try {
      const res = await fetch(`/api/communities/${id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: userId, role: newRole }),
      });
      if (res.ok) {
        setMembersList((prev) =>
          prev.map((m) => (m.user.id === userId ? { ...m, role: newRole } : m))
        );
        triggerToast(`Peran anggota berhasil diperbarui menjadi ${newRole}.`);
      } else {
        const err = await res.json();
        triggerToast(err.error || "Gagal memperbarui peran anggota");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Gagal menghubungi server.");
    }
  };

  const handleSaveEditInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editInfoName.trim()) {
      triggerToast("Nama komunitas minimal 3 karakter!");
      return;
    }
    if (editInfoDescription.trim().length < 10) {
      triggerToast("Deskripsi komunitas minimal 10 karakter!");
      return;
    }

    setSavingEditInfo(true);
    try {
      const res = await fetch(`/api/communities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editInfoName.trim(),
          description: editInfoDescription.trim(),
          rules: editInfoRules.trim(),
          tags: editInfoTags,
        }),
      });

      if (res.ok) {
        const updatedComm = await res.json();
        setCommunity((prev) =>
          prev
            ? {
                ...prev,
                name: updatedComm.name,
                description: updatedComm.description,
                rules: updatedComm.rules,
                tags: updatedComm.tags,
              }
            : null
        );
        setShowEditInfoModal(false);
        triggerToast("Informasi komunitas berhasil diperbarui!");
      } else {
        const err = await res.json();
        triggerToast(err.error || "Gagal memperbarui informasi komunitas");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Gagal menghubungi server.");
    } finally {
      setSavingEditInfo(false);
    }
  };

  if (loading || !user || !community) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#FDFBF7]">
        <div className="text-center font-bold text-[#0B1E36]">
          <svg
            className="animate-spin h-8 w-8 mx-auto mb-4 text-[#0B1E36]"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading data...
        </div>
      </div>
    );
  }

  const isAdmin =
    community.permissions.isCommunityAdmin ||
    community.permissions.isCommunityOwner ||
    user.role === "global_admin" ||
    memberRole === "ADMIN";

  // ==========================================
  // VIEW 1: VISITOR / INFORMASI KOMUNITAS VIEW (NOT JOINED)
  // ==========================================
  if (!community.isJoined) {
    return (
      <CommunityVisitorView
        community={community}
        joining={joining}
        successToast={successToast}
        handleJoinCommunity={handleJoinCommunity}
      />
    );
  }

  // ==========================================
  // VIEW 2: ACTIVE DISCUSSION FEED & MESSAGES (JOINED) exactly matching Screen 1, 2, and 3
  // ==========================================
  return (
    <div className="flex-1 w-full bg-[#E2E5E9]/20 flex flex-col min-h-screen relative font-sans">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 left-4 right-4 md:left-auto md:right-5 z-50 bg-[#F2C010] text-[#0B1E36] font-extrabold px-6 py-3 rounded-full shadow-lg text-center text-xs animate-bounce">
          {successToast}
        </div>
      )}

      {/* 1. Header Banner exactly matching Screen 1/2/3 */}
      <div className="bg-[#0B1E36] px-4 py-3 flex items-center justify-between w-full shadow-sm text-white shrink-0">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Back arrow button */}
          <Link
            href="/community/join"
            className="text-white hover:opacity-80 transition-opacity p-1"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </Link>

          {/* Custom Avatar Square Badge matching soft box guidelines */}
          <div className="w-9 h-9 rounded-lg overflow-hidden border border-white/20 flex items-center justify-center shrink-0 bg-white shadow-sm">
            {community.coverImage || community.community_image_url ? (
              <img
                src={
                  community.coverImage || community.community_image_url || ""
                }
                alt={community.name}
                onClick={() => setPreviewImageUrl(community.coverImage || community.community_image_url || null)}
                className="w-full h-full object-cover cursor-zoom-in hover:brightness-95 transition-all"
              />
            ) : (
              <div
                className={`w-full h-full ${community.avatarColor} flex items-center justify-center font-extrabold text-xs`}
              >
                {community.initials}
              </div>
            )}
          </div>

          <div className="flex flex-col min-w-0 leading-tight">
            <h1 className="font-extrabold text-xs tracking-tight truncate">
              {community.name}
            </h1>
            <span className="text-[9px] font-semibold text-slate-300 mt-0.5">
              {community.onlineCount} online
            </span>
          </div>
        </div>

        {/* Three dots vertical menu on the right */}
        <button
          onClick={() => setShowMenuModal(true)}
          className="p-1 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <svg
            className="w-5 h-5 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>
      </div>

      {/* 2. Admin banner exactly matching Screen 3 */}
      {isAdmin && (
        <div className="bg-[#FEF08A] px-4 py-2 flex items-center justify-between w-full border-b border-amber-200/50 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#0B1E36]">
            {/* Yellow Dot icon as in Screen 3 */}
            <span className="w-2.5 h-2.5 rounded-full bg-[#F2C010] border border-amber-400 inline-block"></span>
            Anda adalah admin
          </div>
          {/* Yellow pill edit button matching screen 3 */}
          <button
            onClick={() => {
              if (community) {
                setEditInfoName(community.name);
                setEditInfoDescription(community.description);
                setEditInfoRules(community.rules || "");
                setEditInfoTags(community.tags || []);
                setEditInfoTagInput("");
                setShowEditInfoModal(true);
              }
            }}
            className="px-3 py-1 bg-[#F2C010] text-[#0B1E36] font-black text-[9px] rounded-lg border border-amber-400 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            Edit Informasi
          </button>
        </div>
      )}

      {/* 3. Cream Tabs Bar exactly matching Screen 1/2/3 */}
      <div className="bg-[#FFFBEB] w-full border-b border-amber-100 flex items-center shrink-0">
        {isAdmin ? (
          // Admin View: 3 tabs with restored Info tab
          <div className="flex w-full">
            {["Postingan", "Info", "Anggota"].map((tab) => {
              const isTabActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 text-center py-3 text-xs font-black transition-all cursor-pointer ${
                    isTabActive
                      ? "text-[#0B1E36] border-b-4 border-[#F2C010]"
                      : "text-slate-400 hover:text-[#0B1E36]"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        ) : (
          // Member View: 2 tabs matching Screen 1/2
          <div className="flex w-full">
            {["Postingan", "Info"].map((tab) => {
              const isTabActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 text-center py-3 text-xs font-black transition-all cursor-pointer ${
                    isTabActive
                      ? "text-[#0B1E36] border-b-4 border-[#F2C010]"
                      : "text-slate-400 hover:text-[#0B1E36]"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Layout Content Container */}
      <div className="flex-1 w-full max-w-lg mx-auto px-4 py-5 flex flex-col gap-5 pb-28 overflow-y-auto">
        {activeTab === "Postingan" && (
          <>
            {/* 4. Post Editor exactly matching Screen 1/2 & Screen 3 */}
            <form
              onSubmit={handleCreatePost}
              className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Avatar circle - changes based on anonymous toggle */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 ${
                      isAnonymous
                        ? "bg-slate-600 text-white border border-slate-500"
                        : "bg-[#F2C010] text-[#0B1E36] border border-amber-300"
                    }`}
                  >
                    {isAnonymous ? "?" : user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-extrabold text-[#0B1E36]">
                    {isAnonymous ? "Anonymous" : user.name}
                  </span>
                </div>

                {/* Interactive Toggle matching Screen 1/2 */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold text-slate-500">
                    Anonim
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer outline-none relative ${
                      isAnonymous ? "bg-[#0B1E36]" : "bg-slate-200"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        isAnonymous ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Switch button type choose between Post and Event */}
              {isAdmin && (
                <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200 select-none">
                  <button
                    type="button"
                    onClick={() => setComposerType("post")}
                    className={`flex-1 text-center py-2 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                      composerType === "post"
                        ? "bg-[#0B1E36] text-white shadow-sm"
                        : "text-slate-400 hover:text-[#0B1E36]"
                    }`}
                  >
                    Post
                  </button>
                  <button
                    type="button"
                    onClick={() => setComposerType("event")}
                    className={`flex-1 text-center py-2 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                      composerType === "event"
                        ? "bg-[#0B1E36] text-white shadow-sm"
                        : "text-slate-400 hover:text-[#0B1E36]"
                    }`}
                  >
                    Event
                  </button>
                </div>
              )}

              {composerType === "event" ? (
                <div className="flex flex-col gap-3.5 border-t border-slate-100 pt-2.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 pl-1 uppercase tracking-wider">
                      Nama Event
                    </label>
                    <input
                      type="text"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="Contoh: Webinar UI/UX Beginner"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-[#0B1E36] outline-none placeholder-[#8FA0AF] focus:border-[#0B1E36]"
                      required
                    />
                  </div>

                  <div className="flex gap-2.5">
                    <div className="flex flex-col gap-1.5 flex-1">
                      <label className="text-[9px] font-black text-slate-400 pl-1 uppercase tracking-wider">
                        Tanggal Event
                      </label>
                      <input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-[#0B1E36] outline-none focus:border-[#0B1E36]"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1">
                      <label className="text-[9px] font-black text-slate-400 pl-1 uppercase tracking-wider">
                        Waktu Event
                      </label>
                      <input
                        type="time"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-[#0B1E36] outline-none focus:border-[#0B1E36]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 pl-1 uppercase tracking-wider">
                      Lokasi Event
                    </label>
                    <input
                      type="text"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      placeholder="Contoh: Auditorium UNNES / Online via Zoom"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-[#0B1E36] outline-none placeholder-[#8FA0AF] focus:border-[#0B1E36]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 pl-1 uppercase tracking-wider">
                      Deskripsi Event (Opsional)
                    </label>
                    <textarea
                      value={postText}
                      onChange={(e) => setPostText(e.target.value)}
                      placeholder="Tulis deskripsi atau detail event..."
                      className="w-full min-h-[60px] py-2 text-xs font-bold text-[#0B1E36] placeholder-[#8FA0AF] outline-none resize-none"
                      maxLength={1000}
                    />
                  </div>
                </div>
              ) : (
                <textarea
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="Apa yang ingin kamu bagikan?"
                  className="w-full min-h-[85px] py-2 text-xs font-bold text-[#0B1E36] placeholder-[#8FA0AF] outline-none resize-none"
                  maxLength={1000}
                  required
                />
              )}

              {/* Interactive selected image preview block (max 5MB) */}
              {postImage && (
                <div className="relative w-full max-h-32 overflow-hidden border border-slate-200 rounded-xl p-1 bg-slate-50 flex items-center justify-start gap-2 select-none">
                  <img
                    src={postImage}
                    alt="Attachment"
                    onClick={() => setPreviewImageUrl(postImage)}
                    className="h-16 w-16 object-cover rounded-lg cursor-zoom-in hover:brightness-95 transition-all"
                  />
                  <span className="text-[10px] font-bold text-slate-400 flex-1">
                    {uploadingImage ? "Mengunggah gambar..." : "Lampiran gambar siap dikirim (maks 5MB)"}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setPostImage(null); setPostImageFile(null); }}
                    className="absolute top-2 right-2 w-6 h-6 bg-[#0B1E36] text-white rounded-full flex items-center justify-center text-[10px] cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Bottom Actions Bar */}
              <div className="flex justify-between items-center border-t border-slate-100 pt-2.5 mt-1">
                <div className="flex items-center gap-3 text-slate-400">
                  {/* Photo icon triggering custom direct upload (max 5MB) */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePostImageChange}
                    className="hidden"
                    id="post-photo-selector"
                  />
                  <label
                    htmlFor="post-photo-selector"
                    className="hover:text-[#0B1E36] transition-colors cursor-pointer p-0.5"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </label>
                  {/* Comment icon matching Screen 1/2 */}
                  <button
                    type="button"
                    onClick={() => triggerToast("Tambah tag diskusi!")}
                    className="hover:text-[#0B1E36] transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                      />
                    </svg>
                  </button>
                </div>

                 <button
                  type="submit"
                  disabled={submittingPost}
                  className="px-6 py-1.5 bg-[#0B1E36] hover:bg-black text-white font-extrabold text-xs rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {submittingPost ? (
                    <span className="flex items-center gap-1.5 justify-center">
                      <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    "Post"
                  )}
                </button>
              </div>
            </form>

            {/* 5. Speech Bubble Card Feed Feed exactly matching Screen 1/2/3 */}
            <div className="flex flex-col gap-4.5 mt-2">
              {posts.length === 0 ? (
                <div className="text-center py-10 bg-white border border-dashed border-slate-200 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400">
                    Belum ada postingan komunitas. Jadilah yang pertama!
                  </p>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    isAdmin={isAdmin}
                    editingPostId={editingPostId}
                    editPostText={editPostText}
                    setEditingPostId={setEditingPostId}
                    setEditPostText={setEditPostText}
                    handleEditPost={handleEditPost}
                    handleDeletePost={handleDeletePost}
                    handleTogglePin={handleTogglePin}
                    handleRegisterEvent={handleRegisterEvent}
                    handleLike={handleLike}
                    handleOpenComments={handleOpenComments}
                    onImageClick={(url) => setPreviewImageUrl(url)}
                  />
                ))
              )}
            </div>
          </>
        )}

        {/* Info / Anggota Tabs contents */}
        {activeTab === "Info" && (
          <div className="flex flex-col gap-5">
            {/* 1. Tentang Komunitas Card */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
              <h2 className="text-xs font-black text-[#0B1E36] uppercase tracking-wider">
                Tentang Komunitas
              </h2>
              <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                {community.description}
              </p>
            </div>

            {/* 2. Aturan Komunitas Card */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
              <h2 className="text-xs font-black text-[#0B1E36] uppercase tracking-wider">
                Aturan Komunitas
              </h2>
              <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                {(() => {
                  const { rules: cleanRules } = parseRulesAndTags(
                    community.rules || "",
                  );
                  return (
                    cleanRules ||
                    "Selamat datang! Patuhi etika akademik, hormati sesama mahasiswa, dan gunakan wadah ini untuk kolaborasi yang sehat."
                  );
                })()}
              </p>
            </div>

            {/* 3. Tag Komunitas Card (Member View) matching your mockup colors exactly */}
            {(() => {
              const displayTags = (community.tags && community.tags.length > 0)
                ? community.tags.map(t => t.startsWith("#") ? t : `#${t}`)
                : ["#Robotika", "#AI", "#IoT"];

              return (
                <div className="bg-white border-2 border-[#0B1E36] rounded-2xl p-5 shadow-[4px_4px_0px_0px_#0B1E36] flex flex-col gap-4 text-center select-none">
                  <h2 className="text-sm font-black text-[#0B1E36] uppercase tracking-wider">
                    Tag Komunitas
                  </h2>
                  <div className="flex flex-wrap justify-center gap-2.5">
                    {displayTags.map((tag, idx) => {
                      const tagColors = [
                        "bg-[#FEF08A] text-yellow-900 border-yellow-300",
                        "bg-[#BFDBFE] text-blue-900 border-blue-300",
                        "bg-[#E9D5FF] text-purple-900 border-purple-300",
                        "bg-[#A7F3D0] text-emerald-900 border-emerald-300",
                        "bg-[#FECDD3] text-rose-900 border-rose-300",
                      ];
                      const colorClass = tagColors[idx % tagColors.length];
                      return (
                        <span
                          key={tag}
                          className={`px-4.5 py-1.5 rounded-full text-xs font-black border shadow-sm ${colorClass}`}
                        >
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === "Anggota" && (
          <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
            <h2 className="text-xs font-black text-[#0B1E36] uppercase tracking-wider">
              Daftar Anggota
            </h2>
            {loadingMembers ? (
              <div className="flex flex-col gap-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 pb-2 border-b border-slate-50"
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-200 shrink-0"></div>
                    <div className="h-3 w-32 bg-slate-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : membersList.length === 0 ? (
              <p className="text-xs font-bold text-slate-400">
                Tidak ada anggota yang ditemukan.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {membersList.map((m: MemberApiData, i: number) => {
                  const name = m.user?.name || "Mahasiswa";
                  return (
                    <div
                      key={m.id || i}
                      className="flex items-center justify-between pb-2 border-b border-slate-50 text-xs font-bold text-[#0B1E36]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] border border-slate-200 text-slate-500 shrink-0">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="truncate">{name}</span>
                          {m.role === "ADMIN" && (
                            <span className="text-[8px] font-extrabold text-[#F2C010] bg-[#0B1E36] px-1.5 py-0.5 rounded w-max mt-0.5 uppercase tracking-wide">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                      {community.isJoined && (community.permissions.isCommunityOwner || community.permissions.isCommunityAdmin) && (
                        <div className="flex items-center gap-2 shrink-0">
                          {community.permissions.isCommunityOwner && m.user.email !== user.email && (
                            <button
                              type="button"
                              onClick={() => setMemberActionConfirm({
                                type: m.role === "ADMIN" ? "demote" : "promote",
                                userId: m.user.id,
                                userName: name,
                              })}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[9px] font-black cursor-pointer transition-all"
                            >
                              {m.role === "ADMIN" ? "Demote" : "Promote"}
                            </button>
                          )}
                          {m.user.email !== user.email && m.user.id !== community.creatorId && (
                            (community.permissions.isCommunityOwner || (community.permissions.isCommunityAdmin && m.role !== "ADMIN")) && (
                              <button
                                type="button"
                                onClick={() => setMemberActionConfirm({
                                  type: "kick",
                                  userId: m.user.id,
                                  userName: name,
                                })}
                                className="px-2 py-1 bg-red-50 hover:bg-red-100 border border-red-200 rounded text-[9px] font-black cursor-pointer transition-all text-red-600"
                              >
                                Kick
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB button in bottom right corner matching Screen 1/2 */}
      {community.isJoined && activeTab === "Postingan" && (
        <button
          onClick={() => triggerToast("Tulis sesuatu...")}
          className="fixed bottom-20 right-5 w-12 h-12 rounded-full bg-[#F2C010] flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer z-40"
        >
          <span className="text-2xl font-black text-[#0B1E36] leading-none">
            +
          </span>
        </button>
      )}

      {/* ==========================================
          INTERACTIVE COMMENTS SHEET / MODAL DRAWER
          ========================================== */}
      {activeCommentPost && (
        <CommentsDrawer
          activeCommentPost={activeCommentPost}
          comments={comments}
          commentText={commentText}
          setCommentText={setCommentText}
          submittingComment={submittingComment}
          handlePostComment={handlePostComment}
          onClose={() => setActiveCommentPost(null)}
          replyingToCommentId={replyingToCommentId}
          setReplyingToCommentId={setReplyingToCommentId}
          replyingToAuthorName={replyingToAuthorName}
          setReplyingToAuthorName={setReplyingToAuthorName}
          editingCommentId={editingCommentId}
          setEditingCommentId={setEditingCommentId}
          editCommentText={editCommentText}
          setEditCommentText={setEditCommentText}
          handleSaveEditComment={handleSaveEditComment}
          handleDeleteComment={handleDeleteComment}
        />
      )}

      {/* Edit Informasi Modal */}
      {showEditInfoModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-6 overflow-y-auto">
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#0B1E36] px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-black text-sm tracking-tight">Edit Informasi Komunitas</h3>
              <button
                type="button"
                onClick={() => setShowEditInfoModal(false)}
                className="text-white/80 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditInfo} className="px-6 py-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">
                  NAMA KOMUNITAS
                </label>
                <input
                  type="text"
                  value={editInfoName}
                  onChange={(e) => setEditInfoName(e.target.value)}
                  placeholder="Nama Komunitas"
                  className="w-full bg-[#E2E5E9]/50 rounded-xl p-2.5 text-xs font-bold text-[#0B1E36] outline-none border border-slate-200 focus:border-[#0B1E36]"
                  maxLength={50}
                  required
                  disabled={savingEditInfo}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">
                  DESKRIPSI
                </label>
                <textarea
                  value={editInfoDescription}
                  onChange={(e) => setEditInfoDescription(e.target.value)}
                  placeholder="Deskripsi Komunitas"
                  className="w-full min-h-[80px] bg-[#E2E5E9]/50 rounded-xl p-2.5 text-xs font-bold text-[#0B1E36] outline-none border border-slate-200 focus:border-[#0B1E36] resize-none"
                  maxLength={500}
                  required
                  disabled={savingEditInfo}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">
                  ATURAN KOMUNITAS
                </label>
                <textarea
                  value={editInfoRules}
                  onChange={(e) => setEditInfoRules(e.target.value)}
                  placeholder="Aturan Komunitas"
                  className="w-full min-h-[80px] bg-[#E2E5E9]/50 rounded-xl p-2.5 text-xs font-bold text-[#0B1E36] outline-none border border-slate-200 focus:border-[#0B1E36] resize-none"
                  maxLength={1000}
                  disabled={savingEditInfo}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">
                  TAGS KOMUNITAS
                </label>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {editInfoTags.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 bg-[#0B1E36] text-white text-[9px] font-extrabold px-2 py-0.5 rounded">
                      #{tag}
                      <button
                        type="button"
                        onClick={() => setEditInfoTags(editInfoTags.filter((_, i) => i !== idx))}
                        className="text-white/60 hover:text-white ml-0.5 cursor-pointer text-[8px]"
                        disabled={savingEditInfo}
                      >✕</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editInfoTagInput}
                    onChange={(e) => setEditInfoTagInput(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        const val = editInfoTagInput.trim();
                        if (val && editInfoTags.length < 10 && !editInfoTags.includes(val)) {
                          setEditInfoTags([...editInfoTags, val]);
                          setEditInfoTagInput("");
                        }
                      }
                    }}
                    placeholder="Tambah tag lalu tekan Enter"
                    className="flex-1 bg-[#E2E5E9]/50 rounded-xl p-2.5 text-xs font-bold text-[#0B1E36] outline-none border border-slate-200 focus:border-[#0B1E36]"
                    maxLength={30}
                    disabled={savingEditInfo || editInfoTags.length >= 10}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = editInfoTagInput.trim();
                      if (val && editInfoTags.length < 10 && !editInfoTags.includes(val)) {
                        setEditInfoTags([...editInfoTags, val]);
                        setEditInfoTagInput("");
                      }
                    }}
                    className="px-3 py-1.5 bg-[#0B1E36] text-white text-[10px] font-extrabold rounded-xl cursor-pointer hover:bg-black/90 transition-all shrink-0"
                    disabled={savingEditInfo || editInfoTags.length >= 10 || !editInfoTagInput.trim()}
                  >
                    Tambah
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowEditInfoModal(false)}
                  disabled={savingEditInfo}
                  className="flex-1 py-2.5 bg-slate-100 text-[#0B1E36] font-extrabold text-xs rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEditInfo}
                  className="flex-1 py-2.5 bg-[#0B1E36] text-white font-extrabold text-xs rounded-xl hover:bg-black transition-colors cursor-pointer shadow-md"
                >
                  {savingEditInfo ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Menu Modal */}
      {showMenuModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40"
          onClick={() => setShowMenuModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-200 pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-slate-300 rounded-full" />
            </div>
            <div className="px-4 flex flex-col gap-1">
              <button
                onClick={() => {
                  setShowMenuModal(false);
                  setShowLeaveConfirm(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left hover:bg-red-50 transition-colors cursor-pointer"
              >
                <span className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <svg
                    className="w-4.5 h-4.5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-extrabold text-red-600">
                    Keluar Komunitas
                  </p>
                  <p className="text-[10px] font-semibold text-slate-400">
                    Tinggalkan komunitas ini
                  </p>
                </div>
              </button>
              <button
                onClick={() => setShowMenuModal(false)}
                className="w-full py-3 text-center text-xs font-extrabold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer mt-1"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member Action Confirmation Modal */}
      {memberActionConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-6">
          <div
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`${
              memberActionConfirm.type === "kick" ? "bg-red-600" : "bg-[#0B1E36]"
            } px-6 py-5 flex flex-col items-center`}>
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-3">
                {memberActionConfirm.type === "kick" ? (
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                ) : (
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                )}
              </div>
              <h3 className="text-white font-black text-sm tracking-tight">
                {memberActionConfirm.type === "kick" ? "Peringatan!" : "Konfirmasi"}
              </h3>
            </div>

            {/* Body */}
            <div className="px-6 py-5 text-center">
              <p className="text-sm font-extrabold text-[#0B1E36] leading-relaxed">
                {memberActionConfirm.type === "kick"
                  ? `Apakah kamu yakin ingin mengeluarkan ${memberActionConfirm.userName}?`
                  : memberActionConfirm.type === "promote"
                    ? `Apakah kamu yakin ingin menjadikan ${memberActionConfirm.userName} sebagai Admin?`
                    : `Apakah kamu yakin ingin menurunkan ${memberActionConfirm.userName} dari Admin?`}
              </p>
              <p className="text-[11px] font-semibold text-slate-400 mt-2 leading-relaxed">
                {memberActionConfirm.type === "kick"
                  ? "Anggota yang dikeluarkan perlu bergabung kembali untuk mengakses komunitas."
                  : memberActionConfirm.type === "promote"
                    ? "Admin dapat mengelola anggota dan konten komunitas."
                    : "Anggota yang diturunkan tidak dapat mengelola komunitas lagi."}
              </p>
            </div>

            {/* Actions */}
            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={() => setMemberActionConfirm(null)}
                disabled={processingMemberAction}
                className="flex-1 py-3 bg-slate-100 text-[#0B1E36] font-extrabold text-xs rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  setProcessingMemberAction(true);
                  try {
                    if (memberActionConfirm.type === "kick") {
                      await handleKickMember(memberActionConfirm.userId);
                    } else {
                      await handleUpdateMemberRole(
                        memberActionConfirm.userId,
                        memberActionConfirm.type === "promote" ? "ADMIN" : "MEMBER"
                      );
                    }
                  } finally {
                    setProcessingMemberAction(false);
                    setMemberActionConfirm(null);
                  }
                }}
                disabled={processingMemberAction}
                className={`flex-1 py-3 ${
                  memberActionConfirm.type === "kick"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-[#0B1E36] hover:bg-black"
                } text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer shadow-md`}
              >
                {processingMemberAction ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Memproses...
                  </span>
                ) : memberActionConfirm.type === "kick" ? (
                  "Ya, Keluarkan"
                ) : memberActionConfirm.type === "promote" ? (
                  "Ya, Jadikan Admin"
                ) : (
                  "Ya, Turunkan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Confirmation Danger Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-6">
          <div
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Red danger header */}
            <div className="bg-red-600 px-6 py-5 flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-3">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
              <h3 className="text-white font-black text-sm tracking-tight">
                Peringatan!
              </h3>
            </div>

            {/* Body */}
            <div className="px-6 py-5 text-center">
              <p className="text-sm font-extrabold text-[#0B1E36] leading-relaxed">
                Apa kamu yakin meninggalkan komunitas ini?
              </p>
              <p className="text-[11px] font-semibold text-slate-400 mt-2 leading-relaxed">
                Kamu perlu bergabung kembali jika ingin mengakses diskusi dan
                konten komunitas.
              </p>
            </div>

            {/* Actions */}
            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                disabled={leavingCommunity}
                className="flex-1 py-3 bg-slate-100 text-[#0B1E36] font-extrabold text-xs rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  setLeavingCommunity(true);
                  try {
                    const res = await fetch(`/api/communities/${id}/leave`, {
                      method: "POST",
                    });
                    if (res.ok) {
                      setShowLeaveConfirm(false);
                      triggerToast("Berhasil keluar dari komunitas.");
                      setTimeout(() => router.push("/"), 1000);
                    } else {
                      const err = await res.json();
                      triggerToast(err.error || "Gagal keluar dari komunitas.");
                    }
                  } catch (err) {
                    console.error(err);
                    triggerToast("Gagal menyambungkan ke server.");
                  } finally {
                    setLeavingCommunity(false);
                  }
                }}
                disabled={leavingCommunity}
                className="flex-1 py-3 bg-red-600 text-white font-extrabold text-xs rounded-xl hover:bg-red-700 transition-colors cursor-pointer shadow-md"
              >
                {leavingCommunity ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <svg
                      className="animate-spin h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Memproses...
                  </span>
                ) : (
                  "Ya, Keluar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewImageUrl && (
        <ImageLightbox
          src={previewImageUrl}
          onClose={() => setPreviewImageUrl(null)}
        />
      )}
    </div>
  );
}
