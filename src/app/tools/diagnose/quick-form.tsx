"use client";

import { FormEvent, useMemo, useRef, useState, useTransition } from "react";
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
  // 조건을 바꿔 다시 제출했을 때, 먼저 보낸 느린 요청의 응답이 나중에 도착해
  // 최신 조건의 화면을 덮어쓰지 않도록 요청 순번을 추적한다 (UX-01).
  const latestRequestId = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

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

    // 이전 요청이 아직 진행 중이면 취소한다 (가능한 경우 서버 낭비도 줄인다).
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const requestId = ++latestRequestId.current;

    startTransition(async () => {
      let response: Response;

      try {
        response = await fetch("/api/diagnose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            regionCode,
            environment,
            safetyTargets,
            lightLevel,
            experience,
            careTime
          }),
          signal: controller.signal
        });
      } catch (fetchError) {
        // 최신 요청이 아니면(더 최근 제출이 이미 진행 중) 이 오류는 화면에 반영하지 않는다.
        if (requestId !== latestRequestId.current) return;
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          // 사용자가 조건을 바꿔 새 요청을 보낸 경우의 정상적인 취소이므로 오류로 표시하지 않는다.
          return;
        }
        setError("네트워크 연결을 확인하고 다시 시도해 주세요.");
        setResult(null);
        return;
      }

      let data: (DiagnoseResponse & { error?: string; fieldErrors?: unknown }) | null = null;
      try {
        data = await response.json();
      } catch {
        // 비JSON 응답(HTML 오류 페이지 등)도 사용자에게 원인을 알 수 없는 오류로 처리한다.
        if (requestId !== latestRequestId.current) return;
        setError("진단 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
        setResult(null);
        return;
      }

      // 이 응답이 도착하는 동안 사용자가 조건을 바꿔 새 요청을 보냈다면,
      // 오래된 이 응답으로 최신 조건의 화면을 덮어쓰지 않는다 (경쟁 요청 방어).
      if (requestId !== latestRequestId.current) return;

      if (!response.ok || !data) {
        setError(data?.error ?? "진단 결과를 불러오지 못했어요.");
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
          <div className="segment-group" role="group" aria-label="환경">
            {(Object.keys(environmentLabels) as Environment[]).map((value) => (
              <button
                key={value}
                type="button"
                className={environment === value ? "selected" : ""}
                aria-pressed={environment === value}
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

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      <DiagnoseResults result={result} selectedRegionName={selectedRegionName} />
    </section>
  );
}
