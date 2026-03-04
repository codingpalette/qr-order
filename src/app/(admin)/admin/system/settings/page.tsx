"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { SettingsIcon } from "lucide-react";

export default function SystemSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{"설정"}</h1>
        <p className="text-muted-foreground text-sm">
          {"플랫폼 글로벌 설정을 관리합니다."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="size-5" />
            {"글로벌 설정"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <SettingsIcon className="text-muted-foreground/50 mb-4 size-12" />
            <p className="text-muted-foreground text-sm">
              {"PG 설정, 시스템 이용료 관리 등의 기능이 곧 추가될 예정입니다."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
