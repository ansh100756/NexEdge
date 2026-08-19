import {
  Download,
  Eye,
  File,
  FileImage,
  FileText,
  Film,
  Music2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { apiUrl } from "../../../config/api";
import { fileId, fileKind, formatBytes, formatDate } from "../file.utils";

function FileIcon({ mimeType }) {
  if (mimeType?.startsWith("image/")) return <FileImage size={22} />;
  if (mimeType?.startsWith("video/")) return <Film size={22} />;
  if (mimeType?.startsWith("audio/")) return <Music2 size={22} />;

  if (mimeType === "application/pdf" || mimeType?.startsWith("text/")) {
    return <FileText size={22} />;
  }

  return <File size={22} />;
}

export default function FileCard({ file, owned }) {
  const id = fileId(file);
  const canDownload = owned || file.canDownload;
  const isImage = file.mimeType?.startsWith("image/");

  return (
    <article className="file-card">
      <div className="file-thumb">
        {isImage && file.thumbnailUrl ? (
          <img src={file.thumbnailUrl} alt="" loading="lazy" />
        ) : (
          <FileIcon mimeType={file.mimeType} />
        )}
        <span>{fileKind(file.mimeType)}</span>
      </div>

      <div className="file-card-body">
        <h3 title={file.originalName}>{file.originalName}</h3>
        <p>
          {formatBytes(file.size)} · {formatDate(file.createdAt)}
        </p>

        <div className="file-tags">
          <span className={owned ? "owner-tag" : "shared-tag"}>
            {owned ? "Owned" : "Shared"}
          </span>
          {!owned && <span>{canDownload ? "Download allowed" : "View only"}</span>}
        </div>
      </div>

      <div className="file-actions">
        {canDownload && (
          <a
            className="icon-button"
            href={apiUrl(`/files/${id}/download`)}
            aria-label={`Download ${file.originalName}`}
            title={`Download ${file.originalName}`}
          >
            <Download size={18} />
          </a>
        )}

        <Link
          className="open-button"
          to={`/files/${id}`}
          aria-label={`Preview ${file.originalName}`}
          title={`Preview ${file.originalName}`}
        >
          <Eye size={19} />
        </Link>
      </div>
    </article>
  );
}
