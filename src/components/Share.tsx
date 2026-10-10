import { DateTime, Interval } from "luxon";
import { useMemo } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  computeProximityPercent,
  generateSquareCharacters,
  getDirectionEmoji,
} from "../domain/geography";
import { Guess } from "../domain/guess";
import React from "react";
import { SettingsData } from "../hooks/useSettings";

const START_DATE = DateTime.fromISO("2022-04-25");

interface ShareProps {
  guesses: Guess[];
  dayString: string;
  settingsData: SettingsData;
  hideImageMode: boolean;
  rotationMode: boolean;
  countyMode: boolean
}

export function Share({
  guesses,
  dayString,
  settingsData,
  hideImageMode,
  rotationMode,
  countyMode
}: ShareProps) {
  const { t } = useTranslation();
  const { theme } = settingsData;

  const shareText = useMemo(() => {
    const win = guesses[guesses.length - 1]?.distance === 0;
    const bestDistance = Math.min(...guesses.map(({ distance }) => distance));
    const guessCount = win ? guesses.length : "X";
    const dayCount = Math.floor(
      Interval.fromDateTimes(START_DATE, DateTime.fromISO(dayString)).length(
        "day"
      )
    );
    const difficultyModifierEmoji = hideImageMode
      ? " 🙈"
      : rotationMode
      ? " 🌀"
      : "";
    const countyModifierEmoji = countyMode
      ? "·县邑"
      : "·州府";
    const bestPercent = `(${computeProximityPercent(
      bestDistance
    ).toString()}%)`;
    const title = `#舆鉴#${countyModifierEmoji} 第${dayCount}天 ${guessCount}/6 ${bestPercent}${difficultyModifierEmoji}`;

    const guessString = guesses
      .map((guess) => {
        const percent = computeProximityPercent(guess.distance);
        const squares = generateSquareCharacters(percent, theme).join("");
        const direction = getDirectionEmoji(guess);
        return `${squares}${direction}`;
      })
      .join("\n");

    return [title, guessString, "https://heliumoctahelide.github.io/Chinale/"].join("\n");
  }, [dayString, guesses, hideImageMode, rotationMode, theme]);

  return (
    <CopyToClipboard
      text={shareText}
      onCopy={() => toast(t("copy"))}
      options={{
        format: "text/plain",
      }}
    >
      <button className="rounded font-bold border-2 p-1 uppercase bg-yellow-300 hover:bg-yellow-200 active:bg-yellow-400 text-white w-full">
        {t("share")}
      </button>
    </CopyToClipboard>
  );
}
