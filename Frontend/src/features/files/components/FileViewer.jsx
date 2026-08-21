import { FileQuestion } from "lucide-react";

const TEXT_TYPES = ["text/plain", "text/csv", "application/json"];

export default function FileViewer({ file, url }) {
  const { mimeType = "", originalName } = file;

  if (mimeType.startsWith("image/")) {
    return (
      <div className="image-viewer">
        <img src={url} alt={originalName} />
      </div>
    );
  }

  if (mimeType === "application/pdf") {
    return (
      <iframe
        className="document-viewer"
        src={`${url}#toolbar=0&navpanes=0`}
        title={originalName}
      />
    );
  }

  if (mimeType.startsWith("video/")) {
    return (
      <div className="media-viewer">
        <video
          src={url}
          controls
          controlsList="nodownload"
          disablePictureInPicture
        />
      </div>
    );
  }

  if (mimeType.startsWith("audio/")) {
    return (
      <div className="audio-viewer">
        <audio src={url} controls controlsList="nodownload" />
      </div>
    );
  }

  if (TEXT_TYPES.includes(mimeType)) {
    return (
      <iframe
        className="document-viewer text-document"
        src={url}
        title={originalName}
        sandbox="allow-same-origin"
      />
    );
  }

  return (
    <div className="unsupported-viewer">
      <FileQuestion size={34} />
      <h3>Preview unavailable</h3>
      <p>
        This format cannot be rendered safely by your browser. The owner can
        still grant download access.
      </p>
    </div>
  );
}
