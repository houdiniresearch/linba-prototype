import assert from "node:assert/strict";
import test from "node:test";
import { presentationCopy } from "../lib/presentation-copy";

test("product presentation wording preserves instructor roles and interpolation tokens", () => {
  assert.equal(
    presentationCopy("Create training with {name}"),
    "Create presentation with {name}",
  );
  assert.equal(
    presentationCopy("Trainings / TRAINING / training"),
    "Presentations / PRESENTATION / presentation",
  );
  assert.equal(
    presentationCopy(
      "Eğitimin adı: eğitimlerini eğitime ekle. Eğitmen ve eğitimci.",
    ),
    "Sunumun adı: sunumlarını sunuma ekle. Eğitmen ve eğitimci.",
  );
  const name = "Satış eğitimi";
  assert.equal(
    presentationCopy("Eğitim: {name}").replace("{name}", name),
    "Sunum: Satış eğitimi",
  );
});
