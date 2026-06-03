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
  parentId?: string | null;
  permissions?: {
    canEdit: boolean;
    canDelete: boolean;
  };
  replies?: CommentItem[];
}

interface CommentsDrawerProps {
  activeCommentPost: PostItem;
  comments: CommentItem[];
  commentText: string;
  setCommentText: (text: string) => void;
  submittingComment: boolean;
  handlePostComment: (e: FormEvent) => Promise<void>;
  onClose: () => void;
  // Comment Action Callbacks
  replyingToCommentId: string | null;
  setReplyingToCommentId: (id: string | null) => void;
  replyingToAuthorName: string | null;
  setReplyingToAuthorName: (name: string | null) => void;
  editingCommentId: string | null;
  setEditingCommentId: (id: string | null) => void;
  editCommentText: string;
  setEditCommentText: (text: string) => void;
  handleSaveEditComment: (commentId: string) => Promise<void>;
  handleDeleteComment: (commentId: string) => Promise<void>;
}

export default function CommentsDrawer({
  activeCommentPost,
  comments,
  commentText,
  setCommentText,
  submittingComment,
  handlePostComment,
  onClose,
  replyingToCommentId,
  setReplyingToCommentId,
  replyingToAuthorName,
  setReplyingToAuthorName,
  editingCommentId,
  setEditingCommentId,
  editCommentText,
  setEditCommentText,
  handleSaveEditComment,
  handleDeleteComment,
}: CommentsDrawerProps) {
  return (
    <div className="fixed inset-0 bg-[#0B1E36]/40 backdrop-blur-sm z-[100] flex items-end justify-center">
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
          &ldquo;{activeCommentPost.content}&rdquo;
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 py-2">
          {comments.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xs font-bold text-slate-400">Belum ada komentar. Tulis komentar pertama!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex flex-col gap-2">
                {/* Main Comment */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex gap-3 text-xs">
                  <div className="w-6.5 h-6.5 rounded-full bg-[#F2C010] text-[#0B1E36] flex items-center justify-center font-extrabold text-[10px] shrink-0">
                    {comment.avatarLetter}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#0B1E36]">{comment.authorName}</span>
                        <span className="text-[8px] text-slate-400 font-bold">{comment.createdAt}</span>
                      </div>
                    </div>

                    {editingCommentId === comment.id ? (
                      <div className="flex flex-col gap-1.5 mt-1.5">
                        <input
                          type="text"
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-[#0B1E36] outline-none focus:border-[#0B1E36]"
                          required
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveEditComment(comment.id)}
                            className="px-3 py-1 bg-[#0B1E36] text-white font-extrabold text-[10px] rounded-md shadow-sm hover:bg-black transition-all cursor-pointer"
                          >
                            Simpan
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditCommentText("");
                            }}
                            className="px-3 py-1 bg-slate-100 text-slate-500 font-extrabold text-[10px] rounded-md hover:bg-slate-200 transition-all cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-semibold text-slate-600 mt-1 leading-relaxed">{comment.content}</p>
                        
                        <div className="flex items-center gap-3 mt-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingToCommentId(comment.id);
                              setReplyingToAuthorName(comment.authorName);
                            }}
                            className="text-[9px] font-black text-blue-600 hover:underline cursor-pointer"
                          >
                            Balas
                          </button>
                          {comment.permissions?.canEdit && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditCommentText(comment.content);
                              }}
                              className="text-[9px] font-black text-slate-500 hover:underline cursor-pointer"
                            >
                              Edit
                            </button>
                          )}
                          {comment.permissions?.canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-[9px] font-black text-red-500 hover:underline cursor-pointer"
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="pl-6 flex flex-col gap-2 border-l border-slate-100 ml-3">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="bg-slate-50/60 border border-slate-100/80 rounded-xl p-2.5 flex gap-2.5 text-xs">
                        <div className="w-5.5 h-5.5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-extrabold text-[9px] shrink-0">
                          {reply.avatarLetter}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-[#0B1E36]">{reply.authorName}</span>
                              <span className="text-[8px] text-slate-400 font-bold">{reply.createdAt}</span>
                            </div>
                          </div>

                          {editingCommentId === reply.id ? (
                            <div className="flex flex-col gap-1.5 mt-1.5">
                              <input
                                type="text"
                                value={editCommentText}
                                onChange={(e) => setEditCommentText(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-[#0B1E36] outline-none focus:border-[#0B1E36]"
                                required
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditComment(reply.id)}
                                  className="px-3 py-1 bg-[#0B1E36] text-white font-extrabold text-[10px] rounded-md shadow-sm hover:bg-black transition-all cursor-pointer"
                                >
                                  Simpan
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCommentId(null);
                                    setEditCommentText("");
                                  }}
                                  className="px-3 py-1 bg-slate-100 text-slate-500 font-extrabold text-[10px] rounded-md hover:bg-slate-200 transition-all cursor-pointer"
                                >
                                  Batal
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="font-semibold text-slate-600 mt-1 leading-relaxed">{reply.content}</p>
                              
                              <div className="flex items-center gap-3 mt-1.5">
                                {reply.permissions?.canEdit && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCommentId(reply.id);
                                      setEditCommentText(reply.content);
                                    }}
                                    className="text-[9px] font-black text-slate-500 hover:underline cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                )}
                                {reply.permissions?.canDelete && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(reply.id)}
                                    className="text-[9px] font-black text-red-500 hover:underline cursor-pointer"
                                  >
                                    Hapus
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Post Comment Form */}
        <form onSubmit={handlePostComment} className="flex flex-col gap-2 border-t border-slate-100 pt-3">
          {replyingToCommentId && (
            <div className="bg-slate-100 px-3 py-1.5 text-[10px] font-extrabold text-[#0B1E36] flex items-center justify-between rounded-lg">
              <span>Membalas @{replyingToAuthorName}</span>
              <button
                type="button"
                onClick={() => {
                  setReplyingToCommentId(null);
                  setReplyingToAuthorName(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input 
              type="text" 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={replyingToCommentId ? "Tulis balasan..." : "Tulis komentar..."}
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
          </div>
        </form>

      </div>
    </div>
  );
}
