"use client";

import { useState } from "react";
import { useAuth } from "@/shared/providers/auth-provider";
import { useCoupons } from "@/entities/promotion/api/useCoupons";
import {
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
  useToggleCouponActive,
} from "@/features/coupon-management";
import { useStores } from "@/entities/store/api/useStores";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  DateTimePicker,
  Input,
  Label,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/shared/ui";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PowerIcon,
  TicketIcon,
  CopyIcon,
} from "lucide-react";
import type { Coupon } from "@/entities/promotion/model/types";

// ── Helpers ──

function generateCouponCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ── Form types ──

interface CouponFormData {
  name: string;
  code: string;
  description: string;
  discount_type: "fixed" | "percentage";
  discount_value: string;
  min_order_amount: string;
  max_uses: string;
  store_id: string;
  starts_at: string;
  expires_at: string;
}

const emptyCouponForm: CouponFormData = {
  name: "",
  code: "",
  description: "",
  discount_type: "fixed",
  discount_value: "",
  min_order_amount: "0",
  max_uses: "",
  store_id: "",
  starts_at: "",
  expires_at: "",
};

// ── Page ──

export default function BrandCouponsPage() {
  const { user } = useAuth();
  const franchiseId = user?.franchise_id ?? null;

  const { data: coupons = [] } = useCoupons(franchiseId);
  const { data: stores = [] } = useStores(franchiseId);

  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();
  const toggleCouponActive = useToggleCouponActive();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponFormData>(emptyCouponForm);

  const isPending = createCoupon.isPending || updateCoupon.isPending;

  // Convert ISO string to datetime-local value (YYYY-MM-DDTHH:mm)
  function toDatetimeLocal(iso: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  const openCreate = () => {
    setEditingCoupon(null);
    setForm(emptyCouponForm);
    setDialogOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setForm({
      name: coupon.name,
      code: coupon.code,
      description: coupon.description ?? "",
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      min_order_amount: String(coupon.min_order_amount),
      max_uses: coupon.max_uses != null ? String(coupon.max_uses) : "",
      store_id: coupon.store_id ?? "",
      starts_at: toDatetimeLocal(coupon.starts_at),
      expires_at: toDatetimeLocal(coupon.expires_at),
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.code.trim() || !form.discount_value) return;
    const discountValue = parseFloat(form.discount_value);
    if (isNaN(discountValue) || discountValue <= 0) return;
    if (form.discount_type === "percentage" && (discountValue < 1 || discountValue > 100)) return;

    const minOrderAmount = parseInt(form.min_order_amount, 10);
    const maxUses = form.max_uses ? parseInt(form.max_uses, 10) : null;
    const storeId = form.store_id || null;
    const startsAt = form.starts_at ? new Date(form.starts_at).toISOString() : new Date().toISOString();
    const expiresAt = form.expires_at ? new Date(form.expires_at).toISOString() : null;

    if (editingCoupon) {
      updateCoupon.mutate(
        {
          id: editingCoupon.id,
          name: form.name.trim(),
          description: form.description.trim() || null,
          discount_type: form.discount_type,
          discount_value: discountValue,
          min_order_amount: isNaN(minOrderAmount) ? 0 : minOrderAmount,
          max_uses: maxUses,
          starts_at: startsAt,
          expires_at: expiresAt,
        },
        { onSuccess: () => setDialogOpen(false) },
      );
    } else {
      if (!franchiseId) return;
      createCoupon.mutate(
        {
          franchise_id: franchiseId,
          store_id: storeId,
          code: form.code.trim().toUpperCase(),
          name: form.name.trim(),
          description: form.description.trim() || null,
          discount_type: form.discount_type,
          discount_value: discountValue,
          min_order_amount: isNaN(minOrderAmount) ? 0 : minOrderAmount,
          max_uses: maxUses,
          starts_at: startsAt,
          expires_at: expiresAt,
        },
        { onSuccess: () => setDialogOpen(false) },
      );
    }
  };

  const handleDelete = (id: string) => {
    deleteCoupon.mutate(id);
  };

  const handleToggle = (coupon: Coupon) => {
    toggleCouponActive.mutate({ id: coupon.id, is_active: !coupon.is_active });
  };

  const getStoreName = (storeId: string | null) => {
    if (!storeId) return "전체 매장";
    return stores.find((s) => s.id === storeId)?.name ?? "전체 매장";
  };

  const selectedStoreName = form.store_id
    ? stores.find((s) => s.id === form.store_id)?.name ?? "매장 선택"
    : "전체 매장";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{"쿠폰 관리"}</h1>
          <p className="text-muted-foreground text-sm">{"할인 쿠폰을 생성하고 관리합니다."}</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <PlusIcon className="size-4" />
          {"쿠폰 추가"}
        </Button>
      </div>

      {/* Coupon List */}
      {coupons.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <TicketIcon className="size-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1">{"등록된 쿠폰이 없습니다"}</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {"첫 번째 할인 쿠폰을 만들어보세요."}
              </p>
              <Button onClick={openCreate} className="gap-2">
                <PlusIcon className="size-4" />
                {"쿠폰 추가"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{"쿠폰 목록"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 bg-background ${!coupon.is_active ? "opacity-60" : ""}`}
                >
                  {/* Icon */}
                  <div className="shrink-0 mt-0.5">
                    <TicketIcon className="size-5 text-muted-foreground" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Name + code */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{coupon.name}</span>
                      <Badge variant="outline" className="font-mono text-xs gap-1">
                        {coupon.code}
                        <button
                          className="ml-0.5 hover:text-foreground text-muted-foreground"
                          onClick={() => navigator.clipboard.writeText(coupon.code)}
                          title="코드 복사"
                        >
                          <CopyIcon className="size-2.5" />
                        </button>
                      </Badge>
                      <Badge variant={coupon.is_active ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                        {coupon.is_active ? "활성" : "비활성"}
                      </Badge>
                    </div>

                    {/* Discount + usage */}
                    <div className="flex items-center gap-3 flex-wrap text-sm">
                      <span className="font-semibold">
                        {coupon.discount_type === "fixed"
                          ? `${coupon.discount_value.toLocaleString("ko-KR")}원 할인`
                          : `${coupon.discount_value}% 할인`}
                      </span>
                      <span className="text-muted-foreground">
                        {coupon.max_uses != null
                          ? `${coupon.current_uses} / ${coupon.max_uses} 사용`
                          : `${coupon.current_uses}회 사용`}
                      </span>
                      {coupon.min_order_amount > 0 && (
                        <span className="text-muted-foreground text-xs">
                          {"최소 "}{coupon.min_order_amount.toLocaleString("ko-KR")}{"원"}
                        </span>
                      )}
                    </div>

                    {/* Period + store */}
                    <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                      <span>
                        {coupon.starts_at || coupon.expires_at
                          ? `${formatDate(coupon.starts_at)} ~ ${coupon.expires_at ? formatDate(coupon.expires_at) : "∞"}`
                          : "기간 제한 없음"}
                      </span>
                      <span>{getStoreName(coupon.store_id)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleToggle(coupon)}
                      disabled={toggleCouponActive.isPending}
                      className="gap-1"
                    >
                      <PowerIcon className="size-3" />
                      {coupon.is_active ? "비활성화" : "활성화"}
                    </Button>
                    <Button variant="ghost" size="xs" onClick={() => openEdit(coupon)} className="gap-1">
                      <PencilIcon className="size-3" />
                      {"수정"}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={<Button variant="ghost" size="xs" className="gap-1 text-destructive" />}
                      >
                        <TrashIcon className="size-3" />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{"쿠폰 삭제"}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {`"${coupon.name}" 쿠폰을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{"취소"}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(coupon.id)}>
                            {"삭제"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? "쿠폰 수정" : "쿠폰 추가"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label>{"쿠폰 이름"}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="예: 신규 가입 할인"
              />
            </div>

            {/* Code */}
            <div className="space-y-2">
              <Label>{"쿠폰 코드"}</Label>
              <div className="flex gap-2">
                <Input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="예: WELCOME10"
                  className="font-mono"
                  disabled={!!editingCoupon}
                />
                {!editingCoupon && (
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, code: generateCouponCode() }))}
                  >
                    {"자동 생성"}
                  </Button>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>{"설명"}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="쿠폰 설명을 입력하세요 (선택)"
                rows={2}
              />
            </div>

            {/* Discount type toggle */}
            <div className="space-y-2">
              <Label>{"할인 유형"}</Label>
              <div className="flex rounded-md border overflow-hidden">
                <button
                  type="button"
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    form.discount_type === "fixed"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => setForm((f) => ({ ...f, discount_type: "fixed" }))}
                >
                  {"정액 할인"}
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    form.discount_type === "percentage"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => setForm((f) => ({ ...f, discount_type: "percentage" }))}
                >
                  {"비율 할인"}
                </button>
              </div>
            </div>

            {/* Discount value */}
            <div className="space-y-2">
              <Label>
                {form.discount_type === "fixed" ? "할인 금액 (원)" : "할인 비율 (%)"}
              </Label>
              <Input
                type="number"
                min="0"
                max={form.discount_type === "percentage" ? 100 : undefined}
                value={form.discount_value}
                onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                placeholder={form.discount_type === "fixed" ? "예: 3000" : "예: 10"}
              />
            </div>

            {/* Min order amount */}
            <div className="space-y-2">
              <Label>{"최소 주문 금액 (원)"}</Label>
              <Input
                type="number"
                min="0"
                value={form.min_order_amount}
                onChange={(e) => setForm((f) => ({ ...f, min_order_amount: e.target.value }))}
                placeholder="0"
              />
            </div>

            {/* Max uses */}
            <div className="space-y-2">
              <Label>{"최대 사용 횟수"}</Label>
              <Input
                type="number"
                min="1"
                value={form.max_uses}
                onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))}
                placeholder="무제한"
              />
            </div>

            {/* Store */}
            <div className="space-y-2">
              <Label>{"적용 매장"}</Label>
              <Select
                value={form.store_id}
                onValueChange={(v) => setForm((f) => ({ ...f, store_id: v === "__all__" ? "" : (v ?? "") }))}
              >
                <SelectTrigger>
                  <span className="flex flex-1 text-left truncate">
                    {selectedStoreName}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{"전체 매장"}</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Starts at */}
            <div className="space-y-2">
              <Label>{"시작일"}</Label>
              <DateTimePicker
                value={form.starts_at}
                onChange={(v) => setForm((f) => ({ ...f, starts_at: v }))}
                placeholder="시작일을 선택하세요"
              />
            </div>

            {/* Expires at */}
            <div className="space-y-2">
              <Label>{"만료일 (선택)"}</Label>
              <DateTimePicker
                value={form.expires_at}
                onChange={(v) => setForm((f) => ({ ...f, expires_at: v }))}
                placeholder="만료일을 선택하세요"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {"취소"}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || !form.name.trim() || !form.code.trim() || !form.discount_value}
            >
              {isPending ? "저장중..." : editingCoupon ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
