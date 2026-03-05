"use client";

import { useState } from "react";
import { useConsultations } from "@/entities/consultation/api/useConsultations";
import { useUpdateConsultationStatus } from "@/features/consultation/api/mutations";
import type { ConsultationStatus } from "@/entities/consultation/model/types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui";
import { Textarea } from "@/shared/ui/textarea";
import { EyeIcon } from "lucide-react";
import type { Consultation } from "@/entities/consultation/model/types";

const STATUS_LABELS: Record<ConsultationStatus, string> = {
  pending: "대기",
  contacted: "연락완료",
  completed: "처리완료",
};

const STATUS_VARIANTS: Record<ConsultationStatus, "secondary" | "default" | "outline"> = {
  pending: "secondary",
  contacted: "default",
  completed: "outline",
};

export default function ConsultationsPage() {
  const { data: consultations = [], isLoading } = useConsultations();
  const updateStatus = useUpdateConsultationStatus();
  const [detail, setDetail] = useState<Consultation | null>(null);
  const [editStatus, setEditStatus] = useState<ConsultationStatus>("pending");
  const [editNote, setEditNote] = useState("");

  const openDetail = (c: Consultation) => {
    setDetail(c);
    setEditStatus(c.status);
    setEditNote(c.note ?? "");
  };

  const handleSave = () => {
    if (!detail) return;
    updateStatus.mutate(
      { id: detail.id, status: editStatus, note: editNote || null },
      { onSuccess: () => setDetail(null) },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">{"로딩 중..."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{"상담 신청 관리"}</h1>
        <p className="text-muted-foreground text-sm">
          {"랜딩 페이지에서 접수된 도입 상담 신청을 관리합니다."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {"상담 신청 목록 ("}
            {consultations.length}
            {")"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {consultations.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {"접수된 상담 신청이 없습니다."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{"이름"}</TableHead>
                    <TableHead>{"전화번호"}</TableHead>
                    <TableHead>{"매장명"}</TableHead>
                    <TableHead>{"상태"}</TableHead>
                    <TableHead>{"신청일"}</TableHead>
                    <TableHead className="text-right">{"액션"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consultations.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.phone}</TableCell>
                      <TableCell>{c.store_name}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[c.status]}>
                          {STATUS_LABELS[c.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(c.created_at).toLocaleDateString("ko-KR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="xs"
                          variant="outline"
                          className="gap-1"
                          onClick={() => openDetail(c)}
                        >
                          <EyeIcon className="size-3" />
                          {"상세"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={!!detail}
        onOpenChange={(open) => { if (!open) setDetail(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{"상담 신청 상세"}</DialogTitle>
            <DialogDescription>
              {detail?.name}
              {" / "}
              {detail?.store_name}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{"이름"}</p>
                  <p className="font-medium">{detail.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{"전화번호"}</p>
                  <p className="font-medium">{detail.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{"매장명"}</p>
                  <p className="font-medium">{detail.store_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{"이메일"}</p>
                  <p className="font-medium">{detail.email ?? "-"}</p>
                </div>
              </div>
              {detail.message && (
                <div className="text-sm">
                  <p className="text-muted-foreground">{"문의 내용"}</p>
                  <p className="mt-1 whitespace-pre-wrap rounded-lg border p-3">
                    {detail.message}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">{"상태"}</label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as ConsultationStatus)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{STATUS_LABELS[editStatus]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{"대기"}</SelectItem>
                    <SelectItem value="contacted">{"연락완료"}</SelectItem>
                    <SelectItem value="completed">{"처리완료"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{"관리자 메모"}</label>
                <Textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="메모를 입력하세요..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetail(null)}>
              {"취소"}
            </Button>
            <Button onClick={handleSave} disabled={updateStatus.isPending}>
              {updateStatus.isPending ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
