// Shared formatting helpers.
// Prices are stored as whole-number units (e.g. 3499 = ₹3,499).

export const formatINR = (value) => '₹' + Number(value || 0).toLocaleString('en-IN');

export const formatOrderCount = (n) => {
    const count = Number(n) || 0;
    return count === 1 ? 'ordered 1 time' : `ordered ${count} times`;
};
