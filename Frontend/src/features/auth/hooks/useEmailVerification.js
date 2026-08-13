import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { authService } from "../services/auth.service";

export function useEmailVerification() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState(token ? "loading" : "invalid");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return undefined;

    let active = true;
    setStatus("loading");
    setMessage("");

    authService
      .verifyEmail(token)
      .then((result) => {
        if (!active) return;
        setStatus(result?.success ? "success" : "error");
        setMessage(result?.message || "We couldn't verify this email.");
      })
      .catch((error) => {
        if (!active) return;
        setStatus("error");
        setMessage(error?.message || "We couldn't verify this email. Please try again.");
      });

    return () => {
      active = false;
    };
  }, [token]);

  return { status, message };
}
