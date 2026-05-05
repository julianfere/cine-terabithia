interface SectionHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  action?: React.ReactNode;
}

export function SectionHeader({ eyebrow, title, action }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div>
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 8 }}>{eyebrow}</div>}
        <h2 className="section-title">{title}</h2>
      </div>
      {action}
    </div>
  );
}
