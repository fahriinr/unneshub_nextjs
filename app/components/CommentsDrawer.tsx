import { FormEvent } from "react";
import { PostItem } from "./PostCard";

export interface CommentItem {
  id: string;
  postId: string;
  content: string;
  createdAt: string;
  authorName: string;
  avatarLetter: string;
  isAnonymous: boolean;
}

interface CommentsDrawerProps {
  activeCommentPost: PostItem;
  comments: CommentItem[];
  commentText: string;
  setCommentText: (text: string) => void;
  submittingComment: boolean;
  handlePostComment: (e: FormEvent) => Promise<void>;
  onClose: () => void;
}

export default function CommentsDrawer({
  activeCommentPost,
  comments,
  commentText,
  setCommentText,
  submittingComment,
  handlePostComment,
  onClose,
}: CommentsDrawerProps) {
  return (
    <div className="fixed inset-0 bg-[#0B1E36]/40 backdrop-blur-sm z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-3xl w-full max-w-lg min-h-[50vh] max-h-[85vh] p-6 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-300">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">💬</span>
            <h3 className="text-sm font-black text-[#0B1E36]">Komentar Postingan</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center font-bold text-[#0B1E36] cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Post Content preview in modal */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs font-bold text-slate-500 line-clamp-2">
          "{activeCommentPost.content}"
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 py-2">
          {comments.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xs font-bold text-slate-400">Belum ada komentar. Tulis komentar pertama!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex gap-3 text-xs">
                <div className="w-6.5 h-6.5 rounded-full bg-slate-200 flex items-center justify-center font-extrabold text-[10px] text-slate-600 shrink-0">
                  {comment.avatarLetter}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#0B1E36]">{comment.authorName}</span>
                    <span className="text-[8px] text-slate-400 font-bold">{comment.createdAt}</span>
                  </div>
                  <p className="font-semibold text-slate-600 mt-1 leading-relaxed">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Post Comment Form */}
        <form onSubmit={handlePostComment} className="flex gap-2 border-t border-slate-100 pt-3">
          <input 
            type="text" 
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Tulis komentar..."
            className="flex-1 bg-slate-50 rounded-full px-4 py-2.5 text-xs font-bold outline-none border border-slate-200 focus:bg-white text-[#0B1E36]"
            required
            disabled={submittingComment}
          />
          <button 
            type="submit"
            disabled={submittingComment}
            className="px-5 py-2.5 bg-[#0B1E36] text-white font-extrabold text-xs rounded-full shadow-md hover:bg-black transition-all cursor-pointer shrink-0"
          >
            {submittingComment ? "..." : "Kirim"}
          </button>
        </form>

      </div>
    </div>
  );
}
