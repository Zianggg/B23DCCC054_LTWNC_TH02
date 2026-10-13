/**
 * Import động dùng chung cho React.lazy (App) và preload khi rê chuột hoặc focus vào link "Thống kê".
 * Cùng một specifier nên trình duyệt chỉ tải chunk một lần.
 */
export const loadStatsPage = () => import('./StatsPage')
