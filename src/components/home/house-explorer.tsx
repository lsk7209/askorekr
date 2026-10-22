"use client";

import Link from "next/link";
import { useState } from "react";
import { HouseScene } from "./home-art";
import styles from "./home.module.css";

// 공간 선택은 설명 패널만 바꾼다. 추천 계산·조건 저장·진단 자동 입력은 하지 않는다.
const ROOMS = {
  living: {
    kicker: "ROOM 01 / LIVING",
    title: "거실의 초록",
    focus: "빛과 실내 배치를 먼저 확인",
    description:
      "창가의 직사광선 여부와 창에서 떨어진 거리에 따라 같은 거실도 식물 환경이 달라집니다."
  },
  bed: {
    kicker: "ROOM 02 / SMALL ROOM",
    title: "작은 방의 초록",
    focus: "공간과 채광, 관리 여유 확인",
    description:
      "작은 공간은 창의 위치와 빛이 머무는 시간을 먼저 살펴보세요. 식물의 크기와 관리 여건도 중요합니다."
  },
  balcony: {
    kicker: "ROOM 03 / BALCONY",
    title: "베란다의 초록",
    focus: "계절별 온도 변화와 직사광선 확인",
    description:
      "베란다는 같은 집 안에서도 일교차와 직사광선이 크게 달라질 수 있습니다. 지역과 계절 조건을 함께 확인하세요."
  }
} as const;

type RoomId = keyof typeof ROOMS;

const HITS: { id: RoomId; label: string; pin: string; hit: string; pinClass: string }[] = [
  { id: "living", label: "거실 공간 선택", pin: "01 거실", hit: styles.hitLiving, pinClass: styles.pinLiving },
  { id: "bed", label: "작은 방 선택", pin: "02 작은 방", hit: styles.hitBed, pinClass: styles.pinBed },
  { id: "balcony", label: "베란다 공간 선택", pin: "03 베란다", hit: styles.hitBalcony, pinClass: styles.pinBalcony }
];

export function HouseExplorer() {
  const [room, setRoom] = useState<RoomId>("living");
  const data = ROOMS[room];

  return (
    <div className={styles.sceneWrap}>
      <div className={`${styles.sceneHeading} ${styles.mono}`}>
        <span>FIG. 01 — THE HOUSE OF PLANTS</span>
        <span>SELECT A ROOM ↓</span>
      </div>
      <div className={styles.scene} data-room={room}>
        <HouseScene />
        {HITS.map((h) => (
          <button
            key={h.id}
            type="button"
            className={`${styles.roomHit} ${h.hit}`}
            aria-pressed={room === h.id}
            aria-label={h.label}
            onClick={() => setRoom(h.id)}
          />
        ))}
        {HITS.map((h) => (
          <span
            key={h.id}
            className={`${styles.roomPin} ${h.pinClass}`}
            data-active={room === h.id}
            aria-hidden="true"
          >
            {h.pin}
          </span>
        ))}
      </div>
      <div className={`${styles.sceneCaption} ${styles.mono}`}>
        <span>CLICK ANY ROOM TO EXPLORE</span>
        <span>SCHEMATIC / NOT TO SCALE</span>
      </div>
      <div className={styles.inspector} aria-live="polite" aria-atomic="true">
        <div className={styles.inspectorLeft}>
          <div className={`${styles.inspectorMini} ${styles.mono}`}>{data.kicker}</div>
          <h2>{data.title}</h2>
          <p className={styles.inspectorBrief}>{data.focus}</p>
        </div>
        <div>
          <p>{data.description}</p>
          <Link href="/tools/diagnose" className={`${styles.textCta} ${styles.inspectorCta}`}>
            실제 환경 진단하기 <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
