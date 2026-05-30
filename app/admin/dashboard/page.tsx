"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserSession } from "../../hooks/useUserSession";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface CommunityAdminItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  createdAt: string;
  rules?: string | null;
  coverImage?: string | null;
  community_image_url?: string | null;
  creator: {
    name: string;
    email: string;
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading } = useUserSession();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING_APPROVAL" | "APPROVED">("ALL");
  const [successToast, setSuccessToast] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Tags inline editing states
  const [editingTagsId, setEditingTagsId] = useState<string | null>(null);
  const [inputTagsVal, setInputTagsVal] = useState("");

  // Protection Guard
  useEffect(() => {
    if (!loading) {
      if (!user || !user.isLoggedIn) {
        router.push("/login");
      } else if (user.role !== "global_admin") {
        router.push("/");
      }
    }
  }, [user, loading, router]);

  // Fetch admin communities
  const { data: communities = [], isLoading } = useQuery<CommunityAdminItem[]>({
    queryKey: ["adminCommunities"],
    queryFn: async () => {
      const res = await fetch("/api/admin/communities");
      if (!res.ok) throw new Error("Gagal mengambil data komunitas");
      return await res.json();
    },
    enabled: !!(user?.isLoggedIn && user?.role === "global_admin"),
    staleTime: 1000 * 30, // 30 seconds cache
  });

  if (loading || isLoading || !user || user.role !== "global_admin") {
    return (
      <div className="flex-1 flex items-center justify-center p-8 min-h-screen bg-[#FDFBF7]">
        <div className="text-center font-bold text-[#0B1E36]">
          <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-[#0B1E36]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Memuat Dashboard Admin...
        </div>
      </div>
    );
  }

  // Helper parser for community tags stored in rules
  const parseRulesAndTags = (rulesString: string | null) => {
    if (!rulesString) return { tags: [], rules: "" };
    const tagsMatch = rulesString.match(/\[TAGS\](.*?)\[RULES\]/);
    if (tagsMatch) {
      const tagsPart = tagsMatch[1].trim();
      const rulesPart = rulesString.replace(/\[TAGS\].*?\[RULES\]/, "").trim();
      const tags = tagsPart ? tagsPart.split(" ").filter((t) => t.startsWith("#")) : [];
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

  // Toggle approval handler
  const handleToggleApproval = async (id: string, currentStatus: string) => {
    setUpdatingId(id);
    const newStatus = currentStatus === "APPROVED" ? "PENDING_APPROVAL" : "APPROVED";

    try {
      const res = await fetch(`/api/admin/communities/${id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Gagal memperbarui status verifikasi");
      }

      // Optimistic update query cache
      queryClient.setQueryData<CommunityAdminItem[]>(["adminCommunities"], (old) => {
        if (!old) return [];
        return old.map((c) => (c.id === id ? { ...c, status: newStatus as any } : c));
      });

      setSuccessToast(
        newStatus === "APPROVED"
          ? "Komunitas berhasil diverifikasi & dapat diakses! 🎉"
          : "Status verifikasi dibatalkan (Pending) ⏳"
      );
      setTimeout(() => setSuccessToast(""), 3000);
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui status");
    } finally {
      setUpdatingId(null);
    }
  };

  // Tag save handler strictly for GLOBAL_ADMIN from dashboard
  const handleSaveTags = async (id: string, currentRules: string | null, newTagsStr: string) => {
    setUpdatingId(id);
    const { rules: cleanRules } = parseRulesAndTags(currentRules);

    // Normalize tags: split, ensure prepended #, filter out empty elements
    const formattedTags = newTagsStr
      .split(" ")
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((t) => (t.startsWith("#") ? t : `#${t}`))
      .join(" ");

    const serializedRules = `[TAGS] ${formattedTags} [RULES] ${cleanRules || "Selamat datang!"}`;

    try {
      const res = await fetch(`/api/admin/communities/${id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: serializedRules }),
      });

      if (!res.ok) {
        throw new Error("Gagal menyimpan tag komunitas");
      }

      // Optimistic update
      queryClient.setQueryData<CommunityAdminItem[]>(["adminCommunities"], (old) => {
        if (!old) return [];
        return old.map((c) => (c.id === id ? { ...c, rules: serializedRules } : c));
      });

      setSuccessToast("Tag komunitas berhasil diperbarui! 🏷️");
      setTimeout(() => setSuccessToast(""), 3000);
      setEditingTagsId(null);
      setInputTagsVal("");
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan tag");
    } finally {
      setUpdatingId(null);
    }
  };

  // Stats derivation
  const totalCount = communities.length;
  const approvedCount = communities.filter((c) => c.status === "APPROVED").length;
  const pendingCount = communities.filter((c) => c.status === "PENDING_APPROVAL").length;

  // Filtered list
  const filteredCommunities = communities.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.creator.name.toLowerCase().includes(search.toLowerCase()) ||
      c.creator.email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getCategoryStyles = (cat: string) => {
    switch (cat) {
      case "AKADEMIK":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "HOBI":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "KARIR":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "ORGANISASI":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "EVENT":
        return "bg-sky-50 text-sky-700 border-sky-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getTagColor = (tag: string, index: number) => {
    // Alternate tag colors based on index matching neobrutalist style guide
    const colors = [
      "bg-[#FEF08A] text-yellow-900 border-yellow-300", // Yellow
      "bg-[#BFDBFE] text-blue-900 border-blue-300",   // Blue
      "bg-[#E9D5FF] text-purple-900 border-purple-300", // Purple
      "bg-[#A7F3D0] text-emerald-900 border-emerald-300", // Green
      "bg-[#FECDD3] text-rose-900 border-rose-300",     // Rose
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="flex-1 w-full bg-[#FDFBF7] min-h-screen text-[#0B1E36] font-sans pb-16">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 left-4 right-4 md:left-auto md:right-5 z-50 bg-[#F2C010] text-[#0B1E36] font-extrabold px-6 py-4 rounded-xl shadow-lg text-center text-sm animate-bounce">
          {successToast}
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col gap-2 mb-8 select-none">
        <span className="text-[10px] font-black tracking-widest text-[#F2C010] bg-[#0B1E36] px-2.5 py-1 rounded inline-block w-max border border-[#0B1E36] shadow-[1px_1px_0px_var(--color-primary-dark)]">
          GLOBAL ADMIN CONSOLE
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#0B1E36]">
          Dashboard Verifikasi Komunitas
        </h1>
        <p className="text-xs font-semibold text-slate-500 max-w-2xl leading-relaxed">
          Tinjau usulan komunitas baru, kelola verifikasi keanggotaan publik, serta tambahkan tag kategori untuk menata direktori komunitas mahasiswa UNNES.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 select-none">
        {/* Card Total */}
        <div className="bg-white border-2 border-[#0B1E36] p-5 rounded-2xl shadow-[4px_4px_0px_0px_#0B1E36] transition-transform hover:scale-[1.01]">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Usulan
          </span>
          <span className="text-3xl font-black text-[#0B1E36] mt-1.5 block">
            {totalCount}
          </span>
          <span className="text-[10px] font-bold text-slate-400 mt-1 block">
            Komunitas terdaftar
          </span>
        </div>

        {/* Card Pending */}
        <div className="bg-white border-2 border-[#0B1E36] p-5 rounded-2xl shadow-[4px_4px_0px_0px_#0B1E36] transition-transform hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Menunggu Tinjauan
            </span>
            {pendingCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-[#F2C010] animate-ping" />
            )}
          </div>
          <span className="text-3xl font-black text-[#F2C010] mt-1.5 block">
            {pendingCount}
          </span>
          <span className="text-[10px] font-bold text-slate-400 mt-1 block">
            Perlu diverifikasi segera
          </span>
        </div>

        {/* Card Approved */}
        <div className="bg-white border-2 border-[#0B1E36] p-5 rounded-2xl shadow-[4px_4px_0px_0px_#0B1E36] transition-transform hover:scale-[1.01]">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Telah Diverifikasi
          </span>
          <span className="text-3xl font-black text-emerald-600 mt-1.5 block">
            {approvedCount}
          </span>
          <span className="text-[10px] font-bold text-slate-400 mt-1 block">
            Telah aktif & publik
          </span>
        </div>
      </div>

      {/* Control Area: Search and Filters */}
      <div className="bg-white border-2 border-[#0B1E36] p-5 rounded-2xl shadow-[4px_4px_0px_0px_#0B1E36] flex flex-col md:flex-row gap-4 justify-between items-center mb-8">
        {/* Search */}
        <div className="w-full md:w-80 relative">
          <input
            type="text"
            placeholder="Cari komunitas, nama author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#E2E5E9]/60 rounded-xl px-4 py-2.5 text-xs font-bold text-[#0B1E36] border-2 border-transparent outline-none focus:border-[#0B1E36] placeholder-[#8FA0AF] transition-all"
          />
          <span className="absolute right-3.5 top-3 text-[#8FA0AF] text-sm pointer-events-none">
            🔍
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg border-2 transition-all cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-[#0B1E36] border-[#0B1E36] text-white shadow-[2px_2px_0px_var(--color-accent-yellow)]"
                : "bg-white border-slate-200 text-[#0B1E36] hover:bg-slate-50"
            }`}
          >
            Semua ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter("PENDING_APPROVAL")}
            className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg border-2 transition-all cursor-pointer ${
              statusFilter === "PENDING_APPROVAL"
                ? "bg-[#F2C010] border-[#0B1E36] text-[#0B1E36] shadow-[2px_2px_0px_#0B1E36]"
                : "bg-white border-slate-200 text-[#0B1E36] hover:bg-slate-50"
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter("APPROVED")}
            className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg border-2 transition-all cursor-pointer ${
              statusFilter === "APPROVED"
                ? "bg-emerald-600 border-[#0B1E36] text-white shadow-[2px_2px_0px_#0B1E36]"
                : "bg-white border-slate-200 text-[#0B1E36] hover:bg-slate-50"
            }`}
          >
            Verifikasi ({approvedCount})
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border-2 border-[#0B1E36] rounded-2xl shadow-[6px_6px_0px_0px_#0B1E36] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B1E36] text-white select-none">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider">
                  Nama Komunitas
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider">
                  Tag Komunitas
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider">
                  Nama Author
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider">
                  Tanggal Dibuat
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-center">
                  Status Verif
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-xs text-[#0B1E36]">
              {filteredCommunities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold italic">
                    Tidak ditemukan usulan komunitas.
                  </td>
                </tr>
              ) : (
                filteredCommunities.map((c) => {
                  const { tags } = parseRulesAndTags(c.rules || "");
                  const isEditingTags = editingTagsId === c.id;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Community name with Soft Box avatar thumbnail crop */}
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-white flex items-center justify-center shadow-sm">
                            {c.coverImage || c.community_image_url ? (
                              <img
                                src={c.coverImage || c.community_image_url || ""}
                                alt={c.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#0B1E36] text-white flex items-center justify-center font-extrabold text-[11px] uppercase">
                                {c.name.slice(0, 2)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold text-[#0B1E36] text-sm leading-tight">
                              {c.name}
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 mt-1 max-w-xs truncate" title={c.description}>
                              {c.description}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4.5">
                        <span className={`inline-block text-[9px] font-extrabold px-2.5 py-1 border rounded-md uppercase tracking-wider ${getCategoryStyles(c.category)}`}>
                          {c.category}
                        </span>
                      </td>

                      {/* Tag Column - Strictly for GLOBAL_ADMIN to add and edit */}
                      <td className="px-6 py-4.5 min-w-[200px]">
                        {isEditingTags ? (
                          <div className="flex items-center gap-1.5 w-full">
                            <input
                              type="text"
                              value={inputTagsVal}
                              onChange={(e) => setInputTagsVal(e.target.value)}
                              placeholder="Contoh: #Robotika #AI"
                              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[10px] font-extrabold text-[#0B1E36] outline-none focus:border-[#0b1e36] w-full"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSaveTags(c.id, c.rules || "", inputTagsVal);
                                } else if (e.key === "Escape") {
                                  setEditingTagsId(null);
                                }
                              }}
                            />
                            <button
                              onClick={() => handleSaveTags(c.id, c.rules || "", inputTagsVal)}
                              className="w-6 h-6 rounded-md bg-[#0B1E36] text-white flex items-center justify-center text-[10px] font-bold cursor-pointer"
                              title="Simpan"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingTagsId(null)}
                              className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold cursor-pointer"
                              title="Batal"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1">
                            {tags.map((tag, idx) => (
                              <span
                                key={tag}
                                className={`text-[8.5px] font-extrabold px-2 py-0.5 border rounded-full ${getTagColor(tag, idx)}`}
                              >
                                {tag}
                              </span>
                            ))}
                            {tags.length === 0 && (
                              <span className="text-[10px] font-bold text-slate-400 italic">Belum ada tag</span>
                            )}
                            <button
                              onClick={() => {
                                setEditingTagsId(c.id);
                                const { tags: existingTags } = parseRulesAndTags(c.rules || "");
                                setInputTagsVal(existingTags.join(" "));
                              }}
                              className="ml-1 text-slate-400 hover:text-[#0B1E36] text-[10px] font-extrabold transition-colors cursor-pointer"
                              title="Ubah Tag"
                            >
                              ✏️
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Author details */}
                      <td className="px-6 py-4.5">
                        <div className="font-extrabold text-[#0B1E36]">
                          {c.creator.name}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                          {c.creator.email}
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4.5 text-slate-600 font-bold">
                        {formatDate(c.createdAt)}
                      </td>

                      {/* Status checkbox/toggle */}
                      <td className="px-6 py-4.5 text-center">
                        <div className="flex items-center justify-center gap-3">
                          {/* Status Label Pill */}
                          <span className={`inline-block text-[9px] font-extrabold px-3 py-1 rounded-full border ${
                            c.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                          }`}>
                            {c.status === "APPROVED" ? "APPROVED" : "PENDING"}
                          </span>

                          {/* Neobrutalist Checkbox Toggle */}
                          <button
                            onClick={() => handleToggleApproval(c.id, c.status)}
                            disabled={updatingId === c.id}
                            className={`w-9 h-5 rounded-full border-2 border-[#0B1E36] p-0.5 transition-all relative cursor-pointer ${
                              c.status === "APPROVED"
                                ? "bg-emerald-500"
                                : "bg-slate-200"
                            } ${updatingId === c.id ? "opacity-50 pointer-events-none" : ""}`}
                            aria-label="Toggle verification status"
                          >
                            <div className={`w-3.5 h-3.5 rounded-full border border-[#0B1E36] bg-white transition-all shadow-sm ${
                              c.status === "APPROVED"
                                ? "translate-x-4"
                                : "translate-x-0"
                            }`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
