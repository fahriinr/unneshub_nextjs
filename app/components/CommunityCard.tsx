import Link from "next/link";

export interface CommunityItem {
  id: string;
  name: string;
  category: string;
  description: string;
  membersCount: number;
  role: "Admin" | "Anggota";
  initials: string;
  avatarColor: string;
  status: string;
  coverImage?: string | null;
}

export default function CommunityCard({ community }: { community: CommunityItem }) {
  return (
    <Link
      href={`/community/${community.id}`}
      className="flex items-center gap-3 bg-[#E2E5E9] rounded-xl p-3.5 transition-all hover:bg-slate-200 cursor-pointer"
      id={`community-card-${community.id}`}
    >
      {/* Initials or Custom Avatar Square Badge matching mockup */}
      <div
        className="w-11 h-11 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-white flex items-center justify-center shadow-sm"
      >
        {community.coverImage ? (
          <img
            src={community.coverImage}
            alt={community.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full ${community.avatarColor} flex items-center justify-center font-extrabold text-sm`}>
            {community.initials}
          </div>
        )}
      </div>

      {/* Title & Member Count */}
      <div className="flex-1 min-w-0">
        <h3 className="font-extrabold text-xs text-[#0B1E36] leading-tight truncate">
          {community.name}
        </h3>
        <p className="text-[9px] font-bold text-slate-500 mt-0.5">
          {community.membersCount} anggota
        </p>
      </div>

      {/* Role pill or Pending status badge matching mockup */}
      {community.status === "PENDING_APPROVAL" ? (
        <span className="text-[9px] font-extrabold px-3 py-1 bg-[#F2C010] text-[#0B1E36] rounded-full shadow-sm shrink-0 border border-transparent animate-pulse">
          Pending
        </span>
      ) : community.role && (
        <span className="text-[9px] font-extrabold px-3 py-1 bg-white text-[#0B1E36] rounded-full shadow-sm shrink-0 border border-transparent">
          {community.role}
        </span>
      )}
    </Link>
  );
}
