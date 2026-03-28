import imgA from "@assets/medium_A_1774695652709.png";
import imgB from "@assets/medium_B_1774695652709.png";
import imgC from "@assets/medium_C_1774695652708.png";
import imgD from "@assets/medium_D_1774695652708.png";
import imgE from "@assets/medium_E_1774695652707.png";

interface GradeBadgeProps {
  grade: "A" | "B" | "C" | "D" | "E";
  className?: string;
}

const GRADE_IMAGES: Record<string, string> = {
  A: imgA,
  B: imgB,
  C: imgC,
  D: imgD,
  E: imgE,
};

export function GradeBadge({ grade, className }: GradeBadgeProps) {
  return (
    <img
      src={GRADE_IMAGES[grade]}
      alt={`Nutri-Score ${grade}`}
      className={className}
      style={{ maxWidth: "100%", height: "auto" }}
    />
  );
}
