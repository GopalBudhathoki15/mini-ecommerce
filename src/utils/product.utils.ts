export function isValidId(productId: unknown): productId is number {
  return (
    typeof productId === "number" &&
    Number.isInteger(productId) &&
    productId > 0
  );
}
