import { DateTime } from "luxon";
import { useCallback, useEffect, useMemo, useState } from "react";
import seedrandom from "seedrandom";
import {
  bigEnoughCountriesWithImage,
  smallEnoughCountriesWithImage,
  countriesWithImage,
  Country,
  smallCountryLimit,
} from "../domain/countries";
import { areas } from "../domain/countries.area";
import { Guess, loadAllGuesses, saveGuesses } from "../domain/guess";
import { getSettings } from "../hooks/useSettings";
import { isUsingMode } from "../hooks/useMode";

const forcedCountries: Record<string, string> = {
  "2022-02-02": "TD",
  "2022-02-03": "PY",
  "2022-03-21": "HM",
  "2022-03-22": "MC",
  "2022-03-23": "PR",
  "2022-03-24": "MX",
  "2022-04-22": "110105",
};

export function getDayString(shiftDayCount?: number) {
  return DateTime.now()
    .plus({ days: shiftDayCount ?? 0 })
    .toFormat("yyyy-MM-dd");
}

export function useTodays(dayString: string): [
  {
    country?: Country;
    guesses: Guess[];
  },
  (guess: Guess) => void,
  number,
  number
] {
  const [todays, setTodays] = useState<{
    country?: Country;
    guesses: Guess[];
  }>({ guesses: [] });

  const addGuess = useCallback(
    (newGuess: Guess) => {
      if (todays == null) {
        return;
      }

      const newGuesses = [...todays.guesses, newGuess];

      setTodays((prev) => ({ country: prev.country, guesses: newGuesses }));
      saveGuesses(dayString, newGuesses);
    },
    [dayString, todays]
  );

  useEffect(() => {
    const guesses = loadAllGuesses()[dayString] ?? [];
    const country = getCountry(dayString);

    setTodays({ country, guesses });
  }, [dayString]);

  const randomAngle = useMemo(
    () => seedrandom.alea(dayString)() * 360,
    [dayString]
  );

  const imageScale = useMemo(() => {
    const normalizedAngle = 45 - (randomAngle % 90);
    const radianAngle = (normalizedAngle * Math.PI) / 180;
    return 1 / (Math.cos(radianAngle) * Math.sqrt(2));
  }, [randomAngle]);

  return [todays, addGuess, randomAngle, imageScale];
}

function getCountry(dayString: string) {
  const currentDayDate = DateTime.fromFormat(dayString, "yyyy-MM-dd");
  let pickingDate = DateTime.fromFormat("2022-03-21", "yyyy-MM-dd");
  let smallCountryCooldown = 0;
  let pickedCountry: Country | null = null;
  const settingsData = getSettings();
  const countyMode = isUsingMode("countyMode", dayString, settingsData.countyMode);
  do {
    smallCountryCooldown--;

    const pickingDateString = pickingDate.toFormat("yyyy-MM-dd");
    //const pickingDateString = Math.random().toString(); // for test

    const forcedCountryCode = forcedCountries[dayString];
    const forcedCountry =
      forcedCountryCode != null
        ? countriesWithImage.find(
            (country) => country.code === forcedCountryCode
          )
        : undefined;

    
    const countrySelection =
      countyMode
        ? smallEnoughCountriesWithImage
        : bigEnoughCountriesWithImage;

    let seedModifier = "";
    do {
    pickedCountry =
      forcedCountry ??
      countrySelection[
        Math.floor(
          seedrandom.alea(pickingDateString + seedModifier)() * countrySelection.length
        )
      ];
      if (Math.floor(seedrandom.alea(pickingDateString + seedModifier)() * countrySelection.length) != Math.floor(seedrandom.alea(pickingDate.minus({ day: 1 }).toFormat("yyyy-MM-dd"))() * countrySelection.length)) break;
      seedModifier += '114514';
    } while(114514);
    if (areas[pickedCountry.code] < smallCountryLimit) {
      smallCountryCooldown = 7;
    }

    pickingDate = pickingDate.plus({ day: 1 });
  } while (pickingDate <= currentDayDate);
  
  return pickedCountry;
}
