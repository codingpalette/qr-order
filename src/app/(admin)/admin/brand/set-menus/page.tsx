"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/shared/providers/auth-provider";
import { useMenuCategories } from "@/entities/menu/api/useMenuCategories";
import { useMasterMenus } from "@/entities/menu/api/useMasterMenus";
import { useSetMenus } from "@/entities/menu/api/useSetMenus";
import {
  useCreateSetMenu,
  useUpdateSetMenu,
  useDeleteSetMenu,
  useToggleSetMenuActive,
  useReorderSetMenus,
} from "@/features/set-menu-management";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Card,
  CardContent,
  CardHeader,
  Badge,
  Button,
  Input,
  Label,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Tabs,
  TabsList,
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  PackageIcon,
  GripVertical,
} from "lucide-react";
import type { SetMenuWithItems } from "@/entities/menu/model/types";

interface SetMenuItemForm {
  master_menu_id: string;
  quantity: number;
}

export default function SetMenusPage() {
  const { user } = useAuth();
  const franchiseId = user?.franchise_id ?? null;
  const { data: categories = [] } = useMenuCategories(franchiseId);
  const { data: masterMenus = [] } = useMasterMenus(franchiseId);
  const { data: setMenus = [] } = useSetMenus(franchiseId);

  const createSetMenu = useCreateSetMenu();
  const updateSetMenu = useUpdateSetMenu();
  const deleteSetMenu = useDeleteSetMenu();
  const toggleActive = useToggleSetMenuActive();
  const reorderSetMenus = useReorderSetMenus();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = filteredSetMenus.findIndex((m) => m.id === active.id);
    const newIndex = filteredSetMenus.findIndex((m) => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(filteredSetMenus, oldIndex, newIndex);
    const updates = reordered.map((item, index) => ({
      id: item.id,
      sort_order: index,
    }));
    reorderSetMenus.mutate(updates);
  };

  const [activeTab, setActiveTab] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SetMenuWithItems | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCostPrice, setFormCostPrice] = useState("");
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  const [formItems, setFormItems] = useState<SetMenuItemForm[]>([]);

  const filteredSetMenus = useMemo(
    () =>
      activeTab === "all"
        ? setMenus
        : setMenus.filter((m) => m.category_id === activeTab),
    [setMenus, activeTab],
  );

  const originalPrice = useMemo(() => {
    return formItems.reduce((sum, item) => {
      const menu = masterMenus.find((m) => m.id === item.master_menu_id);
      return sum + (menu?.price ?? 0) * item.quantity;
    }, 0);
  }, [formItems, masterMenus]);

  const getCategoryName = (categoryId: string) =>
    categories.find((c) => c.id === categoryId)?.name ?? "-";

  const openCreate = () => {
    setEditing(null);
    setFormName("");
    setFormDescription("");
    setFormCategoryId(categories[0]?.id ?? "");
    setFormPrice("");
    setFormCostPrice("");
    setFormImageFile(null);
    setFormImagePreview(null);
    setFormItems([]);
    setDialogOpen(true);
  };

  const openEdit = (setMenu: SetMenuWithItems) => {
    setEditing(setMenu);
    setFormName(setMenu.name);
    setFormDescription(setMenu.description ?? "");
    setFormCategoryId(setMenu.category_id);
    setFormPrice(String(setMenu.price));
    setFormCostPrice(setMenu.cost_price != null ? String(setMenu.cost_price) : "");
    setFormImageFile(null);
    setFormImagePreview(setMenu.image_url);
    setFormItems(
      setMenu.items.map((i) => ({
        master_menu_id: i.master_menu_id,
        quantity: i.quantity,
      })),
    );
    setDialogOpen(true);
  };

  const toggleMenuInSet = (menuId: string) => {
    setFormItems((prev) => {
      const exists = prev.find((i) => i.master_menu_id === menuId);
      if (exists) return prev.filter((i) => i.master_menu_id !== menuId);
      return [...prev, { master_menu_id: menuId, quantity: 1 }];
    });
  };

  const updateItemQuantity = (menuId: string, quantity: number) => {
    setFormItems((prev) =>
      prev.map((i) =>
        i.master_menu_id === menuId ? { ...i, quantity: Math.max(1, quantity) } : i,
      ),
    );
  };

  const handleSubmit = () => {
    if (!formName.trim() || !formCategoryId || !formPrice || formItems.length === 0) return;
    const price = parseInt(formPrice, 10);
    if (isNaN(price) || price < 0) return;
    const costPrice = formCostPrice ? parseInt(formCostPrice, 10) : null;

    const itemsPayload = formItems.map((item, idx) => ({
      master_menu_id: item.master_menu_id,
      quantity: item.quantity,
      sort_order: idx,
    }));

    if (editing) {
      const removeImage = !formImagePreview && !formImageFile && !!editing.image_url;
      updateSetMenu.mutate(
        {
          id: editing.id,
          name: formName.trim(),
          description: formDescription.trim() || null,
          price,
          cost_price: costPrice,
          category_id: formCategoryId,
          imageFile: formImageFile,
          removeImage,
          currentImageUrl: editing.image_url,
          items: itemsPayload,
        },
        { onSuccess: () => setDialogOpen(false) },
      );
    } else {
      if (!franchiseId) return;
      createSetMenu.mutate(
        {
          franchise_id: franchiseId,
          category_id: formCategoryId,
          name: formName.trim(),
          description: formDescription.trim() || null,
          price,
          cost_price: costPrice,
          imageFile: formImageFile,
          sort_order: setMenus.length,
          items: itemsPayload,
        },
        { onSuccess: () => setDialogOpen(false) },
      );
    }
  };

  const isPending = createSetMenu.isPending || updateSetMenu.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{"세트 메뉴"}</h1>
          <p className="text-muted-foreground text-sm">
            {"여러 메뉴를 묶은 세트 메뉴를 관리합니다."}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2" disabled={categories.length === 0 || masterMenus.length === 0}>
          <PlusIcon className="size-4" />
          {"세트 메뉴 추가"}
        </Button>
      </div>

      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="flex flex-row items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">
                {"전체"} ({setMenus.length})
              </TabsTrigger>
              {categories.map((cat) => {
                const count = setMenus.filter((m) => m.category_id === cat.id).length;
                if (count === 0) return null;
                return (
                  <TabsTrigger key={cat.id} value={cat.id}>
                    {cat.name} ({count})
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </CardHeader>
          <CardContent>
            {filteredSetMenus.length === 0 ? (
              <div className="text-center py-8">
                <PackageIcon className="size-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">
                  {"등록된 세트 메뉴가 없습니다."}
                </p>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={filteredSetMenus.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {filteredSetMenus.map((setMenu) => (
                      <SortableSetMenuCard
                        key={setMenu.id}
                        setMenu={setMenu}
                        categoryName={getCategoryName(setMenu.category_id)}
                        onEdit={() => openEdit(setMenu)}
                        onToggle={() => toggleActive.mutate({ id: setMenu.id, is_active: !setMenu.is_active })}
                        onDelete={() => deleteSetMenu.mutate(setMenu.id)}
                        togglePending={toggleActive.isPending}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Tabs>
      </Card>

      {/* Create/Edit Set Menu Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "세트 메뉴 수정" : "세트 메뉴 추가"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{"카테고리"}</Label>
              <Select
                value={formCategoryId}
                onValueChange={(v) => setFormCategoryId(v ?? "")}
              >
                <SelectTrigger>
                  <span className="flex flex-1 text-left truncate">
                    {formCategoryId
                      ? categories.find((c) => c.id === formCategoryId)?.name ?? "카테고리 선택"
                      : "카테고리 선택"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{"세트 이름"}</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="예: 점심 세트 A"
              />
            </div>
            <div className="space-y-2">
              <Label>{"설명"}</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="세트 메뉴 설명 (선택)"
                rows={2}
              />
            </div>

            {/* Menu selection */}
            <div className="space-y-2">
              <Label>{"구성 메뉴"}</Label>
              <div className="max-h-48 overflow-y-auto rounded border p-2 space-y-1">
                {categories.map((cat) => {
                  const catMenus = masterMenus.filter((m) => m.category_id === cat.id && m.is_active);
                  if (catMenus.length === 0) return null;
                  return (
                    <div key={cat.id} className="mb-2">
                      <p className="text-xs font-medium text-muted-foreground mb-1">{cat.name}</p>
                      {catMenus.map((menu) => {
                        const selected = formItems.find((i) => i.master_menu_id === menu.id);
                        return (
                          <div key={menu.id} className="flex items-center gap-2 py-0.5">
                            <label className="flex items-center gap-2 text-sm cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={!!selected}
                                onChange={() => toggleMenuInSet(menu.id)}
                                className="rounded"
                              />
                              <span className="truncate">{menu.name}</span>
                              <span className="ml-auto text-muted-foreground text-xs shrink-0">
                                {menu.price.toLocaleString("ko-KR")}{"원"}
                              </span>
                            </label>
                            {selected && (
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-xs text-muted-foreground">{"x"}</span>
                                <Input
                                  type="number"
                                  min="1"
                                  value={selected.quantity}
                                  onChange={(e) => updateItemQuantity(menu.id, parseInt(e.target.value, 10) || 1)}
                                  className="w-14 h-6 text-xs px-1"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              {formItems.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {"정가 합계: "}{originalPrice.toLocaleString("ko-KR")}{"원 ("}{formItems.length}{"개 메뉴)"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{"세트 판매가 (원)"}</Label>
              <Input
                type="number"
                min="0"
                step="100"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                placeholder="0"
              />
              {formPrice && originalPrice > 0 && (
                <p className="text-xs text-muted-foreground">
                  {"할인: "}{(originalPrice - parseInt(formPrice, 10)).toLocaleString("ko-KR")}{"원 ("}
                  {Math.round(((originalPrice - parseInt(formPrice, 10)) / originalPrice) * 100)}{"%"}
                  {")"}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{"원가 (원)"}</Label>
              <Input
                type="number"
                min="0"
                step="100"
                value={formCostPrice}
                onChange={(e) => setFormCostPrice(e.target.value)}
                placeholder="선택 입력"
              />
            </div>
            <div className="space-y-2">
              <Label>{"이미지"}</Label>
              <ImageUpload
                value={formImagePreview}
                onChange={(file) => {
                  setFormImageFile(file);
                  if (!file) setFormImagePreview(null);
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {"취소"}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isPending ||
                !formName.trim() ||
                !formCategoryId ||
                !formPrice ||
                formItems.length === 0
              }
            >
              {isPending ? "저장 중..." : editing ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reorder indicator */}
      {reorderSetMenus.isPending && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground shadow-lg">
          {"순서 저장 중..."}
        </div>
      )}
    </div>
  );
}

// ── Sortable Set Menu Card ──
interface SortableSetMenuCardProps {
  setMenu: SetMenuWithItems;
  categoryName: string;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  togglePending: boolean;
}

function SortableSetMenuCard({
  setMenu,
  categoryName,
  onEdit,
  onToggle,
  onDelete,
  togglePending,
}: SortableSetMenuCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: setMenu.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border p-3 bg-background ${!setMenu.is_active ? "opacity-60" : ""}`}
    >
      <button
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-5" />
      </button>
      {setMenu.image_url ? (
        <div className="size-14 shrink-0 overflow-hidden rounded-md">
          <img src={setMenu.image_url} alt={setMenu.name} className="size-full object-cover" />
        </div>
      ) : (
        <div className="size-14 shrink-0 rounded-md bg-muted flex items-center justify-center">
          <PackageIcon className="size-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{setMenu.name}</span>
          <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">
            {"세트"}
          </Badge>
          <Badge
            variant={setMenu.is_active ? "default" : "secondary"}
            className="shrink-0 text-[10px] px-1.5 py-0"
          >
            {setMenu.is_active ? "판매중" : "숨김"}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-sm font-bold">{setMenu.price.toLocaleString("ko-KR")}{"원"}</span>
          {setMenu.original_price > setMenu.price && (
            <span className="text-xs text-muted-foreground line-through">
              {setMenu.original_price.toLocaleString("ko-KR")}{"원"}
            </span>
          )}
          <span className="text-muted-foreground text-xs">{categoryName}</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {setMenu.items.map((item) => (
            <Badge key={item.id} variant="outline" className="text-[10px]">
              {item.menu_name}{item.quantity > 1 ? ` x${item.quantity}` : ""}
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="xs" onClick={onEdit} className="gap-1">
          <PencilIcon className="size-3" />
          {"수정"}
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={onToggle}
          disabled={togglePending}
          className="gap-1"
        >
          <PowerIcon className="size-3" />
          {setMenu.is_active ? "숨기기" : "보이기"}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger
            render={<Button variant="ghost" size="xs" className="gap-1 text-destructive" />}
          >
            <TrashIcon className="size-3" />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{"세트 메뉴 삭제"}</AlertDialogTitle>
              <AlertDialogDescription>
                {`"${setMenu.name}" 세트 메뉴를 삭제하시겠습니까?`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{"취소"}</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>
                {"삭제"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
