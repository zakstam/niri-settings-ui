interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      {description && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      <div className="mt-4 h-0.5 w-10 rounded-full bg-accent-color/40" />
    </div>
  );
}
