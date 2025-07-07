export const nl2br = (text: string) => {
  const regex = /(\n)/g;
  return text.split(regex).map((line, i) => {
    if (line.match(regex)) {
      return <br key={i} />;
    } else {
      return <span key={i}>{line}</span>;
    }
  });
};
