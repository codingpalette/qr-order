"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/shared/ui";
import type { TableRevenueItem } from "@/entities/order/model/types";

interface TableRevenueTableProps {
  data: TableRevenueItem[];
}

export function TableRevenueTable({ data }: TableRevenueTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
        {"데이터가 없습니다"}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">{"테이블"}</TableHead>
            <TableHead className="text-right">{"주문수"}</TableHead>
            <TableHead className="text-right">{"매출"}</TableHead>
            <TableHead className="text-right">{"평균 객단가"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.tableNumber}>
              <TableCell className="font-medium">
                {row.tableNumber}{"번"}
              </TableCell>
              <TableCell className="text-right">
                {row.orderCount.toLocaleString()}{"건"}
              </TableCell>
              <TableCell className="text-right">
                {row.totalSales.toLocaleString("ko-KR")}{"원"}
              </TableCell>
              <TableCell className="text-right">
                {Math.round(row.averageSpend).toLocaleString("ko-KR")}{"원"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
