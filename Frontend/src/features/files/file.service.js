import { request } from "../../config/api";

export const fileService = {
  getOwned() {
    return request("/files/dashboard");
  },

  getShared() {
    return request("/files/shared-with-me");
  },

  open(fileId) {
    return request(`/files/${fileId}/open`);
  },

  upload(file) {
    const form = new FormData();
    form.append("file", file);
    return request("/files/upload", { method: "POST", body: form });
  },

  grantAccess(fileId, users) {
    return request(`/files/${fileId}/access`, {
      method: "POST",
      body: JSON.stringify({ users }),
    });
  },
};
