"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Loader2, ShoppingCart, Sparkles } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import {
  useChatStore,
  type ChatMessage,
} from "@/features/customer-order/model/useChatStore";
import type { DisplayMenuItem, CartItem } from "@/features/customer-order/model/types";

interface AIChatSheetProps {
  menuItems: DisplayMenuItem[];
  cartItems: CartItem[];
  storeId: string;
  onAddToCart: (menuId: string, quantity: number) => void;
}

const QUICK_QUESTIONS = ["추천해줘", "매운 거 빼고", "가성비 메뉴", "인기 메뉴"];

export function AIChatSheet({
  menuItems,
  cartItems,
  storeId,
  onAddToCart,
}: AIChatSheetProps) {
  const { messages, isLoading, isOpen, addMessage, setLoading, setOpen, clearMessages } =
    useChatStore();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: ChatMessage = { role: "user", content: text.trim() };
      addMessage(userMsg);
      setInput("");
      setLoading(true);

      try {
        const allMessages = [...messages, userMsg];
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: allMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            menuContext: {
              menus: menuItems.map((m) => ({
                id: m.id,
                name: m.name,
                description: m.description,
                price: m.price,
                categoryName: m.categoryName,
              })),
              cartItems: cartItems.map((c) => ({
                name: c.name,
                quantity: c.quantity,
                price: c.price,
              })),
            },
            storeId,
          }),
        });

        if (!res.ok) {
          addMessage({
            role: "assistant",
            content: "죄송해요, 응답을 생성하지 못했어요. 다시 시도해주세요.",
          });
          return;
        }

        const data = await res.json();

        if (data.toolCalls && data.toolCalls.length > 0) {
          for (const tc of data.toolCalls) {
            if (tc.name === "add_to_cart") {
              onAddToCart(
                tc.input.menuId as string,
                (tc.input.quantity as number) ?? 1,
              );
            }
          }
        }

        addMessage({
          role: "assistant",
          content: data.text || "응답을 받지 못했어요.",
          toolCalls: data.toolCalls,
        });
      } catch {
        addMessage({
          role: "assistant",
          content: "네트워크 오류가 발생했어요. 다시 시도해주세요.",
        });
      } finally {
        setLoading(false);
      }
    },
    [messages, menuItems, cartItems, storeId, isLoading, addMessage, setLoading, onAddToCart],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 animate-fade-in bg-black/50"
        onClick={() => setOpen(false)}
      />
      <div className="relative flex h-[75dvh] w-full max-w-lg animate-sheet-up flex-col overflow-hidden rounded-t-2xl bg-white pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-orange-500" />
            <h3 className="font-bold text-gray-900">주문 도우미</h3>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="rounded-lg px-2 py-1 text-xs text-gray-500 transition-colors active:bg-gray-100"
              >
                초기화
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 transition-colors active:bg-gray-100"
            >
              <X className="size-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Sparkles className="size-10 text-orange-300" />
              <div>
                <p className="font-semibold text-gray-800">
                  무엇을 도와드릴까요?
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  메뉴 추천, 검색, 장바구니 추가를 도와드려요
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="rounded-full bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700 transition-colors active:bg-orange-100"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm",
                  msg.role === "user"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-800",
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.toolCalls?.some((tc) => tc.name === "add_to_cart") && (
                  <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700">
                    <ShoppingCart className="size-3" />
                    장바구니에 추가됨
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-3">
                <Loader2 className="size-4 animate-spin text-gray-400" />
                <span className="text-sm text-gray-500">생각 중...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick questions when messages exist */}
        {messages.length > 0 && !isLoading && (
          <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-hide">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="shrink-0 rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 transition-colors active:bg-gray-100"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t px-4 py-3"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="메뉴에 대해 물어보세요..."
            className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-orange-300 focus:bg-white"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={cn(
              "flex size-10 items-center justify-center rounded-full transition-colors",
              input.trim() && !isLoading
                ? "bg-orange-500 text-white active:bg-orange-600"
                : "bg-gray-100 text-gray-400",
            )}
          >
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
