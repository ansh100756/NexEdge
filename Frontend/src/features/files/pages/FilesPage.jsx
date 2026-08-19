import { useEffect, useState } from "react";
import {
  CircleAlert,
  Files,
  FolderOpen,
  HardDrive,
  RefreshCw,
  Search,
  Share2,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import FileCard from "../components/FileCard";
import UploadBox from "../components/UploadBox";
import { fileService } from "../file.service";
import { formatBytes } from "../file.utils";

export default function FilesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const view = searchParams.get("view") === "shared" ? "shared" : "owned";
  const owned = view === "owned";

  useEffect(() => {
    loadFiles();
  }, [view]);

  async function loadFiles() {
    setLoading(true);
    setError("");

    try {
      const result = owned
        ? await fileService.getOwned()
        : await fileService.getShared();

      setFiles(result.files || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  const normalizedSearch = search.trim().toLowerCase();
  const visibleFiles = files.filter((file) =>
    file.originalName?.toLowerCase().includes(normalizedSearch),
  );
  const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);

  function renderFileList() {
    if (loading) {
      return (
        <div className="empty-state">
          <span className="spinner" />
          <h3>Loading your files</h3>
        </div>
      );
    }

    if (error) {
      return (
        <div className="empty-state error-state">
          <span className="empty-icon"><CircleAlert size={28} /></span>
          <h3>Could not load files</h3>
          <p>{error}</p>
          <button className="secondary-button" onClick={loadFiles}>
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      );
    }

    if (visibleFiles.length > 0) {
      return (
        <div className="file-grid">
          {visibleFiles.map((file) => (
            <FileCard
              key={file.id || file._id}
              file={file}
              owned={owned}
            />
          ))}
        </div>
      );
    }

    let title = owned ? "Your library is ready" : "Nothing shared yet";
    let description = owned
      ? "Upload your first file to start using NexEdge."
      : "Shared files will appear here.";

    if (search) {
      title = "No matching files";
      description = "Try a different search term.";
    }

    return (
      <div className="empty-state">
        <span className="empty-icon">
          <Files size={28} />
        </span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <span className="eyebrow">
            <Sparkles size={14} />
            Private file network
          </span>
          <h1>{owned ? "Your files" : "Shared with you"}</h1>
          <p>
            {owned
              ? "Upload once. Share securely. Deliver from the edge."
              : "Files you can access while their grants remain active."}
          </p>
        </div>

        <button
          className="secondary-button refresh-button"
          onClick={loadFiles}
          disabled={loading}
        >
          <RefreshCw size={17} className={loading ? "spin" : ""} />
          Refresh
        </button>
      </header>

      <div className="stats-grid">
        <article>
          <span className="stat-icon violet">
            <Files size={20} />
          </span>
          <div>
            <small>Total files</small>
            <strong>{files.length}</strong>
          </div>
        </article>

        <article>
          <span className="stat-icon cyan">
            <HardDrive size={20} />
          </span>
          <div>
            <small>Content size</small>
            <strong>{formatBytes(totalSize)}</strong>
          </div>
        </article>

        <article>
          <span className="stat-icon green">
            <Share2 size={20} />
          </span>
          <div>
            <small>Access mode</small>
            <strong>{owned ? "Owner" : "Granted"}</strong>
          </div>
        </article>
      </div>

      {owned && <UploadBox onUploaded={loadFiles} />}

      <section className="library-panel">
        <div className="library-toolbar">
          <div className="view-tabs">
            <button
              className={owned ? "active" : ""}
              onClick={() => setSearchParams({ view: "owned" })}
            >
              <FolderOpen size={16} />
              My files
            </button>
            <button
              className={!owned ? "active" : ""}
              onClick={() => setSearchParams({ view: "shared" })}
            >
              <UsersRound size={16} />
              Shared with me
            </button>
          </div>

          <label className="search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search files"
              aria-label="Search files"
            />
          </label>
        </div>

        {renderFileList()}
      </section>
    </div>
  );
}
