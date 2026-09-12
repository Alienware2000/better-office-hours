import type { Recap } from "@/lib/types";
import styles from "./RecapCard.module.css";

type RecapCardProps = {
  recap: Recap;
  className?: string;
};

export function RecapCard({ recap, className }: RecapCardProps) {
  const hasReviewReference =
    recap.reviewNext.documentTitle.trim() && recap.reviewNext.where.trim();

  return (
    <article
      className={[styles.card, className].filter(Boolean).join(" ")}
      aria-label="Session recap"
    >
      <header className={styles.header}>
        <p className={styles.eyebrow}>Session recap</p>
        <h2 className={styles.title}>Your session takeaway</h2>
      </header>

      <dl className={styles.details}>
        <div className={styles.item}>
          <dt>Where you got stuck</dt>
          <dd>{recap.stuckOn}</dd>
        </div>
        <div className={styles.item}>
          <dt>What changed</dt>
          <dd>{recap.unlockedBy}</dd>
        </div>
        <div className={styles.item}>
          <dt>Review next</dt>
          <dd>
            {hasReviewReference ? (
              <>
                <span className={styles.document}>
                  {recap.reviewNext.documentTitle}
                </span>
                <span>{recap.reviewNext.where}</span>
              </>
            ) : (
              "No course reference was available for this session."
            )}
          </dd>
        </div>
      </dl>
    </article>
  );
}
