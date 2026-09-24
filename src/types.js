export function isISODateString(date) {
    return /^\d{4}-\d{2}-\d{2}$/.test(date);
}
