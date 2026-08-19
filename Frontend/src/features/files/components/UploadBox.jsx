import { useRef, useState } from "react";
import { CheckCircle2, CloudUpload, FileUp, LoaderCircle } from "lucide-react";
import { fileService } from "../file.service";
import { formatBytes } from "../file.utils";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

export default function UploadBox({ onUploaded }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  async function uploadFile(candidate) {
    setError("");
    setComplete(false);

    if (!candidate) return;

    if (candidate.size > MAX_FILE_SIZE) {
      setError("Choose a file smaller than 100 MB.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setFile(candidate);
    setUploading(true);

    try {
      await fileService.upload(candidate);
      setComplete(true);
      onUploaded?.();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setFile(null);
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function openFilePicker() {
    if (!uploading) inputRef.current?.click();
  }

  function handleDragOver(event) {
    event.preventDefault();
    if (!uploading) setDragging(true);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    if (!uploading) uploadFile(event.dataTransfer.files[0]);
  }

  function handleKeyDown(event) {
    if (!uploading && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openFilePicker();
    }
  }

  return (
    <section className="upload-panel">
      <div
        className={[
          "dropzone",
          dragging ? "dragging" : "",
          uploading ? "uploading" : "",
        ].join(" ")}
        onClick={openFilePicker}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-disabled={uploading}
        aria-label={
          uploading ? `Uploading ${file?.name}` : "Choose a file to upload"
        }
      >
        <input
          ref={inputRef}
          type="file"
          hidden
          disabled={uploading}
          onChange={(event) => uploadFile(event.target.files[0])}
        />

        <span className="upload-icon">
          {uploading
            ? <LoaderCircle className="spin" size={24} />
            : <CloudUpload size={24} />}
        </span>

        <div>
          <strong>
            {uploading ? "Uploading securely" : "Drop a file to upload instantly"}
          </strong>
          <p>
            {uploading
              ? "Sending directly to your ImageKit library…"
              : "or browse your device · upload starts automatically · up to 100 MB"}
          </p>
        </div>
      </div>

      {uploading && file && (
        <div className="upload-status" role="status" aria-live="polite">
          <span className="status-file-icon">
            <FileUp size={18} />
          </span>
          <div>
            <strong>{file.name}</strong>
            <span>{formatBytes(file.size)}</span>
          </div>
          <span className="uploading-label">
            <LoaderCircle className="spin" size={15} />
            Uploading
          </span>
        </div>
      )}

      {error && <div className="form-message error">{error}</div>}

      {complete && (
        <div className="form-message success" role="status" aria-live="polite">
          <CheckCircle2 size={17} />
          File uploaded successfully.
        </div>
      )}
    </section>
  );
}
