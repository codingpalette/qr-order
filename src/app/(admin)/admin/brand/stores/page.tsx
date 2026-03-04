"use client";

import { useState } from "react";
import { useAuth } from "@/shared/providers/auth-provider";
import { useStores } from "@/entities/store/api/useStores";
import {
  useCreateStore,
  useUpdateStore,
  useToggleStoreActive,
} from "@/features/store-management";
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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/shared/ui";
import {
  PlusIcon,
  PencilIcon,
  PowerIcon,
  StoreIcon,
} from "lucide-react";
import type { Store } from "@/entities/store/model/types";

interface StoreFormData {
  name: string;
  address: string;
  phone: string;
}

const emptyForm: StoreFormData = { name: "", address: "", phone: "" };

export default function BrandStoresPage() {
  const { user } = useAuth();
  const franchiseId = user?.franchise_id ?? null;
  const { data: stores = [] } = useStores(franchiseId);

  const createStore = useCreateStore();
  const updateStore = useUpdateStore();
  const toggleActive = useToggleStoreActive();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [form, setForm] = useState<StoreFormData>(emptyForm);

  const openCreate = () => {
    setEditingStore(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (store: Store) => {
    setEditingStore(store);
    setForm({
      name: store.name,
      address: store.address ?? "",
      phone: store.phone ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;

    if (editingStore) {
      updateStore.mutate(
        {
          id: editingStore.id,
          name: form.name.trim(),
          address: form.address.trim() || null,
          phone: form.phone.trim() || null,
        },
        { onSuccess: () => setDialogOpen(false) },
      );
    } else {
      if (!franchiseId) return;
      createStore.mutate(
        {
          franchise_id: franchiseId,
          name: form.name.trim(),
          address: form.address.trim() || null,
          phone: form.phone.trim() || null,
        },
        { onSuccess: () => setDialogOpen(false) },
      );
    }
  };

  const handleToggle = (store: Store) => {
    toggleActive.mutate({ id: store.id, is_active: !store.is_active });
  };

  const isPending = createStore.isPending || updateStore.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{"매장 관리"}</h1>
          <p className="text-muted-foreground text-sm">
            {"프랜차이즈 소속 매장을 관리합니다."}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <PlusIcon className="size-4" />
          {"매장 추가"}
        </Button>
      </div>

      {stores.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <StoreIcon className="size-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1">{"매장이 없습니다"}</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {"첫 번째 매장을 추가해보세요."}
              </p>
              <Button onClick={openCreate} className="gap-2">
                <PlusIcon className="size-4" />
                {"매장 추가"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {"전체 매장 "}
              <Badge variant="secondary" className="ml-2">
                {stores.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{"매장명"}</TableHead>
                  <TableHead>{"주소"}</TableHead>
                  <TableHead>{"전화번호"}</TableHead>
                  <TableHead>{"상태"}</TableHead>
                  <TableHead className="text-right">{"관리"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell className="font-medium">{store.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {store.address ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {store.phone ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={store.is_active ? "default" : "secondary"}>
                        {store.is_active ? "운영중" : "비활성"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => openEdit(store)}
                          title="수정"
                        >
                          <PencilIcon className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleToggle(store)}
                          disabled={toggleActive.isPending}
                          title={store.is_active ? "비활성화" : "활성화"}
                        >
                          <PowerIcon className="size-3.5" />
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStore ? "매장 수정" : "매장 추가"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{"매장명"}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="매장 이름을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label>{"주소"}</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="매장 주소를 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label>{"전화번호"}</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="02-1234-5678"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {"취소"}
            </Button>
            <Button onClick={handleSubmit} disabled={isPending || !form.name.trim()}>
              {isPending ? "저장중..." : editingStore ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
