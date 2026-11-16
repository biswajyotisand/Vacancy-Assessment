import { motion } from "framer-motion";
import {
  FlaskConical,
  FolderOpen,
  Plus,
  Printer,
  Save,
  Trash2,
  type LucideIcon,
} from "lucide-react";

interface ToolbarProps {
  onSample: () => void;
  onImport: () => void;
  onAddRow: () => void;
  onClear: () => void;
  onSave: () => void;
  onPrint: () => void;
}

interface Btn {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  className: string;
}

export function Toolbar({
  onSample,
  onImport,
  onAddRow,
  onClear,
  onSave,
  onPrint,
}: ToolbarProps) {
  const buttons: Btn[] = [
    {
      label: "Sample Data",
      icon: FlaskConical,
      onClick: onSample,
      className: "bg-[#6a1b9a] hover:bg-[#7b23ad]",
    },
    {
      label: "Import Data",
      icon: FolderOpen,
      onClick: onImport,
      className: "bg-[#00838f] hover:bg-[#0097a7]",
    },
    {
      label: "Add Row",
      icon: Plus,
      onClick: onAddRow,
      className: "bg-[#1565c0] hover:bg-[#1a74d4]",
    },
    {
      label: "Clear All",
      icon: Trash2,
      onClick: onClear,
      className: "bg-[#c62828] hover:bg-[#d03232]",
    },
    {
      label: "Save",
      icon: Save,
      onClick: onSave,
      className: "bg-[#138808] hover:bg-[#179b0b]",
    },
    {
      label: "Print",
      icon: Printer,
      onClick: onPrint,
      className: "bg-[#e65100] hover:bg-[#f25c05]",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.42, ease: "easeOut" }}
      className="no-print sticky top-3 z-40 mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-1.5 rounded-full border border-slate-200/90 bg-white/90 p-1.5 shadow-lg shadow-[#0a2540]/10 backdrop-blur-md"
    >
      {buttons.map(({ label, icon: Icon, onClick, className }) => (
        <motion.button
          key={label}
          type="button"
          onClick={onClick}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold text-white shadow-md shadow-black/15 ${className}`}
        >
          <Icon size={15} strokeWidth={2.6} />
          {label}
        </motion.button>
      ))}
    </motion.div>
  );
}
