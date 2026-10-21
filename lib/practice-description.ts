/** Strip unnecessary simulation labels from older generated profiles. */
export function personaDescription(background: string) {
  const text = background
    .replace(/\s+/g, " ")
    .trim()
    .replace(
      /^(?:kurgusal olarak|kurgusal bir katılımcı olarak|bir persona olarak|persona olarak|simüle edilen bir katılımcı olarak|as a fictional participant|fictionally)[\s,:;-]*/i,
      "",
    );
  return text ? text.charAt(0).toLocaleUpperCase("tr-TR") + text.slice(1) : "";
}
