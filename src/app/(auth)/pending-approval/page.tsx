"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/shared/api/supabase/client";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Clock } from "lucide-react";

export default function PendingApprovalPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
          <Clock className="size-8 text-muted-foreground" />
        </div>
        <CardTitle>{"승인 대기 중"}</CardTitle>
        <CardDescription>
          {"회원가입이 완료되었습니다."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-center text-sm text-muted-foreground">
          {
            "관리자가 회원님의 계정을 검토 중입니다. 승인이 완료되면 로그인하여 서비스를 이용하실 수 있습니다."
          }
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={handleSignOut}>
          {"로그아웃"}
        </Button>
      </CardFooter>
    </Card>
  );
}
