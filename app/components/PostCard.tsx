// PostCard.tsx

export interface PostItem {
  id: string;
  authorName: string;
  authorEmail: string;
  authorNim: string;
  avatarLetter: string;
  timeAgo: string;
  content: string;
  isAnonymous: boolean;
  likes: number;
  commentsCount: number;
  isLiked?: boolean;
  isPinned?: boolean;
  canEdit?: boolean;
  imageUrl?: string;
  event?: {
    title: string;
    time: string;
    location: string;
    isRegistered?: boolean;
  };
}

interface PostCardProps {
  post: PostItem;
  isAdmin: boolean;
  editingPostId: string | null;
  editPostText: string;
  setEditingPostId: (id: string | null) => void;
  setEditPostText: (text: string) => void;
  handleEditPost: (id: string) => Promise<void>;
  handleDeletePost: (id: string) => Promise<void>;
  handleTogglePin: (id: string) => void;
  handleRegisterEvent: (id: string) => void;
  handleLike: (id: string) => Promise<void>;
  handleOpenComments: (post: PostItem) => Promise<void>;
}

export default function PostCard({
  post,
  isAdmin,
  editingPostId,
  editPostText,
  setEditingPostId,
  setEditPostText,
  handleEditPost,
  handleDeletePost,
  handleTogglePin,
  handleRegisterEvent,
  handleLike,
  handleOpenComments,
}: PostCardProps) {
  const isEditingThisPost = editingPostId === post.id;

  return (
    <div className="relative pl-2.5">
      {/* Left tail speech notch triangle in CSS matching mockup exactly */}
      <div className="absolute left-[4px] top-[18px] w-0 h-0 border-t-[0px] border-r-[8px] border-r-[#FEF9C3] border-b-[12px] border-b-transparent z-10"></div>

      {/* Yellow/Cream Bubble Card */}
      <div className="bg-[#FEF9C3] rounded-2xl p-4.5 flex flex-col gap-3 shadow-sm border border-yellow-200/40 relative">
        
        {/* Card Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar Circle */}
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-[#854d0e]/10 border border-[#854d0e]/20 shrink-0 font-black text-xs text-[#854d0e]">
              {post.avatarLetter}
            </div>

            <div className="flex flex-col leading-tight min-w-0">
              <span className="font-extrabold text-xs text-[#0B1E36] truncate">
                {post.isAnonymous ? "Anonymous" : post.authorName}
              </span>
              <span className="text-[9px] font-bold text-slate-400 mt-0.5">
                {post.timeAgo}
              </span>
            </div>
          </div>

          {/* Top Right Controls */}
          <div className="flex items-center gap-2">
            {/* Pinned badge */}
            {post.isPinned && (
              <span className="text-[9px] font-black text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded border border-yellow-300">
                📌 Sematan
              </span>
            )}

            {/* Edit button for post owner */}
            {post.canEdit && (
              <button
                onClick={() => {
                  setEditingPostId(post.id);
                  setEditPostText(post.content);
                }}
                className="p-1 hover:bg-blue-100 rounded text-blue-600 transition-colors cursor-pointer"
                title="Edit Post"
              >
                ✏️
              </button>
            )}
            
            {/* Admin tools */}
            {isAdmin && (
              <div className="flex items-center gap-1">
                {/* Pin toggle */}
                <button 
                  onClick={() => handleTogglePin(post.id)}
                  className="p-1 hover:bg-[#FEF08A] rounded text-[#0B1E36] transition-colors cursor-pointer"
                  title="Sematkan Post"
                >
                  📌
                </button>
                {/* Trash Delete icon */}
                <button 
                  onClick={() => handleDeletePost(post.id)}
                  className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors cursor-pointer"
                  title="Hapus Post"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Text - or inline edit mode */}
        {isEditingThisPost ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={editPostText}
              onChange={(e) => setEditPostText(e.target.value)}
              className="w-full min-h-[60px] py-2 px-3 text-xs font-bold text-[#0B1E36] outline-none resize-none border border-slate-200 rounded-xl bg-white"
              maxLength={1000}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setEditingPostId(null); setEditPostText(""); }}
                className="px-3 py-1 text-[10px] font-extrabold text-slate-500 hover:text-[#0B1E36] rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleEditPost(post.id)}
                className="px-4 py-1 bg-[#0B1E36] text-white text-[10px] font-extrabold rounded-lg shadow-sm hover:bg-black transition-all cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>
        ) : (
          <div className="text-xs font-semibold text-[#0C0A09] leading-relaxed whitespace-pre-line pr-2 font-mono">
            {post.content}
          </div>
        )}

        {/* Custom image attachments rendering */}
        {post.imageUrl && (
          <div className="mt-1 rounded-xl overflow-hidden border border-yellow-300/40 shadow-sm shrink-0 bg-white p-1">
            <img 
              src={post.imageUrl} 
              alt="Post attachment" 
              loading="lazy"
              decoding="async"
              className="w-full h-44 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Event calendar card inside bubble exactly matching Screen 3 */}
        {post.event && (
          <div className="bg-white border border-yellow-300 rounded-xl p-3.5 flex flex-col gap-3 relative mt-1.5 shadow-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-xs">📅</span>
              <h3 className="text-xs font-black text-[#0B1E36]">
                {post.event.title}
              </h3>
            </div>
            <p className="text-[10px] font-bold text-slate-400 pl-5">
              {post.event.time}
            </p>

            <button
              onClick={() => handleRegisterEvent(post.id)}
              className={`w-full py-2 text-[10px] font-black border border-slate-200 rounded-lg shadow-sm transition-all shrink-0 cursor-pointer text-center ${
                post.event.isRegistered 
                  ? "bg-emerald-100 text-emerald-800" 
                  : "bg-slate-100 hover:bg-slate-200 text-[#0B1E36]"
              }`}
            >
              {post.event.isRegistered ? "✓ Terdaftar" : "Daftar Event"}
            </button>
          </div>
        )}

        {/* Actions Stats bar exactly matching Screen 1/2 */}
        <div className="flex items-center gap-4.5 pt-2 mt-1.5 border-t border-[#854d0e]/10">
          {/* Likes action */}
          <button
            onClick={() => handleLike(post.id)}
            className={`flex items-center gap-1 text-[10px] font-extrabold transition-all cursor-pointer ${
              post.isLiked ? "text-red-500" : "text-[#0B1E36] hover:scale-105"
            }`}
          >
            <span className="text-xs">❤</span>
            <span>{post.likes}</span>
          </button>

          {/* Comments action - Click opens comments drawer */}
          <button
            onClick={() => handleOpenComments(post)}
            className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#0B1E36] hover:scale-105 transition-transform cursor-pointer"
          >
            <span className="text-xs">💬</span>
            <span>{post.commentsCount}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
