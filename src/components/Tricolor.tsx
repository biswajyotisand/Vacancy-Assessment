import { Chakra } from "./Chakra";

export function Tricolor() {
  return (
    <div className="relative z-50">
      <div className="flex h-2">
        <div className="flex-1 bg-gradient-to-r from-[#e8891f] via-[#ff9933] to-[#e8891f]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-gradient-to-r from-[#0f7a06] via-[#138808] to-[#0f7a06]" />
      </div>
      <Chakra className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-[#06038d]" />
    </div>
  );
}
