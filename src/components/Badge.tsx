interface BadgeProps {
  children: React.ReactNode;
  kind?: string;
}

export function Badge({ children, kind }: BadgeProps) {
  return <span className={`badge${kind ? ' ' + kind : ''}`}>{children}</span>;
}
