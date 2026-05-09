"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import type {
  CareTimeLevel,
  DiagnoseResponse,
  Environment,
  ExperienceLevel,
  LightLevel,
  SafetyTarget
} from "@/features/diagnose/types";
import { AdvancedOptions } from "./advanced-options";
import { DiagnoseResults } from "./diagnose-results";

type RegionOption = {
  code: string;
  sido: string;
  sigungu: string;
};

type Props = {
  regions: RegionOption[];
};

const environmentLabels: Record<Environment, string> = {
  indoor: "실내",
  outdoor: "실외",
  both: "둘 다"
};

export function DiagnoseQuickForm({ regions }: Props) {
  const defaultSido = regions[0]?.sido ?? "";
  const [selectedSido, setSelectedSido] = useState(defaultSido);
  const [regionCode, setRegionCode] = useState(regions[0]?.code ?? "");
  const [environment, setEnvironment] = useState<Environment>("indoor");
  const [safetyTargets, setSafetyTargets] = useState<SafetyTarget[]>([]);
  const [lightLevel, setLightLevel] = useState<LightLevel>("any");
  const [experience, setExperience] = useState<ExperienceLevel>("any");
  const [careTime, setCareTime] = useState<CareTimeLevel>("any");
  const [result, setResult] = useState<DiagnoseResponse | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const sidoOptions = useMemo(
    () => Array.from(new Set(regions.map((region) => region.sido))),
    [regions]
  );
  const sigunguOptions = useMemo(
    () => regions.filter((region) => region.sido === selectedSido),
    [regions, selectedSido]
  );
  const selectedRegionName = useMemo(() => {
    const targetRegionCode = result?.regionCode ?? regionCode;
    const region = regions.find((item) => item.code === targetRegionCode);
    return region ? `${region.sido} ${region.sigungu}` : "";
  }, [regionCode, regions, result?.regionCode]);

  function handleSidoChange(nextSido: string) {
    const nextRegion = regions.find((region) => region.sido === nextSido);

    setSelectedSido(nextSido);
    setRegionCode(nextRegion?.code ?? "");
    setResult(null);
    setError("");
  }

  function clearResult() {
    setResult(null);
    setError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regionCode,
          environment,
          safetyTargets,
          lightLevel,
          experience,
          careTime
        })
      });

      const data = (await response.json()) as DiagnoseResponse & {
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "진단 결과를 불러오지 못했어요.");
        setResult(null);
        return;
      }

      setResult(data);
    });
  }

  return (
    <section className="tool-grid" aria-label="진단 입력과 결과">
      <form className="diagnose-form" onSubmit={handleSubmit}>
        <div className="region-fields">
          <label>
            <span>시·도</span>
            <select
              value={selectedSido}
              onChange={(event) => handleSidoChange(event.target.value)}
            >
              {sidoOptions.map((sido) => (
                <option key={sido} value={sido}>
                  {sido}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>시·군·구</span>
            <select
              value={regionCode}
              onChange={(event) => {
                setRegionCode(event.target.value);
                clearResult();
              }}
            >
              {sigunguOptions.map((region) => (
                <option key={region.code} value={region.code}>
                  {region.sigungu}
                </option>
              ))}
            </select>
          </label>
        </div>

        <fieldset>
          <legend>환경</legend>
          <div className="segment-group">
            {(Object.keys(environmentLabels) as Environment[]).map((value) => (
              <button
                key={value}
                type="button"
                className={environment === value ? "selected" : ""}
                onClick={() => {
                  setEnvironment(value);
                  clearResult();
                }}
              >
                {environmentLabels[value]}
              </button>
            ))}
          </div>
        </fieldset>

        <AdvancedOptions
          safetyTargets={safetyTargets}
          lightLevel={lightLevel}
          experience={experience}
          careTime={careTime}
          onChange={(values) => {
            setSafetyTargets(values.safetyTargets);
            setLightLevel(values.lightLevel);
            setExperience(values.experience);
            setCareTime(values.careTime);
            clearResult();
          }}
        />

        <button
          className="primary-action"
          type="submit"
          disabled={isPending || !regionCode}
        >
          {isPending ? "진단 중" : "진단하기"}
        </button>

        {error ? <p className="form-error">{error}</p> : null}
      </form>

      <DiagnoseResults result={result} selectedRegionName={selectedRegionName} />
    </section>
  );
}
