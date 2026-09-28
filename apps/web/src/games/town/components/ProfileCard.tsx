"use client";

import styles from "@/app/games/town/town.module.css";
import type { MemberInfo } from "../core/TownGame";
import { AvatarCanvas } from "./AvatarCanvas";

type Props = {
  member: MemberInfo;
  onPraise: () => void;
  onVisitRoom: () => void;
  onWave: () => void;
  onDressUp: () => void;
  /** Shown only when this person can be added as a cloud friend. */
  onAddFriend?: () => void;
  /** Shown when this person has a garden. */
  onVisitGarden?: () => void;
  onClose: () => void;
};

/** Pigg-style profile popup shown when clicking someone in town. */
export function ProfileCard({ member, onPraise, onVisitRoom, onWave, onDressUp, onAddFriend, onVisitGarden, onClose }: Props) {
  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label={`${member.name}のプロフィール`} onClick={onClose}>
      <div className={styles.profileCard} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.closeButton} aria-label="とじる" onClick={onClose}>
          ×
        </button>
        <div className={styles.profileStage}>
          <AvatarCanvas avatar={member.avatar} width={150} height={190} action="wave" />
        </div>
        <h2 className={styles.profileName}>{member.name}</h2>
        <p className={styles.profileStat}>
          <span aria-hidden="true">★</span> グッピグ {member.goodPigg}
        </p>
        <div className={styles.profileActions}>
          {member.isSelf ? (
            <>
              <button type="button" className={styles.primaryButton} onClick={onDressUp}>着せかえ</button>
              {member.roomId ? <button type="button" className={styles.secondaryButton} onClick={onVisitRoom}>マイルームへ</button> : null}
              {onVisitGarden ? <button type="button" className={styles.secondaryButton} onClick={onVisitGarden}>マイガーデンへ</button> : null}
            </>
          ) : (
            <>
              <button type="button" className={styles.primaryButton} onClick={onPraise}>グッピグする</button>
              <button type="button" className={styles.secondaryButton} onClick={onWave}>手をふる</button>
              {onAddFriend ? <button type="button" className={styles.secondaryButton} onClick={onAddFriend}>ピグともになる</button> : null}
              {member.roomId ? <button type="button" className={styles.secondaryButton} onClick={onVisitRoom}>へやに遊びに行く</button> : null}
              {onVisitGarden ? <button type="button" className={styles.secondaryButton} onClick={onVisitGarden}>ガーデンに遊びに行く</button> : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
