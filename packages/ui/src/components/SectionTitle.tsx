type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  level?: "h1" | "h2";
};

export const SectionTitle = ({
  eyebrow,
  title,
  description,
  level = "h2"
}: SectionTitleProps) => {
  const Heading = level;

  return (
    <div className="ui-section-title">
      {eyebrow ? <span className="ui-badge">{eyebrow}</span> : null}
      <Heading>{title}</Heading>
      {description ? <p>{description}</p> : null}
    </div>
  );
};
