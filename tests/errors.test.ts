import { test } from "node:test";
import assert from "node:assert/strict";
import { mapEngineError, mapHttpError } from "../lib/youcam/errors.ts";

test("every documented capture error asks for a retake with a plain message", () => {
  const retake = [
    "error_below_min_image_size", "error_face_position_invalid", "error_face_position_too_small",
    "error_face_position_out_of_boundary", "error_insufficient_lighting", "error_face_angle_invalid",
    "error_no_face", "error_pose", "error_no_shoulder", "error_large_face_angle",
    "error_insufficient_landmarks", "error_face_pose", "error_mismatch_image_size",
  ];
  for (const code of retake) {
    const m = mapEngineError(code);
    assert.equal(m.retake, true, code);
    assert.doesNotMatch(m.message, /error_|undefined/, code);
  }
});

test("processing errors suggest retrying, not retaking", () => {
  for (const code of ["error_inference", "error_upload", "unknown_internal_error"]) assert.equal(mapEngineError(code).retake, false, code);
});

test("unknown codes fall back safely", () => {
  assert.equal(mapEngineError("something_new", "Detail").message, "Detail");
  assert.equal(mapEngineError(null).retake, false);
  assert.match(mapHttpError("CreditInsufficiency", "x"), /units/);
  assert.equal(mapHttpError("NotACode", "fallback"), "fallback");
});
