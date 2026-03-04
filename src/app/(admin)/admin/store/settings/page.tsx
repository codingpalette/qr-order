"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/shared/providers/auth-provider";
import { useStore } from "@/entities/store/api/useStore";
import { useUpdateStore } from "@/features/store-management";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
} from "@/shared/ui";
import {
  SaveIcon,
  StoreIcon,
  KeyIcon,
} from "lucide-react";

export default function StoreSettingsPage() {
  const { user } = useAuth();
  const storeId = user?.store_id ?? null;
  const { data: store } = useStore(storeId);
  const updateStore = useUpdateStore();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [pgKey, setPgKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (store) {
      setName(store.name);
      setAddress(store.address ?? "");
      setPhone(store.phone ?? "");
      setPgKey(store.pg_merchant_key ?? "");
    }
  }, [store]);

  const handleSaveInfo = () => {
    if (!storeId || !name.trim()) return;
    updateStore.mutate(
      {
        id: storeId,
        name: name.trim(),
        address: address.trim() || null,
        phone: phone.trim() || null,
      },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      },
    );
  };

  const handleSavePgKey = () => {
    if (!storeId) return;
    updateStore.mutate(
      {
        id: storeId,
        pg_merchant_key: pgKey.trim() || null,
      },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{"매장 설정"}</h1>
        <p className="text-muted-foreground text-sm">
          {"매장 정보와 결제 설정을 관리합니다."}
        </p>
      </div>

      {saved && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
          {"저장되었습니다."}
        </div>
      )}

      {/* Store Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StoreIcon className="size-5" />
            {"매장 정보"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{"매장 이름"}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="매장 이름을 입력하세요"
            />
          </div>
          <div className="space-y-2">
            <Label>{"주소"}</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="매장 주소를 입력하세요"
            />
          </div>
          <div className="space-y-2">
            <Label>{"전화번호"}</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="02-0000-0000"
            />
          </div>
          <div className="flex justify-end">
            <Button
              className="gap-1"
              onClick={handleSaveInfo}
              disabled={updateStore.isPending || !name.trim()}
            >
              <SaveIcon className="size-4" />
              {updateStore.isPending ? "저장 중..." : "저장"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* PG Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyIcon className="size-5" />
            {"결제 설정"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{"PG 가맹점 키"}</Label>
            <Input
              type="password"
              value={pgKey}
              onChange={(e) => setPgKey(e.target.value)}
              placeholder="PG 가맹점 키를 입력하세요"
            />
            <p className="text-muted-foreground text-xs">
              {"결제 연동을 위한 PG사 가맹점 키입니다. 설정하지 않으면 결제 기능이 비활성화됩니다."}
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              className="gap-1"
              onClick={handleSavePgKey}
              disabled={updateStore.isPending}
            >
              <SaveIcon className="size-4" />
              {updateStore.isPending ? "저장 중..." : "저장"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
