"use client";

import { useCompletion } from "ai/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";
import { useState } from "react";

export default function Completion() {
  const [type, setType] = useState("chinese");

  const {
    completion,
    input,
    stop,
    isLoading,
    handleInputChange,
    handleSubmit,
  } = useCompletion({
    api: "/api/completion",
    body: {
      type: type,
    },
    onResponse: (res) => {
      if (res.status === 429) {
        toast.error("制限されています。後でもう一度お試しください。");
      } else if (res.status === 500) {
        toast.error("問題が発生しました。");
      }
    },
    onFinish: () => {
      // do something with the completion result
      toast.success("Successfully generated completion!");
    },
  });

  return (
    <div className="mx-auto py-12 space-y-3 max-w-3xl">
      <h1 className="text-5xl mb-10 text-center font-bold">🌏 言葉で遊ぼう</h1>
      <Select
        onValueChange={(newVibe: string) => setType(newVibe)}
        defaultValue={type}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="選択してください" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="chinese">エセ中国語</SelectItem>
          <SelectItem value="gojyun">変換します日本語の語順</SelectItem>
          <SelectItem value="heian">平安時代</SelectItem>
          <SelectItem value="japaniizu">Japaniizu</SelectItem>
          <SelectItem value="katakana">カタカナ語</SelectItem>
          <SelectItem value="keigo">敬語変換</SelectItem>
          <SelectItem value="syogakuse">簡単な言葉で話す</SelectItem>
          <SelectItem value="wired_japanese">怪しい日本語</SelectItem>
        </SelectContent>
      </Select>
      <form onSubmit={handleSubmit}>
        <TextareaAutosize
          value={input}
          className="w-full p-2 bg-gray-100"
          placeholder="変換したい文章を入力..."
          onChange={handleInputChange}
        />
        <div className="flex mt-3 items-center gap-3 justify-center">
          <button
            className="bg-red-500 font-bold px-6 py-2 text-white"
            type="button"
            onClick={stop}
          >
            ストップ
          </button>
          <button
            className="bg-blue-500 font-bold px-6 py-2 text-white"
            disabled={isLoading}
            type="submit"
          >
            送信する
          </button>
        </div>
        <div className="text-3xl mb-5 mt-8 block font-bold">
          変換されたテキスト:
        </div>
        <div className="border rounded-md p-6">
          {completion.length === 0
            ? "送信ボタンをクリックしてください"
            : completion}
        </div>
      </form>
    </div>
  );
}
