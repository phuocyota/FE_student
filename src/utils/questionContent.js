const toArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

export const buildContentChain = (node) => {
  if (!node) return [];

  if (Array.isArray(node.chain) && node.chain.length > 0) {
    return node.chain.flatMap((item) => buildContentChain(item));
  }

  const current =
    node.contentType && node.content
      ? [{ id: node.id, contentType: node.contentType, content: node.content }]
      : [];

  return [
    ...current,
    ...toArray(node.nextContentDetails).flatMap((item) =>
      buildContentChain(item)
    ),
  ];
};

export const getQuestionAnswerOptions = (question) => {
  const answers = toArray(question?.answers);
  const nestedPartIds = new Set(
    answers.map((answer) => answer?.nextContent).filter(Boolean)
  );

  return answers
    .filter((answer) => answer?.id && !nestedPartIds.has(answer.id))
    .sort((a, b) => {
      const labelA = a.meta?.importOptionLabel || "";
      const labelB = b.meta?.importOptionLabel || "";

      if (labelA && labelB && labelA !== labelB) {
        return labelA.localeCompare(labelB);
      }

      const orderA = a.orderNo ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.orderNo ?? Number.MAX_SAFE_INTEGER;

      if (orderA !== orderB) return orderA - orderB;
      return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
    });
};
