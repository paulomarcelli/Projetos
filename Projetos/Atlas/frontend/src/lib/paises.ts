// ISO 3166-1 alfa-3 → numérico (ids do world-atlas). Blocos são expandidos em membros.
export const ISO_NUM: Record<string, string> = {
  ARG: "032", BRA: "076", CHN: "156", DEU: "276", FRA: "250", IND: "356", JPN: "392", KOR: "410", MEX: "484",
  NLD: "528", PHL: "608", RUS: "643", TUR: "792", TWN: "158", USA: "840", VNM: "704",
};
export const BLOCOS: Record<string, string[]> = {
  // UE-27
  ue: ["040", "056", "100", "191", "196", "203", "208", "233", "246", "250", "276", "300", "348", "372", "380", "428", "440", "442", "470", "528", "616", "620", "642", "703", "705", "724", "752"],
};
