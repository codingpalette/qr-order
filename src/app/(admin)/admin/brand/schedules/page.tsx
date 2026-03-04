"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/shared/providers/auth-provider";
import { useMenuCategories } from "@/entities/menu/api/useMenuCategories";
import { useMasterMenus } from "@/entities/menu/api/useMasterMenus";
import { useMenuSchedules } from "@/entities/menu/api/useMenuSchedules";
import {
  useCreateMenuSchedule,
  useUpdateMenuSchedule,
  useDeleteMenuSchedule,
  useBulkUpdateScheduleLinks,
} from "@/features/schedule-management";
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
} from "@/shared/ui";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
} from "lucide-react";
import type { MenuSchedule } from "@/entities/menu/model/types";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export default function SchedulesPage() {
  const { user } = useAuth();
  const franchiseId = user?.franchise_id ?? null;
  const { data: categories = [] } = useMenuCategories(franchiseId);
  const { data: masterMenus = [] } = useMasterMenus(franchiseId);
  const { schedules, links } = useMenuSchedules(franchiseId);

  const createSchedule = useCreateMenuSchedule();
  const updateSchedule = useUpdateMenuSchedule();
  const deleteSchedule = useDeleteMenuSchedule();
  const bulkUpdateLinks = useBulkUpdateScheduleLinks();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MenuSchedule | null>(null);
  const [formName, setFormName] = useState("");
  const [formStartTime, setFormStartTime] = useState("11:00");
  const [formEndTime, setFormEndTime] = useState("14:00");
  const [formDays, setFormDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [linkedMenuIds, setLinkedMenuIds] = useState<Set<string>>(new Set());

  const selectedScheduleLinks = useMemo(() => {
    if (!selectedScheduleId) return [];
    return links.filter((l) => l.schedule_id === selectedScheduleId);
  }, [links, selectedScheduleId]);

  const openCreate = () => {
    setEditing(null);
    setFormName("");
    setFormStartTime("11:00");
    setFormEndTime("14:00");
    setFormDays([0, 1, 2, 3, 4, 5, 6]);
    setDialogOpen(true);
  };

  const openEdit = (schedule: MenuSchedule) => {
    setEditing(schedule);
    setFormName(schedule.name);
    setFormStartTime(schedule.start_time.slice(0, 5));
    setFormEndTime(schedule.end_time.slice(0, 5));
    setFormDays([...schedule.days_of_week]);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formName.trim() || !formStartTime || !formEndTime) return;
    if (editing) {
      updateSchedule.mutate(
        {
          id: editing.id,
          name: formName.trim(),
          start_time: formStartTime,
          end_time: formEndTime,
          days_of_week: formDays,
        },
        { onSuccess: () => setDialogOpen(false) },
      );
    } else {
      if (!franchiseId) return;
      createSchedule.mutate(
        {
          franchise_id: franchiseId,
          name: formName.trim(),
          start_time: formStartTime,
          end_time: formEndTime,
          days_of_week: formDays,
        },
        { onSuccess: () => setDialogOpen(false) },
      );
    }
  };

  const toggleDay = (day: number) => {
    setFormDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  };

  const selectSchedule = (schedule: MenuSchedule) => {
    setSelectedScheduleId(schedule.id);
    const currentLinks = links.filter((l) => l.schedule_id === schedule.id);
    setLinkedMenuIds(new Set(currentLinks.map((l) => `${l.menu_type}:${l.menu_id}`)));
  };

  const toggleMenuLink = (menuId: string, menuType: "master" | "local") => {
    const key = `${menuType}:${menuId}`;
    setLinkedMenuIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const saveLinks = () => {
    if (!selectedScheduleId) return;
    const linksList = Array.from(linkedMenuIds).map((key) => {
      const [menu_type, menu_id] = key.split(":") as ["master" | "local", string];
      return { menu_type, menu_id };
    });
    bulkUpdateLinks.mutate({ scheduleId: selectedScheduleId, links: linksList });
  };

  const isPending = createSchedule.isPending || updateSchedule.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{"시간대 관리"}</h1>
          <p className="text-muted-foreground text-sm">
            {"특정 시간대에만 표시할 메뉴를 설정합니다."}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <PlusIcon className="size-4" />
          {"스케줄 추가"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Schedule List */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">{"스케줄 목록"}</h2>
          {schedules.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <ClockIcon className="size-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">
                    {"등록된 스케줄이 없습니다."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            schedules.map((schedule) => {
              const isSelected = selectedScheduleId === schedule.id;
              const linkCount = links.filter((l) => l.schedule_id === schedule.id).length;
              return (
                <Card
                  key={schedule.id}
                  className={`cursor-pointer transition-colors ${isSelected ? "ring-2 ring-primary" : ""}`}
                  onClick={() => selectSchedule(schedule)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{schedule.name}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {schedule.start_time.slice(0, 5)}{" ~ "}{schedule.end_time.slice(0, 5)}
                        </p>
                        <div className="flex gap-1 mt-1.5">
                          {DAY_LABELS.map((label, idx) => (
                            <Badge
                              key={idx}
                              variant={schedule.days_of_week.includes(idx) ? "default" : "outline"}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {linkCount}{"개 메뉴"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="size-7"
                          onClick={(e) => { e.stopPropagation(); openEdit(schedule); }}
                        >
                          <PencilIcon className="size-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                className="size-7 text-destructive"
                                onClick={(e) => e.stopPropagation()}
                              />
                            }
                          >
                            <TrashIcon className="size-3.5" />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{"스케줄 삭제"}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {`"${schedule.name}" 스케줄을 삭제하시겠습니까?`}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{"취소"}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => {
                                deleteSchedule.mutate(schedule.id);
                                if (selectedScheduleId === schedule.id) setSelectedScheduleId(null);
                              }}>
                                {"삭제"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Menu Link Management */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">{"메뉴 연결"}</h2>
          {selectedScheduleId ? (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {schedules.find((s) => s.id === selectedScheduleId)?.name ?? ""}
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={saveLinks}
                    disabled={bulkUpdateLinks.isPending}
                  >
                    {bulkUpdateLinks.isPending ? "저장 중..." : "저장"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {"체크한 메뉴는 이 시간대에만 표시됩니다. 체크하지 않은 메뉴는 항상 표시됩니다."}
                </p>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto space-y-1">
                  {categories.map((cat) => {
                    const catMenus = masterMenus.filter((m) => m.category_id === cat.id && m.is_active);
                    if (catMenus.length === 0) return null;
                    return (
                      <div key={cat.id} className="mb-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">{cat.name}</p>
                        {catMenus.map((menu) => {
                          const key = `master:${menu.id}`;
                          return (
                            <label key={menu.id} className="flex items-center gap-2 text-sm cursor-pointer py-1">
                              <input
                                type="checkbox"
                                checked={linkedMenuIds.has(key)}
                                onChange={() => toggleMenuLink(menu.id, "master")}
                                className="rounded"
                              />
                              <span>{menu.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <ClockIcon className="size-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">
                    {"스케줄을 선택하면 메뉴를 연결할 수 있습니다."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create/Edit Schedule Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "스케줄 수정" : "스케줄 추가"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{"스케줄 이름"}</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="예: 점심 메뉴, 저녁 메뉴"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{"시작 시간"}</Label>
                <Input
                  type="time"
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{"종료 시간"}</Label>
                <Input
                  type="time"
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{"요일"}</Label>
              <div className="flex gap-1.5">
                {DAY_LABELS.map((label, idx) => (
                  <Button
                    key={idx}
                    variant={formDays.includes(idx) ? "default" : "outline"}
                    size="sm"
                    className="size-9 p-0"
                    onClick={() => toggleDay(idx)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {"취소"}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || !formName.trim() || formDays.length === 0}
            >
              {isPending ? "저장 중..." : editing ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
