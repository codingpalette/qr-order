"use client";

import { useState } from "react";
import { useFranchises } from "@/entities/franchise/api/useFranchises";
import { useStores } from "@/entities/store/api/useStores";
import {
  useCreateFranchise,
  useUpdateFranchise,
  useToggleFranchiseActive,
} from "@/features/franchise-management/api/mutations";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  ImageUpload,
} from "@/shared/ui";
import { PlusIcon, PencilIcon, ToggleLeftIcon, ToggleRightIcon } from "lucide-react";
import type { Franchise } from "@/entities/franchise/model/types";

export default function FranchisesPage() {
  const { data: franchises = [], isLoading } = useFranchises();
  const { data: stores = [] } = useStores();
  const createFranchise = useCreateFranchise();
  const updateFranchise = useUpdateFranchise();
  const toggleActive = useToggleFranchiseActive();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Franchise | null>(null);
  const [formName, setFormName] = useState("");
  const [formLogoFile, setFormLogoFile] = useState<File | null>(null);
  const [formLogoPreview, setFormLogoPreview] = useState<string | null>(null);

  const storeCountMap = stores.reduce<Record<string, number>>((acc, s) => {
    acc[s.franchise_id] = (acc[s.franchise_id] ?? 0) + 1;
    return acc;
  }, {});

  const resetForm = () => {
    setFormName("");
    setFormLogoFile(null);
    setFormLogoPreview(null);
  };

  const handleCreate = async () => {
    if (!formName.trim()) return;
    await createFranchise.mutateAsync({
      name: formName.trim(),
      logoFile: formLogoFile,
    });
    resetForm();
    setIsCreateOpen(false);
  };

  const handleEdit = async () => {
    if (!editTarget || !formName.trim()) return;
    await updateFranchise.mutateAsync({
      id: editTarget.id,
      name: formName.trim(),
      logoFile: formLogoFile,
      removeLogo: !formLogoFile && !formLogoPreview,
      currentLogoUrl: editTarget.logo_url,
    });
    setEditTarget(null);
    resetForm();
  };

  const openEdit = (franchise: Franchise) => {
    setEditTarget(franchise);
    setFormName(franchise.name);
    setFormLogoFile(null);
    setFormLogoPreview(franchise.logo_url ?? null);
  };

  const handleToggle = (franchise: Franchise) => {
    toggleActive.mutate({
      id: franchise.id,
      is_active: !franchise.is_active,
    });
  };

  const handleLogoChange = (file: File | null) => {
    setFormLogoFile(file);
    if (!file) {
      setFormLogoPreview(null);
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{"프랜차이즈 관리"}</h1>
          <p className="text-muted-foreground text-sm">
            {"프랜차이즈(본사) 계정을 생성하고 관리합니다."}
          </p>
        </div>
        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger
            render={
              <Button className="gap-2">
                <PlusIcon className="size-4" />
                {"새 프랜차이즈"}
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{"프랜차이즈 생성"}</DialogTitle>
              <DialogDescription>
                {"새로운 프랜차이즈(본사) 계정을 생성합니다."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">{"이름"}</label>
                <Input
                  placeholder="프랜차이즈 이름"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {"로고 (선택)"}
                </label>
                <ImageUpload
                  onChange={handleLogoChange}
                  disabled={createFranchise.isPending}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                {"취소"}
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!formName.trim() || createFranchise.isPending}
              >
                {createFranchise.isPending ? "생성 중..." : "생성"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {"전체 프랜차이즈 ("}
            {franchises.length}
            {")"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {franchises.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {"등록된 프랜차이즈가 없습니다."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{"이름"}</TableHead>
                  <TableHead>{"매장 수"}</TableHead>
                  <TableHead>{"상태"}</TableHead>
                  <TableHead>{"생성일"}</TableHead>
                  <TableHead className="text-right">{"액션"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {franchises.map((franchise) => (
                  <TableRow key={franchise.id}>
                    <TableCell className="font-medium">
                      {franchise.name}
                    </TableCell>
                    <TableCell>
                      {storeCountMap[franchise.id] ?? 0}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          franchise.is_active ? "default" : "secondary"
                        }
                      >
                        {franchise.is_active ? "활성" : "비활성"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(franchise.created_at).toLocaleDateString(
                        "ko-KR",
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => openEdit(franchise)}
                        >
                          <PencilIcon className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleToggle(franchise)}
                          disabled={toggleActive.isPending}
                        >
                          {franchise.is_active ? (
                            <ToggleRightIcon className="size-3.5 text-green-600" />
                          ) : (
                            <ToggleLeftIcon className="size-3.5 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{"프랜차이즈 수정"}</DialogTitle>
            <DialogDescription>
              {"프랜차이즈 정보를 수정합니다."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">{"이름"}</label>
              <Input
                placeholder="프랜차이즈 이름"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {"로고 (선택)"}
              </label>
              <ImageUpload
                value={formLogoPreview}
                onChange={handleLogoChange}
                disabled={updateFranchise.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditTarget(null);
                resetForm();
              }}
            >
              {"취소"}
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!formName.trim() || updateFranchise.isPending}
            >
              {updateFranchise.isPending ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
