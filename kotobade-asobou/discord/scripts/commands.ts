import {
  RESTPostAPIApplicationCommandsJSONBody,
  ApplicationCommandOptionType,
} from "discord-api-types/v10";

export const commands: RESTPostAPIApplicationCommandsJSONBody[] = [
  {
    name: "chinese",
    description: "君文字列、我変換偽中国語。",
    options: [
      {
        name: "文字列",
        description: "指定文字列、要変換偽中国語。",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
  {
    name: "wordorder",
    description:
      "変換します日本語の語順S,O,Vを、英語の語順S,V,Oに。\n例:私はりんごを食べる -> 私は食べるりんご",
    options: [
      {
        name: "文字列",
        description: "日本語を入力します変換したい",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
  {
    name: "heian",
    description: "きみの書きし言の葉を平安世がちなる言の葉に変ふ。",
    options: [
      {
        name: "文字列",
        description: "変へまほしき文を入力したまへ",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
  {
    name: "engurishu",
    description:
      "convert your phrases into japaniizu akusento. \nExample: I eat apple. -> Ai eato appuru.",
    options: [
      {
        name: "文字列",
        description: "Taipu yuaa fureizu.",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
  {
    name: "katakana",
    description: "横文字大好きな過激派日本人に変換します。",
    options: [
      {
        name: "文字列",
        description: "横文字変換を行いたい文字列を指定します",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
  {
    name: "keigo",
    description: "文章の敬語変換を提供します。",
    options: [
      {
        name: "文字列",
        description: "敬語に変換いたす文章を決定いたします",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
  {
    name: "syogakuse",
    description: "簡単な言葉だけで話そう。",
    options: [
      {
        name: "文字列",
        description: "簡単な言葉で話す。",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
  {
    name: "ayasii_jp",
    description: "贵樣ゐ日本语を怪レい日本语に変换レまず",
    options: [
      {
        name: "文字列",
        description: "変换レだい日本语を入力レてくたちい",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
];
