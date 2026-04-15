/** 動画URLから埋め込みURLを取得 */
export function getVideoEmbedUrl(url: string): { type: string; embedUrl: string } | null {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) {
    return { type: "youtube", embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}` };
  }

  // TikTok
  const ttMatch = url.match(/tiktok\.com\/@[\w.]+\/video\/(\d+)/);
  if (ttMatch) {
    return { type: "tiktok", embedUrl: `https://www.tiktok.com/embed/v2/${ttMatch[1]}` };
  }

  // Google Drive
  const gdMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (gdMatch) {
    return { type: "gdrive", embedUrl: `https://drive.google.com/file/d/${gdMatch[1]}/preview` };
  }
  const gdIdMatch = url.match(/[?&]id=([^&]+)/);
  if (url.includes("drive.google.com") && gdIdMatch) {
    return { type: "gdrive", embedUrl: `https://drive.google.com/file/d/${gdIdMatch[1]}/preview` };
  }

  return null;
}
