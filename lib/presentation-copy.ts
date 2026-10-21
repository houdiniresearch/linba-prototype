const forms: Record<string, string> = {
  eğitim: "sunum",
  eğitimde: "sunumda",
  eğitimden: "sunumdan",
  eğitime: "sunuma",
  eğitimi: "sunumu",
  eğitimin: "sunumun",
  eğitiminde: "sunumunda",
  eğitiminden: "sunumundan",
  eğitimine: "sunumuna",
  eğitimini: "sunumunu",
  eğitiminin: "sunumunun",
  eğitimle: "sunumla",
  eğitimler: "sunumlar",
  eğitimlerde: "sunumlarda",
  eğitimlere: "sunumlara",
  eğitimleri: "sunumları",
  eğitimlerim: "sunumlarım",
  eğitimlerime: "sunumlarıma",
  eğitimlerimi: "sunumlarımı",
  eğitimlerin: "sunumların",
  eğitimlerinde: "sunumlarında",
  eğitimlerine: "sunumlarına",
  eğitimlerini: "sunumlarını",
  eğitimlerinin: "sunumlarının",
  eğitimlerinizi: "sunumlarınızı",
  eğitimlerinle: "sunumlarınla",
};
/** Product wording only. Landing-page copy and user-provided names remain unchanged. */
export function presentationCopy(text: string) {
  return text
    .replace(/\btraining(s)?\b/gi, (word, plural) => {
      const replacement = plural ? "presentations" : "presentation";
      return word === word.toUpperCase()
        ? replacement.toUpperCase()
        : word[0] === "T"
          ? replacement[0].toUpperCase() + replacement.slice(1)
          : replacement;
    })
    .replace(/[Ee]ğitim[\p{L}]*/gu, (word) => {
      const replacement = forms[word.toLocaleLowerCase("tr-TR")];
      return replacement
        ? word[0] === "E"
          ? replacement[0].toUpperCase() + replacement.slice(1)
          : replacement
        : word;
    });
}
