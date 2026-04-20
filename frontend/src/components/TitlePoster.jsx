export default function TitlePoster({ title, size = 'medium' }) {
  const label = title?.name || title?.title_name || 'Anime';
  const imageUrl = title?.image_url;

  if (imageUrl) {
    return <img className={`title-poster ${size}`} src={imageUrl} alt={`${label} poster`} />;
  }

  return (
    <div className={`title-poster poster-fallback ${size}`} aria-label={`${label} poster placeholder`}>
      <span>{label.slice(0, 1).toUpperCase()}</span>
    </div>
  );
}
