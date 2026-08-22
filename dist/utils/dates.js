export function daysInMonth(month, year) {
    if (!Number.isInteger(month) ||
        month < 1 ||
        month > 12 ||
        !Number.isInteger(year) ||
        year < 1) {
        throw new Error("Mês ou ano inválido");
    }
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
export function dateKey(year, month, day) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
