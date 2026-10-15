"use client";
import { Auth } from "./auth";

export function AuthEntry({ register }: { register: boolean }) {
  return (
    <Auth
      key={register ? "register" : "login"}
      initialRegister={register}
      onDone={() => window.location.assign("/")}
    />
  );
}
