"use client";

import { useState } from "react";
import { useUsers, usePendingUsers } from "@/entities/user/api/useUsers";
import { useFranchises } from "@/entities/franchise/api/useFranchises";
import { useStores } from "@/entities/store/api/useStores";
import {
  useApproveUser,
  useRejectUser,
  useUpdateUserRole,
} from "@/features/user-management/api/mutations";
import { inviteUser } from "@/features/user-management/actions/invite-user";
import { useQueryClient } from "@tanstack/react-query";
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
  Input,
  Label,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/ui";
import { CheckIcon, XIcon, ShieldIcon, PlusIcon } from "lucide-react";
import type { UserProfile, UserRole } from "@/entities/user/model/types";

const ROLE_LABELS: Record<UserRole, string> = {
  pending: "대기",
  system_admin: "시스템 관리자",
  brand_admin: "브랜드 관리자",
  store_admin: "매장 관리자",
};

const ROLE_VARIANTS: Record<UserRole, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  system_admin: "destructive",
  brand_admin: "default",
  store_admin: "outline",
};

export default function UsersPage() {
  const { data: allUsers = [], isLoading } = useUsers();
  const { data: pendingUsers = [] } = usePendingUsers();
  const { data: franchises = [] } = useFranchises();
  const { data: stores = [] } = useStores();
  const approveUser = useApproveUser();
  const rejectUser = useRejectUser();
  const updateUserRole = useUpdateUserRole();

  const [activeTab, setActiveTab] = useState(pendingUsers.length > 0 ? "pending" : "all");
  const [approveTarget, setApproveTarget] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("brand_admin");
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>("");
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");

  // Invite dialog
  const queryClient = useQueryClient();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("store_admin");
  const [inviteFranchiseId, setInviteFranchiseId] = useState<string>("");
  const [inviteStoreId, setInviteStoreId] = useState<string>("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const openInviteDialog = () => {
    setInviteName("");
    setInviteEmail("");
    setInvitePassword("");
    setInviteRole("store_admin");
    setInviteFranchiseId("");
    setInviteStoreId("");
    setInviteError(null);
    setInviteDialogOpen(true);
  };

  const inviteFilteredStores = inviteFranchiseId
    ? stores.filter((s) => s.franchise_id === inviteFranchiseId)
    : [];

  const handleInvite = async () => {
    if (!inviteName.trim() || !inviteEmail.trim() || !invitePassword.trim()) {
      setInviteError("모든 필수 항목을 입력해주세요.");
      return;
    }
    if (invitePassword.length < 8) {
      setInviteError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    setInviteLoading(true);
    setInviteError(null);
    try {
      const result = await inviteUser({
        email: inviteEmail.trim(),
        name: inviteName.trim(),
        password: invitePassword,
        role: inviteRole as Exclude<UserRole, "pending">,
        franchiseId: inviteFranchiseId || null,
        storeId: inviteRole === "store_admin" ? inviteStoreId || null : null,
      });
      if (!result.success) {
        setInviteError(result.error ?? "사용자 추가에 실패했습니다.");
      } else {
        setInviteDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ["users"] });
      }
    } catch {
      setInviteError("네트워크 오류가 발생했습니다.");
    } finally {
      setInviteLoading(false);
    }
  };

  const filteredStores = selectedFranchiseId
    ? stores.filter((s) => s.franchise_id === selectedFranchiseId)
    : [];

  const handleApprove = async () => {
    if (!approveTarget) return;
    await approveUser.mutateAsync({
      userId: approveTarget.id,
      role: selectedRole as Exclude<UserRole, "pending">,
      franchiseId: selectedFranchiseId || null,
      storeId: selectedStoreId || null,
    });
    setApproveTarget(null);
    resetForm();
  };

  const handleReject = (userId: string) => {
    if (!confirm("정말로 이 사용자의 가입을 거절하시겠습니까?")) return;
    rejectUser.mutate(userId);
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    updateUserRole.mutate({ userId, role: newRole });
  };

  const resetForm = () => {
    setSelectedRole("brand_admin");
    setSelectedFranchiseId("");
    setSelectedStoreId("");
  };

  const openApproveDialog = (user: UserProfile) => {
    setApproveTarget(user);
    resetForm();
  };

  const franchiseNameMap = franchises.reduce<Record<string, string>>(
    (acc, f) => {
      acc[f.id] = f.name;
      return acc;
    },
    {},
  );

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
          <h1 className="text-2xl font-bold">{"사용자 관리"}</h1>
          <p className="text-muted-foreground text-sm">
            {"사용자 가입 승인 및 역할을 관리합니다."}
          </p>
        </div>
        <Button onClick={openInviteDialog} className="gap-1.5">
          <PlusIcon className="size-4" />
          {"사용자 추가"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            {"승인 대기"}
            {pendingUsers.length > 0 && (
              <Badge variant="destructive" className="ml-1.5 h-4 px-1.5 text-[10px]">
                {pendingUsers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">{"전체 사용자"}</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>
                {"승인 대기 사용자 ("}
                {pendingUsers.length}
                {")"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingUsers.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  {"승인 대기 중인 사용자가 없습니다."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{"이름"}</TableHead>
                      <TableHead>{"이메일"}</TableHead>
                      <TableHead>{"가입일"}</TableHead>
                      <TableHead className="text-right">{"액션"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          {u.name}
                        </TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          {new Date(u.created_at).toLocaleDateString("ko-KR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="xs"
                              className="gap-1"
                              onClick={() => openApproveDialog(u)}
                            >
                              <CheckIcon className="size-3" />
                              {"승인"}
                            </Button>
                            <Button
                              size="xs"
                              variant="destructive"
                              className="gap-1"
                              onClick={() => handleReject(u.id)}
                              disabled={rejectUser.isPending}
                            >
                              <XIcon className="size-3" />
                              {"거절"}
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
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>
                {"전체 사용자 ("}
                {allUsers.length}
                {")"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allUsers.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  {"등록된 사용자가 없습니다."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{"이름"}</TableHead>
                      <TableHead>{"이메일"}</TableHead>
                      <TableHead>{"역할"}</TableHead>
                      <TableHead>{"소속"}</TableHead>
                      <TableHead>{"상태"}</TableHead>
                      <TableHead className="text-right">{"액션"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          {u.name}
                        </TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge variant={ROLE_VARIANTS[u.role]}>
                            {ROLE_LABELS[u.role]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {u.franchise_id
                            ? franchiseNameMap[u.franchise_id] ?? "-"
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={u.is_approved ? "default" : "secondary"}
                          >
                            {u.is_approved ? "승인됨" : "미승인"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {u.role !== "system_admin" && u.is_approved && (
                            <Select
                              value={u.role}
                              onValueChange={(val) => {
                                if (val) handleRoleChange(u.id, val as UserRole);
                              }}
                            >
                              <SelectTrigger size="sm" className="w-auto">
                                <ShieldIcon className="size-3" />
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="brand_admin">
                                  {"브랜드 관리자"}
                                </SelectItem>
                                <SelectItem value="store_admin">
                                  {"매장 관리자"}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{"사용자 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {inviteError && (
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {inviteError}
              </div>
            )}
            <div className="space-y-2">
              <Label>{"이름"}</Label>
              <Input
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="홍길동"
              />
            </div>
            <div className="space-y-2">
              <Label>{"이메일"}</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>{"초기 비밀번호"}</Label>
              <Input
                type="text"
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
                placeholder="8자 이상"
              />
            </div>
            <div className="space-y-2">
              <Label>{"역할"}</Label>
              <Select value={inviteRole} onValueChange={(v) => { setInviteRole(v ?? "store_admin"); setInviteStoreId(""); }}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {ROLE_LABELS[inviteRole as UserRole] ?? inviteRole}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system_admin">{"시스템 관리자"}</SelectItem>
                  <SelectItem value="brand_admin">{"브랜드 관리자"}</SelectItem>
                  <SelectItem value="store_admin">{"매장 관리자"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {inviteRole !== "system_admin" && franchises.length > 0 && (
              <div className="space-y-2">
                <Label>{"프랜차이즈"}</Label>
                <Select value={inviteFranchiseId} onValueChange={(v) => { setInviteFranchiseId(v ?? ""); setInviteStoreId(""); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="프랜차이즈 선택">
                      {inviteFranchiseId ? franchiseNameMap[inviteFranchiseId] : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {franchises.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {inviteRole === "store_admin" && inviteFilteredStores.length > 0 && (
              <div className="space-y-2">
                <Label>{"매장"}</Label>
                <Select value={inviteStoreId} onValueChange={(v) => setInviteStoreId(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="매장 선택">
                      {inviteStoreId ? inviteFilteredStores.find((s) => s.id === inviteStoreId)?.name : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {inviteFilteredStores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              {"취소"}
            </Button>
            <Button onClick={handleInvite} disabled={inviteLoading}>
              {inviteLoading ? "추가중..." : "사용자 추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog
        open={!!approveTarget}
        onOpenChange={(open) => {
          if (!open) {
            setApproveTarget(null);
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{"사용자 승인"}</DialogTitle>
            <DialogDescription>
              {approveTarget?.name} ({approveTarget?.email})
              {"님의 역할과 소속을 설정합니다."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">{"역할"}</label>
              <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val ?? "brand_admin")}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {selectedRole === "store_admin" ? "매장 관리자" : "브랜드 관리자"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brand_admin">
                    {"브랜드 관리자"}
                  </SelectItem>
                  <SelectItem value="store_admin">
                    {"매장 관리자"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {"프랜차이즈 (선택)"}
              </label>
              <Select
                value={selectedFranchiseId}
                onValueChange={(val) => {
                  setSelectedFranchiseId(val ?? "");
                  setSelectedStoreId("");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="프랜차이즈 선택">
                    {selectedFranchiseId ? franchiseNameMap[selectedFranchiseId] : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {franchises.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedRole === "store_admin" && filteredStores.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {"매장 (선택)"}
                </label>
                <Select
                  value={selectedStoreId}
                  onValueChange={(val) => setSelectedStoreId(val ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="매장 선택">
                      {selectedStoreId ? filteredStores.find((s) => s.id === selectedStoreId)?.name : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApproveTarget(null);
                resetForm();
              }}
            >
              {"취소"}
            </Button>
            <Button
              onClick={handleApprove}
              disabled={approveUser.isPending}
            >
              {approveUser.isPending ? "승인 중..." : "승인"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
