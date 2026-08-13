import { useState } from "react";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useAuthForm(mode) {
  const isRegister = mode === "register";
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", terms: false });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const update = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setServerError("");
  };

  const validate = () => {
    const next = {};
    const email = form.email.trim();

    if (!emailPattern.test(email)) next.email = "Enter a valid email address.";
    if (!form.password) next.password = "Password is required.";
    if (isRegister && form.password.length < 6) {
      next.password = "Password must contain at least 6 characters.";
    }
    if (isRegister && form.password !== form.confirmPassword) {
      next.confirmPassword = "Passwords do not match.";
    }
    if (isRegister && !form.terms) {
      next.terms = "Please accept the terms to continue.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  return {
    form,
    errors,
    serverError,
    setServerError,
    update,
    validate,
  };
}
