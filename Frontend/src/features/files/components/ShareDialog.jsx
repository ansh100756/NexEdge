import { useState } from "react";
import { Clock3, Download, Mail, Share2, X } from "lucide-react";
import { fileService } from "../file.service";

const DURATIONS = [
  { value: 1, label: "1 hour" },
  { value: 24, label: "1 day" },
  { value: 72, label: "3 days" },
  { value: 168, label: "7 days" },
  { value: 720, label: "30 days" },
];

export default function ShareDialog({ fileId, fileName, onClose }) {
  const [email, setEmail] = useState("");
  const [duration, setDuration] = useState(24);
  const [canDownload, setCanDownload] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function closeFromBackdrop(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const access = {
      email,
      durationInHours: Number(duration),
      canDownload,
    };

    try {
      await fileService.grantAccess(fileId, [access]);
      setSuccess(`Access granted to ${email}.`);
      setEmail("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="dialog-backdrop" onMouseDown={closeFromBackdrop}>
      <section
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
      >
        <button
          className="dialog-close icon-button"
          onClick={onClose}
          aria-label="Close"
          title="Close"
        >
          <X size={19} />
        </button>

        <span className="dialog-icon">
          <Share2 size={22} />
        </span>

        <h2 id="share-title">Share file access</h2>
        <p className="dialog-description">
          Grant time-limited access to <strong>{fileName}</strong>.
        </p>

        <form onSubmit={handleSubmit}>
          <label>
            Recipient email
            <div className="input-wrap">
              <Mail size={18} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="person@example.com"
                required
              />
            </div>
          </label>

          <label>
            Access duration
            <div className="input-wrap">
              <Clock3 size={18} />
              <select
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
              >
                {DURATIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="permission-toggle">
            <input
              type="checkbox"
              checked={canDownload}
              onChange={(event) => setCanDownload(event.target.checked)}
            />
            <span className="toggle" />
            <span>
              <Download size={17} />
              <strong>Allow download</strong>
              <small>Otherwise the recipient can only view it in NexEdge.</small>
            </span>
          </label>

          {error && <div className="form-message error">{error}</div>}
          {success && <div className="form-message success">{success}</div>}

          <button className="primary-button wide" disabled={submitting}>
            {submitting && <span className="spinner small" />}
            {submitting ? "Granting access" : "Grant access"}
          </button>
        </form>
      </section>
    </div>
  );
}
