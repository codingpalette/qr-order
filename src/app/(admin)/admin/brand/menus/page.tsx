"use client";

import { useState } from "react";
import { useAuth } from "@/shared/providers/auth-provider";
import { useMenuCategories } from "@/entities/menu/api/useMenuCategories";
import { useMasterMenus } from "@/entities/menu/api/useMasterMenus";
import {
  useCreateMenuCategory,
  useUpdateMenuCategory,
  useDeleteMenuCategory,
  useCreateMasterMenu,
  useUpdateMasterMenu,
  useDeleteMasterMenu,
  useToggleMasterMenuActive,
  useReorderMasterMenus,
  useBulkUpdateMasterMenuPrices,
} from "@/features/menu-management";
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
  CardTitle,
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
  TabsContent,
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
  UtensilsIcon,
  TagIcon,
  GripVertical,
  DollarSignIcon,
  Sparkles,
  Loader2,
} from "lucide-react";
import type { MasterMenu, MenuCategory } from "@/entities/menu/model/types";

// ── Category Form ──
interface CategoryFormData {
  name: string;
}

// ── Menu Form ──
interface MenuFormData {
  name: string;
  description: string;
  price: string;
  cost_price: string;
  category_id: string;
}

const emptyMenuForm: MenuFormData = {
  name: "",
  description: "",
  price: "",
  cost_price: "",
  category_id: "",
};

export default function BrandMenusPage() {
  const { user } = useAuth();
  const franchiseId = user?.franchise_id ?? null;
  const { data: categories = [] } = useMenuCategories(franchiseId);
  const { data: allMenus = [] } = useMasterMenus(franchiseId);

  // Category mutations
  const createCategory = useCreateMenuCategory();
  const updateCategory = useUpdateMenuCategory();
  const deleteCategory = useDeleteMenuCategory();

  // Menu mutations
  const createMenu = useCreateMasterMenu();
  const updateMenu = useUpdateMasterMenu();
  const deleteMenu = useDeleteMasterMenu();
  const toggleMenuActive = useToggleMasterMenuActive();
  const reorderMenus = useReorderMasterMenus();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredMenus.findIndex((m) => m.id === active.id);
    const newIndex = filteredMenus.findIndex((m) => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(filteredMenus, oldIndex, newIndex);
    const updates = reordered.map((item, index) => ({
      id: item.id,
      sort_order: index,
    }));
    reorderMenus.mutate(updates);
  };

  // Category dialog
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<MenuCategory | null>(null);
  const [catForm, setCatForm] = useState<CategoryFormData>({ name: "" });

  // Menu dialog
  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MasterMenu | null>(null);
  const [menuForm, setMenuForm] = useState<MenuFormData>(emptyMenuForm);
  const [menuImageFile, setMenuImageFile] = useState<File | null>(null);
  const [menuImagePreview, setMenuImagePreview] = useState<string | null>(null);

  // Bulk price change
  const bulkUpdatePrices = useBulkUpdateMasterMenuPrices();
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkDirection, setBulkDirection] = useState<"increase" | "decrease">("increase");
  const [bulkMode, setBulkMode] = useState<"percent" | "amount">("percent");
  const [bulkValue, setBulkValue] = useState("");
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(new Set());

  // Active tab (category)
  const [activeTab, setActiveTab] = useState<string>("all");

  // ── Category handlers ──
  const openCreateCategory = () => {
    setEditingCat(null);
    setCatForm({ name: "" });
    setCatDialogOpen(true);
  };

  const openEditCategory = (cat: MenuCategory) => {
    setEditingCat(cat);
    setCatForm({ name: cat.name });
    setCatDialogOpen(true);
  };

  const handleCategorySubmit = () => {
    if (!catForm.name.trim()) return;
    if (editingCat) {
      updateCategory.mutate(
        { id: editingCat.id, name: catForm.name.trim() },
        { onSuccess: () => setCatDialogOpen(false) },
      );
    } else {
      if (!franchiseId) return;
      createCategory.mutate(
        {
          franchise_id: franchiseId,
          name: catForm.name.trim(),
          sort_order: categories.length,
        },
        { onSuccess: () => setCatDialogOpen(false) },
      );
    }
  };

  const handleDeleteCategory = (id: string) => {
    deleteCategory.mutate(id);
  };

  // ── Menu handlers ──
  const openCreateMenu = () => {
    setEditingMenu(null);
    setMenuForm({
      ...emptyMenuForm,
      category_id: activeTab !== "all" ? activeTab : (categories[0]?.id ?? ""),
    });
    setMenuImageFile(null);
    setMenuImagePreview(null);
    setMenuDialogOpen(true);
  };

  const openEditMenu = (menu: MasterMenu) => {
    setEditingMenu(menu);
    setMenuForm({
      name: menu.name,
      description: menu.description ?? "",
      price: String(menu.price),
      cost_price: menu.cost_price != null ? String(menu.cost_price) : "",
      category_id: menu.category_id,
    });
    setMenuImageFile(null);
    setMenuImagePreview(menu.image_url);
    setMenuDialogOpen(true);
  };

  const handleMenuSubmit = () => {
    if (!menuForm.name.trim() || !menuForm.category_id || !menuForm.price) return;
    const price = parseInt(menuForm.price, 10);
    if (isNaN(price) || price < 0) return;
    const costPrice = menuForm.cost_price ? parseInt(menuForm.cost_price, 10) : null;

    if (editingMenu) {
      const removeImage = !menuImagePreview && !menuImageFile && !!editingMenu.image_url;
      updateMenu.mutate(
        {
          id: editingMenu.id,
          name: menuForm.name.trim(),
          description: menuForm.description.trim() || null,
          price,
          cost_price: costPrice,
          category_id: menuForm.category_id,
          imageFile: menuImageFile,
          removeImage,
          currentImageUrl: editingMenu.image_url,
        },
        { onSuccess: () => setMenuDialogOpen(false) },
      );
    } else {
      if (!franchiseId) return;
      createMenu.mutate(
        {
          franchise_id: franchiseId,
          category_id: menuForm.category_id,
          name: menuForm.name.trim(),
          description: menuForm.description.trim() || null,
          price,
          cost_price: costPrice,
          imageFile: menuImageFile,
          sort_order: filteredMenus.length,
        },
        { onSuccess: () => setMenuDialogOpen(false) },
      );
    }
  };

  const handleDeleteMenu = (id: string) => {
    deleteMenu.mutate(id);
  };

  const handleToggleMenu = (menu: MasterMenu) => {
    toggleMenuActive.mutate({ id: menu.id, is_active: !menu.is_active });
  };

  // Filter menus by active tab
  const filteredMenus =
    activeTab === "all"
      ? allMenus
      : allMenus.filter((m) => m.category_id === activeTab);

  const getCategoryName = (categoryId: string) =>
    categories.find((c) => c.id === categoryId)?.name ?? "-";

  // AI description
  const [aiDescLoading, setAiDescLoading] = useState(false);

  const generateAIDescription = async () => {
    if (!menuForm.name.trim()) return;
    setAiDescLoading(true);
    try {
      const categoryName =
        categories.find((c) => c.id === menuForm.category_id)?.name ?? "";
      const res = await fetch("/api/ai/menu-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: menuForm.name.trim(),
          categoryName,
          price: menuForm.price ? parseInt(menuForm.price, 10) : undefined,
          costPrice: menuForm.cost_price ? parseInt(menuForm.cost_price, 10) : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.description) {
          setMenuForm((f) => ({ ...f, description: data.description }));
        }
      }
    } catch {
      // silently fail
    } finally {
      setAiDescLoading(false);
    }
  };

  const isCatPending = createCategory.isPending || updateCategory.isPending;
  const isMenuPending = createMenu.isPending || updateMenu.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{"메뉴 관리"}</h1>
          <p className="text-muted-foreground text-sm">
            {"프랜차이즈 공통 메뉴를 관리합니다."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={openCreateCategory} className="gap-2">
            <TagIcon className="size-4" />
            {"카테고리 추가"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setBulkSelectedIds(new Set(filteredMenus.map((m) => m.id)));
              setBulkValue("");
              setBulkDirection("increase");
              setBulkMode("percent");
              setBulkDialogOpen(true);
            }}
            className="gap-2"
            disabled={allMenus.length === 0}
          >
            <DollarSignIcon className="size-4" />
            {"일괄 가격 변경"}
          </Button>
          <Button onClick={openCreateMenu} className="gap-2" disabled={categories.length === 0}>
            <PlusIcon className="size-4" />
            {"메뉴 추가"}
          </Button>
        </div>
      </div>

      {/* Category Management */}
      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{"카테고리"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const count = allMenus.filter((m) => m.category_id === cat.id).length;
                return (
                  <div
                    key={cat.id}
                    className="flex items-center gap-1 rounded-lg border px-3 py-1.5"
                  >
                    <span className="text-sm font-medium">{cat.name}</span>
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {count}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="ml-1 size-5"
                      onClick={() => openEditCategory(cat)}
                    >
                      <PencilIcon className="size-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={<Button variant="ghost" size="icon-xs" className="size-5" />}
                      >
                        <TrashIcon className="size-3" />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{"카테고리 삭제"}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {`"${cat.name}" 카테고리를 삭제하시겠습니까? 이 카테고리에 속한 메뉴도 함께 삭제됩니다.`}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{"취소"}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteCategory(cat.id)}>
                            {"삭제"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Menu List */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <TagIcon className="size-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1">{"카테고리를 먼저 만들어주세요"}</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {"메뉴를 추가하려면 최소 1개의 카테고리가 필요합니다."}
              </p>
              <Button onClick={openCreateCategory} className="gap-2">
                <TagIcon className="size-4" />
                {"카테고리 추가"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="flex flex-row items-center justify-between">
              <TabsList>
                <TabsTrigger value="all">
                  {"전체"} ({allMenus.length})
                </TabsTrigger>
                {categories.map((cat) => (
                  <TabsTrigger key={cat.id} value={cat.id}>
                    {cat.name} ({allMenus.filter((m) => m.category_id === cat.id).length})
                  </TabsTrigger>
                ))}
              </TabsList>
            </CardHeader>
            <CardContent>
              {filteredMenus.length === 0 ? (
                <div className="text-center py-8">
                  <UtensilsIcon className="size-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">
                    {"등록된 메뉴가 없습니다."}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 gap-2"
                    onClick={openCreateMenu}
                  >
                    <PlusIcon className="size-4" />
                    {"메뉴 추가"}
                  </Button>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={filteredMenus.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {filteredMenus.map((menu) => (
                        <SortableMenuCard
                          key={menu.id}
                          menu={menu}
                          categoryName={getCategoryName(menu.category_id)}
                          onEdit={() => openEditMenu(menu)}
                          onToggle={() => handleToggleMenu(menu)}
                          onDelete={() => handleDeleteMenu(menu.id)}
                          togglePending={toggleMenuActive.isPending}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Tabs>
        </Card>
      )}

      {/* Category Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCat ? "카테고리 수정" : "카테고리 추가"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{"카테고리 이름"}</Label>
              <Input
                value={catForm.name}
                onChange={(e) => setCatForm({ name: e.target.value })}
                placeholder="예: 메인메뉴, 사이드, 음료"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialogOpen(false)}>
              {"취소"}
            </Button>
            <Button onClick={handleCategorySubmit} disabled={isCatPending || !catForm.name.trim()}>
              {isCatPending ? "저장중..." : editingCat ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reorder indicator */}
      {reorderMenus.isPending && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground shadow-lg">
          {"순서 저장 중..."}
        </div>
      )}

      {/* Bulk Price Change Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{"일괄 가격 변경"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Tabs value={bulkDirection} onValueChange={(v) => setBulkDirection(v as "increase" | "decrease")}>
              <TabsList className="w-full">
                <TabsTrigger value="increase" className="flex-1">{"인상"}</TabsTrigger>
                <TabsTrigger value="decrease" className="flex-1">{"인하"}</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs value={bulkMode} onValueChange={(v) => setBulkMode(v as "percent" | "amount")}>
              <TabsList className="w-full">
                <TabsTrigger value="percent" className="flex-1">{"비율 (%)"}</TabsTrigger>
                <TabsTrigger value="amount" className="flex-1">{"금액 (원)"}</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="space-y-2">
              <Label>{bulkMode === "percent" ? "비율 (%)" : "금액 (원)"}</Label>
              <Input
                type="number"
                min="0"
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                placeholder={bulkMode === "percent" ? "예: 10" : "예: 1000"}
              />
            </div>

            {/* Menu checkbox list */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{"대상 메뉴"}</Label>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    if (bulkSelectedIds.size === filteredMenus.length) {
                      setBulkSelectedIds(new Set());
                    } else {
                      setBulkSelectedIds(new Set(filteredMenus.map((m) => m.id)));
                    }
                  }}
                >
                  {bulkSelectedIds.size === filteredMenus.length ? "전체 해제" : "전체 선택"}
                </Button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1 rounded border p-2">
                {filteredMenus.map((menu) => (
                  <label key={menu.id} className="flex items-center gap-2 text-sm cursor-pointer py-0.5">
                    <input
                      type="checkbox"
                      checked={bulkSelectedIds.has(menu.id)}
                      onChange={() => {
                        setBulkSelectedIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(menu.id)) next.delete(menu.id);
                          else next.add(menu.id);
                          return next;
                        });
                      }}
                      className="rounded"
                    />
                    <span className="truncate">{menu.name}</span>
                    <span className="ml-auto text-muted-foreground shrink-0">
                      {menu.price.toLocaleString("ko-KR")}{"원"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Preview table */}
            {bulkValue && Number(bulkValue) > 0 && bulkSelectedIds.size > 0 && (
              <div className="space-y-2">
                <Label>{"미리보기"}</Label>
                <div className="max-h-48 overflow-y-auto rounded border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left py-1.5 px-2">{"메뉴명"}</th>
                        <th className="text-right py-1.5 px-2">{"현재가"}</th>
                        <th className="text-right py-1.5 px-2">{"변경가"}</th>
                        <th className="text-right py-1.5 px-2">{"차액"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMenus
                        .filter((m) => bulkSelectedIds.has(m.id))
                        .map((menu) => {
                          const val = Number(bulkValue);
                          let newPrice: number;
                          if (bulkMode === "percent") {
                            const delta = menu.price * (val / 100);
                            newPrice = bulkDirection === "increase"
                              ? menu.price + delta
                              : menu.price - delta;
                          } else {
                            newPrice = bulkDirection === "increase"
                              ? menu.price + val
                              : menu.price - val;
                          }
                          newPrice = Math.max(0, Math.round(newPrice / 100) * 100);
                          const diff = newPrice - menu.price;
                          return (
                            <tr key={menu.id} className="border-b last:border-0">
                              <td className="py-1.5 px-2 truncate max-w-[120px]">{menu.name}</td>
                              <td className="py-1.5 px-2 text-right">{menu.price.toLocaleString("ko-KR")}</td>
                              <td className="py-1.5 px-2 text-right font-medium">{newPrice.toLocaleString("ko-KR")}</td>
                              <td className={`py-1.5 px-2 text-right ${diff > 0 ? "text-red-600" : diff < 0 ? "text-blue-600" : ""}`}>
                                {diff > 0 ? "+" : ""}{diff.toLocaleString("ko-KR")}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
              {"취소"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    disabled={
                      !bulkValue ||
                      Number(bulkValue) <= 0 ||
                      bulkSelectedIds.size === 0 ||
                      bulkUpdatePrices.isPending
                    }
                  />
                }
              >
                {bulkUpdatePrices.isPending ? "적용 중..." : `${bulkSelectedIds.size}개 메뉴 가격 변경`}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{"가격 변경 확인"}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {`${bulkSelectedIds.size}개 메뉴의 가격을 변경하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{"취소"}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      const val = Number(bulkValue);
                      const updates = filteredMenus
                        .filter((m) => bulkSelectedIds.has(m.id))
                        .map((menu) => {
                          let newPrice: number;
                          if (bulkMode === "percent") {
                            const delta = menu.price * (val / 100);
                            newPrice = bulkDirection === "increase"
                              ? menu.price + delta
                              : menu.price - delta;
                          } else {
                            newPrice = bulkDirection === "increase"
                              ? menu.price + val
                              : menu.price - val;
                          }
                          newPrice = Math.max(0, Math.round(newPrice / 100) * 100);
                          return { id: menu.id, newPrice };
                        });
                      bulkUpdatePrices.mutate(updates, {
                        onSuccess: () => setBulkDialogOpen(false),
                      });
                    }}
                  >
                    {"변경"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Menu Dialog */}
      <Dialog open={menuDialogOpen} onOpenChange={setMenuDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMenu ? "메뉴 수정" : "메뉴 추가"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{"카테고리"}</Label>
              <Select
                value={menuForm.category_id}
                onValueChange={(v) => setMenuForm((f) => ({ ...f, category_id: v ?? "" }))}
              >
                <SelectTrigger>
                  <span className="flex flex-1 text-left truncate">
                    {menuForm.category_id
                      ? categories.find((c) => c.id === menuForm.category_id)?.name ?? "카테고리 선택"
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
              <Label>{"메뉴 이름"}</Label>
              <Input
                value={menuForm.name}
                onChange={(e) => setMenuForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="메뉴 이름을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{"설명"}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="gap-1 text-violet-600 hover:text-violet-700"
                  onClick={generateAIDescription}
                  disabled={aiDescLoading || !menuForm.name.trim()}
                >
                  {aiDescLoading ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Sparkles className="size-3" />
                  )}
                  {aiDescLoading ? "생성 중..." : "AI로 생성"}
                </Button>
              </div>
              <Textarea
                value={menuForm.description}
                onChange={(e) =>
                  setMenuForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="메뉴 설명을 입력하세요 (선택)"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>{"가격 (원)"}</Label>
              <Input
                type="number"
                min="0"
                step="100"
                value={menuForm.price}
                onChange={(e) => setMenuForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>{"원가 (원)"}</Label>
              <Input
                type="number"
                min="0"
                step="100"
                value={menuForm.cost_price}
                onChange={(e) => setMenuForm((f) => ({ ...f, cost_price: e.target.value }))}
                placeholder="선택 입력"
              />
              {menuForm.price && menuForm.cost_price && (() => {
                const p = parseInt(menuForm.price, 10);
                const c = parseInt(menuForm.cost_price, 10);
                if (isNaN(p) || isNaN(c) || p <= 0) return null;
                const margin = p - c;
                const marginRate = Math.round((margin / p) * 100);
                return (
                  <p className="text-xs text-muted-foreground">
                    {"마진: "}{margin.toLocaleString("ko-KR")}{"원 ("}{marginRate}{"%"}
                    {")"}
                  </p>
                );
              })()}
            </div>
            <div className="space-y-2">
              <Label>{"메뉴 이미지"}</Label>
              <ImageUpload
                value={menuImagePreview}
                onChange={(file) => {
                  setMenuImageFile(file);
                  if (!file) setMenuImagePreview(null);
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMenuDialogOpen(false)}>
              {"취소"}
            </Button>
            <Button
              onClick={handleMenuSubmit}
              disabled={
                isMenuPending ||
                !menuForm.name.trim() ||
                !menuForm.category_id ||
                !menuForm.price
              }
            >
              {isMenuPending ? "저장중..." : editingMenu ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Sortable Menu Row ──
interface SortableMenuCardProps {
  menu: MasterMenu;
  categoryName: string;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  togglePending: boolean;
}

function SortableMenuCard({
  menu,
  categoryName,
  onEdit,
  onToggle,
  onDelete,
  togglePending,
}: SortableMenuCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: menu.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border p-3 bg-background ${!menu.is_active ? "opacity-60" : ""}`}
    >
      <button
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-5" />
      </button>
      {menu.image_url ? (
        <div className="size-14 shrink-0 overflow-hidden rounded-md">
          <img src={menu.image_url} alt={menu.name} className="size-full object-cover" />
        </div>
      ) : (
        <div className="size-14 shrink-0 rounded-md bg-muted flex items-center justify-center">
          <UtensilsIcon className="size-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{menu.name}</span>
          <Badge
            variant={menu.is_active ? "default" : "secondary"}
            className="shrink-0 text-[10px] px-1.5 py-0"
          >
            {menu.is_active ? "판매중" : "숨김"}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-sm font-bold">{menu.price.toLocaleString("ko-KR")}{"원"}</span>
          <span className="text-muted-foreground text-xs">{categoryName}</span>
          {menu.cost_price != null && menu.price > 0 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {"마진 "}{Math.round(((menu.price - menu.cost_price) / menu.price) * 100)}{"%"}
            </Badge>
          )}
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
          {menu.is_active ? "숨기기" : "보이기"}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger
            render={<Button variant="ghost" size="xs" className="gap-1 text-destructive" />}
          >
            <TrashIcon className="size-3" />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{"메뉴 삭제"}</AlertDialogTitle>
              <AlertDialogDescription>
                {`"${menu.name}" 메뉴를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
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
