import type { Row, SheetInfo } from "../types";
import { mkRow } from "./calc";

export function buildSample(): { info: SheetInfo; rows: Row[] } {
  return {
    info: {
      department: "Personnel",
      cadre: "Ministerial",
      period: "01.01.2026 to 01.01.2027",
    },
    rows: [
      mkRow({
        postName: "Head Clerk",
        intake: "DPQ",
        intakePercent: 100,
        ss: { UR: 8, SC: 2, ST: 1 },
        or: { UR: 6, SC: 1, ST: 1 },
        anticipated: { UR: 2, ST: 1 },
        remarks: "Two retirements due Mar-26",
      }),
      mkRow({
        postName: "Senior Clerk",
        intake: "DPQ",
        intakePercent: 75,
        ss: { UR: 20, SC: 4, ST: 2 },
        or: { UR: 15, SC: 3, ST: 2 },
        anticipated: { UR: 3, SC: 1 },
        remarks: "DPC scheduled Feb-26",
        mergedWithNext: true,
      }),
      mkRow({
        postName: "Senior Clerk",
        intake: "LDCE",
        intakePercent: 25,
        ss: { UR: 10, SC: 2, ST: 1 },
        or: { UR: 8, SC: 2, ST: 0 },
        remarks: "",
      }),
      mkRow({
        postName: "Junior Clerk",
        intake: "DPQ",
        intakePercent: 60,
        ss: { UR: 25, SC: 5, ST: 3 },
        or: { UR: 20, SC: 4, ST: 2 },
        anticipated: { UR: 2 },
        mergedWithNext: true,
      }),
      mkRow({
        postName: "Junior Clerk",
        intake: "DRQ",
        intakePercent: 40,
        ss: { UR: 35, SC: 7, ST: 4, OBC: 12, EWS: 4 },
        or: { UR: 30, SC: 6, ST: 3, OBC: 10, EWS: 3 },
        anticipated: { UR: 5, SC: 1, OBC: 2, EWS: 1 },
        remarks: "RRB panel awaited",
      }),
    ],
  };
}
