"use client";

import { useState } from "react";
import { useAuth } from "@/shared/providers/auth-provider";
import { useMasterMenus } from "@/entities/menu/api/useMasterMenus";
import { useMenuCategories } from "@/entities/menu/api/useMenuCategories";
import { useSetMenus } from "@/entities/menu/api/useSetMenus";
import { useLocalMenus } from "@/entities/order/api/useLocalMenus";
import { useStoreMenuOverrides } from "@/entities/order/api/useStoreMenuOverrides";
import { useMenuStock } from "@/entities/menu/api/useMenuStock";
import {
  useCreateLocalMenu,
  useUpdateLocalMenu,
  useDeleteLocalMenu,
  useToggleLocalMenuActive,
  useUpsertMenuOverride,
  useReorderMasterMenuOverrides,
  useReorderLocalMenus,
} from "@/features/local-menu-management";
import { useToggleSetMenuActive } from "@/features/set-menu-management";
import { useUpsertMenuStock, useDeleteMenuStock } from "@/features/inventory-management";
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Label,
  Textarea,
  ImageUpload,
} from "@/shared/ui";
import {
  UtensilsIcon,
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  EyeOffIcon,
  EyeIcon,
  BanIcon,
  CheckCircleIcon,
  GripVertical,
  PackageIcon,
} from "lucide-react";
import type { MasterMenu, LocalMenu, MenuCategory, SetMenuWithItems } from "@/entities/menu/model/types";
import type { StoreMenuOverride } from "@/entities/order/model/types";

interface CombinedMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  menuType: "master" | "local" | "set";
  sortOrder: number;
  isActive: boolean;
  isSoldOut: boolean;
  isHidden: boolean;
  categoryName: string;
  original: MasterMenu | LocalMenu | SetMenuWithItems;
}

export default function StoreMenusPage() {
  const { user } = useAuth();
  const storeId = user?.store_id ?? null;
  const franchiseId = user?.franchise_id ?? null;

  const { data: categories = [] } = useMenuCategories(franchiseId);
  const { data: masterMenus = [] } = useMasterMenus(franchiseId);
  const { data: localMenus = [] } = useLocalMenus(storeId);
  const { data: overrides = [] } = useStoreMenuOverrides(storeId);
  const { data: stockList = [] } = useMenuStock(storeId);
  const { data: setMenus = [] } = useSetMenus(franchiseId);
  const toggleSetMenuActive = useToggleSetMenuActive();
  const activeSetMenus = setMenus.filter((m) => m.is_active);

  const upsertOverride = useUpsertMenuOverride();
  const upsertStock = useUpsertMenuStock();
  const removeStock = useDeleteMenuStock();

  const getStock = (menuType: "master" | "local", menuId: string) =>
    stockList.find((s) => s.menu_type === menuType && s.menu_id === menuId);

  const createLocal = useCreateLocalMenu();
  const updateLocal = useUpdateLocalMenu();
  const deleteLocal = useDeleteLocalMenu();
  const toggleActive = useToggleLocalMenuActive();
  const reorderMasterOverrides = useReorderMasterMenuOverrides();
  const reorderLocal = useReorderLocalMenus();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const [activeTab, setActiveTab] = useState("all");
  const [localDialogOpen, setLocalDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LocalMenu | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LocalMenu | null>(null);

  // Local menu form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formRemoveImage, setFormRemoveImage] = useState(false);

  // Stock dialog state
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [stockTarget, setStockTarget] = useState<{ menuType: "master" | "local"; menuId: string; name: string } | null>(null);
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockThreshold, setStockThreshold] = useState("5");
  const [stockUnlimited, setStockUnlimited] = useState(false);

  const openStockDialog = (menuType: "master" | "local", menuId: string, name: string) => {
    const existing = getStock(menuType, menuId);
    setStockTarget({ menuType, menuId, name });
    if (existing) {
      setStockUnlimited(existing.stock_quantity === -1);
      setStockQuantity(existing.stock_quantity === -1 ? "" : String(existing.stock_quantity));
      setStockThreshold(String(existing.low_stock_threshold));
    } else {
      setStockUnlimited(true);
      setStockQuantity("");
      setStockThreshold("5");
    }
    setStockDialogOpen(true);
  };

  const handleSaveStock = () => {
    if (!storeId || !stockTarget) return;
    const existing = getStock(stockTarget.menuType, stockTarget.menuId);
    if (stockUnlimited && existing) {
      removeStock.mutate(existing.id, { onSuccess: () => setStockDialogOpen(false) });
    } else if (!stockUnlimited) {
      const qty = parseInt(stockQuantity, 10);
      if (isNaN(qty) || qty < 0) return;
      upsertStock.mutate(
        {
          store_id: storeId,
          menu_type: stockTarget.menuType,
          menu_id: stockTarget.menuId,
          stock_quantity: qty,
          low_stock_threshold: parseInt(stockThreshold, 10) || 5,
        },
        { onSuccess: () => setStockDialogOpen(false) },
      );
    } else {
      setStockDialogOpen(false);
    }
  };

  const getOverride = (menuId: string) =>
    overrides.find((o) => o.master_menu_id === menuId);

  const getCategoryName = (categoryId: string) =>
    categories.find((c) => c.id === categoryId)?.name ?? "";

  // Flat sorted lists for DnD
  const activeMasterMenus = masterMenus.filter((m) => m.is_active);

  // Combined menu list (same order as customer sees)
  const combinedMenus: CombinedMenuItem[] = [
    ...activeMasterMenus
      .filter((m) => {
        const override = getOverride(m.id);
        return !(override?.is_hidden ?? false);
      })
      .map((m) => {
        const override = getOverride(m.id);
        return {
          id: m.id,
          name: m.name,
          description: m.description,
          price: m.price,
          imageUrl: m.image_url,
          menuType: "master" as const,
          sortOrder: override?.sort_order ?? m.sort_order,
          isActive: m.is_active,
          isSoldOut: override?.is_sold_out ?? false,
          isHidden: false,
          categoryName: getCategoryName(m.category_id),
          original: m,
        };
      }),
    ...localMenus.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      price: m.price,
      imageUrl: m.image_url,
      menuType: "local" as const,
      sortOrder: m.sort_order,
      isActive: m.is_active,
      isSoldOut: !m.is_active,
      isHidden: false,
      categoryName: getCategoryName(m.category_id),
      original: m,
    })),
    ...activeSetMenus.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      price: m.price,
      imageUrl: m.image_url,
      menuType: "set" as const,
      sortOrder: m.sort_order,
      isActive: m.is_active,
      isSoldOut: false,
      isHidden: false,
      categoryName: getCategoryName(m.category_id),
      original: m,
    })),
  ].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleCombinedDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = combinedMenus.findIndex((m) => m.id === active.id);
    const newIndex = combinedMenus.findIndex((m) => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(combinedMenus, oldIndex, newIndex);
    const masterOverrideUpdates: { master_menu_id: string; sort_order: number }[] = [];
    const localUpdates: { id: string; sort_order: number }[] = [];

    reordered.forEach((item, i) => {
      if (item.menuType === "master") {
        masterOverrideUpdates.push({ master_menu_id: item.id, sort_order: i });
      } else if (item.menuType === "local") {
        localUpdates.push({ id: item.id, sort_order: i });
      }
      // set menus: 순서는 본사에서 관리하므로 무시
    });

    if (masterOverrideUpdates.length > 0 && storeId) {
      reorderMasterOverrides.mutate({ store_id: storeId, items: masterOverrideUpdates });
    }
    if (localUpdates.length > 0) reorderLocal.mutate(localUpdates);
  };

  const handleToggleSoldOut = (menu: MasterMenu) => {
    if (!storeId) return;
    const current = getOverride(menu.id);
    upsertOverride.mutate({
      store_id: storeId,
      master_menu_id: menu.id,
      is_sold_out: !(current?.is_sold_out ?? false),
      is_hidden: current?.is_hidden ?? false,
    });
  };

  const handleToggleHidden = (menu: MasterMenu) => {
    if (!storeId) return;
    const current = getOverride(menu.id);
    upsertOverride.mutate({
      store_id: storeId,
      master_menu_id: menu.id,
      is_sold_out: current?.is_sold_out ?? false,
      is_hidden: !(current?.is_hidden ?? false),
    });
  };

  const openCreateDialog = () => {
    setEditTarget(null);
    setFormName("");
    setFormDescription("");
    setFormPrice("");
    setFormCategoryId(categories[0]?.id ?? "");
    setFormImageFile(null);
    setFormRemoveImage(false);
    setLocalDialogOpen(true);
  };

  const openEditDialog = (menu: LocalMenu) => {
    setEditTarget(menu);
    setFormName(menu.name);
    setFormDescription(menu.description ?? "");
    setFormPrice(String(menu.price));
    setFormCategoryId(menu.category_id);
    setFormImageFile(null);
    setFormRemoveImage(false);
    setLocalDialogOpen(true);
  };

  const handleSaveLocal = () => {
    if (!storeId) return;
    const price = Number(formPrice);
    if (!formName.trim() || !formCategoryId || isNaN(price) || price <= 0) return;

    if (editTarget) {
      updateLocal.mutate(
        {
          id: editTarget.id,
          name: formName.trim(),
          description: formDescription.trim() || null,
          price,
          category_id: formCategoryId,
          imageFile: formImageFile,
          removeImage: formRemoveImage,
          currentImageUrl: editTarget.image_url,
        },
        { onSuccess: () => setLocalDialogOpen(false) },
      );
    } else {
      createLocal.mutate(
        {
          store_id: storeId,
          name: formName.trim(),
          description: formDescription.trim() || null,
          price,
          category_id: formCategoryId,
          imageFile: formImageFile,
        },
        { onSuccess: () => setLocalDialogOpen(false) },
      );
    }
  };

  const handleDeleteLocal = () => {
    if (!deleteTarget) return;
    deleteLocal.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const handleMasterDragEnd = (event: DragEndEvent) => {
    if (!storeId) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = activeMasterMenus.findIndex((m) => m.id === active.id);
    const newIndex = activeMasterMenus.findIndex((m) => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(activeMasterMenus, oldIndex, newIndex);
    reorderMasterOverrides.mutate({
      store_id: storeId,
      items: reordered.map((item, i) => ({ master_menu_id: item.id, sort_order: i })),
    });
  };

  const handleLocalDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localMenus.findIndex((m) => m.id === active.id);
    const newIndex = localMenus.findIndex((m) => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(localMenus, oldIndex, newIndex);
    reorderLocal.mutate(reordered.map((item, i) => ({ id: item.id, sort_order: i })));
  };

  const isReordering = reorderMasterOverrides.isPending || reorderLocal.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{"메뉴 관리"}</h1>
        <p className="text-muted-foreground text-sm">
          {"본사 메뉴 상태 관리 및 자체 메뉴를 관리합니다."}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            {"전체"} ({combinedMenus.length})
          </TabsTrigger>
          <TabsTrigger value="master">
            {"본사 메뉴"} ({activeMasterMenus.length})
          </TabsTrigger>
          <TabsTrigger value="local">
            {"자체 메뉴"} ({localMenus.length})
          </TabsTrigger>
          <TabsTrigger value="set">
            {"세트 메뉴"} ({activeSetMenus.length})
          </TabsTrigger>
        </TabsList>

        {/* Combined All Menus Tab */}
        <TabsContent value="all" className="mt-4">
          <p className="text-muted-foreground text-xs mb-3">
            {"드래그하여 고객에게 보이는 메뉴 순서를 변경할 수 있습니다."}
          </p>
          {combinedMenus.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <UtensilsIcon className="size-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">{"메뉴가 없습니다"}</h3>
                  <p className="text-muted-foreground text-sm">
                    {"본사 메뉴 또는 자체 메뉴를 추가해주세요."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCombinedDragEnd}>
              <SortableContext items={combinedMenus.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {combinedMenus.map((menu) => (
                    <SortableCombinedCard key={menu.id} menu={menu} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </TabsContent>

        {/* Master Menus Tab */}
        <TabsContent value="master" className="mt-4">
          {activeMasterMenus.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <UtensilsIcon className="size-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">{"본사 메뉴가 없습니다"}</h3>
                  <p className="text-muted-foreground text-sm">
                    {"본사에서 메뉴를 등록하면 여기에 표시됩니다."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleMasterDragEnd}>
              <SortableContext items={activeMasterMenus.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {activeMasterMenus.map((menu) => {
                    const override = getOverride(menu.id);
                    const isSoldOut = override?.is_sold_out ?? false;
                    const isHidden = override?.is_hidden ?? false;
                    return (
                      <SortableMasterCard
                        key={menu.id}
                        menu={menu}
                        isSoldOut={isSoldOut}
                        isHidden={isHidden}
                        onToggleSoldOut={() => handleToggleSoldOut(menu)}
                        onToggleHidden={() => handleToggleHidden(menu)}
                        overridePending={upsertOverride.isPending}
                        stock={getStock("master", menu.id)}
                        onStockClick={() => openStockDialog("master", menu.id, menu.name)}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </TabsContent>

        {/* Local Menus Tab */}
        <TabsContent value="local" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button className="gap-1" onClick={openCreateDialog}>
              <PlusIcon className="size-4" />
              {"자체 메뉴 추가"}
            </Button>
          </div>

          {localMenus.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <UtensilsIcon className="size-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">{"자체 메뉴가 없습니다"}</h3>
                  <p className="text-muted-foreground text-sm">
                    {"매장만의 메뉴를 추가해보세요."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLocalDragEnd}>
              <SortableContext items={localMenus.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {localMenus.map((menu) => (
                    <SortableLocalCard
                      key={menu.id}
                      menu={menu}
                      onEdit={() => openEditDialog(menu)}
                      onToggle={() =>
                        toggleActive.mutate({ id: menu.id, is_active: !menu.is_active })
                      }
                      onDelete={() => setDeleteTarget(menu)}
                      togglePending={toggleActive.isPending}
                      stock={getStock("local", menu.id)}
                      onStockClick={() => openStockDialog("local", menu.id, menu.name)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </TabsContent>

        {/* Set Menus Tab */}
        <TabsContent value="set" className="mt-4">
          {activeSetMenus.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <UtensilsIcon className="size-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">{"세트 메뉴가 없습니다"}</h3>
                  <p className="text-muted-foreground text-sm">
                    {"본사에서 세트 메뉴를 등록하면 여기에 표시됩니다."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {activeSetMenus.map((menu) => (
                <Card key={menu.id}>
                  <div className="flex items-center gap-3 p-3">
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
                        <Badge variant="default" className="shrink-0 text-[10px] px-1.5 py-0">{"세트"}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-bold">{menu.price.toLocaleString("ko-KR")}{"원"}</span>
                        {menu.original_price > menu.price && (
                          <span className="text-muted-foreground text-xs line-through">
                            {menu.original_price.toLocaleString("ko-KR")}{"원"}
                          </span>
                        )}
                      </div>
                      {menu.items.length > 0 && (
                        <p className="text-muted-foreground text-xs mt-1 truncate">
                          {menu.items.map((item) => `${item.menu_name}${item.quantity > 1 ? ` x${item.quantity}` : ""}`).join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant={menu.is_active ? "outline" : "default"}
                        size="xs"
                        className="gap-1"
                        onClick={() =>
                          toggleSetMenuActive.mutate({ id: menu.id, is_active: !menu.is_active })
                        }
                        disabled={toggleSetMenuActive.isPending}
                      >
                        {menu.is_active ? <EyeOffIcon className="size-3" /> : <EyeIcon className="size-3" />}
                        {menu.is_active ? "비활성" : "활성"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reorder indicator */}
      {isReordering && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground shadow-lg">
          {"순서 저장 중..."}
        </div>
      )}

      {/* Create/Edit Local Menu Dialog */}
      <Dialog open={localDialogOpen} onOpenChange={setLocalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "자체 메뉴 수정" : "자체 메뉴 추가"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{"카테고리"}</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={formCategoryId === cat.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormCategoryId(cat.id)}
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{"메뉴 이름"}</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="메뉴 이름을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label>{"설명 (선택)"}</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="메뉴 설명을 입력하세요"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>{"가격 (원)"}</Label>
              <Input
                type="number"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>{"이미지 (선택)"}</Label>
              <ImageUpload
                value={editTarget?.image_url ?? null}
                onChange={(file) => {
                  if (file) {
                    setFormImageFile(file);
                    setFormRemoveImage(false);
                  } else {
                    setFormImageFile(null);
                    setFormRemoveImage(true);
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLocalDialogOpen(false)}>
              {"취소"}
            </Button>
            <Button
              onClick={handleSaveLocal}
              disabled={createLocal.isPending || updateLocal.isPending}
            >
              {createLocal.isPending || updateLocal.isPending ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Management Dialog */}
      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{"재고 설정"}{stockTarget ? ` - ${stockTarget.name}` : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={stockUnlimited}
                onChange={(e) => setStockUnlimited(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">{"무제한 (재고 추적 안 함)"}</span>
            </label>
            {!stockUnlimited && (
              <>
                <div className="space-y-2">
                  <Label>{"재고 수량"}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{"부족 기준 수량"}</Label>
                  <Input
                    type="number"
                    min="1"
                    value={stockThreshold}
                    onChange={(e) => setStockThreshold(e.target.value)}
                    placeholder="5"
                  />
                  <p className="text-xs text-muted-foreground">
                    {"재고가 이 수량 이하가 되면 부족 경고가 표시됩니다."}
                  </p>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockDialogOpen(false)}>
              {"취소"}
            </Button>
            <Button
              onClick={handleSaveStock}
              disabled={upsertStock.isPending || removeStock.isPending}
            >
              {upsertStock.isPending || removeStock.isPending ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{"메뉴 삭제"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              {"'"}{deleteTarget?.name}{"' 메뉴를 삭제하시겠습니까?"}
            </p>
            <p className="text-muted-foreground text-xs mt-2">
              {"이 작업은 되돌릴 수 없습니다."}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {"취소"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteLocal}
              disabled={deleteLocal.isPending}
            >
              {deleteLocal.isPending ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Sortable Master Menu Row ──
interface SortableMasterCardProps {
  menu: MasterMenu;
  isSoldOut: boolean;
  isHidden: boolean;
  onToggleSoldOut: () => void;
  onToggleHidden: () => void;
  overridePending: boolean;
  stock?: { stock_quantity: number; low_stock_threshold: number } | null;
  onStockClick?: () => void;
}

function SortableMasterCard({
  menu,
  isSoldOut,
  isHidden,
  onToggleSoldOut,
  onToggleHidden,
  overridePending,
  stock,
  onStockClick,
}: SortableMasterCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: menu.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={isSoldOut || isHidden ? "opacity-60" : ""}
    >
      <div className="flex items-center gap-3 p-3">
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
            {isSoldOut && <Badge variant="destructive" className="shrink-0 text-[10px] px-1.5 py-0">{"품절"}</Badge>}
            {isHidden && <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0">{"숨김"}</Badge>}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm font-bold">{menu.price.toLocaleString("ko-KR")}{"원"}</span>
            {stock && stock.stock_quantity !== -1 && (
              <Badge
                variant={stock.stock_quantity === 0 ? "destructive" : stock.stock_quantity <= stock.low_stock_threshold ? "outline" : "secondary"}
                className="text-[10px] px-1.5 py-0 cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onStockClick?.(); }}
              >
                {stock.stock_quantity === 0
                  ? `품절 (재고 0)`
                  : stock.stock_quantity <= stock.low_stock_threshold
                    ? `재고 부족 (${stock.stock_quantity})`
                    : `재고 ${stock.stock_quantity}`}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="xs"
            className="gap-1"
            onClick={onStockClick}
          >
            <PackageIcon className="size-3" />
            {"재고"}
          </Button>
          <Button
            variant={isSoldOut ? "default" : "outline"}
            size="xs"
            className="gap-1"
            onClick={onToggleSoldOut}
            disabled={overridePending}
          >
            {isSoldOut ? <CheckCircleIcon className="size-3" /> : <BanIcon className="size-3" />}
            {isSoldOut ? "재개" : "품절"}
          </Button>
          <Button
            variant={isHidden ? "default" : "outline"}
            size="xs"
            className="gap-1"
            onClick={onToggleHidden}
            disabled={overridePending}
          >
            {isHidden ? <EyeIcon className="size-3" /> : <EyeOffIcon className="size-3" />}
            {isHidden ? "표시" : "숨김"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ── Sortable Local Menu Row ──
interface SortableLocalCardProps {
  menu: LocalMenu;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  togglePending: boolean;
  stock?: { stock_quantity: number; low_stock_threshold: number } | null;
  onStockClick?: () => void;
}

function SortableLocalCard({
  menu,
  onEdit,
  onToggle,
  onDelete,
  togglePending,
  stock,
  onStockClick,
}: SortableLocalCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: menu.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className={!menu.is_active ? "opacity-60" : ""}>
      <div className="flex items-center gap-3 p-3">
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
            {!menu.is_active && <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0">{"비활성"}</Badge>}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm font-bold">{menu.price.toLocaleString("ko-KR")}{"원"}</span>
            {stock && stock.stock_quantity !== -1 && (
              <Badge
                variant={stock.stock_quantity === 0 ? "destructive" : stock.stock_quantity <= stock.low_stock_threshold ? "outline" : "secondary"}
                className="text-[10px] px-1.5 py-0 cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onStockClick?.(); }}
              >
                {stock.stock_quantity === 0
                  ? `품절 (재고 0)`
                  : stock.stock_quantity <= stock.low_stock_threshold
                    ? `재고 부족 (${stock.stock_quantity})`
                    : `재고 ${stock.stock_quantity}`}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="xs" className="gap-1" onClick={onEdit}>
            <PencilIcon className="size-3" />
            {"수정"}
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className="gap-1"
            onClick={onStockClick}
          >
            <PackageIcon className="size-3" />
            {"재고"}
          </Button>
          <Button
            variant="outline"
            size="xs"
            className="gap-1"
            onClick={onToggle}
            disabled={togglePending}
          >
            {menu.is_active ? <EyeOffIcon className="size-3" /> : <EyeIcon className="size-3" />}
            {menu.is_active ? "비활성" : "활성"}
          </Button>
          <Button variant="ghost" size="xs" className="gap-1 text-destructive" onClick={onDelete}>
            <Trash2Icon className="size-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ── Sortable Combined Menu Row (All tab) ──
interface SortableCombinedCardProps {
  menu: CombinedMenuItem;
}

function SortableCombinedCard({ menu }: SortableCombinedCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: menu.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`${menu.isSoldOut || !menu.isActive ? "opacity-60" : ""}`}
    >
      <div className="flex items-center gap-3 p-3">
        <button
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground shrink-0"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-5" />
        </button>
        {menu.imageUrl ? (
          <div className="size-14 shrink-0 overflow-hidden rounded-md">
            <img src={menu.imageUrl} alt={menu.name} className="size-full object-cover" />
          </div>
        ) : (
          <div className="size-14 shrink-0 rounded-md bg-muted flex items-center justify-center">
            <UtensilsIcon className="size-5 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{menu.name}</span>
            <Badge variant={menu.menuType === "master" ? "secondary" : menu.menuType === "set" ? "default" : "outline"} className="shrink-0 text-[10px] px-1.5 py-0">
              {menu.menuType === "master" ? "본사" : menu.menuType === "set" ? "세트" : "자체"}
            </Badge>
            {menu.isSoldOut && <Badge variant="destructive" className="shrink-0 text-[10px] px-1.5 py-0">{"품절"}</Badge>}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm font-bold">{menu.price.toLocaleString("ko-KR")}{"원"}</span>
            {menu.categoryName && (
              <span className="text-muted-foreground text-xs">{menu.categoryName}</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
