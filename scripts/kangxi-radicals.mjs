/** 214 Kangxi radicals (康熙部首) as unified Han characters for Make Me a Hanzi data. */
export const KANGXI_RADICALS = Array.from({ length: 214 }, (_, index) =>
  String.fromCodePoint(0x2f00 + index).normalize('NFKC'),
);

export const KANGXI_RADICAL_COUNT = KANGXI_RADICALS.length;
