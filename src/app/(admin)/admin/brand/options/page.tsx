"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/shared/providers/auth-provider";
import { useMenuOptions } from "@/entities/menu/api/useMenuOptions";
import { useMasterMenus } from "@/entities/menu/api/useMasterMenus";
import { useMenuCategories } from "@/entities/menu/api/useMenuCategories";
import {
  useCreateOptionGroup,
  useUpdateOptionGroup,
  useDeleteOptionGroup,
  useCreateOptionItem,
  useUpdateOptionItem,
  useDeleteOptionItem,
  useToggleOptionItem,
  useCreateOptionGroupLink,
  useDeleteOptionGroupLink,
} from "@/features/menu-management";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/shared/ui";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PowerIcon,
  Settings2Icon,
  LinkIcon,
  UnlinkIcon,
  CheckIcon,
} from "lucide-react";
import type { MenuOptionGroup, MenuOptionItem } from "@/entities/menu/model/types";

// ── Form Types ──

interface GroupFormData {
  name: string;
  is_required: boolean;
  min_select: string;
  max_select: string;
}

interface ItemFormData {
  name: string;
  price_delta: string;
}

const emptyGroupForm: GroupFormData = {
  name: "",
  is_required: false,
  min_select: "0",
  max_select: "1",
};

const emptyItemForm: ItemFormData = {
  name: "",
  price_delta: "0",
};

export default function BrandOptionsPage() {
  const { user } = useAuth();
  const franchiseId = user?.franchise_id ?? null;
  const { data: optionsData } = useMenuOptions(franchiseId);
  const { data: masterMenus = [] } = useMasterMenus(franchiseId);
  const { data: categories = [] } = useMenuCategories(franchiseId);

  const groups = optionsData?.groups ?? [];
  const linksByMenu = optionsData?.linksByMenu ?? new Map();

  // Mutations
  const createGroup = useCreateOptionGroup();
  const updateGroup = useUpdateOptionGroup();
  const deleteGroup = useDeleteOptionGroup();
  const createItem = useCreateOptionItem();
  const updateItem = useUpdateOptionItem();
  const deleteItem = useDeleteOptionItem();
  const toggleItem = useToggleOptionItem();
  const createLink = useCreateOptionGroupLink();
  const deleteLink = useDeleteOptionGroupLink();

  // ── Group Dialog ──
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<MenuOptionGroup | null>(null);
  const [groupForm, setGroupForm] = useState<GroupFormData>(emptyGroupForm);

  // ── Item Dialog ──
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuOptionItem | null>(null);
  const [itemForm, setItemForm] = useState<ItemFormData>(emptyItemForm);
  const [itemGroupId, setItemGroupId] = useState<string>("");

  // ── Link Dialog ──
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkGroupId, setLinkGroupId] = useState<string>("");

  // ── Active group (expanded) ──
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  // Build reverse map: groupId → linked menu names
  const linkedMenusByGroup = useMemo(() => {
    const map = new Map<string, { linkKey: string; menuName: string; menuId: string; menuType: string }[]>();
    linksByMenu.forEach((groupList: MenuOptionGroup[], key: string) => {
      // key = "master:menuId" or "local:menuId"
      const [menuType, menuId] = key.split(":");
      const menu = masterMenus.find((m) => m.id === menuId);
      const menuName = menu?.name ?? menuId.slice(0, 8);
      groupList.forEach((g: MenuOptionGroup) => {
        const list = map.get(g.id) ?? [];
        list.push({ linkKey: key, menuName, menuId, menuType });
        map.set(g.id, list);
      });
    });
    return map;
  }, [linksByMenu, masterMenus]);

  // Build link IDs map from raw data (we need to refetch for deletion)
  // For simplicity, we'll use a query to get link IDs when needed

  // ── Group Handlers ──
  const openCreateGroup = () => {
    setEditingGroup(null);
    setGroupForm(emptyGroupForm);
    setGroupDialogOpen(true);
  };

  const openEditGroup = (group: MenuOptionGroup) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      is_required: group.is_required,
      min_select: String(group.min_select),
      max_select: String(group.max_select),
    });
    setGroupDialogOpen(true);
  };

  const handleGroupSubmit = () => {
    if (!groupForm.name.trim()) return;
    const min_select = parseInt(groupForm.min_select, 10) || 0;
    const max_select = parseInt(groupForm.max_select, 10) || 1;

    if (editingGroup) {
      updateGroup.mutate(
        {
          id: editingGroup.id,
          name: groupForm.name.trim(),
          is_required: groupForm.is_required,
          min_select,
          max_select,
        },
        { onSuccess: () => setGroupDialogOpen(false) },
      );
    } else {
      if (!franchiseId) return;
      createGroup.mutate(
        {
          franchise_id: franchiseId,
          name: groupForm.name.trim(),
          is_required: groupForm.is_required,
          min_select,
          max_select,
          sort_order: groups.length,
        },
        { onSuccess: () => setGroupDialogOpen(false) },
      );
    }
  };

  // ── Item Handlers ──
  const openCreateItem = (groupId: string) => {
    setEditingItem(null);
    setItemGroupId(groupId);
    setItemForm(emptyItemForm);
    setItemDialogOpen(true);
  };

  const openEditItem = (item: MenuOptionItem) => {
    setEditingItem(item);
    setItemGroupId(item.option_group_id);
    setItemForm({
      name: item.name,
      price_delta: String(item.price_delta),
    });
    setItemDialogOpen(true);
  };

  const handleItemSubmit = () => {
    if (!itemForm.name.trim()) return;
    const price_delta = parseInt(itemForm.price_delta, 10) || 0;

    if (editingItem) {
      updateItem.mutate(
        { id: editingItem.id, name: itemForm.name.trim(), price_delta },
        { onSuccess: () => setItemDialogOpen(false) },
      );
    } else {
      const group = groups.find((g) => g.id === itemGroupId);
      createItem.mutate(
        {
          option_group_id: itemGroupId,
          name: itemForm.name.trim(),
          price_delta,
          sort_order: group?.items.length ?? 0,
        },
        { onSuccess: () => setItemDialogOpen(false) },
      );
    }
  };

  // ── Link Handlers ──
  const openLinkDialog = (groupId: string) => {
    setLinkGroupId(groupId);
    setLinkDialogOpen(true);
  };

  const handleLinkMenu = (menuId: string) => {
    createLink.mutate({
      menu_type: "master",
      menu_id: menuId,
      option_group_id: linkGroupId,
    });
  };

  const handleUnlinkMenu = async (menuId: string, groupId: string) => {
    // Need to find the link ID - query directly
    const { createClient: cc } = await import("@/shared/api/supabase/client");
    const supabase = cc();
    const { data } = await supabase
      .from("menu_option_group_links")
      .select("id")
      .eq("menu_type", "master")
      .eq("menu_id", menuId)
      .eq("option_group_id", groupId)
      .single();
    if (data?.id) {
      deleteLink.mutate(data.id as string);
    }
  };

  const isLinkedToMenu = (menuId: string, groupId: string) => {
    const linked = linkedMenusByGroup.get(groupId) ?? [];
    return linked.some((l) => l.menuId === menuId);
  };

  const isGroupPending = createGroup.isPending || updateGroup.isPending;
  const isItemPending = createItem.isPending || updateItem.isPending;

  const getCategoryName = (categoryId: string) =>
    categories.find((c) => c.id === categoryId)?.name ?? "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{"옵션 관리"}</h1>
          <p className="text-muted-foreground text-sm">
            {"메뉴 옵션 그룹과 항목을 관리하고, 메뉴에 연결합니다."}
          </p>
        </div>
        <Button onClick={openCreateGroup} className="gap-2">
          <PlusIcon className="size-4" />
          {"옵션 그룹 추가"}
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Settings2Icon className="text-muted-foreground mx-auto mb-3 size-12" />
              <h3 className="mb-1 text-lg font-medium">{"옵션 그룹이 없습니다"}</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {"사이즈, 맛 선택 등 옵션 그룹을 추가하세요."}
              </p>
              <Button onClick={openCreateGroup} className="gap-2">
                <PlusIcon className="size-4" />
                {"옵션 그룹 추가"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const isExpanded = expandedGroupId === group.id;
            const linkedMenus = linkedMenusByGroup.get(group.id) ?? [];

            return (
              <Card key={group.id}>
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-base">{group.name}</CardTitle>
                      <div className="flex items-center gap-1.5">
                        {group.is_required && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            {"필수"}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {group.max_select === 1 ? "단일선택" : `최대 ${group.max_select}개`}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {group.items.length}{"개 항목"}
                        </Badge>
                        {linkedMenus.length > 0 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            <LinkIcon className="mr-1 size-2.5" />
                            {linkedMenus.length}{"개 메뉴"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="xs" onClick={() => openLinkDialog(group.id)} className="gap-1">
                        <LinkIcon className="size-3" />
                        {"메뉴 연결"}
                      </Button>
                      <Button variant="ghost" size="xs" onClick={() => openEditGroup(group)} className="gap-1">
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
                            <AlertDialogTitle>{"옵션 그룹 삭제"}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {`"${group.name}" 옵션 그룹을 삭제하시겠습니까? 하위 항목과 메뉴 연결도 함께 삭제됩니다.`}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{"취소"}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteGroup.mutate(group.id)}>
                              {"삭제"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-4">
                    {/* Linked menus */}
                    {linkedMenus.length > 0 && (
                      <div>
                        <p className="text-muted-foreground mb-2 text-xs font-medium">{"연결된 메뉴"}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {linkedMenus.map((l) => (
                            <div
                              key={l.linkKey}
                              className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
                            >
                              <span>{l.menuName}</span>
                              <button
                                onClick={() => handleUnlinkMenu(l.menuId, group.id)}
                                className="text-muted-foreground hover:text-destructive ml-0.5"
                              >
                                <UnlinkIcon className="size-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Option Items */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-muted-foreground text-xs font-medium">{"옵션 항목"}</p>
                        <Button
                          variant="outline"
                          size="xs"
                          className="gap-1"
                          onClick={() => openCreateItem(group.id)}
                        >
                          <PlusIcon className="size-3" />
                          {"항목 추가"}
                        </Button>
                      </div>

                      {group.items.length === 0 ? (
                        <p className="text-muted-foreground py-4 text-center text-sm">
                          {"항목이 없습니다. 항목을 추가해주세요."}
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {group.items.map((item) => (
                            <div
                              key={item.id}
                              className={`flex items-center gap-3 rounded-lg border p-2.5 ${!item.is_active ? "opacity-50" : ""}`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{item.name}</span>
                                  {!item.is_active && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                      {"비활성"}
                                    </Badge>
                                  )}
                                </div>
                                {item.price_delta !== 0 && (
                                  <span className="text-muted-foreground text-xs">
                                    {item.price_delta > 0 ? "+" : ""}
                                    {item.price_delta.toLocaleString("ko-KR")}{"원"}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  className="size-6"
                                  onClick={() => openEditItem(item)}
                                >
                                  <PencilIcon className="size-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  className="size-6"
                                  onClick={() =>
                                    toggleItem.mutate({
                                      id: item.id,
                                      is_active: !item.is_active,
                                    })
                                  }
                                  disabled={toggleItem.isPending}
                                >
                                  <PowerIcon className="size-3" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger
                                    render={
                                      <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        className="text-destructive size-6"
                                      />
                                    }
                                  >
                                    <TrashIcon className="size-3" />
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>{"항목 삭제"}</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {`"${item.name}" 항목을 삭제하시겠습니까?`}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>{"취소"}</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteItem.mutate(item.id)}>
                                        {"삭제"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Group Dialog */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? "옵션 그룹 수정" : "옵션 그룹 추가"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{"그룹 이름"}</Label>
              <Input
                value={groupForm.name}
                onChange={(e) => setGroupForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="예: 사이즈, 맛 선택, 토핑"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={groupForm.is_required}
                  onChange={(e) =>
                    setGroupForm((f) => ({ ...f, is_required: e.target.checked }))
                  }
                  className="accent-primary size-4 rounded"
                />
                <span className="text-sm">{"필수 선택"}</span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{"최소 선택 수"}</Label>
                <Input
                  type="number"
                  min="0"
                  value={groupForm.min_select}
                  onChange={(e) =>
                    setGroupForm((f) => ({ ...f, min_select: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{"최대 선택 수"}</Label>
                <Input
                  type="number"
                  min="1"
                  value={groupForm.max_select}
                  onChange={(e) =>
                    setGroupForm((f) => ({ ...f, max_select: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupDialogOpen(false)}>
              {"취소"}
            </Button>
            <Button
              onClick={handleGroupSubmit}
              disabled={isGroupPending || !groupForm.name.trim()}
            >
              {isGroupPending ? "저장중..." : editingGroup ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "옵션 항목 수정" : "옵션 항목 추가"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{"항목 이름"}</Label>
              <Input
                value={itemForm.name}
                onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="예: 레귤러, 라지, 매운맛"
              />
            </div>
            <div className="space-y-2">
              <Label>{"추가 금액 (원)"}</Label>
              <Input
                type="number"
                step="100"
                value={itemForm.price_delta}
                onChange={(e) =>
                  setItemForm((f) => ({ ...f, price_delta: e.target.value }))
                }
                placeholder="0"
              />
              <p className="text-muted-foreground text-xs">
                {"추가 금액이 없으면 0을 입력하세요."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>
              {"취소"}
            </Button>
            <Button
              onClick={handleItemSubmit}
              disabled={isItemPending || !itemForm.name.trim()}
            >
              {isItemPending ? "저장중..." : editingItem ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{"메뉴에 옵션 연결"}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 py-2">
            <p className="text-muted-foreground mb-3 text-sm">
              {"이 옵션 그룹을 적용할 메뉴를 선택하세요."}
            </p>
            {masterMenus.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                {"등록된 메뉴가 없습니다."}
              </p>
            ) : (
              <div className="space-y-1">
                {masterMenus.map((menu) => {
                  const linked = isLinkedToMenu(menu.id, linkGroupId);
                  return (
                    <button
                      key={menu.id}
                      onClick={() => {
                        if (linked) {
                          handleUnlinkMenu(menu.id, linkGroupId);
                        } else {
                          handleLinkMenu(menu.id);
                        }
                      }}
                      disabled={createLink.isPending || deleteLink.isPending}
                      className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors ${
                        linked
                          ? "border-primary/30 bg-primary/5"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div
                        className={`flex size-5 shrink-0 items-center justify-center rounded border-2 ${
                          linked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {linked && <CheckIcon className="size-3" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium">{menu.name}</span>
                        <span className="text-muted-foreground ml-2 text-xs">
                          {getCategoryName(menu.category_id)}
                        </span>
                      </div>
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {menu.price.toLocaleString("ko-KR")}{"원"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setLinkDialogOpen(false)}>
              {"완료"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
