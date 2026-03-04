"use client";

import { useState } from "react";
import { useAuth } from "@/shared/providers/auth-provider";
import { useEventBanners } from "@/entities/promotion/api/useEventBanners";
import {
  useCreateEventBanner,
  useUpdateEventBanner,
  useDeleteEventBanner,
  useToggleBannerActive,
  useReorderBanners,
} from "@/features/banner-management";
import { useStores } from "@/entities/store/api/useStores";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Card,
  CardContent,
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
  ImageUpload,
} from "@/shared/ui";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PowerIcon,
  ImageIcon,
  GripVertical,
} from "lucide-react";
import type { EventBanner } from "@/entities/promotion/model/types";

// ── Banner Form ──
interface BannerFormData {
  title: string;
  description: string;
  link_type: string; // "" | "menu" | "coupon" | "external"
  link_value: string;
  store_id: string; // "" = all stores
  starts_at: string;
  ends_at: string;
}

const emptyBannerForm: BannerFormData = {
  title: "",
  description: "",
  link_type: "",
  link_value: "",
  store_id: "",
  starts_at: "",
  ends_at: "",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BrandBannersPage() {
  const { user } = useAuth();
  const franchiseId = user?.franchise_id ?? null;

  const { data: banners = [] } = useEventBanners(franchiseId);
  const { data: stores = [] } = useStores(franchiseId);

  const createBanner = useCreateEventBanner();
  const updateBanner = useUpdateEventBanner();
  const deleteBanner = useDeleteEventBanner();
  const toggleActive = useToggleBannerActive();
  const reorderBanners = useReorderBanners();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = banners.findIndex((b) => b.id === active.id);
    const newIndex = banners.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(banners, oldIndex, newIndex);
    const updates = reordered.map((item, index) => ({ id: item.id, sort_order: index }));
    reorderBanners.mutate(updates);
  };

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<EventBanner | null>(null);
  const [form, setForm] = useState<BannerFormData>(emptyBannerForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // ── Handlers ──
  const openCreate = () => {
    setEditingBanner(null);
    setForm(emptyBannerForm);
    setImageFile(null);
    setImagePreview(null);
    setDialogOpen(true);
  };

  const openEdit = (banner: EventBanner) => {
    setEditingBanner(banner);
    setForm({
      title: banner.title,
      description: banner.description ?? "",
      link_type: banner.link_type ?? "",
      link_value: banner.link_value ?? "",
      store_id: banner.store_id ?? "",
      starts_at: banner.starts_at
        ? new Date(banner.starts_at).toISOString().slice(0, 16)
        : "",
      ends_at: banner.ends_at
        ? new Date(banner.ends_at).toISOString().slice(0, 16)
        : "",
    });
    setImageFile(null);
    setImagePreview(banner.image_url);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;

    const linkType =
      form.link_type === "menu" ||
      form.link_type === "coupon" ||
      form.link_type === "external"
        ? form.link_type
        : null;

    if (editingBanner) {
      const removeImage =
        !imagePreview && !imageFile && !!editingBanner.image_url;
      updateBanner.mutate(
        {
          id: editingBanner.id,
          title: form.title.trim(),
          description: form.description.trim() || null,
          imageFile: imageFile,
          removeImage,
          currentImageUrl: editingBanner.image_url,
          link_type: linkType,
          link_value: form.link_value.trim() || null,
          starts_at: form.starts_at || undefined,
          ends_at: form.ends_at || null,
        },
        { onSuccess: () => setDialogOpen(false) },
      );
    } else {
      if (!franchiseId) return;
      createBanner.mutate(
        {
          franchise_id: franchiseId,
          store_id: form.store_id || null,
          title: form.title.trim(),
          description: form.description.trim() || null,
          imageFile: imageFile,
          link_type: linkType,
          link_value: form.link_value.trim() || null,
          sort_order: banners.length,
          starts_at: form.starts_at || undefined,
          ends_at: form.ends_at || null,
        },
        { onSuccess: () => setDialogOpen(false) },
      );
    }
  };

  const handleToggle = (banner: EventBanner) => {
    toggleActive.mutate({ id: banner.id, is_active: !banner.is_active });
  };

  const handleDelete = (banner: EventBanner) => {
    deleteBanner.mutate({ id: banner.id, imageUrl: banner.image_url });
  };

  const getStoreName = (storeId: string | null) =>
    storeId ? (stores.find((s) => s.id === storeId)?.name ?? "-") : "전체 매장";

  const linkTypePlaceholder =
    form.link_type === "menu"
      ? "메뉴 ID"
      : form.link_type === "coupon"
        ? "쿠폰 코드"
        : form.link_type === "external"
          ? "https://..."
          : "";

  const linkTypeLabel =
    form.link_type === "menu"
      ? "메뉴"
      : form.link_type === "coupon"
        ? "쿠폰"
        : form.link_type === "external"
          ? "외부링크"
          : null;

  const isBannerPending = createBanner.isPending || updateBanner.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{"이벤트 배너"}</h1>
          <p className="text-muted-foreground text-sm">
            {"고객 메뉴 화면 상단에 표시되는 프로모션 배너를 관리합니다."}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <PlusIcon className="size-4" />
          {"배너 추가"}
        </Button>
      </div>

      {/* Banner Grid */}
      {banners.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <ImageIcon className="size-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1">{"등록된 배너가 없습니다"}</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {"배너를 추가하면 고객 메뉴 화면 상단에 표시됩니다."}
              </p>
              <Button onClick={openCreate} className="gap-2">
                <PlusIcon className="size-4" />
                {"배너 추가"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={banners.map((b) => b.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {banners.map((banner) => (
                <SortableBannerCard
                  key={banner.id}
                  banner={banner}
                  storeName={getStoreName(banner.store_id)}
                  onEdit={() => openEdit(banner)}
                  onToggle={() => handleToggle(banner)}
                  onDelete={() => handleDelete(banner)}
                  togglePending={toggleActive.isPending}
                  linkTypeLabel={
                    banner.link_type === "menu"
                      ? "메뉴"
                      : banner.link_type === "coupon"
                        ? "쿠폰"
                        : banner.link_type === "external"
                          ? "외부링크"
                          : null
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Reorder indicator */}
      {reorderBanners.isPending && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground shadow-lg">
          {"순서 저장 중..."}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? "배너 수정" : "배너 추가"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label>{"배너 제목"}</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="배너 제목을 입력하세요"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>{"설명"}</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="배너 설명을 입력하세요 (선택)"
                rows={3}
              />
            </div>

            {/* Image */}
            <div className="space-y-2">
              <Label>{"배너 이미지"}</Label>
              <ImageUpload
                value={imagePreview}
                onChange={(file) => {
                  setImageFile(file);
                  if (!file) setImagePreview(null);
                }}
                maxSizeMB={10}
              />
            </div>

            {/* Link type */}
            <div className="space-y-2">
              <Label>{"링크 유형"}</Label>
              <Select
                value={form.link_type}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, link_type: v ?? "", link_value: "" }))
                }
              >
                <SelectTrigger>
                  <span className="flex flex-1 text-left truncate">
                    {form.link_type === "menu"
                      ? "메뉴"
                      : form.link_type === "coupon"
                        ? "쿠폰"
                        : form.link_type === "external"
                          ? "외부 링크"
                          : "없음"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{"없음"}</SelectItem>
                  <SelectItem value="menu">{"메뉴"}</SelectItem>
                  <SelectItem value="coupon">{"쿠폰"}</SelectItem>
                  <SelectItem value="external">{"외부 링크"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Link value */}
            {form.link_type && (
              <div className="space-y-2">
                <Label>{"링크 값"}</Label>
                <Input
                  value={form.link_value}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, link_value: e.target.value }))
                  }
                  placeholder={linkTypePlaceholder}
                />
              </div>
            )}

            {/* Store scope */}
            <div className="space-y-2">
              <Label>{"적용 매장"}</Label>
              <Select
                value={form.store_id}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, store_id: v ?? "" }))
                }
              >
                <SelectTrigger>
                  <span className="flex flex-1 text-left truncate">
                    {form.store_id
                      ? (stores.find((s) => s.id === form.store_id)?.name ?? "매장 선택")
                      : "전체 매장"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{"전체 매장"}</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start date */}
            <div className="space-y-2">
              <Label>{"시작일"}</Label>
              <DateTimePicker
                value={form.starts_at}
                onChange={(v) => setForm((f) => ({ ...f, starts_at: v }))}
                placeholder="시작일을 선택하세요"
              />
            </div>

            {/* End date */}
            <div className="space-y-2">
              <Label>{"종료일"}</Label>
              <DateTimePicker
                value={form.ends_at}
                onChange={(v) => setForm((f) => ({ ...f, ends_at: v }))}
                placeholder="종료일을 선택하세요"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {"취소"}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isBannerPending || !form.title.trim()}
            >
              {isBannerPending ? "저장중..." : editingBanner ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Sortable Banner Card ──
interface SortableBannerCardProps {
  banner: EventBanner;
  storeName: string;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  togglePending: boolean;
  linkTypeLabel: string | null;
}

function SortableBannerCard({
  banner,
  storeName,
  onEdit,
  onToggle,
  onDelete,
  togglePending,
  linkTypeLabel,
}: SortableBannerCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const periodText =
    banner.starts_at || banner.ends_at
      ? `${formatDate(banner.starts_at)} ~ ${formatDate(banner.ends_at) || "종료일 없음"}`
      : "기간 제한 없음";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative rounded-lg border bg-background overflow-hidden flex flex-col ${!banner.is_active ? "opacity-60" : ""}`}
    >
      {/* Drag handle */}
      <button
        className="absolute top-2 left-2 z-10 cursor-grab touch-none text-muted-foreground hover:text-foreground bg-background/80 rounded p-0.5"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      {/* Image */}
      {banner.image_url ? (
        <div className="aspect-[16/7] w-full overflow-hidden bg-muted">
          <img
            src={banner.image_url}
            alt={banner.title}
            className="size-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-[16/7] w-full bg-muted flex items-center justify-center">
          <ImageIcon className="size-8 text-muted-foreground" />
        </div>
      )}

      {/* Content */}
      <div className="p-3 flex-1 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium text-sm leading-snug line-clamp-2">{banner.title}</span>
          <Badge
            variant={banner.is_active ? "default" : "secondary"}
            className="shrink-0 text-[10px] px-1.5 py-0"
          >
            {banner.is_active ? "활성" : "비활성"}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground">{periodText}</p>

        <div className="flex flex-wrap items-center gap-1 mt-0.5">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {storeName}
          </Badge>
          {linkTypeLabel && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {linkTypeLabel}
            </Badge>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 px-3 pb-3">
        <Button
          variant="ghost"
          size="xs"
          onClick={onToggle}
          disabled={togglePending}
          className="gap-1"
        >
          <PowerIcon className="size-3" />
          {banner.is_active ? "비활성화" : "활성화"}
        </Button>
        <Button variant="ghost" size="xs" onClick={onEdit} className="gap-1">
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
              <AlertDialogTitle>{"배너 삭제"}</AlertDialogTitle>
              <AlertDialogDescription>
                {`"${banner.title}" 배너를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{"취소"}</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>{"삭제"}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
