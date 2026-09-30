"use client";

import type {
  CareTimeLevel,
  DiagnoseRequest,
  ExperienceLevel,
  LightLevel,
  SafetyTarget
} from "@/features/diagnose/types";

type AdvancedValues = Pick<
  DiagnoseRequest,
  "safetyTargets" | "lightLevel" | "experience" | "careTime"
>;

type Props = AdvancedValues & {
  onChange: (values: AdvancedValues) => void;
};

const safetyLabels: Record<SafetyTarget, string> = {
  dog: "강아지",
  cat: "고양이",
  child: "어린 자녀"
};

const lightLabels: Record<LightLevel, string> = {
  any: "상관없음",
  direct: "직사광",
  partial: "반양지",
  indirect: "간접광",
  shade: "그늘"
};

const experienceLabels: Record<ExperienceLevel, string> = {
  any: "상관없음",
  beginner: "초보",
  intermediate: "중급",
  advanced: "고수"
};

const careTimeLabels: Record<CareTimeLevel, string> = {
  any: "상관없음",
  low: "낮음",
  medium: "보통",
  high: "충분"
};

const safetyOptions = Object.keys(safetyLabels) as SafetyTarget[];
const lightOptions = Object.keys(lightLabels) as LightLevel[];
const experienceOptions = Object.keys(experienceLabels) as ExperienceLevel[];
const careTimeOptions = Object.keys(careTimeLabels) as CareTimeLevel[];

export function AdvancedOptions({
  safetyTargets,
  lightLevel,
  experience,
  careTime,
  onChange
}: Props) {
  function update(values: Partial<AdvancedValues>) {
    onChange({ safetyTargets, lightLevel, experience, careTime, ...values });
  }

  function toggleSafety(target: SafetyTarget) {
    const nextTargets = safetyTargets.includes(target)
      ? safetyTargets.filter((item) => item !== target)
      : [...safetyTargets, target];

    update({ safetyTargets: nextTargets });
  }

  return (
    <fieldset className="advanced-options">
      <legend>고급 조건</legend>

      <div className="option-group">
        <span>반려동물·아이</span>
        <div className="checkbox-group">
          {safetyOptions.map((target) => (
            <label key={target} className="checkbox-option">
              <input
                type="checkbox"
                checked={safetyTargets.includes(target)}
                onChange={() => toggleSafety(target)}
              />
              {safetyLabels[target]}
            </label>
          ))}
        </div>
      </div>

      <OptionButtons
        label="광량"
        options={lightOptions}
        labels={lightLabels}
        selected={lightLevel}
        onSelect={(value) => update({ lightLevel: value })}
      />
      <OptionButtons
        label="경험"
        options={experienceOptions}
        labels={experienceLabels}
        selected={experience}
        onSelect={(value) => update({ experience: value })}
      />
      <OptionButtons
        label="관리 시간"
        options={careTimeOptions}
        labels={careTimeLabels}
        selected={careTime}
        onSelect={(value) => update({ careTime: value })}
      />
    </fieldset>
  );
}

function OptionButtons<T extends string>({
  label,
  options,
  labels,
  selected,
  onSelect
}: {
  label: string;
  options: T[];
  labels: Record<T, string>;
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <div className="option-group">
      <span>{label}</span>
      <div className="segment-group wrap" role="group" aria-label={label}>
        {options.map((value) => (
          <button
            key={value}
            type="button"
            className={selected === value ? "selected" : ""}
            aria-pressed={selected === value}
            onClick={() => onSelect(value)}
          >
            {labels[value]}
          </button>
        ))}
      </div>
    </div>
  );
}
