"use client";

import { useState } from "react";
import { useAuth } from "@/shared/providers/auth-provider";
import { useTables } from "@/entities/store/api/useTables";
import { useCreateTable, useDeleteTable, useResetTable } from "@/features/table-management";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Label,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/shared/ui";
import {
  QrCodeIcon,
  PlusIcon,
  Trash2Icon,
  LinkIcon,
  RotateCcwIcon,
} from "lucide-react";
import type { Table as TableType } from "@/entities/store/model/types";

export default function StoreTablesPage() {
  const { user } = useAuth();
  const storeId = user?.store_id ?? null;
  const { data: tables = [] } = useTables(storeId);
  const createTable = useCreateTable();
  const deleteTable = useDeleteTable();
  const resetTable = useResetTable();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<TableType | null>(null);
  const [qrTarget, setQrTarget] = useState<TableType | null>(null);
  const [resetTarget, setResetTarget] = useState<TableType | null>(null);

  const handleCreate = () => {
    if (!storeId) return;
    const num = Number(newTableNumber);
    if (isNaN(num) || num <= 0) return;
    if (tables.some((t) => t.table_number === num)) return;

    createTable.mutate(
      { store_id: storeId, table_number: num },
      {
        onSuccess: () => {
          setAddDialogOpen(false);
          setNewTableNumber("");
        },
      },
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteTable.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const handleReset = () => {
    if (!resetTarget) return;
    resetTable.mutate(resetTarget.id, {
      onSuccess: () => setResetTarget(null),
    });
  };

  const getOrderUrl = (tableNumber: number) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/order/${storeId}?table=${tableNumber}`;
  };

  const handleCopyLink = (tableNumber: number) => {
    const url = getOrderUrl(tableNumber);
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{"테이블 / QR 관리"}</h1>
          <p className="text-muted-foreground text-sm">
            {"테이블을 추가하고 QR 코드를 관리합니다."}
          </p>
        </div>
        <Button className="gap-1" onClick={() => { setNewTableNumber(""); setAddDialogOpen(true); }}>
          <PlusIcon className="size-4" />
          {"테이블 추가"}
        </Button>
      </div>

      {tables.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <QrCodeIcon className="size-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1">{"테이블이 없습니다"}</h3>
              <p className="text-muted-foreground text-sm">
                {"테이블을 추가하여 QR 주문을 시작하세요."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{"테이블 번호"}</TableHead>
                  <TableHead>{"주문 링크"}</TableHead>
                  <TableHead className="w-[120px] text-right">{"관리"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tables.map((table) => (
                  <TableRow key={table.id}>
                    <TableCell className="font-medium">
                      {"테이블 "}{table.table_number}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded truncate block max-w-xs">
                        {getOrderUrl(table.table_number)}
                      </code>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          className="gap-1"
                          onClick={() => handleCopyLink(table.table_number)}
                        >
                          <LinkIcon className="size-3" />
                          {"복사"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="gap-1"
                          onClick={() => setQrTarget(table)}
                        >
                          <QrCodeIcon className="size-3" />
                          {"QR"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="gap-1"
                          onClick={() => setResetTarget(table)}
                        >
                          <RotateCcwIcon className="size-3" />
                          {"초기화"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="gap-1 text-destructive"
                          onClick={() => setDeleteTarget(table)}
                        >
                          <Trash2Icon className="size-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Table Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{"테이블 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{"테이블 번호"}</Label>
              <Input
                type="number"
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value)}
                placeholder="1"
                min={1}
              />
              {newTableNumber && tables.some((t) => t.table_number === Number(newTableNumber)) && (
                <p className="text-destructive text-xs">
                  {"이미 존재하는 테이블 번호입니다."}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              {"취소"}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                createTable.isPending ||
                !newTableNumber ||
                tables.some((t) => t.table_number === Number(newTableNumber))
              }
            >
              {createTable.isPending ? "추가 중..." : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{"테이블 삭제"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              {"테이블 "}{deleteTarget?.table_number}{"을(를) 삭제하시겠습니까?"}
            </p>
            <p className="text-muted-foreground text-xs mt-2">
              {"해당 테이블의 QR 코드도 함께 삭제됩니다."}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {"취소"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteTable.isPending}
            >
              {deleteTable.isPending ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog open={!!resetTarget} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{"테이블 초기화"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              {"테이블 "}{resetTarget?.table_number}{"을(를) 초기화하시겠습니까?"}
            </p>
            <p className="text-muted-foreground text-xs mt-2">
              {"새로운 세션이 시작되며, 이전 팀의 주문 내역이 새 고객에게 표시되지 않습니다."}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)}>
              {"취소"}
            </Button>
            <Button
              onClick={handleReset}
              disabled={resetTable.isPending}
            >
              {resetTable.isPending ? "초기화 중..." : "초기화"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={!!qrTarget} onOpenChange={(open) => !open && setQrTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {"테이블 "}{qrTarget?.table_number}{" QR 코드"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <div className="border rounded-lg p-4 bg-white">
                {/* QR code rendered via Google Charts API */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getOrderUrl(qrTarget?.table_number ?? 0))}`}
                  alt={`테이블 ${qrTarget?.table_number} QR 코드`}
                  width={200}
                  height={200}
                />
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground break-all">
                {getOrderUrl(qrTarget?.table_number ?? 0)}
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => handleCopyLink(qrTarget?.table_number ?? 0)}
              >
                <LinkIcon className="size-3" />
                {"링크 복사"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQrTarget(null)}>
              {"닫기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
