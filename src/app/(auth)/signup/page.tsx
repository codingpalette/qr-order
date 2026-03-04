"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/shared/api/supabase/client";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

const signupSchema = z
  .object({
    name: z.string().min(2, "이름은 2자 이상이어야 합니다."),
    email: z.string().email("올바른 이메일 주소를 입력해주세요."),
    password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
    confirmPassword: z.string(),
    requestedRole: z.enum(["brand_admin", "store_admin"], {
      message: "희망 역할을 선택해주세요.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  });

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod v4.3 type incompatibility with @hookform/resolvers
    resolver: zodResolver(signupSchema as any),
    defaultValues: {
      requestedRole: "store_admin",
    },
  });

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            requested_role: data.requestedRole,
          },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          setError("이미 가입된 이메일 주소입니다.");
        } else {
          setError("회원가입에 실패했습니다. 다시 시도해주세요.");
        }
        return;
      }

      router.push("/pending-approval");
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{"회원가입"}</CardTitle>
        <CardDescription>
          {"QR-Order Pro 관리자 계정을 생성하세요."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="flex flex-col gap-4 pb-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">{"이름"}</Label>
            <Input
              id="name"
              type="text"
              placeholder="홍길동"
              autoComplete="name"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">{"이메일"}</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">{"비밀번호"}</Label>
            <Input
              id="password"
              type="password"
              placeholder="8자 이상 입력"
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">{"비밀번호 확인"}</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="비밀번호를 다시 입력"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="requestedRole">{"희망 역할"}</Label>
            <select
              id="requestedRole"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("requestedRole")}
            >
              <option value="store_admin">{"매장 관리자 (Store Admin)"}</option>
              <option value="brand_admin">
                {"브랜드 관리자 (Brand Admin)"}
              </option>
            </select>
            {errors.requestedRole && (
              <p className="text-sm text-destructive">
                {errors.requestedRole.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "가입 중..." : "회원가입"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {"이미 계정이 있으신가요? "}
            <Link href="/login" className="text-primary hover:underline">
              {"로그인"}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
