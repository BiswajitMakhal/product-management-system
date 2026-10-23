import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total } = pagination;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-4 py-3 mt-4 bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs sm:text-sm">
      <p className="text-slate-400 text-center sm:text-left">
        Showing page{" "}
        <span className="font-semibold text-amber-400">{page}</span> of{" "}
        <span className="font-semibold text-slate-200">{totalPages}</span>{" "}
        <span className="text-slate-500">({total} total records)</span>
      </p>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-200 hover:border-amber-500/50 hover:text-amber-400 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Prev</span>
        </button>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-200 hover:border-amber-500/50 hover:text-amber-400 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
