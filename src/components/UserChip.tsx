import { History, LibraryBig, LogOut } from "lucide-react";
import type { UserProfile } from "../types";

interface UserChipProps {
  profile: UserProfile;
  onOpenCadres: () => void;
  onOpenSheets: () => void;
  onLogout: () => void;
}

export function UserChip({
  profile,
  onOpenCadres,
  onOpenSheets,
  onLogout,
}: UserChipProps) {
  const initials = profile.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <div className="no-print flex flex-wrap items-center justify-center gap-2 sm:justify-end">
      <div
        className="flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 py-1 pl-1 pr-4 backdrop-blur-sm"
        title={`${profile.zone} · ${profile.division} · ${profile.office}`}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#ffb35c] to-[#e65100] text-[12px] font-extrabold text-white shadow">
          {initials || "?"}
        </span>
        <span className="text-left leading-tight">
          <span className="block text-[13px] font-bold text-white">
            {profile.name}
          </span>
          <span className="block text-[10px] font-semibold text-white/60">
            HRMS {profile.hrmsId} · {profile.zone}
            {profile.division ? ` · ${profile.division}` : ""}
          </span>
        </span>
      </div>

      <button
        type="button"
        onClick={onOpenCadres}
        className="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-[12px] font-bold text-white transition hover:bg-white/20"
      >
        <LibraryBig size={13} strokeWidth={2.5} />
        Cadre Library
      </button>
      <button
        type="button"
        onClick={onOpenSheets}
        className="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-[12px] font-bold text-white transition hover:bg-white/20"
      >
        <History size={13} strokeWidth={2.5} />
        My Assessments
      </button>
      <button
        type="button"
        onClick={onLogout}
        title="Log out"
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-[#c62828] hover:border-[#c62828]"
      >
        <LogOut size={13} strokeWidth={2.5} />
      </button>
    </div>
  );
}
