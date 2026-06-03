import { useState } from "react";
import Link from "next/link";
import ImageLightbox from "./ImageLightbox";

export interface CommunityDetails {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  membersCount: number;
  initials: string;
  isJoined: boolean;
  rules?: string;
  tags?: string[];
  chatCount?: number;
  isVerified?: boolean;
  avatarColor: string;
  onlineCount: number;
  coverImage?: string | null;
  community_image_url?: string | null;
  creatorId?: string;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canManageMembers: boolean;
    isCommunityAdmin: boolean;
    isCommunityOwner: boolean;
  };
}

interface CommunityVisitorViewProps {
  community: CommunityDetails;
  joining: boolean;
  successToast: string;
  handleJoinCommunity: () => void;
}

export default function CommunityVisitorView({
  community,
  joining,
  successToast,
  handleJoinCommunity,
}: CommunityVisitorViewProps) {
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  return (
    <div className="flex-1 w-full bg-white flex flex-col min-h-screen">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 left-4 right-4 md:left-auto md:right-5 z-50 bg-[#F2C010] text-[#0B1E36] font-extrabold px-6 py-4 rounded-xl shadow-lg text-center text-sm animate-bounce">
          {successToast}
        </div>
      )}

      {/* Dark Navy Header Banner */}
      <div className="bg-[#0B1E36] px-4 py-4 flex items-center justify-between w-full shadow-sm">
        <span className="text-white font-black text-xl tracking-tight">UnnesHub</span>
        <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
          <svg className="w-4.5 h-4.5 text-[#0B1E36]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a9.041 9.041 0 01-3.185 0M17 11V7a5 5 0 00-7-4.887A5.006 5.006 0 005 7v4a5.986 5.986 0 01-.294 1.828l-1.005 3.013c-.115.346.124.694.487.694h13.624c.363 0 .602-.348.487-.694l-1.005-3.013a5.986 5.986 0 01-.294-1.828z" />
          </svg>
        </button>
      </div>

      {/* Back Link */}
      <div className="px-4 pt-4 max-w-lg mx-auto w-full">
        <Link
          href="/community/join"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:underline transition-all"
        >
          <span className="text-sm">‹</span> Kembali
        </Link>
      </div>

      {/* Community Dark Navy Banner Block */}
      <div className="px-4 pt-3 max-w-lg mx-auto w-full">
        <div className="bg-[#0B1E36] rounded-2xl p-6 flex items-center gap-4 text-white relative overflow-hidden shadow-sm">
          {/* Custom Avatar Square Badge matching soft box guidelines */}
          <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/20 shrink-0 bg-white flex items-center justify-center shadow-sm">
            {community.coverImage || community.community_image_url ? (
              <img
                src={community.coverImage || community.community_image_url || ""}
                alt={community.name}
                onClick={() => setPreviewImageUrl(community.coverImage || community.community_image_url || null)}
                className="w-full h-full object-cover cursor-zoom-in hover:brightness-95 transition-all"
              />
            ) : (
              <div className={`w-full h-full ${community.avatarColor} flex items-center justify-center font-extrabold text-xl`}>
                {community.initials}
              </div>
            )}
          </div>

              <div className="flex flex-col min-w-0">
                <h1 className="text-base font-extrabold tracking-tight leading-snug truncate">
                  Komunitas {community.name}
                </h1>
              </div>
            </div>

            {/* Tentang Komunitas Description Block */}
            <div className="flex flex-col gap-2">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                Tentang Komunitas
              </h2>
              <p className="text-xs font-semibold text-slate-600 leading-relaxed bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                {community.description}
              </p>
            </div>
          </div>

      {/* Tag Komunitas Card (Visitor View) matching mockup colors exactly */}
      {(() => {
        const displayTags = (community.tags && community.tags.length > 0)
          ? community.tags.map(t => t.startsWith("#") ? t : `#${t}`)
          : ["#Robotika", "#AI", "#IoT"];

        return (
          <div className="px-4 pt-5 max-w-lg mx-auto w-full select-none">
            <div className="bg-white border-2 border-[#0B1E36] rounded-2xl p-5 shadow-[4px_4px_0px_0px_#0B1E36] flex flex-col gap-4 text-center">
              <h2 className="text-sm font-black text-[#0B1E36] uppercase tracking-wider">Tag Komunitas</h2>
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
                    <span key={tag} className={`px-4.5 py-1.5 rounded-full text-xs font-black border shadow-sm ${colorClass}`}>
                      {tag}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

            {/* Join Action button for Desktop view */}
            <div className="hidden md:block">
              <button
                onClick={handleJoinCommunity}
                disabled={joining}
                className="w-full py-3.5 bg-[#0B1E36] hover:bg-black text-white text-xs font-extrabold flex items-center justify-center gap-2 rounded-full shadow-md active:scale-98 transition-all cursor-pointer"
              >
                {joining ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Bergabung...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Join Komunitas
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Wide Bottom Join Button (Mobile only) */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent z-40 max-w-lg mx-auto w-full md:hidden">
        <button
          onClick={handleJoinCommunity}
          disabled={joining}
          className="w-full py-3.5 bg-[#0B1E36] rounded-full text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md hover:bg-black/90 active:scale-99 transition-all cursor-pointer shrink-0"
        >
          {joining ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Bergabung...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Join Komunitas
            </>
          )}
        </button>
      </div>

      {previewImageUrl && (
        <ImageLightbox
          src={previewImageUrl}
          onClose={() => setPreviewImageUrl(null)}
        />
      )}
    </div>
  );
}
