const BOM = "\uFEFF";

export function generateCSV(headers: string[], rows: string[][]): string {
  const escape = (v: string) => {
    if (v.includes(",") || v.includes('"') || v.includes("\n")) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };

  const lines = [
    headers.map(escape).join(","),
    ...rows.map((row) => row.map(escape).join(",")),
  ];

  return BOM + lines.join("\n");
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportSalesReport(
  data: { label: string; totalSales: number; orderCount: number }[],
  storeName: string,
) {
  const headers = ["기간", "매출(원)", "주문수"];
  const rows = data.map((d) => [
    d.label,
    d.totalSales.toString(),
    d.orderCount.toString(),
  ]);
  const csv = generateCSV(headers, rows);
  const date = new Date().toISOString().split("T")[0];
  downloadCSV(csv, `${storeName}_매출리포트_${date}.csv`);
}

export function exportMenuRanking(
  data: { menuName: string; totalQuantity: number; totalRevenue: number }[],
  storeName: string,
) {
  const headers = ["메뉴명", "판매수량", "매출(원)"];
  const rows = data.map((d) => [
    d.menuName,
    d.totalQuantity.toString(),
    d.totalRevenue.toString(),
  ]);
  const csv = generateCSV(headers, rows);
  const date = new Date().toISOString().split("T")[0];
  downloadCSV(csv, `${storeName}_메뉴랭킹_${date}.csv`);
}

export function exportStoreComparison(
  data: {
    storeName: string;
    totalSales: number;
    orderCount: number;
    averageOrderValue: number;
  }[],
) {
  const headers = ["매장명", "매출(원)", "주문수", "평균객단가(원)"];
  const rows = data.map((d) => [
    d.storeName,
    d.totalSales.toString(),
    d.orderCount.toString(),
    Math.round(d.averageOrderValue).toString(),
  ]);
  const csv = generateCSV(headers, rows);
  const date = new Date().toISOString().split("T")[0];
  downloadCSV(csv, `매장비교_${date}.csv`);
}
