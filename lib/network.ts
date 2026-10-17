import { networkInterfaces } from "node:os";
export function localAddresses() {
  return Object.entries(networkInterfaces())
    .sort(
      ([a], [b]) =>
        Number(!/^(en0|eth0|wlan0)$/.test(a)) -
        Number(!/^(en0|eth0|wlan0)$/.test(b)),
    )
    .flatMap(([, entries]) => entries || [])
    .filter((a) => a.family === "IPv4" && !a.internal)
    .map((a) => a.address);
}
export function joinOrigin(request: Request) {
  const origin = new URL(request.url);
  const host = request.headers.get("host");
  if (host) origin.host = host;
  const address = localAddresses()[0];
  if (
    address &&
    ["localhost", "127.0.0.1", "0.0.0.0"].includes(origin.hostname)
  )
    origin.hostname = address;
  return origin.origin;
}
