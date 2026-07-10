import { useEffect, useRef, useState } from "react";

export function Section({ children, id, label, sectionRefs, title }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={(element) => {
        ref.current = element;
        sectionRefs.current[id] = element;
      }}
      data-section={id}
      style={{
        padding: "80px 48px",
        maxWidth: 1100,
        margin: "0 auto",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 16,
          marginBottom: 28,
          paddingLeft: 8,
        }}
      >
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: 12,
            color: "var(--accent)",
            letterSpacing: "0.06em",
            textShadow: "0 1px 10px rgba(0,0,0,0.65)",
          }}
        >
          {label}
        </span>
        <h2
          style={{
            fontFamily: "var(--serif)",
            fontSize: 36,
            fontWeight: 400,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            textShadow: "0 1px 14px rgba(0,0,0,0.7)",
          }}
        >
          {title}
        </h2>
        <div
          aria-hidden="true"
          style={{
            flex: 1,
            height: 1,
            background: "rgba(255,255,255,0.18)",
            marginLeft: 16,
          }}
        />
      </div>
      <div className="island" style={{ padding: "44px 48px" }}>
        {children}
      </div>
    </section>
  );
}
