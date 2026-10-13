export function hasDuplicateOptions(options: string[]) {
  const labels = options.map((option) =>
    option.trim().toLocaleLowerCase("tr-TR"),
  );
  return new Set(labels).size !== labels.length;
}

export function pollResults(options: string[], responses: { value: string }[]) {
  return [...new Set(options)].map((option) => {
    const count = responses.filter(
      (response) => response.value === option,
    ).length;
    return {
      option,
      count,
      percentage: responses.length ? (count / responses.length) * 100 : 0,
    };
  });
}
