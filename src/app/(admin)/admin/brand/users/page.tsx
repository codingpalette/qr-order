"use client";

import { useState } from "react";
import { useAuth } from "@/shared/providers/auth-provider";
import { useFranchiseUsers, useFranchisePendingUsers } from "@/entities/user/api/useFranchiseUsers";
import { useStores } from "@/entities/store/api/useStores";
import { useApproveUser, useRejectUser, useUpdateUserRole } from "@/features/user-management/api/mutations";
import { inviteUser } from "@/features/user-management/actions/invite-user";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
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
  CheckIcon,
  XIcon,
  UsersIcon,
  PencilIcon,
  ClockIcon,
  PlusIcon,
} from "lucide-react";
import type { UserProfile, UserRole } from "@/entities/user/model/types";

export default function BrandUsersPage() {
  const { user } = useAuth();
  const franchiseId = user?.franchise_id ?? null;
  const { data: allUsers = [] } = useFranchiseUsers(franchiseId);
  const { data: pendingUsers = [] } = useFranchisePendingUsers(franchiseId);
  const { data: stores = [] } = useStores(franchiseId);

  const approveUser = useApproveUser();
  const rejectUser = useRejectUser();
  const updateUserRole = useUpdateUserRole();

  // Approve dialog
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [approveRole, setApproveRole] = useState<string>("store_admin");
  const [approveStoreId, setApproveStoreId] = useState<string>("");

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [editRole, setEditRole] = useState<string>("");
  const [editStoreId, setEditStoreId] = useState<string>("");

  // Invite dialog
  const queryClient = useQueryClient();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("store_admin");
  const [inviteStoreId, setInviteStoreId] = useState<string>("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const openInviteDialog = () => {
    setInviteName("");
    setInviteEmail("");
    setInvitePassword("");
    setInviteRole("store_admin");
    setInviteStoreId("");
    setInviteError(null);
    setInviteDialogOpen(true);
  };

  const handleInvite = async () => {
    if (!franchiseId || !inviteName.trim() || !inviteEmail.trim() || !invitePassword.trim()) {
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
        role: inviteRole as "brand_admin" | "store_admin",
        franchiseId,
        storeId: inviteRole === "store_admin" ? inviteStoreId || null : null,
      });
      if (!result.success) {
        setInviteError(result.error ?? "팀원 추가에 실패했습니다.");
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

  const [activeTab, setActiveTab] = useState(pendingUsers.length > 0 ? "pending" : "members");
  const approvedUsers = allUsers.filter((u) => u.is_approved && u.id !== user?.id);

  const openApproveDialog = (u: UserProfile) => {
    setSelectedUser(u);
    setApproveRole("store_admin");
    setApproveStoreId("");
    setApproveDialogOpen(true);
  };

  const handleApprove = () => {
    if (!selectedUser || !franchiseId) return;
    approveUser.mutate(
      {
        userId: selectedUser.id,
        role: approveRole as Exclude<UserRole, "pending">,
        franchiseId,
        storeId: approveRole === "store_admin" ? approveStoreId || null : null,
      },
      { onSuccess: () => setApproveDialogOpen(false) },
    );
  };

  const handleReject = (userId: string) => {
    rejectUser.mutate(userId);
  };

  const openEditDialog = (u: UserProfile) => {
    setEditUser(u);
    setEditRole(u.role);
    setEditStoreId(u.store_id ?? "");
    setEditDialogOpen(true);
  };

  const handleEditSave = () => {
    if (!editUser || !franchiseId) return;
    updateUserRole.mutate(
      {
        userId: editUser.id,
        role: editRole as UserRole,
        franchiseId,
        storeId: editRole === "store_admin" ? editStoreId || null : null,
      },
      { onSuccess: () => setEditDialogOpen(false) },
    );
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "brand_admin":
        return <Badge>{"브랜드 관리자"}</Badge>;
      case "store_admin":
        return <Badge variant="secondary">{"매장 관리자"}</Badge>;
      case "pending":
        return <Badge variant="outline">{"대기중"}</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStoreName = (storeId: string | null) => {
    if (!storeId) return "-";
    return stores.find((s) => s.id === storeId)?.name ?? "-";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{"팀원 관리"}</h1>
          <p className="text-muted-foreground text-sm">
            {"프랜차이즈 소속 팀원을 관리합니다."}
          </p>
        </div>
        <Button onClick={openInviteDialog} className="gap-1.5">
          <PlusIcon className="size-4" />
          {"팀원 추가"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <ClockIcon className="size-3.5" />
            {"승인 대기"}
            {pendingUsers.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs px-1.5">
                {pendingUsers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <UsersIcon className="size-3.5" />
            {"전체 팀원"}
            <Badge variant="secondary" className="ml-1 text-xs px-1.5">
              {approvedUsers.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="pending" className="mt-4">
          {pendingUsers.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <CheckIcon className="size-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">{"대기중인 요청이 없습니다"}</h3>
                  <p className="text-muted-foreground text-sm">
                    {"새로운 팀원이 가입하면 여기에 표시됩니다."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{"승인 대기 목록"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingUsers.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-muted-foreground text-sm">{u.email}</p>
                        <p className="text-muted-foreground text-xs mt-1">
                          {new Date(u.created_at).toLocaleDateString("ko-KR")}
                          {" 가입"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => openApproveDialog(u)}
                          className="gap-1"
                        >
                          <CheckIcon className="size-3.5" />
                          {"승인"}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger
                            render={<Button size="sm" variant="outline" className="gap-1" />}
                          >
                            <XIcon className="size-3.5" />
                            {"거절"}
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{"가입 거절"}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {`${u.name}님의 가입 요청을 거절하시겠습니까?`}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{"취소"}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleReject(u.id)}>
                                {"거절"}
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
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-4">
          {approvedUsers.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <UsersIcon className="size-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">{"팀원이 없습니다"}</h3>
                  <p className="text-muted-foreground text-sm">
                    {"승인된 팀원이 여기에 표시됩니다."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{"전체 팀원"}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{"이름"}</TableHead>
                      <TableHead>{"이메일"}</TableHead>
                      <TableHead>{"역할"}</TableHead>
                      <TableHead>{"배정 매장"}</TableHead>
                      <TableHead className="text-right">{"관리"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {u.email}
                        </TableCell>
                        <TableCell>{getRoleBadge(u.role)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {getStoreName(u.store_id)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => openEditDialog(u)}
                            title="역할 수정"
                          >
                            <PencilIcon className="size-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{"팀원 승인"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm font-medium">{selectedUser?.name}</p>
              <p className="text-muted-foreground text-sm">{selectedUser?.email}</p>
            </div>
            <div className="space-y-2">
              <Label>{"역할"}</Label>
              <Select value={approveRole} onValueChange={(v) => setApproveRole(v ?? "store_admin")}>
                <SelectTrigger>
                  <span className="flex flex-1 text-left truncate">
                    {approveRole === "brand_admin" ? "브랜드 관리자" : "매장 관리자"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brand_admin">{"브랜드 관리자"}</SelectItem>
                  <SelectItem value="store_admin">{"매장 관리자"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {approveRole === "store_admin" && stores.length > 0 && (
              <div className="space-y-2">
                <Label>{"배정 매장"}</Label>
                <Select value={approveStoreId} onValueChange={(v) => setApproveStoreId(v ?? "")}>
                  <SelectTrigger>
                    <span className="flex flex-1 text-left truncate">
                      {approveStoreId
                        ? stores.find((s) => s.id === approveStoreId)?.name ?? "매장 선택 (선택사항)"
                        : "매장 선택 (선택사항)"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((s) => (
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
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              {"취소"}
            </Button>
            <Button onClick={handleApprove} disabled={approveUser.isPending}>
              {approveUser.isPending ? "처리중..." : "승인"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{"팀원 추가"}</DialogTitle>
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
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v ?? "store_admin")}>
                <SelectTrigger>
                  <span className="flex flex-1 text-left truncate">
                    {inviteRole === "brand_admin" ? "브랜드 관리자" : "매장 관리자"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brand_admin">{"브랜드 관리자"}</SelectItem>
                  <SelectItem value="store_admin">{"매장 관리자"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {inviteRole === "store_admin" && stores.length > 0 && (
              <div className="space-y-2">
                <Label>{"배정 매장"}</Label>
                <Select value={inviteStoreId} onValueChange={(v) => setInviteStoreId(v ?? "")}>
                  <SelectTrigger>
                    <span className="flex flex-1 text-left truncate">
                      {inviteStoreId
                        ? stores.find((s) => s.id === inviteStoreId)?.name ?? "매장 선택"
                        : "매장 선택 (선택사항)"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((s) => (
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
              {inviteLoading ? "추가중..." : "팀원 추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{"역할 수정"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm font-medium">{editUser?.name}</p>
              <p className="text-muted-foreground text-sm">{editUser?.email}</p>
            </div>
            <div className="space-y-2">
              <Label>{"역할"}</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v ?? "")}>
                <SelectTrigger>
                  <span className="flex flex-1 text-left truncate">
                    {editRole === "brand_admin" ? "브랜드 관리자" : "매장 관리자"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brand_admin">{"브랜드 관리자"}</SelectItem>
                  <SelectItem value="store_admin">{"매장 관리자"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editRole === "store_admin" && stores.length > 0 && (
              <div className="space-y-2">
                <Label>{"배정 매장"}</Label>
                <Select value={editStoreId} onValueChange={(v) => setEditStoreId(v ?? "")}>
                  <SelectTrigger>
                    <span className="flex flex-1 text-left truncate">
                      {editStoreId
                        ? stores.find((s) => s.id === editStoreId)?.name ?? "매장 선택 (선택사항)"
                        : "매장 선택 (선택사항)"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((s) => (
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
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {"취소"}
            </Button>
            <Button onClick={handleEditSave} disabled={updateUserRole.isPending}>
              {updateUserRole.isPending ? "저장중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
