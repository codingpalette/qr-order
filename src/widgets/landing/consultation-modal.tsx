"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Field, FieldLabel, FieldError } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Button } from "@/shared/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useCreateConsultation } from "@/features/consultation/api/mutations";

const consultationSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요."),
  phone: z
    .string()
    .min(1, "전화번호를 입력해주세요.")
    .regex(/^[\d\-]+$/, "올바른 전화번호를 입력해주세요."),
  storeName: z.string().min(1, "매장명을 입력해주세요."),
  email: z.string().email("올바른 이메일 주소를 입력해주세요.").or(z.literal("")),
  message: z.string(),
});

type ConsultationForm = z.infer<typeof consultationSchema>;

interface ConsultationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConsultationModal({
  open,
  onOpenChange,
}: ConsultationModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const createConsultation = useCreateConsultation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConsultationForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod v4.3 type incompatibility with @hookform/resolvers
    resolver: zodResolver(consultationSchema as any),
    defaultValues: { name: "", phone: "", storeName: "", email: "", message: "" },
  });

  const onSubmit = (data: ConsultationForm) => {
    createConsultation.mutate(data, {
      onSuccess: () => {
        setSubmitted(true);
        setTimeout(() => {
          onOpenChange(false);
          setTimeout(() => {
            setSubmitted(false);
            reset();
          }, 300);
        }, 1500);
      },
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setTimeout(() => {
        setSubmitted(false);
        reset();
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle2 className="size-12 text-primary" />
            <DialogTitle>{"상담 신청이 완료되었습니다"}</DialogTitle>
            <DialogDescription>
              {"빠른 시일 내에 연락드리겠습니다."}
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{"무료 도입 상담"}</DialogTitle>
              <DialogDescription>
                {"매장에 맞는 QR 오더 도입 방안을 안내해 드립니다."}
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <Field data-invalid={!!errors.name || undefined}>
                <FieldLabel>{"이름 *"}</FieldLabel>
                <Input
                  placeholder="홍길동"
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
                <FieldError>{errors.name?.message}</FieldError>
              </Field>

              <Field data-invalid={!!errors.phone || undefined}>
                <FieldLabel>{"전화번호 *"}</FieldLabel>
                <Input
                  placeholder="010-1234-5678"
                  aria-invalid={!!errors.phone}
                  {...register("phone")}
                />
                <FieldError>{errors.phone?.message}</FieldError>
              </Field>

              <Field data-invalid={!!errors.storeName || undefined}>
                <FieldLabel>{"매장명 *"}</FieldLabel>
                <Input
                  placeholder="카페 맛있는집"
                  aria-invalid={!!errors.storeName}
                  {...register("storeName")}
                />
                <FieldError>{errors.storeName?.message}</FieldError>
              </Field>

              <Field data-invalid={!!errors.email || undefined}>
                <FieldLabel>{"이메일"}</FieldLabel>
                <Input
                  type="email"
                  placeholder="example@email.com"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                <FieldError>{errors.email?.message}</FieldError>
              </Field>

              <Field>
                <FieldLabel>{"문의 내용"}</FieldLabel>
                <Textarea
                  placeholder="궁금하신 점을 자유롭게 작성해주세요."
                  {...register("message")}
                />
              </Field>

              {createConsultation.isError && (
                <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {"오류가 발생했습니다. 다시 시도해주세요."}
                </div>
              )}
              <DialogFooter className="mt-2">
                <Button type="submit" className="w-full sm:w-auto" disabled={createConsultation.isPending}>
                  {createConsultation.isPending ? "신청 중..." : "상담 신청하기"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
