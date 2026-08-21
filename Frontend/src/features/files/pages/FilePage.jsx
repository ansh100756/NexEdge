import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Database,
  Download,
  FileText,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  Route,
  Share2,
  UserRound,
  WifiOff,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { apiUrl } from "../../../config/api";
import { useCdn } from "../../cdn/CdnContext";
import { cdnService } from "../../cdn/cdn.service";
import FileViewer from "../components/FileViewer";
import ShareDialog from "../components/ShareDialog";
import { fileService } from "../file.service";
import { fileKind, formatBytes, formatDate } from "../file.utils";

export default function FilePage() {
  const { fileId } = useParams();
  const { location } = useCdn();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [delivery, setDelivery] = useState(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState("");
  const [deliveryAttempt, setDeliveryAttempt] = useState(0);
  const [showShareDialog, setShowShareDialog] = useState(false);

  useEffect(() => {
    async function loadFile() {
      setFile(null);
      setLoading(true);
      setError("");

      try {
        const result = await fileService.open(fileId);
        setFile(result.file);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadFile();
  }, [fileId]);

  useEffect(() => {
    if (!file) return undefined;

    const controller = new AbortController();
    let previewUrl = "";

    async function loadFromCdn() {
      setDelivery(null);
      setDeliveryLoading(true);
      setDeliveryError("");

      try {
        const result = await cdnService.deliver(fileId, location, {
          signal: controller.signal,
        });
        previewUrl = URL.createObjectURL(result.blob);
        setDelivery({ ...result, url: previewUrl });
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setDeliveryError(requestError.message);
        }
      } finally {
        if (!controller.signal.aborted) setDeliveryLoading(false);
      }
    }

    loadFromCdn();

    return () => {
      controller.abort();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [
    deliveryAttempt,
    file,
    fileId,
    location.latitude,
    location.longitude,
  ]);

  if (loading) {
    return (
      <div className="page-loader">
        <span className="spinner" />
        <h2>Opening secure file</h2>
        <p>Checking your current access grant…</p>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="page-loader error-state">
        <LockKeyhole size={30} />
        <h2>File unavailable</h2>
        <p>{error || "The file could not be opened."}</p>
        <Link className="secondary-button" to="/files">
          <ArrowLeft size={17} />
          Back to files
        </Link>
      </div>
    );
  }

  const accessLabel = file.isOwner
    ? "Owner access"
    : file.canDownload
      ? "View + download"
      : "View only";

  return (
    <div className="file-page">
      <header className="file-header">
        <Link className="back-link" to="/files">
          <ArrowLeft size={18} />
          Back to files
        </Link>

        <div className="file-title-row">
          <span className="large-file-icon">
            <FileText size={25} />
          </span>

          <div>
            <span className="eyebrow">
              {fileKind(file.mimeType)} ·{" "}
              {file.isOwner ? "Owned by you" : "Shared with you"}
            </span>
            <h1>{file.originalName}</h1>
          </div>

          <div className="header-actions">
            {file.isOwner && (
              <button
                className="secondary-button"
                onClick={() => setShowShareDialog(true)}
              >
                <Share2 size={17} />
                Share access
              </button>
            )}

            {file.canDownload && (
              <a
                className="primary-button"
                href={apiUrl(`/files/${fileId}/download`)}
                title={`Download ${file.originalName}`}
              >
                <Download size={17} />
                Download
              </a>
            )}
          </div>
        </div>

        <div className="file-metadata">
          <span>
            <CalendarDays size={16} />
            {formatDate(file.createdAt)}
          </span>
          <span>
            <FileText size={16} />
            {formatBytes(file.size)}
          </span>
          <span>
            <UserRound size={16} />
            {accessLabel}
          </span>
          {!file.isOwner && file.accessExpiresAt && (
            <span>
              <LockKeyhole size={16} />
              Expires {formatDate(file.accessExpiresAt)}
            </span>
          )}
        </div>
      </header>

      <section className="viewer-shell">
        <div className="viewer-toolbar">
          <div>
            <span className="live-dot" />
            Secure CDN preview
          </div>

          <div className="delivery-details" aria-live="polite">
            {deliveryLoading && (
              <span>
                <LoaderCircle className="spin" size={14} />
                Finding nearest edge
              </span>
            )}

            {delivery && (
              <>
                <span title="Serving edge">
                  <MapPin size={14} />
                  {delivery.edge}
                </span>
                <span
                  className={delivery.cacheStatus === "HIT" ? "cache-hit" : ""}
                  title="Edge cache status"
                >
                  <Database size={14} />
                  Cache {delivery.cacheStatus}
                </span>
                {delivery.distanceKm && (
                  <span title="Distance from your routing location">
                    <Route size={14} />
                    {delivery.distanceKm} km
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {deliveryError && (
          <div className="delivery-error">
            <WifiOff size={32} />
            <h3>CDN delivery unavailable</h3>
            <p>{deliveryError}</p>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setDeliveryAttempt((attempt) => attempt + 1)}
            >
              Try CDN again
            </button>
          </div>
        )}

        {deliveryLoading && (
          <div className="delivery-loader">
            <span className="spinner" />
            <p>Authorizing access and routing to the nearest healthy edge…</p>
          </div>
        )}

        {delivery && <FileViewer file={file} url={delivery.url} />}
      </section>

      {showShareDialog && (
        <ShareDialog
          fileId={fileId}
          fileName={file.originalName}
          onClose={() => setShowShareDialog(false)}
        />
      )}
    </div>
  );
}
