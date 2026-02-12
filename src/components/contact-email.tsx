"use client";

export function ContactEmail({ className }: { className?: string }) {
  const u = "support";
  const d = "cleanbag.io";

  return (
    <a
      href="#contact"
      className={className}
      onClick={(e) => {
        e.preventDefault();
        const s = encodeURIComponent("CleanBag Support Request");
        window.location.href = ["ma", "il", "to:", u, "@", d, "?subject=", s].join("");
      }}
    >
      {u}
      {"\u200B"}@{"\u200B"}
      {d}
    </a>
  );
}
